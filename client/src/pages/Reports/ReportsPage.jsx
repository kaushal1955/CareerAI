import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Flag } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMyReports, submitReport } from '../../services/reportService';

export default function ReportsPage() {
  const { getToken } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    category: 'other',
    severity: 'medium',
    subject: '',
    description: '',
    targetType: 'general',
    targetId: '',
  });

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await getMyReports(getToken);
      setReports(response.reports || []);
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load your reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setMessage('');
      setError('');
      await submitReport(getToken, form);
      setMessage('Report submitted successfully.');
      setForm({
        category: 'other',
        severity: 'medium',
        subject: '',
        description: '',
        targetType: 'general',
        targetId: '',
      });
      await loadReports();
    } catch (submitError) {
      setError(submitError?.response?.data?.message || 'Unable to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading reports..." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6">
        <div className="flex items-center gap-3 text-brand-300">
          <Flag size={18} />
          <p className="text-sm font-medium uppercase tracking-[0.2em]">Reports</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-white">Submit an issue or moderation report</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Report bugs, inappropriate content, mentor issues, or any platform concern. Admins will review and update the status.
        </p>
      </section>

      {message ? <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-white">Create report</h2>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <select className="input" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}>
                <option value="other">Other</option>
                <option value="bug">Bug</option>
                <option value="mentor">Mentor</option>
                <option value="user">User</option>
                <option value="resource">Resource</option>
                <option value="chat">Chat</option>
                <option value="content">Content</option>
              </select>
              <select className="input" value={form.severity} onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <input className="input" placeholder="Subject" value={form.subject} onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))} />
            <textarea className="input min-h-36" placeholder="Describe the issue in detail" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            <div className="grid gap-4 md:grid-cols-2">
              <input className="input" placeholder="Target type (optional)" value={form.targetType} onChange={(e) => setForm((prev) => ({ ...prev, targetType: e.target.value }))} />
              <input className="input" placeholder="Target ID (optional)" value={form.targetId} onChange={(e) => setForm((prev) => ({ ...prev, targetId: e.target.value }))} />
            </div>
            <button className="btn-primary w-full" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          </form>
        </section>

        <section className="card p-6">
          <h2 className="text-xl font-semibold text-white">My submitted reports</h2>
          <div className="mt-5 space-y-4">
            {reports.length ? (
              reports.map((report) => (
                <div key={report._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{report.subject}</h3>
                      <p className="text-sm text-slate-400 capitalize">{report.category} · {report.severity}</p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300">
                      {report.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{report.description}</p>
                  {report.adminResponse ? (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-300">
                      <p className="font-medium text-white">Admin response</p>
                      <p className="mt-2 text-slate-400">{report.adminResponse}</p>
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs text-slate-500">Submitted on {new Date(report.createdAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">You have not submitted any reports yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
