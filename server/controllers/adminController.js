import CareerRecommendation from '../models/CareerRecommendation.js';
import Interview from '../models/Interview.js';
import Mentor from '../models/Mentor.js';
import MentorResource from '../models/MentorResource.js';
import MentorSession from '../models/MentorSession.js';
import Report from '../models/Report.js';
import Resume from '../models/Resume.js';
import Roadmap from '../models/Roadmap.js';
import SkillGap from '../models/SkillGap.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createBulkNotifications, createNotification } from '../services/notificationService.js';

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatMonth(date) {
  return date.toLocaleString('en-IN', { month: 'short' });
}

function buildRecentMonthBuckets(monthCount = 6) {
  const buckets = [];
  const current = new Date();
  current.setHours(0, 0, 0, 0);
  current.setDate(1);

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(current.getFullYear(), current.getMonth() - index, 1);
    buckets.push({
      label: `${formatMonth(date)} ${date.getFullYear()}`,
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
    });
  }

  return buckets;
}

async function buildMentorSummaries() {
  const mentors = await Mentor.find({})
    .populate('user', 'firstName lastName email role status')
    .populate('assignedStudents', 'firstName lastName email');

  return mentors.map((mentor) => ({
    _id: mentor._id,
    userId: mentor.user?._id || null,
    name: [mentor.user?.firstName, mentor.user?.lastName].filter(Boolean).join(' ') || 'Mentor',
    email: mentor.user?.email || '',
    status: mentor.user?.status || 'active',
    expertise: mentor.expertise || [],
    assignedStudents: (mentor.assignedStudents || []).length,
    assignedStudentDetails: (mentor.assignedStudents || []).map((student) => ({
      _id: student._id,
      name: [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email,
      email: student.email,
    })),
    sessionCount: mentor.sessionCount || 0,
    resourceCount: mentor.resourceCount || 0,
  }));
}

async function buildAnalytics() {
  const monthBuckets = buildRecentMonthBuckets(6);

  const [allUsers, resumes, recommendations, skillGaps, roadmaps, interviews, mentorSessions, mentorResources, mentors, reports] =
    await Promise.all([
      User.find({}).select('role status createdAt'),
      Resume.find({}).select('createdAt'),
      CareerRecommendation.find({}).select('createdAt'),
      SkillGap.find({}).select('createdAt'),
      Roadmap.find({}).select('createdAt'),
      Interview.find({}).select('createdAt performanceScore status'),
      MentorSession.find({}).select('createdAt status meetingProvider sessionType'),
      MentorResource.find({}).select('createdAt moderationStatus'),
      Mentor.find({}).select('assignedStudents sessionCount resourceCount').populate('user', 'firstName lastName'),
      Report.find({}).select('createdAt status severity'),
    ]);

  const monthlySignups = monthBuckets.map((bucket) => ({
    label: bucket.label,
    value: allUsers.filter((item) => item.createdAt >= bucket.start && item.createdAt < bucket.end).length,
  }));

  const contentActivity = monthBuckets.map((bucket) => ({
    label: bucket.label,
    resumes: resumes.filter((item) => item.createdAt >= bucket.start && item.createdAt < bucket.end).length,
    recommendations: recommendations.filter((item) => item.createdAt >= bucket.start && item.createdAt < bucket.end).length,
    skillGaps: skillGaps.filter((item) => item.createdAt >= bucket.start && item.createdAt < bucket.end).length,
    roadmaps: roadmaps.filter((item) => item.createdAt >= bucket.start && item.createdAt < bucket.end).length,
    interviews: interviews.filter((item) => item.createdAt >= bucket.start && item.createdAt < bucket.end).length,
    reports: reports.filter((item) => item.createdAt >= bucket.start && item.createdAt < bucket.end).length,
  }));

  const roleDistribution = ['student', 'mentor', 'admin'].map((role) => ({
    label: role,
    value: allUsers.filter((item) => item.role === role).length,
  }));

  const statusDistribution = ['active', 'blocked', 'pending'].map((status) => ({
    label: status,
    value: allUsers.filter((item) => item.status === status).length,
  }));

  const mentorLoad = mentors.map((mentor) => ({
    label: [mentor.user?.firstName, mentor.user?.lastName].filter(Boolean).join(' ') || 'Mentor',
    students: (mentor.assignedStudents || []).length,
    sessions: mentor.sessionCount || 0,
    resources: mentor.resourceCount || 0,
  }));

  const interviewScores = interviews.filter((item) => item.status === 'completed' && typeof item.performanceScore === 'number');
  const averageInterviewScore = interviewScores.length
    ? Math.round(interviewScores.reduce((total, item) => total + item.performanceScore, 0) / interviewScores.length)
    : 0;

  const moderationHealth = {
    openReports: reports.filter((item) => item.status === 'open').length,
    inReviewReports: reports.filter((item) => item.status === 'in-review').length,
    flaggedResources: mentorResources.filter((item) => item.moderationStatus === 'flagged').length,
    hiddenResources: mentorResources.filter((item) => item.moderationStatus === 'hidden').length,
  };

  return {
    monthlySignups,
    contentActivity,
    roleDistribution,
    statusDistribution,
    mentorLoad,
    engagement: {
      averageInterviewScore,
      scheduledMentorSessions: mentorSessions.filter((item) => item.status === 'scheduled').length,
      completedMentorSessions: mentorSessions.filter((item) => item.status === 'completed').length,
      mentorResourcesShared: mentorResources.length,
    },
    moderationHealth,
  };
}

export const getAdminDashboard = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    totalStudents,
    totalMentors,
    totalAdmins,
    activeUsers,
    blockedUsers,
    profilesCompleted,
    totalResumes,
    totalRecommendations,
    totalSkillGaps,
    totalRoadmaps,
    totalInterviews,
    totalMentorSessions,
    totalMentorResources,
    totalReports,
    openReports,
    flaggedResources,
    recentUsers,
    mentorSummaries,
    analytics,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'mentor' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ status: 'active' }),
    User.countDocuments({ status: 'blocked' }),
    User.countDocuments({ onboardingCompleted: true }),
    Resume.countDocuments(),
    CareerRecommendation.countDocuments(),
    SkillGap.countDocuments(),
    Roadmap.countDocuments(),
    Interview.countDocuments(),
    MentorSession.countDocuments(),
    MentorResource.countDocuments(),
    Report.countDocuments(),
    Report.countDocuments({ status: { $in: ['open', 'in-review'] } }),
    MentorResource.countDocuments({ moderationStatus: { $in: ['flagged', 'hidden'] } }),
    User.find({}).sort({ createdAt: -1 }).limit(8).select('firstName lastName email role status profileCompletion createdAt'),
    buildMentorSummaries(),
    buildAnalytics(),
  ]);

  res.status(200).json({
    success: true,
    overview: {
      totalUsers,
      totalStudents,
      totalMentors,
      totalAdmins,
      activeUsers,
      blockedUsers,
      profilesCompleted,
      totalResumes,
      totalRecommendations,
      totalSkillGaps,
      totalRoadmaps,
      totalInterviews,
      totalMentorSessions,
      totalMentorResources,
      totalReports,
      openReports,
      flaggedResources,
    },
    recentUsers,
    mentors: mentorSummaries,
    analytics,
  });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const role = cleanString(req.query.role);
  const status = cleanString(req.query.status);
  const search = cleanString(req.query.search);

  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .select('firstName lastName email role status profileCompletion onboardingCompleted createdAt');

  res.status(200).json({ success: true, count: users.length, users });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const status = cleanString(req.body.status);

  if (!['active', 'blocked', 'pending'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Allowed values: active, blocked, pending.');
  }

  const user = await User.findByIdAndUpdate(req.params.userId, { status }, { new: true, runValidators: true });
  if (!user) {
    res.status(404);
    throw new Error('User not found.');
  }

  await createNotification({
    userId: user._id,
    type: 'admin_update',
    title: 'Account status updated',
    message: `Your CareerAI account status has been changed to ${status}.`,
    link: '/dashboard',
    metadata: { status },
  });

  res.status(200).json({ success: true, message: 'User status updated successfully.', user });
});

