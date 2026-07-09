import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProfileForm from '../../components/profile/ProfileForm';
import useCurrentUserData from '../../hooks/useCurrentUserData';
import { upsertMyProfile } from '../../services/profileService';
import calculateProfileCompletion from '../../utils/profileCompletion';
import { useAuth } from '../../context/AuthContext';

const defaultValues = {
  headline: '',
  preferredCareer: '',
  phone: '',
  location: '',
  bio: '',
  institution: '',
  degree: '',
  fieldOfStudy: '',
  grade: '',
  startYear: '',
  endYear: '',
  skillsCsv: '',
  interestsCsv: '',
  experienceLevel: 'beginner',
  github: '',
  linkedin: '',
  portfolio: '',
};

const splitCsv = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toNumberOrUndefined = (value) => {
  if (value === '' || value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
};

function mapProfileToForm(profile) {
  const primaryEducation = profile?.education?.[0] || {};

  return {
    headline: profile?.headline || '',
    preferredCareer: profile?.preferredCareer || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    institution: primaryEducation.institution || '',
    degree: primaryEducation.degree || '',
    fieldOfStudy: primaryEducation.fieldOfStudy || '',
    grade: primaryEducation.grade || '',
    startYear: primaryEducation.startYear || '',
    endYear: primaryEducation.endYear || '',
    skillsCsv: profile?.skills?.join(', ') || '',
    interestsCsv: profile?.interests?.join(', ') || '',
    experienceLevel: profile?.experienceLevel || 'beginner',
    github: profile?.socialLinks?.github || '',
    linkedin: profile?.socialLinks?.linkedin || '',
    portfolio: profile?.socialLinks?.portfolio || '',
  };
}

function buildPayload(values) {
  const hasEducation = values.institution || values.degree || values.fieldOfStudy;

  return {
    headline: values.headline,
    preferredCareer: values.preferredCareer,
    phone: values.phone,
    location: values.location,
    bio: values.bio,
    experienceLevel: values.experienceLevel,
    skills: splitCsv(values.skillsCsv),
    interests: splitCsv(values.interestsCsv),
    education: hasEducation
      ? [
          {
            institution: values.institution,
            degree: values.degree,
            fieldOfStudy: values.fieldOfStudy,
            grade: values.grade,
            startYear: toNumberOrUndefined(values.startYear),
            endYear: toNumberOrUndefined(values.endYear),
          },
        ]
      : [],
    socialLinks: {
      github: values.github,
      linkedin: values.linkedin,
      portfolio: values.portfolio,
    },
  };
}

export default function ProfilePage() {
  const { getToken } = useAuth();
  const { user, profile, loading, error, refresh } = useCurrentUserData();
  const [message, setMessage] = useState('');
  const form = useForm({ defaultValues });

  useEffect(() => {
    if (!loading) {
      form.reset(profile ? mapProfileToForm(profile) : defaultValues);
    }
  }, [form, loading, profile]);

  const completion = useMemo(() => calculateProfileCompletion(profile || {}), [profile]);

  const handleSave = async (values) => {
    setMessage('');
    try {
      await upsertMyProfile(getToken, buildPayload(values));
      await refresh();
      setMessage('Profile saved successfully.');
    } catch (saveError) {
      setMessage(saveError?.response?.data?.message || 'Unable to save your profile.');
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading your profile..." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Profile setup</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Build your career profile</h1>
          <p className="mt-2 text-slate-400">
            Add your academics, skills, and goals. This data will later drive AI recommendations,
            skill-gap analysis, and learning roadmaps.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-5 rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-sm text-brand-100">
            {message}
          </div>
        ) : null}

        <ProfileForm form={form} onSubmit={handleSave} saving={form.formState.isSubmitting} />
      </div>

      <aside className="space-y-6">
        <section className="card p-6">
          <p className="text-sm text-slate-400">Current completion</p>
          <h2 className="mt-2 text-4xl font-bold text-white">{completion}%</h2>
          <p className="mt-3 text-sm text-slate-400">
            A stronger profile leads to better resume analysis and smarter AI guidance.
          </p>
        </section>

        <section className="card p-6">
          <h3 className="text-lg font-semibold text-white">Synced account</h3>
          <dl className="mt-4 space-y-3 text-sm text-slate-300">
            <div className="flex justify-between gap-3 border-b border-slate-800 pb-3">
              <dt>Name</dt>
              <dd className="text-right">{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Not available'}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-slate-800 pb-3">
              <dt>Email</dt>
              <dd className="text-right text-slate-400">{user?.email || 'Not available'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Role</dt>
              <dd className="capitalize text-slate-400">{user?.role || 'student'}</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
