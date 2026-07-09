import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const features = [
  'Secure email and password authentication',
  'Student profile onboarding and progress tracking',
  'PDF resume upload with ATS-style AI analysis',
  'MongoDB-backed user sync and role-ready authorization',
  'Production-focused starter architecture for future AI modules',
];

export default function HomePage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-6 py-12 shadow-soft lg:grid-cols-[1.2fr_0.8fr] lg:px-10">
        <div>
          <span className="inline-flex rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
            AI-powered career guidance platform
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Build your career journey with a personal AI mentor.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            CareerAI helps students and professionals manage profiles, analyze resumes, discover roles,
            and prepare for future opportunities. This starter focuses on authentication and onboarding.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            {!isSignedIn ? (
              <>
                <Link className="btn-primary" to="/sign-up">
                  Get Started
                </Link>
                <Link className="btn-secondary" to="/login">
                  Login
                </Link>
              </>
            ) : (
              <>
                <Link className="btn-primary" to="/dashboard">
                  Open Dashboard
                </Link>
                <Link className="btn-secondary" to="/profile">
                  Complete Profile
                </Link>
                <Link className="btn-secondary" to="/resume">
                  Analyze Resume
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-sm font-medium text-slate-400">Included in this scaffold</p>
          <ul className="mt-5 space-y-4 text-sm text-slate-200">
            {features.map((feature) => (
              <li key={feature} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
