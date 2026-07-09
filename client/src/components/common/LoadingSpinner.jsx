export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4 text-sm text-slate-200">
        <span className="h-3 w-3 animate-pulse rounded-full bg-brand-500" />
        {label}
      </div>
    </div>
  );
}
