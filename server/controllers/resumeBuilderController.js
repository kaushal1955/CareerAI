import PDFDocument from 'pdfkit';
import BuiltResume from '../models/BuiltResume.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanStringArray(values = []) {
  return [...new Set((values || []).map((item) => cleanString(item)).filter(Boolean))];
}

function sanitizeBasics(basics = {}) {
  return {
    fullName: cleanString(basics.fullName),
    email: cleanString(basics.email),
    phone: cleanString(basics.phone),
    location: cleanString(basics.location),
    linkedin: cleanString(basics.linkedin),
    github: cleanString(basics.github),
    portfolio: cleanString(basics.portfolio),
  };
}

function sanitizeExperience(experience = []) {
  return (experience || [])
    .map((item) => ({
      company: cleanString(item.company),
      role: cleanString(item.role),
      startDate: cleanString(item.startDate),
      endDate: cleanString(item.endDate),
      location: cleanString(item.location),
      highlights: cleanStringArray(item.highlights),
    }))
    .filter((item) => item.company || item.role || item.highlights.length);
}

function sanitizeEducation(education = []) {
  return (education || [])
    .map((item) => ({
      institution: cleanString(item.institution),
      degree: cleanString(item.degree),
      fieldOfStudy: cleanString(item.fieldOfStudy),
      startYear: cleanString(item.startYear),
      endYear: cleanString(item.endYear),
      grade: cleanString(item.grade),
    }))
    .filter((item) => item.institution || item.degree || item.fieldOfStudy);
}

function sanitizeProjects(projects = []) {
  return (projects || [])
    .map((item) => ({
      title: cleanString(item.title),
      subtitle: cleanString(item.subtitle),
      link: cleanString(item.link),
      highlights: cleanStringArray(item.highlights),
    }))
    .filter((item) => item.title || item.subtitle || item.highlights.length);
}

function sanitizeCertifications(certifications = []) {
  return (certifications || [])
    .map((item) => ({
      name: cleanString(item.name),
      issuer: cleanString(item.issuer),
      year: cleanString(item.year),
    }))
    .filter((item) => item.name || item.issuer);
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

function buildDefaultDraft(user, profile) {
  const firstEducation = profile?.education?.[0] || {};

  return {
    title: `${[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Professional'} Resume`,
    template: 'professional',
    basics: {
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      linkedin: profile?.socialLinks?.linkedin || '',
      github: profile?.socialLinks?.github || '',
      portfolio: profile?.socialLinks?.portfolio || '',
    },
    summary: profile?.bio || profile?.headline || '',
    skills: profile?.skills || [],
    experience: [],
    education: profile?.education?.map((item) => ({
      institution: item.institution || '',
      degree: item.degree || '',
      fieldOfStudy: item.fieldOfStudy || '',
      startYear: item.startYear ? String(item.startYear) : '',
      endYear: item.endYear ? String(item.endYear) : '',
      grade: item.grade || '',
    })) ||
      (firstEducation?.institution ? [firstEducation] : []),
    projects: profile?.projects?.map((project) => ({
      title: project.title || '',
      subtitle: (project.techStack || []).join(', '),
      link: project.url || '',
      highlights: project.description ? [project.description] : [],
    })) || [],
    certifications: profile?.certifications?.map((certification) => ({
      name: certification.name || '',
      issuer: certification.issuer || '',
      year: certification.issueDate ? new Date(certification.issueDate).getFullYear().toString() : '',
    })) || [],
    achievements: [],
  };
}

function sanitizeDraftPayload(body = {}, user, profile) {
  const defaults = buildDefaultDraft(user, profile);

  return {
    title: cleanString(body.title) || defaults.title,
    template: 'professional',
    basics: sanitizeBasics(body.basics || defaults.basics),
    summary: cleanString(body.summary || defaults.summary),
    skills: cleanStringArray(body.skills || defaults.skills),
    experience: sanitizeExperience(body.experience || []),
    education: sanitizeEducation(body.education || defaults.education),
    projects: sanitizeProjects(body.projects || defaults.projects),
    certifications: sanitizeCertifications(body.certifications || defaults.certifications),
    achievements: cleanStringArray(body.achievements || []),
  };
}

function ensureSpace(doc, space = 80) {
  if (doc.y > doc.page.height - space) {
    doc.addPage();
  }
}

function writeSectionHeading(doc, title) {
  ensureSpace(doc, 60);
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text(title.toUpperCase());
  doc.moveTo(doc.page.margins.left, doc.y + 3).lineTo(doc.page.width - doc.page.margins.right, doc.y + 3).stroke('#D1D5DB');
  doc.moveDown(0.6);
}

function writeBulletList(doc, items = []) {
  items.filter(Boolean).forEach((item) => {
    ensureSpace(doc, 40);
    doc.font('Helvetica').fontSize(10).fillColor('#1F2937').text(`• ${item}`, {
      indent: 12,
      lineGap: 3,
    });
  });
}

async function getDraftOrDefault(user) {
  const [draft, profile] = await Promise.all([
    BuiltResume.findOne({ user: user._id }),
    Profile.findOne({ user: user._id }),
  ]);

  return draft || buildDefaultDraft(user, profile);
}

export const getMyBuiltResume = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const draft = await getDraftOrDefault(user);

  res.status(200).json({
    success: true,
    draft,
  });
});

