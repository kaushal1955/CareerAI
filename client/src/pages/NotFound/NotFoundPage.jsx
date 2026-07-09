import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="card mx-auto max-w-2xl p-10 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-brand-300">404</p>
      <h1 className="mt-3 text-4xl font-bold text-white">Page not found</h1>
      <p className="mt-4 text-slate-400">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary mt-6">
        Go home
      </Link>
    </div>
  );
}
