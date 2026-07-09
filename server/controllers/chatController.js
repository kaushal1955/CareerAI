import Chat from '../models/Chat.js';
import Mentor from '../models/Mentor.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from '../services/notificationService.js';
import { emitToUser } from '../sockets/socket.js';

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function findDbUser(req) {
  const userId = req.userId;

  if (!userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User record not found. Sync the authenticated user first.');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function getAllowedContactsForUser(user) {
  if (user.role === 'admin') {
    return User.find({ _id: { $ne: user._id } })
      .select('firstName lastName email role imageUrl status')
      .sort({ firstName: 1, lastName: 1 });
  }

  if (user.role === 'mentor') {
    const mentor = await Mentor.findOne({ user: user._id });
    if (!mentor?.assignedStudents?.length) return [];

    return User.find({ _id: { $in: mentor.assignedStudents } })
      .select('firstName lastName email role imageUrl status')
      .sort({ firstName: 1, lastName: 1 });
  }

  const mentors = await Mentor.find({ assignedStudents: user._id }).populate({
    path: 'user',
    select: 'firstName lastName email role imageUrl status',
  });

  return mentors
    .map((mentor) => mentor.user)
    .filter(Boolean);
}

async function assertAllowedContact(user, peerId) {
  if (user.role === 'admin') {
    const peer = await User.findById(peerId);
    if (!peer) {
      const error = new Error('Chat contact not found.');
      error.statusCode = 404;
      throw error;
    }
    return peer;
  }

  const contacts = await getAllowedContactsForUser(user);
  const peer = contacts.find((contact) => String(contact._id) === String(peerId));

  if (!peer) {
    const error = new Error('You do not have permission to chat with this user.');
    error.statusCode = 403;
    throw error;
  }

  return peer;
}

export const getChatContacts = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const contacts = await getAllowedContactsForUser(user);

  const contactIds = contacts.map((contact) => contact._id);
  const latestMessages = contactIds.length
    ? await Chat.aggregate([
        {
          $match: {
            $or: [
              { sender: user._id, recipient: { $in: contactIds } },
              { recipient: user._id, sender: { $in: contactIds } },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [{ $eq: ['$sender', user._id] }, '$recipient', '$sender'],
            },
            lastMessage: { $first: '$content' },
            lastMessageAt: { $first: '$createdAt' },
          },
        },
      ])
    : [];

  const unreadCounts = contactIds.length
    ? await Chat.aggregate([
        {
          $match: {
            recipient: user._id,
            sender: { $in: contactIds },
            readAt: null,
          },
        },
        {
          $group: {
            _id: '$sender',
            count: { $sum: 1 },
          },
        },
      ])
    : [];

  const latestMap = new Map(latestMessages.map((item) => [String(item._id), item]));
  const unreadMap = new Map(unreadCounts.map((item) => [String(item._id), item.count]));

  const enriched = contacts.map((contact) => ({
    ...contact.toObject?.() || contact,
    lastMessage: latestMap.get(String(contact._id))?.lastMessage || '',
    lastMessageAt: latestMap.get(String(contact._id))?.lastMessageAt || null,
    unreadCount: unreadMap.get(String(contact._id)) || 0,
  }));

  res.status(200).json({
    success: true,
    contacts: enriched,
  });
});

export const getConversation = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const peer = await assertAllowedContact(user, req.params.peerId);

  const messages = await Chat.find({
    $or: [
      { sender: user._id, recipient: peer._id },
      { sender: peer._id, recipient: user._id },
    ],
  })
    .populate('sender', 'firstName lastName email role imageUrl')
    .populate('recipient', 'firstName lastName email role imageUrl')
    .sort({ createdAt: 1 });

  await Chat.updateMany(
    {
      sender: peer._id,
      recipient: user._id,
      readAt: null,
    },
    {
      $set: { readAt: new Date() },
    },
  );

  res.status(200).json({
    success: true,
    peer,
    messages,
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const peer = await assertAllowedContact(user, req.body.recipientId);
  const content = cleanString(req.body.content);

  if (!content) {
    res.status(400);
    throw new Error('Message content is required.');
  }

  const message = await Chat.create({
    sender: user._id,
    recipient: peer._id,
    content,
  });

  const populatedMessage = await Chat.findById(message._id)
    .populate('sender', 'firstName lastName email role imageUrl')
    .populate('recipient', 'firstName lastName email role imageUrl');

  emitToUser(peer._id, 'chat:message', {
    message: populatedMessage,
  });
  emitToUser(user._id, 'chat:message', {
    message: populatedMessage,
  });

  await createNotification({
    userId: peer._id,
    type: 'chat_message',
    title: `New message from ${[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}`,
    message: content.length > 120 ? `${content.slice(0, 117)}...` : content,
    link: '/chat',
    metadata: {
      senderId: user._id,
      messageId: message._id,
    },
  });

  res.status(201).json({
    success: true,
    message: populatedMessage,
  });
});
