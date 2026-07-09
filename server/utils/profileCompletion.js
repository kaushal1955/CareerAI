export function calculateProfileCompletion(profile = {}) {
  const checks = [
    Boolean(profile.headline),
    Boolean(profile.bio),
    Boolean(profile.location),
    Boolean(profile.phone),
    Boolean(profile.preferredCareer),
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Array.isArray(profile.interests) && profile.interests.length > 0,
    Array.isArray(profile.education) && profile.education.length > 0,
    Boolean(
      profile.socialLinks?.linkedin || profile.socialLinks?.github || profile.socialLinks?.portfolio,
    ),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
