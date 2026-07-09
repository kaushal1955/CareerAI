import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, FileWarning, LineChart, ShieldCheck, Users } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useCurrentUserData from '../../hooks/useCurrentUserData';
import {
  assignStudentToMentor,
  getAdminDashboard,
  getAdminReports,
  getAdminResources,
  getAdminUsers,
  moderateAdminResource,
  unassignStudentFromMentor,
  updateAdminReport,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '../../services/adminService';

function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function VerticalBarChart({ title, items = [], valueKey = 'value', color = 'bg-brand-500' }) {
  const maxValue = Math.max(...items.map((item) => item[valueKey] || 0), 1);

  return (
    <section className="card p-6">
      <div className="flex items-center gap-3 text-brand-300">
        <BarChart3 size={18} />
        <p className="text-sm font-medium uppercase tracking-[0.2em]">{title}</p>
      </div>
      <div className="mt-6 flex min-h-[220px] items-end gap-4 overflow-x-auto">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-[72px] flex-1 flex-col items-center gap-3">
            <div className="text-xs text-slate-400">{item[valueKey]}</div>
            <div className="flex h-40 w-full items-end rounded-2xl bg-slate-950/70 p-2">
              <div
                className={`w-full rounded-xl ${color}`}
                style={{ height: `${Math.max(8, ((item[valueKey] || 0) / maxValue) * 100)}%` }}
              />
            </div>
            <div className="text-center text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HorizontalBarList({ title, items = [], keys = [] }) {
  const totals = items.map((item) => keys.reduce((sum, key) => sum + (item[key] || 0), 0));
  const maxValue = Math.max(...totals, 1);

  return (
    <section className="card p-6">
      <div className="flex items-center gap-3 text-brand-300">
        <LineChart size={18} />
        <p className="text-sm font-medium uppercase tracking-[0.2em]">{title}</p>
      </div>
      <div className="mt-6 space-y-4">
        {items.map((item) => {
          const total = keys.reduce((sum, key) => sum + (item[key] || 0), 0);
          return (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-200">{item.label}</span>
                <span className="text-slate-500">{total}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-950/80">
                <div className="flex h-3 overflow-hidden rounded-full">
                  {keys.map((key, index) => (
                    <div
                      key={key}
                      className={index === 0 ? 'bg-brand-500' : index === 1 ? 'bg-emerald-500' : index === 2 ? 'bg-amber-500' : index === 3 ? 'bg-violet-500' : index === 4 ? 'bg-cyan-500' : 'bg-rose-500'}
                      style={{ width: `${total ? ((item[key] || 0) / total) * ((total / maxValue) * 100) : 0}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
        {keys.map((key, index) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-brand-500' : index === 1 ? 'bg-emerald-500' : index === 2 ? 'bg-amber-500' : index === 3 ? 'bg-violet-500' : index === 4 ? 'bg-cyan-500' : 'bg-rose-500'}`} />
            {key}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminPage() {
  const { getToken } = useAuth();
  const { user, loading: userLoading } = useCurrentUserData();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ role: '', status: '', search: '' });
  const [actionId, setActionId] = useState('');
  const [assignment, setAssignment] = useState({ mentorId: '', studentId: '' });

  const loadDashboard = async () => {
    const response = await getAdminDashboard(getToken);
    setDashboard(response);
  };

  const loadUsers = async (params = {}) => {
    const response = await getAdminUsers(getToken, params);
    setUsers(response.users || []);
  };

  const loadAllUsers = async () => {
    const response = await getAdminUsers(getToken);
    setAllUsers(response.users || []);
  };

  const loadReports = async () => {
    const response = await getAdminReports(getToken);
    setReports(response.reports || []);
  };

  const loadResources = async () => {
    const response = await getAdminResources(getToken);
    setResources(response.resources || []);
  };

  const bootstrap = async () => {
    try {
      setLoading(true);
      await Promise.all([loadDashboard(), loadUsers(filters), loadAllUsers(), loadReports(), loadResources()]);
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      await loadUsers(filters);
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to filter users.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      setActionId(`role-${userId}`);
      setMessage('');
      setError('');
      await updateAdminUserRole(getToken, userId, role);
      setMessage('User role updated successfully.');
      await Promise.all([loadUsers(filters), loadAllUsers(), loadDashboard()]);
    } catch (updateError) {
      setError(updateError?.response?.data?.message || 'Unable to update user role.');
    } finally {
      setActionId('');
    }
  };

  const handleStatusChange = async (userId, status) => {
    try {
      setActionId(`status-${userId}`);
      setMessage('');
      setError('');
      await updateAdminUserStatus(getToken, userId, status);
      setMessage('User status updated successfully.');
      await Promise.all([loadUsers(filters), loadAllUsers(), loadDashboard()]);
    } catch (updateError) {
      setError(updateError?.response?.data?.message || 'Unable to update user status.');
    } finally {
      setActionId('');
    }
  };

  const handleAssignStudent = async () => {
    if (!assignment.mentorId || !assignment.studentId) {
      setMessage('');
      setError('Please select both a mentor and a student before assigning.');
      return;
    }
    try {
      setActionId('assign-student');
      setMessage('');
      setError('');
      await assignStudentToMentor(getToken, assignment.mentorId, assignment.studentId);
      setMessage('Student assigned to mentor successfully.');
      await Promise.all([loadDashboard(), loadAllUsers(), loadUsers(filters)]);
      setAssignment({ mentorId: '', studentId: '' });
    } catch (assignError) {
      setError(assignError?.response?.data?.message || 'Unable to assign student to mentor.');
    } finally {
      setActionId('');
    }
  };

  const handleUnassignStudent = async (mentorUserId, studentId) => {
    try {
      setActionId(`unassign-${mentorUserId}-${studentId}`);
      setMessage('');
      setError('');
      await unassignStudentFromMentor(getToken, mentorUserId, studentId);
      setMessage('Student removed from mentor successfully.');
      await Promise.all([loadDashboard(), loadAllUsers(), loadUsers(filters)]);
    } catch (unassignError) {
      setError(unassignError?.response?.data?.message || 'Unable to remove student from mentor.');
    } finally {
      setActionId('');
    }
  };

  const handleReportStatus = async (reportId, nextStatus) => {
    const adminResponse = window.prompt('Optional admin response for this report:', '') || '';

    try {
      setActionId(`report-${reportId}`);
      setMessage('');
      setError('');
      await updateAdminReport(getToken, reportId, { status: nextStatus, adminResponse });
      setMessage('Report updated successfully.');
      await Promise.all([loadDashboard(), loadReports()]);
    } catch (updateError) {
      setError(updateError?.response?.data?.message || 'Unable to update report.');
    } finally {
      setActionId('');
    }
  };

  const handleResourceModeration = async (resourceId, moderationStatus) => {
    const moderationNotes = window.prompt('Optional moderation notes:', '') || '';

    try {
      setActionId(`resource-${resourceId}`);
      setMessage('');
      setError('');
      await moderateAdminResource(getToken, resourceId, { moderationStatus, moderationNotes });
      setMessage('Resource moderation updated successfully.');
      await Promise.all([loadDashboard(), loadResources()]);
    } catch (updateError) {
      setError(updateError?.response?.data?.message || 'Unable to update resource moderation.');
    } finally {
      setActionId('');
    }
  };

  const mentors = useMemo(() => allUsers.filter((item) => item.role === 'mentor'), [allUsers]);
  const students = useMemo(() => allUsers.filter((item) => item.role === 'student'), [allUsers]);

  if (userLoading || loading) {
    return <LoadingSpinner label="Loading admin dashboard..." />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-bold text-white">Admin access only</h1>
        <p className="mt-3 text-slate-400">Ask an existing admin to grant your account the admin role.</p>
      </div>
    );
  }

  const overview = dashboard?.overview || {};
  const analytics = dashboard?.analytics || {};

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Admin dashboard</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Manage users, mentors, analytics, and moderation</h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Monitor platform usage, update roles and statuses, assign students to mentors, review reports, and moderate shared content.
        </p>
      </section>

      {message ? <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total users" value={overview.totalUsers || 0} hint="All platform accounts" />
        <StatCard label="Students" value={overview.totalStudents || 0} hint="Learners using CareerAI" />
        <StatCard label="Mentors" value={overview.totalMentors || 0} hint="Mentor accounts" />
        <StatCard label="Profiles completed" value={overview.profilesCompleted || 0} hint="Users who finished onboarding" />
        <StatCard label="Open reports" value={overview.openReports || 0} hint="Reports waiting for admin review" />
        <StatCard label="Flagged resources" value={overview.flaggedResources || 0} hint="Resources currently flagged or hidden" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Resumes" value={overview.totalResumes || 0} hint="Uploaded resumes" />
        <StatCard label="Recommendations" value={overview.totalRecommendations || 0} hint="Career recommendation runs" />
        <StatCard label="Skill gaps" value={overview.totalSkillGaps || 0} hint="Generated skill-gap reports" />
        <StatCard label="Roadmaps" value={overview.totalRoadmaps || 0} hint="Learning roadmaps created" />
        <StatCard label="Interviews" value={overview.totalInterviews || 0} hint="Mock interview sessions" />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <VerticalBarChart title="User signups trend" items={analytics.monthlySignups || []} />
        <HorizontalBarList title="Content creation activity" items={analytics.contentActivity || []} keys={['resumes', 'recommendations', 'skillGaps', 'roadmaps', 'interviews', 'reports']} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <VerticalBarChart title="Role distribution" items={analytics.roleDistribution || []} color="bg-emerald-500" />
        <VerticalBarChart title="Status distribution" items={analytics.statusDistribution || []} color="bg-amber-500" />
        <section className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <Users size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">Engagement summary</p>
          </div>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Average interview score</p>
              <p className="mt-2 text-2xl font-semibold text-white">{analytics.engagement?.averageInterviewScore || 0}%</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Scheduled mentor sessions</p>
              <p className="mt-2 text-2xl font-semibold text-white">{analytics.engagement?.scheduledMentorSessions || 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-slate-400">Shared mentor resources</p>
              <p className="mt-2 text-2xl font-semibold text-white">{analytics.engagement?.mentorResourcesShared || 0}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-white">Assign student to mentor</h2>
          <div className="mt-5 space-y-4">
            <select className="input" value={assignment.mentorId} onChange={(e) => setAssignment((prev) => ({ ...prev, mentorId: e.target.value }))}>
              <option value="">Select mentor</option>
              {mentors.map((mentor) => (
                <option key={mentor._id} value={mentor._id}>
                  {[mentor.firstName, mentor.lastName].filter(Boolean).join(' ') || mentor.email}
                </option>
              ))}
            </select>
            {mentors.length === 0 ? (
              <p className="text-sm text-amber-300">No mentors found. Change a user's role to "mentor" first.</p>
            ) : null}
            <select className="input" value={assignment.studentId} onChange={(e) => setAssignment((prev) => ({ ...prev, studentId: e.target.value }))}>
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {[student.firstName, student.lastName].filter(Boolean).join(' ') || student.email}
                </option>
              ))}
            </select>
            <button className="btn-primary w-full" type="button" onClick={handleAssignStudent} disabled={actionId === 'assign-student'}>
              {actionId === 'assign-student' ? 'Assigning...' : 'Assign student'}
            </button>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-xl font-semibold text-white">Mentor summary</h2>
          <div className="mt-5 space-y-4">
            {(dashboard?.mentors || []).length ? (
              dashboard.mentors.map((mentor) => (
                <div key={mentor._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{mentor.name}</h3>
                      <p className="text-sm text-slate-400">{mentor.email}</p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{mentor.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">Assigned students: <span className="text-slate-200">{mentor.assignedStudents}</span></p>
                  <p className="mt-2 text-sm text-slate-400">Sessions: <span className="text-slate-200">{mentor.sessionCount}</span> · Resources: <span className="text-slate-200">{mentor.resourceCount}</span></p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(mentor.expertise || []).map((skill) => (
                      <span key={skill} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                  {(mentor.assignedStudentDetails || []).length ? (
                    <div className="mt-4 space-y-2">
                      {mentor.assignedStudentDetails.map((student) => (
                        <div key={student._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 px-3 py-2 text-sm">
                          <span className="text-slate-300">{student.name}</span>
                          <button
                            className="text-rose-300 transition hover:text-rose-200"
                            type="button"
                            onClick={() => handleUnassignStudent(mentor.userId, student._id)}
                            disabled={actionId === `unassign-${mentor.userId}-${student._id}`}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No mentor profiles found yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <FileWarning size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">Reports queue</p>
          </div>
          <div className="mt-5 space-y-4">
            {reports.length ? (
              reports.map((report) => (
                <div key={report._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{report.subject}</h3>
                      <p className="text-sm text-slate-400">
                        {report.reporter ? `${[report.reporter.firstName, report.reporter.lastName].filter(Boolean).join(' ') || report.reporter.email} · ` : ''}
                        <span className="capitalize">{report.category}</span> · <span className="capitalize">{report.severity}</span>
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300">{report.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{report.description}</p>
                  {report.adminResponse ? (
                    <p className="mt-3 text-sm text-slate-500">Response: {report.adminResponse}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="btn-secondary" type="button" onClick={() => handleReportStatus(report._id, 'in-review')} disabled={actionId === `report-${report._id}`}>Mark in review</button>
                    <button className="btn-secondary" type="button" onClick={() => handleReportStatus(report._id, 'resolved')} disabled={actionId === `report-${report._id}`}>Resolve</button>
                    <button className="btn-secondary" type="button" onClick={() => handleReportStatus(report._id, 'dismissed')} disabled={actionId === `report-${report._id}`}>Dismiss</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No reports submitted yet.</p>
            )}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <ShieldCheck size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">Resource moderation</p>
          </div>
          <div className="mt-5 space-y-4">
            {resources.length ? (
              resources.map((resource) => (
                <div key={resource._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{resource.title}</h3>
                      <p className="text-sm text-slate-400">
                        Shared by {[resource.mentor?.user?.firstName, resource.mentor?.user?.lastName].filter(Boolean).join(' ') || resource.mentor?.user?.email || 'Mentor'}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300">{resource.moderationStatus || 'approved'}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">{resource.description || 'No description provided.'}</p>
                  {resource.url ? <p className="mt-2 text-xs text-slate-500">{resource.url}</p> : null}
                  {resource.moderationNotes ? <p className="mt-2 text-xs text-slate-500">Notes: {resource.moderationNotes}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button className="btn-secondary" type="button" onClick={() => handleResourceModeration(resource._id, 'approved')} disabled={actionId === `resource-${resource._id}`}>Approve</button>
                    <button className="btn-secondary" type="button" onClick={() => handleResourceModeration(resource._id, 'flagged')} disabled={actionId === `resource-${resource._id}`}>Flag</button>
                    <button className="btn-secondary" type="button" onClick={() => handleResourceModeration(resource._id, 'hidden')} disabled={actionId === `resource-${resource._id}`}>Hide</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No mentor resources available for moderation.</p>
            )}
          </div>
        </section>
      </div>

      <section className="card p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">User management</h2>
            <p className="mt-2 text-sm text-slate-400">Filter accounts, update roles, and change access status.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4 xl:min-w-[780px]">
            <input className="input" placeholder="Search name or email" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
            <select className="input" value={filters.role} onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}>
              <option value="">All roles</option>
              <option value="student">Student</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
            <select className="input" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="pending">Pending</option>
            </select>
            <button className="btn-primary" type="button" onClick={handleSearch}>Apply filters</button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {users.length ? (
            users.map((account) => (
              <div key={account._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr_0.7fr_0.5fr] xl:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{[account.firstName, account.lastName].filter(Boolean).join(' ') || 'Unnamed user'}</h3>
                    <p className="text-sm text-slate-400">{account.email}</p>
                    <p className="mt-2 text-sm text-slate-500">Profile completion: {account.profileCompletion || 0}%</p>
                  </div>

                  <div>
                    <label className="label">Role</label>
                    <select className="input" defaultValue={account.role} onChange={(e) => handleRoleChange(account._id, e.target.value)} disabled={actionId === `role-${account._id}`}>
                      <option value="student">Student</option>
                      <option value="mentor">Mentor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Status</label>
                    <select className="input" defaultValue={account.status} onChange={(e) => handleStatusChange(account._id, e.target.value)} disabled={actionId === `status-${account._id}`}>
                      <option value="active">Active</option>
                      <option value="blocked">Blocked</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div className="text-sm text-slate-500">
                    Joined<br />
                    <span className="text-slate-300">{new Date(account.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No users found for the current filters.</p>
          )}
        </div>
      </section>
    </div>
  );
}
