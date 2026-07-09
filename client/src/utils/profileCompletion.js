export default function calculateProfileCompletion(profile = {}) {
  const checks = [
    Boolean(profile.headline),
    Boolean(profile.bio),
    Boolean(profile.location),
    Boolean(profile.phone),
    Boolean(profile.preferredCareer),
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Array.isArray(profile.interests) && profile.interests.length > 0,
    Array.isArray(profile.education) && profile.education.length > 0,
    Boolean(profile.socialLinks?.linkedin || profile.socialLinks?.github || profile.socialLinks?.portfolio),
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}
