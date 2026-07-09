import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BellRing, Smartphone } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  deletePushSubscription,
  getNotificationSettings,
  savePushSubscription,
  sendPushTest,
  updateNotificationSettings,
} from '../../services/settingsService';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getServiceWorkerRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.ready;
}

export default function SettingsPage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    preferences: {
      inApp: true,
      email: true,
      push: false,
      chatMessage: true,
      mentorSession: true,
      mentorResource: true,
      mentorAssignment: true,
      adminUpdate: true,
      reportUpdate: true,
    },
    push: {
      enabled: false,
      publicKey: '',
      subscriptionCount: 0,
      subscriptions: [],
    },
  });
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getNotificationSettings(getToken);
      setSettings(response);
      setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default');
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load notification settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const deviceCount = settings.push?.subscriptions?.length || 0;
  const pushReady = useMemo(
    () => 'serviceWorker' in navigator && 'PushManager' in window && settings.push?.enabled,
    [settings.push?.enabled],
  );

  const updatePreference = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value,
      },
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setMessage('');
      setError('');
      const response = await updateNotificationSettings(getToken, settings.preferences);
      setSettings((prev) => ({ ...prev, preferences: response.preferences }));
      setMessage('Notification preferences saved successfully.');
    } catch (saveError) {
      setError(saveError?.response?.data?.message || 'Unable to save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      setPushBusy(true);
      setMessage('');
      setError('');

      if (!pushReady) {
        throw new Error('Push notifications are not configured on the server or not supported on this browser.');
      }

      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== 'granted') {
        throw new Error('Notification permission was not granted.');
      }

      const registration = await getServiceWorkerRegistration();
      if (!registration) {
        throw new Error('Service worker is not available in this browser.');
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await savePushSubscription(getToken, {
          ...existingSubscription.toJSON(),
          deviceLabel: navigator.platform || 'Browser device',
        });
      } else {
        const applicationServerKey = urlBase64ToUint8Array(settings.push.publicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        await savePushSubscription(getToken, {
          ...subscription.toJSON(),
          deviceLabel: navigator.platform || 'Browser device',
        });
      }

      await updateNotificationSettings(getToken, {
        ...settings.preferences,
        push: true,
      });
      await loadSettings();
      setMessage('Push notifications enabled on this device.');
    } catch (pushError) {
      setError(pushError?.response?.data?.message || pushError.message || 'Unable to enable push notifications.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisablePush = async () => {
    try {
      setPushBusy(true);
      setMessage('');
      setError('');
      const registration = await getServiceWorkerRegistration();
      const subscription = registration ? await registration.pushManager.getSubscription() : null;

      if (subscription?.endpoint) {
        await deletePushSubscription(getToken, subscription.endpoint);
        await subscription.unsubscribe().catch(() => null);
      }

      await updateNotificationSettings(getToken, {
        ...settings.preferences,
        push: false,
      });
      await loadSettings();
      setMessage('Push notifications disabled on this device.');
    } catch (pushError) {
      setError(pushError?.response?.data?.message || pushError.message || 'Unable to disable push notifications.');
    } finally {
      setPushBusy(false);
    }
  };

  const handlePushTest = async () => {
    try {
      setPushBusy(true);
      setMessage('');
      setError('');
      const response = await sendPushTest(getToken);
      setMessage(response.message || 'Push test sent.');
    } catch (pushError) {
      setError(pushError?.response?.data?.message || 'Unable to send push test.');
    } finally {
      setPushBusy(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading settings..." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Settings</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Notification and device settings</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Manage in-app, email, and mobile-ready push alerts for chat, mentor activity, admin updates, and reports.
        </p>
      </section>

      {message ? <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <BellRing size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">Notification preferences</p>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ['inApp', 'In-app notifications'],
              ['email', 'Email notifications'],
              ['chatMessage', 'Chat message alerts'],
              ['mentorSession', 'Mentor session alerts'],
              ['mentorResource', 'Mentor resource alerts'],
              ['mentorAssignment', 'Mentor assignment alerts'],
              ['adminUpdate', 'Admin update alerts'],
              ['reportUpdate', 'Report update alerts'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                <span>{label}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={Boolean(settings.preferences[key])}
                  onChange={(event) => updatePreference(key, event.target.checked)}
                />
              </label>
            ))}
            <button className="btn-primary w-full" type="button" onClick={handleSavePreferences} disabled={saving}>
              {saving ? 'Saving preferences...' : 'Save notification preferences'}
            </button>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <Smartphone size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">Push notifications</p>
          </div>
          <div className="mt-5 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Browser permission</p>
              <p className="mt-2 capitalize text-white">{permission}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Server push configuration</p>
              <p className="mt-2 text-white">{settings.push?.enabled ? 'Configured' : 'Not configured'}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Connected devices</p>
              <p className="mt-2 text-white">{deviceCount}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" type="button" onClick={handleEnablePush} disabled={pushBusy || !settings.push?.enabled}>
                {pushBusy ? 'Working...' : 'Enable push on this device'}
              </button>
              <button className="btn-secondary" type="button" onClick={handleDisablePush} disabled={pushBusy || !deviceCount}>
                Disable push
              </button>
              <button className="btn-secondary" type="button" onClick={handlePushTest} disabled={pushBusy || !deviceCount}>
                Send test alert
              </button>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-500">
              Mobile-ready alerts work best when the app is installed or kept open in a browser that supports service workers and push notifications.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