export const assignStudentToMentor = asyncHandler(async (req, res) => {
  const studentId = cleanString(req.body.studentId);
  const mentorUser = await User.findById(req.params.mentorId);

  if (!mentorUser) {
    res.status(404);
    throw new Error('Mentor user not found.');
  }
  if (!studentId) {
    res.status(400);
    throw new Error('studentId is required.');
  }

  const student = await User.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student user not found.');
  }

  const mentor = await Mentor.findOneAndUpdate(
    { user: mentorUser._id },
    { user: mentorUser._id },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  if (!(mentor.assignedStudents || []).some((item) => String(item) === String(student._id))) {
    mentor.assignedStudents.push(student._id);
    await mentor.save();
  }

  await createBulkNotifications([mentorUser._id, student._id], {
    type: 'mentor_assignment',
    title: 'Mentor assignment updated',
    message: `A mentor-student assignment has been created between ${mentorUser.email} and ${student.email}.`,
    link: '/notifications',
    metadata: { mentorId: mentorUser._id, studentId: student._id },
  });

  res.status(200).json({ success: true, message: 'Student assigned to mentor successfully.', mentor });
});

export const unassignStudentFromMentor = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findOne({ user: req.params.mentorId });
  if (!mentor) {
    res.status(404);
    throw new Error('Mentor profile not found.');
  }

  mentor.assignedStudents = (mentor.assignedStudents || []).filter(
    (item) => String(item) !== String(req.params.studentId),
  );
  await mentor.save();

  await createBulkNotifications([req.params.mentorId, req.params.studentId], {
    type: 'mentor_assignment',
    title: 'Mentor assignment removed',
    message: 'A mentor-student assignment has been removed by an admin.',
    link: '/notifications',
    metadata: { mentorId: req.params.mentorId, studentId: req.params.studentId },
  });

  res.status(200).json({ success: true, message: 'Student removed from mentor successfully.', mentor });
});

