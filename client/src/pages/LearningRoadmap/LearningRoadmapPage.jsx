import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Map, RefreshCcw } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { generateRoadmap, getLatestRoadmap } from '../../services/roadmapService';

export default function LearningRoadmapPage() {
  const { getToken } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadLatest = async () => {
    try {
      setLoading(true);
      const response = await getLatestRoadmap(getToken);
      setRoadmap(response.roadmap || null);
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load learning roadmap.');
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
      const response = await generateRoadmap(getToken);
      setRoadmap(response.roadmap);
      setMessage('Learning roadmap generated successfully.');
    } catch (generateError) {
      setError(generateError?.response?.data?.message || 'Unable to generate roadmap.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading learning roadmap..." />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/skill-gap" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            <ArrowLeft size={16} />
            Back to skill gap analysis
          </Link>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Learning roadmap</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Turn your skill gap into a weekly plan</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Generate a stage-by-stage roadmap with topics, project ideas, practice actions, and milestones.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={handleGenerate} disabled={generating}>
          <RefreshCcw size={16} className="mr-2" />
          {generating ? 'Generating...' : roadmap ? 'Regenerate roadmap' : 'Generate roadmap'}
        </button>
      </section>

      {message ? <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      {roadmap ? (
        <>
          <div className="flex flex-wrap gap-3">
            <Link className="btn-secondary" to="/skill-gap">
              Back to skill gap
            </Link>
            <Link className="btn-primary" to="/mock-interview">
              Start mock interview
            </Link>
          </div>
          <section className="card p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3 text-brand-300">
                  <Map size={20} />
                  <p className="text-sm font-medium uppercase tracking-[0.25em]">Roadmap overview</p>
                </div>
                <h2 className="mt-3 text-3xl font-bold text-white">{roadmap.targetCareer}</h2>
                <p className="mt-2 max-w-3xl text-slate-400">{roadmap.summary}</p>
              </div>
              <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-brand-200">Estimated duration</p>
                <p className="mt-2 text-2xl font-bold text-white">{roadmap.estimatedDuration}</p>
              </div>
            </div>
          </section>

          <div className="space-y-5">
            {(roadmap.stages || []).map((stage, index) => (
              <section key={stage.title} className="card p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-brand-300">Stage {index + 1}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{stage.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{stage.goal}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
                    {stage.weekRange}
                  </span>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-4">
                  <div>
                    <p className="font-medium text-white">Topics</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-400">
                      {(stage.topics || []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-white">Courses</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-400">
                      {(stage.courses || []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-white">Practice</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-400">
                      {(stage.practiceItems || []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-white">Projects</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-400">
                      {(stage.miniProjects || []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
                  <p className="font-medium text-white">Milestone</p>
                  <p className="mt-2 text-slate-400">{stage.milestone}</p>
                </div>
              </section>
            ))}
          </div>
        </>
      ) : (
        <div className="card p-10 text-center text-slate-400">
          <p>No roadmap generated yet.</p>
          <button className="btn-primary mt-5" type="button" onClick={handleGenerate}>
            Generate your roadmap
          </button>
        </div>
      )}
    </div>
  );
}
