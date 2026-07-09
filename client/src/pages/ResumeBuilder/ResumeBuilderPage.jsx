import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Plus, Save, Trash2 } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  exportMyResumeBuilderPdf,
  getMyResumeBuilder,
  saveMyResumeBuilder,
} from '../../services/resumeBuilderService';

const emptyState = {
  title: 'Professional Resume',
  basics: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
  },
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  achievements: [],
};

const emptyExperience = () => ({
  company: '',
  role: '',
  startDate: '',
  endDate: '',
  location: '',
  highlights: [],
});

const emptyEducation = () => ({
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startYear: '',
  endYear: '',
  grade: '',
});

const emptyProject = () => ({
  title: '',
  subtitle: '',
  link: '',
  highlights: [],
});

const emptyCertification = () => ({
  name: '',
  issuer: '',
  year: '',
});

function splitLines(value = '') {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(list = []) {
  return (list || []).join('\n');
}

function normalizeDraft(draft = {}) {
  return {
    ...emptyState,
    ...draft,
    basics: {
      ...emptyState.basics,
      ...(draft.basics || {}),
    },
    skills: Array.isArray(draft.skills) ? draft.skills : [],
    experience: Array.isArray(draft.experience) ? draft.experience : [],
    education: Array.isArray(draft.education) ? draft.education : [],
    projects: Array.isArray(draft.projects) ? draft.projects : [],
    certifications: Array.isArray(draft.certifications) ? draft.certifications : [],
    achievements: Array.isArray(draft.achievements) ? draft.achievements : [],
  };
}

export default function ResumeBuilderPage() {
  const { getToken } = useAuth();
  const [builder, setBuilder] = useState(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDraft = async () => {
    try {
      setLoading(true);
      const response = await getMyResumeBuilder(getToken);
      setBuilder(normalizeDraft(response.draft || emptyState));
      setError('');
    } catch (loadError) {
      setError(loadError?.response?.data?.message || 'Unable to load resume builder draft.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDraft();
  }, []);

  const updateBasics = (field, value) => {
    setBuilder((prev) => ({
      ...prev,
      basics: {
        ...prev.basics,
        [field]: value,
      },
    }));
  };

  const updateSectionItem = (section, index, field, value) => {
    setBuilder((prev) => ({
      ...prev,
      [section]: prev[section].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const addSectionItem = (section, factory) => {
    setBuilder((prev) => ({
      ...prev,
      [section]: [...prev[section], factory()],
    }));
  };

  const removeSectionItem = (section, index) => {
    setBuilder((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      setMessage('');
      setError('');
      const response = await saveMyResumeBuilder(getToken, builder);
      setBuilder(normalizeDraft(response.draft || builder));
      setMessage('Resume builder draft saved successfully.');
    } catch (saveError) {
      setError(saveError?.response?.data?.message || 'Unable to save the resume draft.');
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async () => {
    try {
      setExporting(true);
      setMessage('');
      setError('');
      await saveMyResumeBuilder(getToken, builder);
      const blob = await exportMyResumeBuilderPdf(getToken);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${(builder.basics.fullName || 'careerai-resume').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setMessage('Resume PDF exported successfully.');
    } catch (exportError) {
      setError(exportError?.response?.data?.message || 'Unable to export the resume PDF.');
    } finally {
      setExporting(false);
    }
  };

  const previewName = useMemo(
    () => builder.basics.fullName || builder.title || 'Professional Resume',
    [builder.basics.fullName, builder.title],
  );

  if (loading) {
    return <LoadingSpinner label="Loading resume builder..." />;
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/resume" className="mb-3 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            <ArrowLeft size={16} />
            Back to resume workspace
          </Link>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Resume builder</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Build a polished resume and export PDF</h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Create a structured resume draft, preview it live, save it in CareerAI, and export a PDF copy.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" type="button" onClick={saveDraft} disabled={saving}>
            <Save size={16} className="mr-2" />
            {saving ? 'Saving...' : 'Save draft'}
          </button>
          <button className="btn-primary" type="button" onClick={exportPdf} disabled={exporting}>
            <Download size={16} className="mr-2" />
            {exporting ? 'Exporting...' : 'Export PDF'}
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

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-white">Basic details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input className="input" placeholder="Resume title" value={builder.title} onChange={(e) => setBuilder((prev) => ({ ...prev, title: e.target.value }))} />
              <input className="input" placeholder="Full name" value={builder.basics.fullName} onChange={(e) => updateBasics('fullName', e.target.value)} />
              <input className="input" placeholder="Email" value={builder.basics.email} onChange={(e) => updateBasics('email', e.target.value)} />
              <input className="input" placeholder="Phone" value={builder.basics.phone} onChange={(e) => updateBasics('phone', e.target.value)} />
              <input className="input" placeholder="Location" value={builder.basics.location} onChange={(e) => updateBasics('location', e.target.value)} />
              <input className="input" placeholder="LinkedIn URL" value={builder.basics.linkedin} onChange={(e) => updateBasics('linkedin', e.target.value)} />
              <input className="input" placeholder="GitHub URL" value={builder.basics.github} onChange={(e) => updateBasics('github', e.target.value)} />
              <input className="input" placeholder="Portfolio URL" value={builder.basics.portfolio} onChange={(e) => updateBasics('portfolio', e.target.value)} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-white">Summary and skills</h2>
            <div className="mt-5 space-y-4">
              <textarea
                className="input min-h-32"
                placeholder="Write a concise professional summary tailored to your target role."
                value={builder.summary}
                onChange={(e) => setBuilder((prev) => ({ ...prev, summary: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Skills (comma separated)"
                value={builder.skills.join(', ')}
                onChange={(e) =>
                  setBuilder((prev) => ({
                    ...prev,
                    skills: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                  }))
                }
              />
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Experience</h2>
              <button className="btn-secondary" type="button" onClick={() => addSectionItem('experience', emptyExperience)}>
                <Plus size={16} className="mr-2" />
                Add experience
              </button>
            </div>
            <div className="mt-5 space-y-5">
              {builder.experience.map((item, index) => (
                <div key={`${item.company}-${index}`} className="rounded-2xl border border-slate-800 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-300">Experience #{index + 1}</p>
                    <button className="text-rose-300 transition hover:text-rose-200" type="button" onClick={() => removeSectionItem('experience', index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="input" placeholder="Company" value={item.company} onChange={(e) => updateSectionItem('experience', index, 'company', e.target.value)} />
                    <input className="input" placeholder="Role" value={item.role} onChange={(e) => updateSectionItem('experience', index, 'role', e.target.value)} />
                    <input className="input" placeholder="Start date" value={item.startDate} onChange={(e) => updateSectionItem('experience', index, 'startDate', e.target.value)} />
                    <input className="input" placeholder="End date" value={item.endDate} onChange={(e) => updateSectionItem('experience', index, 'endDate', e.target.value)} />
                    <input className="input md:col-span-2" placeholder="Location" value={item.location} onChange={(e) => updateSectionItem('experience', index, 'location', e.target.value)} />
                    <textarea
                      className="input min-h-28 md:col-span-2"
                      placeholder="Highlights (one per line)"
                      value={listToText(item.highlights)}
                      onChange={(e) => updateSectionItem('experience', index, 'highlights', splitLines(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Education</h2>
              <button className="btn-secondary" type="button" onClick={() => addSectionItem('education', emptyEducation)}>
                <Plus size={16} className="mr-2" />
                Add education
              </button>
            </div>
            <div className="mt-5 space-y-5">
              {builder.education.map((item, index) => (
                <div key={`${item.institution}-${index}`} className="rounded-2xl border border-slate-800 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-300">Education #{index + 1}</p>
                    <button className="text-rose-300 transition hover:text-rose-200" type="button" onClick={() => removeSectionItem('education', index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="input" placeholder="Institution" value={item.institution} onChange={(e) => updateSectionItem('education', index, 'institution', e.target.value)} />
                    <input className="input" placeholder="Degree" value={item.degree} onChange={(e) => updateSectionItem('education', index, 'degree', e.target.value)} />
                    <input className="input" placeholder="Field of study" value={item.fieldOfStudy} onChange={(e) => updateSectionItem('education', index, 'fieldOfStudy', e.target.value)} />
                    <input className="input" placeholder="Grade / CGPA" value={item.grade} onChange={(e) => updateSectionItem('education', index, 'grade', e.target.value)} />
                    <input className="input" placeholder="Start year" value={item.startYear} onChange={(e) => updateSectionItem('education', index, 'startYear', e.target.value)} />
                    <input className="input" placeholder="End year" value={item.endYear} onChange={(e) => updateSectionItem('education', index, 'endYear', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Projects</h2>
              <button className="btn-secondary" type="button" onClick={() => addSectionItem('projects', emptyProject)}>
                <Plus size={16} className="mr-2" />
                Add project
              </button>
            </div>
            <div className="mt-5 space-y-5">
              {builder.projects.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-800 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-300">Project #{index + 1}</p>
                    <button className="text-rose-300 transition hover:text-rose-200" type="button" onClick={() => removeSectionItem('projects', index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="input" placeholder="Project title" value={item.title} onChange={(e) => updateSectionItem('projects', index, 'title', e.target.value)} />
                    <input className="input" placeholder="Subtitle / tech stack" value={item.subtitle} onChange={(e) => updateSectionItem('projects', index, 'subtitle', e.target.value)} />
                    <input className="input md:col-span-2" placeholder="Project link" value={item.link} onChange={(e) => updateSectionItem('projects', index, 'link', e.target.value)} />
                    <textarea
                      className="input min-h-28 md:col-span-2"
                      placeholder="Project highlights (one per line)"
                      value={listToText(item.highlights)}
                      onChange={(e) => updateSectionItem('projects', index, 'highlights', splitLines(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Certifications</h2>
              <button className="btn-secondary" type="button" onClick={() => addSectionItem('certifications', emptyCertification)}>
                <Plus size={16} className="mr-2" />
                Add certification
              </button>
            </div>
            <div className="mt-5 space-y-5">
              {builder.certifications.map((item, index) => (
                <div key={`${item.name}-${index}`} className="rounded-2xl border border-slate-800 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-300">Certification #{index + 1}</p>
                    <button className="text-rose-300 transition hover:text-rose-200" type="button" onClick={() => removeSectionItem('certifications', index)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <input className="input" placeholder="Certification name" value={item.name} onChange={(e) => updateSectionItem('certifications', index, 'name', e.target.value)} />
                    <input className="input" placeholder="Issuer" value={item.issuer} onChange={(e) => updateSectionItem('certifications', index, 'issuer', e.target.value)} />
                    <input className="input" placeholder="Year" value={item.year} onChange={(e) => updateSectionItem('certifications', index, 'year', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-white">Achievements</h2>
            <textarea
              className="input mt-5 min-h-32"
              placeholder="Write achievements, awards, or leadership points (one per line)"
              value={listToText(builder.achievements)}
              onChange={(e) => setBuilder((prev) => ({ ...prev, achievements: splitLines(e.target.value) }))}
            />
          </section>
        </div>

        <aside className="card p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Live preview</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{previewName}</h2>
          <p className="mt-3 text-sm text-slate-400">
            {[builder.basics.email, builder.basics.phone, builder.basics.location].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-6 space-y-6 text-sm text-slate-300">
            {builder.summary ? (
              <section>
                <h3 className="text-base font-semibold text-white">Summary</h3>
                <p className="mt-2 leading-6 text-slate-400">{builder.summary}</p>
              </section>
            ) : null}

            {builder.skills.length ? (
              <section>
                <h3 className="text-base font-semibold text-white">Skills</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {builder.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {builder.experience.length ? (
              <section>
                <h3 className="text-base font-semibold text-white">Experience</h3>
                <div className="mt-3 space-y-4">
                  {builder.experience.map((item, index) => (
                    <div key={`${item.company}-${index}`}>
                      <p className="font-medium text-slate-100">
                        {item.role || 'Role'}{item.company ? ` — ${item.company}` : ''}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[item.location, item.startDate, item.endDate].filter(Boolean).join(' · ')}
                      </p>
                      <ul className="mt-2 space-y-2 text-slate-400">
                        {item.highlights.map((highlight) => (
                          <li key={highlight}>• {highlight}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {builder.projects.length ? (
              <section>
                <h3 className="text-base font-semibold text-white">Projects</h3>
                <div className="mt-3 space-y-4">
                  {builder.projects.map((item, index) => (
                    <div key={`${item.title}-${index}`}>
                      <p className="font-medium text-slate-100">{item.title || 'Project title'}</p>
                      <p className="mt-1 text-xs text-slate-500">{[item.subtitle, item.link].filter(Boolean).join(' · ')}</p>
                      <ul className="mt-2 space-y-2 text-slate-400">
                        {item.highlights.map((highlight) => (
                          <li key={highlight}>• {highlight}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {builder.education.length ? (
              <section>
                <h3 className="text-base font-semibold text-white">Education</h3>
                <div className="mt-3 space-y-4">
                  {builder.education.map((item, index) => (
                    <div key={`${item.institution}-${index}`}>
                      <p className="font-medium text-slate-100">{item.institution}</p>
                      <p className="mt-1 text-slate-400">{[item.degree, item.fieldOfStudy].filter(Boolean).join(' · ')}</p>
                      <p className="mt-1 text-xs text-slate-500">{[item.startYear, item.endYear, item.grade].filter(Boolean).join(' · ')}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
