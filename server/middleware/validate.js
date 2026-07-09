export function validateProfileUpsert(req, res, next) {
  const { skills, interests, education, socialLinks } = req.body;

  if (skills && !Array.isArray(skills)) {
    return res.status(400).json({ success: false, message: 'skills must be an array.' });
  }

  if (interests && !Array.isArray(interests)) {
    return res.status(400).json({ success: false, message: 'interests must be an array.' });
  }

  if (education && !Array.isArray(education)) {
    return res.status(400).json({ success: false, message: 'education must be an array.' });
  }

  if (socialLinks && typeof socialLinks !== 'object') {
    return res.status(400).json({ success: false, message: 'socialLinks must be an object.' });
  }

  return next();
}
