import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Hammer, RefreshCcw } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useCurrentUserData from '../../hooks/useCurrentUserData';
import { generateSkillGap, getLatestSkillGap } from '../../services/skillGapService';

function ChipList({ items = [], variant = 'default' }) {
  if (!items.length) {
    return <p className="text-sm text-slate-500">No items available yet.</p>;
  }

  const className =
    variant === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : variant === 'warning'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        : 'border-slate-700 bg-slate-950 text-slate-200';

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-full border px-3 py-1 text-xs ${className}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function SkillGapPage() {
  const { getToken } = useAuth();
  const { profile, loading: profileLoading } = useCurrentUserData();
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadLatest = async () => {
    try {
      setLoading(true);
      const response = await getLatestSkillGap(getToken);
      setSkillGap(response.skillGap || null);
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load skill-gap analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setMessage('');
      setError('');
      const response = await generateSkillGap(getToken);
      setSkillGap(response.skillGap);
      setMessage('Skill-gap analysis generated successfully.');
    } catch (generateError) {
      setError(generateError?.response?.data?.message || 'Unable to generate skill-gap analysis.');
    } finally {
      setGenerating(false);
    }
  };

  if (profileLoading || loading) {
    return <LoadingSpinner label="Loading skill-gap analysis..." />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/career-recommendation" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            <ArrowLeft size={16} />
            Back to career recommendation
          </Link>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Skill gap analysis</p>
          <h1 className="mt-2 text-3xl font-bold text-white">See what is missing for your target career</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Compare your current skills, extracted resume skills, and target role requirements to know exactly what to learn next.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={handleGenerate} disabled={generating}>
          <RefreshCcw size={16} className="mr-2" />
          {generating ? 'Generating...' : skillGap ? 'Regenerate analysis' : 'Generate analysis'}
        </button>
      </section>

      {message ? <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Current profile</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Your target direction</h2>
          <dl className="mt-5 space-y-4 text-sm text-slate-300">
            <div className="flex justify-between gap-3 border-b border-slate-800 pb-3">
              <dt>Preferred career</dt>
              <dd className="text-right text-slate-400">{profile?.preferredCareer || 'Not selected'}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-slate-800 pb-3">
              <dt>Experience level</dt>
              <dd className="capitalize text-right text-slate-400">{profile?.experienceLevel || 'beginner'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Current listed skills</dt>
              <dd className="text-right text-slate-400">{profile?.skills?.length || 0}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-300">Current skills</p>
            <div className="mt-3">
              <ChipList items={profile?.skills || []} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <Hammer size={20} />
            <p className="text-sm font-medium uppercase tracking-[0.25em]">Gap summary</p>
          </div>
          {skillGap ? (
            <>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">{skillGap.targetCareer}</h2>
                  <p className="mt-2 text-slate-400">{skillGap.summary}</p>
                </div>
                <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-5 py-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Readiness</p>
                  <p className="mt-2 text-3xl font-bold text-white">{skillGap.matchPercentage}%</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm font-medium text-white">Existing skills</p>
                  <div className="mt-3">
                    <ChipList items={skillGap.existingSkills || []} variant="success" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm font-medium text-white">Missing skills</p>
                  <div className="mt-3">
                    <ChipList items={skillGap.missingSkills || []} variant="warning" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
              Generate skill-gap analysis to see your missing skills and priorities.
            </div>
          )}
        </div>
      </section>

      {skillGap ? (
        <>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-secondary" to="/learning-roadmap">
              Open learning roadmap
            </Link>
            <Link className="btn-primary" to="/mock-interview">
              Practice mock interview
            </Link>
          </div>
          <section className="grid gap-6 xl:grid-cols-3">
            {(skillGap.priorities || []).map((item) => (
              <div key={item.skill} className="card p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-white">{item.skill}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.priority === 'high' ? 'bg-rose-500/15 text-rose-200' : item.priority === 'medium' ? 'bg-amber-500/15 text-amber-200' : 'bg-slate-800 text-slate-300'}`}>
                    {item.priority}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-400">{item.reason}</p>
                <dl className="mt-5 space-y-3 text-sm text-slate-300">
                  <div>
                    <dt className="font-medium text-white">Recommended course</dt>
                    <dd className="mt-1 text-slate-400">{item.recommendedCourse}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-white">Practice project</dt>
                    <dd className="mt-1 text-slate-400">{item.practiceProject}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-white">Estimated time</dt>
                    <dd className="mt-1 text-slate-400">{item.estimatedWeeks}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white">Recommended courses</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {(skillGap.recommendedCourses || []).map((course) => (
                  <li key={course}>• {course}</li>
                ))}
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white">Suggested projects</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {(skillGap.suggestedProjects || []).map((project) => (
                  <li key={project}>• {project}</li>
                ))}
              </ul>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
