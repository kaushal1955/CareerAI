import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircleMore, Send } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useCurrentUserData from '../../hooks/useCurrentUserData';
import { getChatContacts, getConversation, sendChatMessage } from '../../services/chatService';
import { getSocketClient } from '../../services/socketClient';

function formatConversationTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

export default function ChatPage() {
  const { getToken } = useAuth();
  const { user, loading: userLoading } = useCurrentUserData();
  const [contacts, setContacts] = useState([]);
  const [selectedPeerId, setSelectedPeerId] = useState('');
  const [messages, setMessages] = useState([]);
  const [peer, setPeer] = useState(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadContacts = async (keepPeer = true) => {
    const response = await getChatContacts(getToken);
    const nextContacts = response.contacts || [];
    setContacts(nextContacts);

    if (!keepPeer || !selectedPeerId || !nextContacts.some((item) => item._id === selectedPeerId)) {
      setSelectedPeerId(nextContacts[0]?._id || '');
    }
  };

  const loadConversation = async (peerId) => {
    if (!peerId) {
      setMessages([]);
      setPeer(null);
      return;
    }

    const response = await getConversation(getToken, peerId);
    setMessages(response.messages || []);
    setPeer(response.peer || null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        await loadContacts(false);
        setError('');
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load chat contacts.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedPeerId) return;
    loadConversation(selectedPeerId).catch((loadError) => {
      setError(loadError?.response?.data?.message || 'Unable to load conversation.');
    });
  }, [selectedPeerId]);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = getSocketClient();
    socket.emit('register', { userId: user._id });

    const handleChatMessage = ({ message: incomingMessage }) => {
      const senderId = incomingMessage?.sender?._id || incomingMessage?.sender;
      const recipientId = incomingMessage?.recipient?._id || incomingMessage?.recipient;
      const belongsToSelectedConversation =
        selectedPeerId &&
        ((String(senderId) === String(selectedPeerId) && String(recipientId) === String(user._id)) ||
          (String(senderId) === String(user._id) && String(recipientId) === String(selectedPeerId)));

      if (belongsToSelectedConversation) {
        setMessages((prev) => {
          if (prev.some((item) => String(item._id) === String(incomingMessage._id))) {
            return prev;
          }
          return [...prev, incomingMessage];
        });
      }

      loadContacts(true).catch(() => null);
    };

    socket.on('chat:message', handleChatMessage);

    return () => {
      socket.off('chat:message', handleChatMessage);
    };
  }, [selectedPeerId, user?._id]);

  const selectedContact = useMemo(
    () => contacts.find((item) => item._id === selectedPeerId) || peer,
    [contacts, peer, selectedPeerId],
  );

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedPeerId || !draft.trim()) return;

    try {
      setSending(true);
      setMessage('');
      setError('');
      const response = await sendChatMessage(getToken, selectedPeerId, draft.trim());
      setMessages((prev) => {
        if (prev.some((item) => String(item._id) === String(response.message._id))) {
          return prev;
        }
        return [...prev, response.message];
      });
      setDraft('');
      setMessage('Message sent.');
      await loadContacts(true);
    } catch (sendError) {
      setError(sendError?.response?.data?.message || 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  if (userLoading || loading) {
    return <LoadingSpinner label="Loading chat workspace..." />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <section className="card p-6">
        <div className="flex items-center gap-3 text-brand-300">
          <MessageCircleMore size={18} />
          <p className="text-sm font-medium uppercase tracking-[0.2em]">Conversations</p>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-white">Mentor-student chat</h1>
        <p className="mt-2 text-sm text-slate-400">
          Chat in real time with your assigned mentors or students.
        </p>

        {error ? <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
        {message ? <div className="mt-5 rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">{message}</div> : null}

        <div className="mt-5 space-y-3">
          {contacts.length ? (
            contacts.map((contact) => (
              <button
                key={contact._id}
                type="button"
                onClick={() => setSelectedPeerId(contact._id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedPeerId === contact._id ? 'border-brand-500/40 bg-brand-500/10' : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {[contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email}
                    </h3>
                    <p className="text-xs capitalize text-slate-500">{contact.role}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-400">{contact.lastMessage || 'Start a conversation'}</p>
                  </div>
                  <div className="text-right">
                    {contact.unreadCount ? (
                      <span className="inline-flex rounded-full bg-brand-600 px-2 py-1 text-xs font-semibold text-white">
                        {contact.unreadCount}
                      </span>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">{contact.lastMessageAt ? new Date(contact.lastMessageAt).toLocaleDateString() : ''}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-800 p-6 text-sm text-slate-500">
              No chat contacts are available yet. Students need a mentor assignment, and mentors need assigned students.
            </p>
          )}
        </div>
      </section>

      <section className="card flex min-h-[70vh] flex-col p-6">
        {selectedContact ? (
          <>
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-semibold text-white">
                {[selectedContact.firstName, selectedContact.lastName].filter(Boolean).join(' ') || selectedContact.email}
              </h2>
              <p className="text-sm capitalize text-slate-500">{selectedContact.role}</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto py-5">
              {messages.length ? (
                messages.map((item) => {
                  const senderId = item.sender?._id || item.sender;
                  const mine = String(senderId) === String(user?._id);
                  return (
                    <div key={item._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${mine ? 'bg-brand-600 text-white' : 'border border-slate-800 bg-slate-950/70 text-slate-200'}`}>
                        <p>{item.content}</p>
                        <p className={`mt-2 text-xs ${mine ? 'text-brand-100/80' : 'text-slate-500'}`}>
                          {formatConversationTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No messages yet. Start the conversation below.
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="border-t border-slate-800 pt-4">
              <div className="flex gap-3">
                <textarea
                  className="input min-h-24 flex-1"
                  placeholder="Write a message..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button className="btn-primary self-end" type="submit" disabled={sending || !draft.trim()}>
                  <Send size={16} className="mr-2" />
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center text-slate-500">
            Select a contact to open the conversation.
          </div>
        )}
      </section>
    </div>
  );
}
