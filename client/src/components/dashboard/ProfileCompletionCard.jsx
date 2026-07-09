export default function ProfileCompletionCard({ completion = 0, preferredCareer = 'Not selected yet' }) {
  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm text-slate-400">Profile completion</p>
          <h3 className="mt-2 text-3xl font-bold text-white">{completion}%</h3>
          <p className="mt-2 text-sm text-slate-400">
            Preferred career: <span className="text-slate-200">{preferredCareer}</span>
          </p>
        </div>

        <div className="relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border-8 border-slate-800" />
          <div
            className="absolute inset-0 rounded-full border-8 border-brand-500"
            style={{
              clipPath: `inset(${100 - completion}% 0 0 0)`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
            {completion}%
          </div>
        </div>
      </div>
    </section>
  );
}
