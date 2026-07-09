const fieldBlock = 'grid gap-5 md:grid-cols-2';

export default function ProfileForm({ form, onSubmit, saving = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white">Personal information</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <label className="label">Headline</label>
            <input className="input" placeholder="Aspiring full-stack developer" {...register('headline')} />
          </div>
          <div>
            <label className="label">Preferred career</label>
            <input className="input" placeholder="Frontend Developer" {...register('preferredCareer')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" placeholder="+91 98765 43210" {...register('phone')} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="Jharkhand, India" {...register('location')} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Short bio</label>
            <textarea className="input min-h-32" placeholder="Tell us about your background and goals." {...register('bio')} />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white">Education</h2>
        <div className={`mt-5 ${fieldBlock}`}>
          <div>
            <label className="label">Institution</label>
            <input className="input" placeholder="IIT / University name" {...register('institution')} />
          </div>
          <div>
            <label className="label">Degree</label>
            <input className="input" placeholder="B.Tech / BCA / MCA" {...register('degree')} />
          </div>
          <div>
            <label className="label">Field of study</label>
            <input className="input" placeholder="Computer Science" {...register('fieldOfStudy')} />
          </div>
          <div>
            <label className="label">Grade / CGPA</label>
            <input className="input" placeholder="8.4 CGPA" {...register('grade')} />
          </div>
          <div>
            <label className="label">Start year</label>
            <input className="input" placeholder="2022" type="number" {...register('startYear')} />
          </div>
          <div>
            <label className="label">End year</label>
            <input className="input" placeholder="2026" type="number" {...register('endYear')} />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white">Skills and interests</h2>
        <div className={`mt-5 ${fieldBlock}`}>
          <div>
            <label className="label">Skills</label>
            <input className="input" placeholder="React, Node.js, MongoDB, DSA" {...register('skillsCsv')} />
            <p className="mt-2 text-xs text-slate-500">Enter comma-separated skills.</p>
          </div>
          <div>
            <label className="label">Interests</label>
            <input className="input" placeholder="AI, web development, cybersecurity" {...register('interestsCsv')} />
            <p className="mt-2 text-xs text-slate-500">Enter comma-separated interests.</p>
          </div>
          <div>
            <label className="label">Experience level</label>
            <select className="input" {...register('experienceLevel')}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white">Social links</h2>
        <div className={`mt-5 ${fieldBlock}`}>
          <div>
            <label className="label">GitHub</label>
            <input className="input" placeholder="https://github.com/username" {...register('github')} />
          </div>
          <div>
            <label className="label">LinkedIn</label>
            <input className="input" placeholder="https://linkedin.com/in/username" {...register('linkedin')} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Portfolio</label>
            <input className="input" placeholder="https://yourportfolio.com" {...register('portfolio')} />
          </div>
        </div>
      </section>

      {Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          Please review the highlighted fields and try again.
        </div>
      )}

      <button className="btn-primary w-full sm:w-auto" type="submit" disabled={saving}>
        {saving ? 'Saving profile...' : 'Save profile'}
      </button>
    </form>
  );
}