export const getAdminModerationResources = asyncHandler(async (req, res) => {
  const status = cleanString(req.query.status);
  const query = {};
  if (status) {
    query.moderationStatus = status;
  }

  const resources = await MentorResource.find(query)
    .sort({ createdAt: -1 })
    .populate({
      path: 'mentor',
      populate: { path: 'user', select: 'firstName lastName email' },
    })
    .populate('student', 'firstName lastName email');

  res.status(200).json({
    success: true,
    count: resources.length,
    resources,
  });
});

export const moderateResource = asyncHandler(async (req, res) => {
  const status = cleanString(req.body.moderationStatus);
  if (!['approved', 'flagged', 'hidden'].includes(status)) {
    res.status(400);
    throw new Error('Invalid moderation status.');
  }

  const resource = await MentorResource.findById(req.params.resourceId).populate({
    path: 'mentor',
    populate: { path: 'user', select: 'firstName lastName email' },
  });

  if (!resource) {
    res.status(404);
    throw new Error('Mentor resource not found.');
  }

  resource.moderationStatus = status;
  resource.moderationNotes = cleanString(req.body.moderationNotes);
  await resource.save();

  const mentorUserId = resource.mentor?.user?._id;
  if (mentorUserId) {
    await createNotification({
      userId: mentorUserId,
      type: 'admin_update',
      title: 'Resource moderation updated',
      message: `Your resource "${resource.title}" is now marked as ${status}.`,
      link: '/mentor',
      metadata: { resourceId: resource._id, moderationStatus: status },
    });
  }

  res.status(200).json({
    success: true,
    message: 'Resource moderation updated successfully.',
    resource,
  });
});
