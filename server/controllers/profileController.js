import Profile from '../models/Profile.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { calculateProfileCompletion } from '../utils/profileCompletion.js';

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanStringArray(values = []) {
  return [...new Set(values.map((value) => cleanString(value)).filter(Boolean))];
}

function sanitizeEducation(education = []) {
  return education
    .filter(Boolean)
    .map((item) => ({
      institution: cleanString(item.institution),
      degree: cleanString(item.degree),
      fieldOfStudy: cleanString(item.fieldOfStudy),
      startYear: item.startYear || undefined,
      endYear: item.endYear || undefined,
      grade: cleanString(item.grade),
    }))
    .filter(
      (item) => item.institution || item.degree || item.fieldOfStudy || item.startYear || item.endYear,
    );
}

async function findDbUser(req) {
  const userId = req.userId;

  if (!userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error('User record not found. Sync the authenticated user first.');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const profile = await Profile.findOne({ user: user._id });

  res.status(200).json({
    success: true,
    profile,
  });
});

export const upsertMyProfile = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);

  const sanitizedProfile = {
    headline: cleanString(req.body.headline),
    phone: cleanString(req.body.phone),
    bio: cleanString(req.body.bio),
    location: cleanString(req.body.location),
    preferredCareer: cleanString(req.body.preferredCareer),
    experienceLevel: req.body.experienceLevel || 'beginner',
    skills: cleanStringArray(req.body.skills),
    interests: cleanStringArray(req.body.interests),
    education: sanitizeEducation(req.body.education),
    socialLinks: {
      github: cleanString(req.body.socialLinks?.github),
      linkedin: cleanString(req.body.socialLinks?.linkedin),
      portfolio: cleanString(req.body.socialLinks?.portfolio),
    },
  };

  const profile = await Profile.findOneAndUpdate(
    { user: user._id },
    {
      ...sanitizedProfile,
      user: user._id,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  const completion = calculateProfileCompletion(profile.toObject());
  await User.findByIdAndUpdate(user._id, {
    profileCompletion: completion,
    onboardingCompleted: completion >= 60,
  });

  res.status(200).json({
    success: true,
    message: 'Profile saved successfully.',
    profile,
    completion,
  });
});
