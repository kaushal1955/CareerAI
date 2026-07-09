import nodemailer from 'nodemailer';

let transporter;

function isExplicitlyEnabled() {
  return String(process.env.EMAIL_NOTIFICATIONS_ENABLED || 'false').toLowerCase() === 'true';
}

export function isEmailConfigured() {
  return Boolean(
    isExplicitlyEnabled() &&
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function getTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

function buildBaseHtml({ heading, intro, bodyLines = [], actionUrl = '', actionLabel = '' }) {
  const bodyHtml = bodyLines
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px;color:#334155;font-size:14px;line-height:1.6;">${line}</p>`)
    .join('');

  const actionHtml =
    actionUrl && actionLabel
      ? `<a href="${actionUrl}" style="display:inline-block;margin-top:8px;padding:12px 18px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">${actionLabel}</a>`
      : '';

  return `
    <div style="background:#f8fafc;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:32px;">
        <p style="margin:0 0 8px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">CareerAI</p>
        <h1 style="margin:0 0 16px;color:#0f172a;font-size:24px;line-height:1.3;">${heading}</h1>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.7;">${intro}</p>
        ${bodyHtml}
        ${actionHtml}
        <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">This email was sent automatically by CareerAI.</p>
      </div>
    </div>
  `;
}

export async function sendPlatformEmail({ to, subject, text, html }) {
  const activeTransporter = getTransporter();

  if (!activeTransporter || !to || !subject) {
    return { skipped: true };
  }

  const result = await activeTransporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return { skipped: false, result };
}

export async function sendNotificationEmail({ to, name = '', title, message, appPath = '' }) {
  if (!title || !message || !to) {
    return { skipped: true };
  }

  const baseUrl = (process.env.CLIENT_URL || '').split(',')[0]?.trim() || 'http://localhost:5173';
  const normalizedPath = appPath ? (appPath.startsWith('/') ? appPath : `/${appPath}`) : '';
  const actionUrl = normalizedPath ? `${baseUrl}${normalizedPath}` : '';
  const greeting = name ? `Hi ${name},` : 'Hello,';

  const html = buildBaseHtml({
    heading: title,
    intro: greeting,
    bodyLines: [message],
    actionUrl,
    actionLabel: actionUrl ? 'Open CareerAI' : '',
  });

  const text = [greeting, '', title, message, actionUrl ? `Open: ${actionUrl}` : ''].join('\n');

  return sendPlatformEmail({
    to,
    subject: `CareerAI • ${title}`,
    text,
    html,
  });
}

export async function sendMentorSessionEmail({ to, name = '', topic, scheduledFor, meetingLink = '', provider = '' }) {
  const formattedDate = scheduledFor ? new Date(scheduledFor).toLocaleString('en-IN') : 'Scheduled soon';
  const html = buildBaseHtml({
    heading: `Mentor session: ${topic || 'Career guidance'}`,
    intro: name ? `Hi ${name},` : 'Hello,',
    bodyLines: [
      `Your mentor session is scheduled for ${formattedDate}.`,
      provider ? `Meeting provider: ${provider}.` : '',
      meetingLink ? 'Use the button below to join the meeting at the scheduled time.' : '',
    ],
    actionUrl: meetingLink,
    actionLabel: meetingLink ? 'Join meeting' : '',
  });

  const text = [
    name ? `Hi ${name},` : 'Hello,',
    '',
    `Your mentor session is scheduled for ${formattedDate}.`,
    provider ? `Meeting provider: ${provider}.` : '',
    meetingLink ? `Join meeting: ${meetingLink}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return sendPlatformEmail({
    to,
    subject: `CareerAI • Mentor session ${topic ? `- ${topic}` : ''}`.trim(),
    text,
    html,
  });
}