export const upsertMyBuiltResume = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const profile = await Profile.findOne({ user: user._id });
  const payload = sanitizeDraftPayload(req.body, user, profile);

  const draft = await BuiltResume.findOneAndUpdate(
    { user: user._id },
    {
      user: user._id,
      ...payload,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    success: true,
    message: 'Resume builder draft saved successfully.',
    draft,
  });
});

export const exportMyBuiltResumePdf = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const draft = await getDraftOrDefault(user);
  const safeName = cleanString(draft.basics?.fullName || draft.title || 'careerai-resume')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName || 'careerai-resume'}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(22).fillColor('#111827').text(draft.basics?.fullName || 'Professional Resume', {
    align: 'center',
  });

  const contactLine = [
    draft.basics?.email,
    draft.basics?.phone,
    draft.basics?.location,
    draft.basics?.linkedin,
    draft.basics?.github,
    draft.basics?.portfolio,
  ]
    .filter(Boolean)
    .join(' | ');

  if (contactLine) {
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(10).fillColor('#374151').text(contactLine, {
      align: 'center',
    });
  }

  if (draft.summary) {
    writeSectionHeading(doc, 'Professional Summary');
    doc.font('Helvetica').fontSize(10.5).fillColor('#1F2937').text(draft.summary, {
      lineGap: 4,
    });
  }

  if (draft.skills?.length) {
    writeSectionHeading(doc, 'Skills');
    doc.font('Helvetica').fontSize(10.5).fillColor('#1F2937').text(draft.skills.join(', '), {
      lineGap: 4,
    });
  }

  if (draft.experience?.length) {
    writeSectionHeading(doc, 'Experience');
    draft.experience.forEach((item) => {
      ensureSpace(doc, 90);
      doc.font('Helvetica-Bold').fontSize(11).text(`${item.role || 'Role'}${item.company ? ` — ${item.company}` : ''}`);
      const meta = [item.location, item.startDate, item.endDate].filter(Boolean).join(' | ');
      if (meta) {
        doc.font('Helvetica').fontSize(9.5).fillColor('#6B7280').text(meta);
      }
      doc.moveDown(0.3);
      writeBulletList(doc, item.highlights);
      doc.moveDown(0.3);
    });
  }

  if (draft.projects?.length) {
    writeSectionHeading(doc, 'Projects');
    draft.projects.forEach((item) => {
      ensureSpace(doc, 80);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(item.title || 'Project');
      const meta = [item.subtitle, item.link].filter(Boolean).join(' | ');
      if (meta) {
        doc.font('Helvetica').fontSize(9.5).fillColor('#6B7280').text(meta);
      }
      doc.moveDown(0.3);
      writeBulletList(doc, item.highlights);
      doc.moveDown(0.3);
    });
  }

  if (draft.education?.length) {
    writeSectionHeading(doc, 'Education');
    draft.education.forEach((item) => {
      ensureSpace(doc, 65);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(item.institution || 'Institution');
      const degreeLine = [item.degree, item.fieldOfStudy].filter(Boolean).join(' — ');
      if (degreeLine) {
        doc.font('Helvetica').fontSize(10).fillColor('#1F2937').text(degreeLine);
      }
      const meta = [item.startYear, item.endYear, item.grade].filter(Boolean).join(' | ');
      if (meta) {
        doc.font('Helvetica').fontSize(9.5).fillColor('#6B7280').text(meta);
      }
      doc.moveDown(0.4);
    });
  }

  if (draft.certifications?.length) {
    writeSectionHeading(doc, 'Certifications');
    draft.certifications.forEach((item) => {
      ensureSpace(doc, 40);
      doc.font('Helvetica').fontSize(10.5).fillColor('#1F2937').text(
        [item.name, item.issuer, item.year].filter(Boolean).join(' | '),
      );
    });
  }

  if (draft.achievements?.length) {
    writeSectionHeading(doc, 'Achievements');
    writeBulletList(doc, draft.achievements);
  }

  doc.end();
});
