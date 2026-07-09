import Report from '../models/Report.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createBulkNotifications, createNotification } from '../services/notificationService.js';

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
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

export const createReport = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const subject = cleanString(req.body.subject);
  const description = cleanString(req.body.description);

  if (!subject || !description) {
    res.status(400);
    throw new Error('Both subject and description are required.');
  }

  const report = await Report.create({
    reporter: user._id,
    category: cleanString(req.body.category) || 'other',
    severity: cleanString(req.body.severity) || 'medium',
    subject,
    description,
    targetType: cleanString(req.body.targetType) || 'general',
    targetId: cleanString(req.body.targetId),
  });

  const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');
  await createBulkNotifications(
    admins.map((item) => item._id),
    {
      type: 'admin_update',
      title: 'New report submitted',
      message: `A new ${report.category} report was submitted: ${report.subject}`,
      link: '/admin',
      metadata: { reportId: report._id },
    },
  );

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully.',
    report,
  });
});

export const getMyReports = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const reports = await Report.find({ reporter: user._id })
    .sort({ createdAt: -1 })
    .populate('resolvedBy', 'firstName lastName email');

  res.status(200).json({
    success: true,
    count: reports.length,
    reports,
  });
});

export const getAdminReports = asyncHandler(async (req, res) => {
  const query = {};
  const status = cleanString(req.query.status);
  const severity = cleanString(req.query.severity);
  const category = cleanString(req.query.category);

  if (status) query.status = status;
  if (severity) query.severity = severity;
  if (category) query.category = category;

  const reports = await Report.find(query)
    .sort({ createdAt: -1 })
    .populate('reporter', 'firstName lastName email role')
    .populate('resolvedBy', 'firstName lastName email');

  res.status(200).json({
    success: true,
    count: reports.length,
    reports,
  });
});

export const updateReportStatus = asyncHandler(async (req, res) => {
  const admin = await findDbUser(req);
  const report = await Report.findById(req.params.reportId);

  if (!report) {
    res.status(404);
    throw new Error('Report not found.');
  }

  const nextStatus = cleanString(req.body.status);
  if (!['open', 'in-review', 'resolved', 'dismissed'].includes(nextStatus)) {
    res.status(400);
    throw new Error('Invalid report status.');
  }

  report.status = nextStatus;
  report.adminResponse = req.body.adminResponse !== undefined ? cleanString(req.body.adminResponse) : report.adminResponse;
  report.resolvedBy = ['resolved', 'dismissed'].includes(nextStatus) ? admin._id : report.resolvedBy;
  report.resolvedAt = ['resolved', 'dismissed'].includes(nextStatus) ? new Date() : null;
  await report.save();

  await createNotification({
    userId: report.reporter,
    type: 'report_update',
    title: 'Report status updated',
    message: `Your report "${report.subject}" is now ${nextStatus}.`,
    link: '/reports',
    metadata: { reportId: report._id, status: nextStatus },
  });

  res.status(200).json({
    success: true,
    message: 'Report updated successfully.',
    report,
  });
});
