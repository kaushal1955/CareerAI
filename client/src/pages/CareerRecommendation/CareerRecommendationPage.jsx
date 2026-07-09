import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, RefreshCcw } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useCurrentUserData from '../../hooks/useCurrentUserData';
import {
  generateCareerRecommendation,
  getLatestCareerRecommendation,
} from '../../services/careerRecommendationService';

function SkillList({ items = [], variant = 'default' }) {
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

export default function CareerRecommendationPage() {
  const { getToken } = useAuth();
  const { profile, loading: profileLoading } = useCurrentUserData();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadLatest = async () => {
    try {
      setLoading(true);
      const response = await getLatestCareerRecommendation(getToken);
      setRecommendation(response.recommendation || null);
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load career recommendations.');
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
      const response = await generateCareerRecommendation(getToken);
      setRecommendation(response.recommendation);
      setMessage('Career recommendations generated successfully.');
    } catch (generateError) {
      setError(generateError?.response?.data?.message || 'Unable to generate recommendations.');
    } finally {
      setGenerating(false);
    }
  };

  if (profileLoading || loading) {
    return <LoadingSpinner label="Loading career recommendations..." />;
  }

  const topRecommendation = recommendation?.recommendations?.[0] || null;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/resume" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            <ArrowLeft size={16} />
            Back to resume workspace
          </Link>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Career recommendation</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Discover the roles that fit your profile</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            CareerAI uses your profile and latest resume analysis to estimate career match, missing skills,
            growth outlook, and suggested next steps.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" type="button" onClick={handleGenerate} disabled={generating}>
            <RefreshCcw size={16} className="mr-2" />
            {generating ? 'Generating...' : recommendation ? 'Regenerate recommendations' : 'Generate recommendations'}
          </button>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="card p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Profile context</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Your current inputs</h2>
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
              <dt>Skills captured</dt>
              <dd className="text-right text-slate-400">{profile?.skills?.length || 0}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <p className="text-sm font-medium text-slate-300">Current skills</p>
            <div className="mt-3">
              <SkillList items={profile?.skills || []} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <BrainCircuit size={20} />
            <p className="text-sm font-medium uppercase tracking-[0.25em]">Top recommendation</p>
          </div>

          {topRecommendation ? (
            <>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-white">{topRecommendation.careerPath}</h2>
                  <p className="mt-2 max-w-2xl text-slate-400">{topRecommendation.summary}</p>
                </div>
                <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-5 py-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Match</p>
                  <p className="mt-2 text-3xl font-bold text-white">{topRecommendation.matchPercentage}%</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm text-slate-400">Salary range</p>
                  <p className="mt-2 font-semibold text-white">{topRecommendation.salaryRangeIndia}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm text-slate-400">Growth outlook</p>
                  <p className="mt-2 font-semibold text-white">{topRecommendation.growthOutlook}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-sm text-slate-400">Learning duration</p>
                  <p className="mt-2 font-semibold text-white">{topRecommendation.estimatedLearningDuration}</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Why this fits you</p>
                <p className="mt-2 text-slate-400">{topRecommendation.whyItFits}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="btn-secondary" to="/skill-gap">
                  Skill gap analysis
                </Link>
                <Link className="btn-secondary" to="/learning-roadmap">
                  Learning roadmap
                </Link>
                <Link className="btn-primary" to="/mock-interview">
                  Mock interview
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
              Generate your first recommendation set to see the best-matching career paths here.
            </div>
          )}
        </div>
      </section>

      {recommendation?.recommendations?.length ? (
        <div className="grid gap-6 xl:grid-cols-3">
          {recommendation.recommendations.map((item) => (
            <section key={item.careerPath} className="card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{item.careerPath}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.summary}</p>
                </div>
                <span className="rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-200">
                  {item.matchPercentage}%
                </span>
              </div>

              <div className="mt-5 space-y-5 text-sm text-slate-300">
                <div>
                  <p className="mb-2 font-medium text-white">Existing skills</p>
                  <SkillList items={item.existingSkills || []} variant="success" />
                </div>
                <div>
                  <p className="mb-2 font-medium text-white">Missing skills</p>
                  <SkillList items={item.missingSkills || []} variant="warning" />
                </div>
                <div>
                  <p className="mb-2 font-medium text-white">Recommended courses</p>
                  <ul className="space-y-2 text-slate-400">
                    {(item.recommendedCourses || []).map((course) => (
                      <li key={course}>• {course}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 font-medium text-white">Suggested projects</p>
                  <ul className="space-y-2 text-slate-400">
                    {(item.suggestedProjects || []).map((project) => (
                      <li key={project}>• {project}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
