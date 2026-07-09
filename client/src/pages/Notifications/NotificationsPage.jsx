import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, CheckCheck } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useCurrentUserData from '../../hooks/useCurrentUserData';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';
import { getSocketClient } from '../../services/socketClient';

export default function NotificationsPage() {
  const { getToken } = useAuth();
  const { user, loading: userLoading } = useCurrentUserData();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    const response = await getMyNotifications(getToken);
    setNotifications(response.notifications || []);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        setLoading(true);
        await loadNotifications();
        setError('');
      } catch (loadError) {
        setError(loadError?.response?.data?.message || 'Unable to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = getSocketClient();
    socket.emit('register', { userId: user._id });

    const handleNotification = ({ notification }) => {
      setNotifications((prev) => [notification, ...prev]);
    };

    socket.on('notification:new', handleNotification);
    return () => {
      socket.off('notification:new', handleNotification);
    };
  }, [user?._id]);

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  const handleMarkRead = async (notificationId) => {
    try {
      setError('');
      await markNotificationRead(getToken, notificationId);
      setNotifications((prev) => prev.map((item) => (item._id === notificationId ? { ...item, readAt: new Date().toISOString() } : item)));
    } catch (markError) {
      setError(markError?.response?.data?.message || 'Unable to mark notification as read.');
    }
  };

  const handleMarkAll = async () => {
    try {
      setMarkingAll(true);
      setMessage('');
      setError('');
      await markAllNotificationsRead(getToken);
      setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
      setMessage('All notifications marked as read.');
    } catch (markError) {
      setError(markError?.response?.data?.message || 'Unable to mark all notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  if (userLoading || loading) {
    return <LoadingSpinner label="Loading notifications..." />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-3 text-brand-300">
            <Bell size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">Notifications</p>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">Stay updated on mentor activity and platform events</h1>
          <p className="mt-2 text-slate-400">Unread notifications: {unreadCount}</p>
        </div>
        <button className="btn-primary" type="button" onClick={handleMarkAll} disabled={markingAll || !unreadCount}>
          <CheckCheck size={16} className="mr-2" />
          {markingAll ? 'Updating...' : 'Mark all as read'}
        </button>
      </section>

      {message ? <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      <section className="space-y-4">
        {notifications.length ? (
          notifications.map((item) => (
            <div key={item._id} className={`card p-5 ${item.readAt ? 'opacity-80' : 'border-brand-500/20'}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">{item.message}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="capitalize">{item.type.replace('_', ' ')}</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                    {item.link ? <span>{item.link}</span> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {item.metadata?.meetingLink ? (
                      <a className="btn-secondary" href={item.metadata.meetingLink} target="_blank" rel="noreferrer">
                        Join meeting
                      </a>
                    ) : null}
                    {item.metadata?.resourceUrl ? (
                      <a className="btn-secondary" href={item.metadata.resourceUrl} target="_blank" rel="noreferrer">
                        Open resource
                      </a>
                    ) : null}
                    {item.link ? (
                      <a className="btn-secondary" href={item.link}>
                        Open in app
                      </a>
                    ) : null}
                  </div>
                </div>
                {!item.readAt ? (
                  <button className="btn-secondary" type="button" onClick={() => handleMarkRead(item._id)}>
                    Mark as read
                  </button>
                ) : (
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">Read</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="card p-10 text-center text-slate-500">No notifications yet.</div>
        )}
      </section>
    </div>
  );
}
