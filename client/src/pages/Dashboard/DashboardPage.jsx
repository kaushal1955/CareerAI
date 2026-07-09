import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProfileCompletionCard from '../../components/dashboard/ProfileCompletionCard';
import useCurrentUserData from '../../hooks/useCurrentUserData';
import calculateProfileCompletion from '../../utils/profileCompletion';

function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">{value}</h3>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, loading, error } = useCurrentUserData();

  if (loading) {
    return <LoadingSpinner label="Loading your dashboard..." />;
  }

  const completion = calculateProfileCompletion(profile || {});

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-white">
            Welcome back, {user?.firstName || 'Learner'}
          </h1>
          <p className="mt-2 text-slate-400">
            Track onboarding progress before adding AI career modules.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn-secondary" to="/resume">
            Analyze resume
          </Link>
          <Link className="btn-primary" to="/profile">
            Update profile
          </Link>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ProfileCompletionCard
          completion={completion}
          preferredCareer={profile?.preferredCareer || 'Not selected yet'}
        />

        <div className="card p-6">
          <p className="text-sm text-slate-400">Account snapshot</p>
          <dl className="mt-4 space-y-3 text-sm text-slate-200">
            <div className="flex justify-between gap-3 border-b border-slate-800 pb-3">
              <dt>Email</dt>
              <dd className="text-right text-slate-400">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-slate-800 pb-3">
              <dt>Role</dt>
              <dd className="capitalize text-slate-400">{user?.role || 'student'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Experience</dt>
              <dd className="capitalize text-slate-400">{profile?.experienceLevel || 'beginner'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Profile status"
          value={completion >= 60 ? 'On track' : 'Needs attention'}
          hint="Complete key fields to unlock better AI recommendations."
        />
        <StatCard
          label="Preferred career"
          value={profile?.preferredCareer || 'Not selected'}
          hint="Set a goal to later power skill-gap analysis and roadmaps."
        />
        <StatCard
          label="Top skills"
          value={profile?.skills?.slice(0, 3).join(', ') || 'Add your first skills'}
          hint="Use comma-separated skills in the profile form."
        />
      </section>
    </div>
  );
}
