import Mentor from "../models/Mentor.js";
import MentorResource from "../models/MentorResource.js";
import MentorSession from "../models/MentorSession.js";
import Profile from "../models/Profile.js";
import Resume from "../models/Resume.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendMentorSessionEmail } from "../services/emailService.js";
import {
  createBulkNotifications,
  createNotification,
} from "../services/notificationService.js";

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(values = []) {
  return [
    ...new Set((values || []).map((item) => cleanString(item)).filter(Boolean)),
  ];
}

function buildVideoSessionDetails({
  sessionType = "video",
  meetingProvider = "google-meet",
  meetingLink = "",
}) {
  const normalizedSessionType = [
    "video",
    "phone",
    "chat",
    "in-person",
  ].includes(sessionType)
    ? sessionType
    : "video";

  if (normalizedSessionType !== "video") {
    return {
      sessionType: normalizedSessionType,
      meetingProvider: "none",
      meetingLink: cleanString(meetingLink),
      meetingCode: "",
    };
  }

  const provider = ["google-meet", "zoom", "teams", "custom"].includes(
    meetingProvider,
  )
    ? meetingProvider
    : "google-meet";
  const existingLink = cleanString(meetingLink);

  // We never fabricate a real Google Meet / Zoom / Teams link here — without a real
  // Calendar/Meet API integration, a made-up code is not a real meeting and will show
  // "this meeting has been dismissed" when the student clicks it. So a real link is
  // required for video sessions instead of auto-generating a fake one.
  if (!existingLink) {
    const error = new Error(
      "Please paste a real meeting link (e.g. create one at meet.google.com/new) before scheduling a video session.",
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    sessionType: normalizedSessionType,
    meetingProvider: provider,
    meetingLink: existingLink,
    meetingCode: "",
  };
}

async function findDbUser(req) {
  const userId = req.userId;

  if (!userId) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(userId);

  if (!user) {
    const error = new Error(
      "User record not found. Sync the authenticated user first.",
    );
    error.statusCode = 404;
    throw error;
  }

  return user;
}

async function ensureMentorProfile(user) {
  return Mentor.findOneAndUpdate(
    { user: user._id },
    { user: user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

async function buildAssignedStudentCards(mentor) {
  const students = await User.find({
    _id: { $in: mentor.assignedStudents || [] },
  }).sort({ createdAt: -1 });
  const studentIds = students.map((item) => item._id);

  const [profiles, latestResumes] = await Promise.all([
    Profile.find({ user: { $in: studentIds } }),
    Resume.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user",
          atsScore: { $first: "$analysis.atsScore" },
          recommendedRoles: { $first: "$analysis.recommendedRoles" },
        },
      },
    ]),
  ]);

  const profileMap = new Map(profiles.map((item) => [String(item.user), item]));
  const resumeMap = new Map(
    latestResumes.map((item) => [String(item._id), item]),
  );

  return students.map((student) => {
    const profile = profileMap.get(String(student._id));
    const resume = resumeMap.get(String(student._id));

    return {
      _id: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      role: student.role,
      profileCompletion: student.profileCompletion,
      preferredCareer: profile?.preferredCareer || "",
      topSkills: (profile?.skills || []).slice(0, 5),
      experienceLevel: profile?.experienceLevel || "beginner",
      headline: profile?.headline || "",
      resumeAtsScore: resume?.atsScore ?? null,
      resumeSuggestedRoles: resume?.recommendedRoles || [],
    };
  });
}

async function recalculateMentorCounts(mentorId) {
  const [sessionCount, resourceCount] = await Promise.all([
    MentorSession.countDocuments({ mentor: mentorId }),
    MentorResource.countDocuments({ mentor: mentorId }),
  ]);

  await Mentor.findByIdAndUpdate(mentorId, { sessionCount, resourceCount });
}

export const getMentorDashboard = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);

  if (user.role !== "mentor" && user.role !== "admin") {
    res.status(403);
    throw new Error("Only mentors or admins can access mentor dashboard data.");
  }

  const mentor = await ensureMentorProfile(user);
  const [assignedStudents, sessions, resources] = await Promise.all([
    buildAssignedStudentCards(mentor),
    MentorSession.find({ mentor: mentor._id })
      .populate("student", "firstName lastName email role profileCompletion")
      .sort({ scheduledFor: 1 })
      .limit(12),
    MentorResource.find({ mentor: mentor._id })
      .populate("student", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(12),
  ]);

  const upcomingSessions = sessions.filter(
    (item) => item.status === "scheduled",
  ).length;
  const completedSessions = sessions.filter(
    (item) => item.status === "completed",
  ).length;

  res.status(200).json({
    success: true,
    mentor,
    assignedStudents,
    sessions,
    resources,
    summary: {
      assignedStudents: assignedStudents.length,
      upcomingSessions,
      completedSessions,
      sharedResources: resources.length,
    },
  });
});

export const upsertMentorProfile = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);

  if (user.role !== "mentor" && user.role !== "admin") {
    res.status(403);
    throw new Error("Only mentors or admins can update mentor profile data.");
  }

  const mentor = await Mentor.findOneAndUpdate(
    { user: user._id },
    {
      user: user._id,
      headline: cleanString(req.body.headline),
      bio: cleanString(req.body.bio),
      expertise: cleanStringArray(req.body.expertise),
      availability: cleanString(req.body.availability),
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  res
    .status(200)
    .json({
      success: true,
      message: "Mentor profile saved successfully.",
      mentor,
    });
});

export const createMentorSession = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const mentor = await ensureMentorProfile(user);
  const studentId = cleanString(req.body.studentId);

  if (!studentId) {
    res.status(400);
    throw new Error("studentId is required to schedule a session.");
  }

  const isAssigned = (mentor.assignedStudents || []).some(
    (item) => String(item) === studentId,
  );
  if (!isAssigned && user.role !== "admin") {
    res.status(403);
    throw new Error(
      "You can only schedule sessions for students assigned to you.",
    );
  }

  const student = await User.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }

  const scheduledFor = req.body.scheduledFor
    ? new Date(req.body.scheduledFor)
    : null;
  if (!scheduledFor || Number.isNaN(scheduledFor.getTime())) {
    res.status(400);
    throw new Error("A valid scheduledFor datetime is required.");
  }

  const videoDetails = buildVideoSessionDetails({
    sessionType: req.body.sessionType,
    meetingProvider: req.body.meetingProvider,
    meetingLink: req.body.meetingLink,
  });

  const session = await MentorSession.create({
    mentor: mentor._id,
    student: student._id,
    topic: cleanString(req.body.topic) || "Career guidance session",
    agenda: cleanString(req.body.agenda),
    scheduledFor,
    sessionType: videoDetails.sessionType,
    meetingProvider: videoDetails.meetingProvider,
    durationMinutes: Number(req.body.durationMinutes) || 30,
    meetingLink: videoDetails.meetingLink,
    meetingCode: videoDetails.meetingCode,
    joinInstructions: cleanString(req.body.joinInstructions),
  });

  await recalculateMentorCounts(mentor._id);

  await createNotification({
    userId: student._id,
    type: "mentor_session",
    title: "New mentor session scheduled",
    message: `A mentor session on "${session.topic}" has been scheduled for you.${session.meetingLink ? " Your meeting link is ready." : ""}`,
    link: "/notifications",
    metadata: {
      sessionId: session._id,
      meetingLink: session.meetingLink,
      meetingProvider: session.meetingProvider,
    },
  });

  await sendMentorSessionEmail({
    to: student.email,
    name: [student.firstName, student.lastName].filter(Boolean).join(" "),
    topic: session.topic,
    scheduledFor: session.scheduledFor,
    meetingLink: session.meetingLink,
    provider: session.meetingProvider,
  }).catch((error) => {
    console.error("Mentor session email skipped:", error.message);
  });

  res
    .status(201)
    .json({
      success: true,
      message: "Mentor session scheduled successfully.",
      session,
    });
});

export const updateMentorSession = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const mentor = await ensureMentorProfile(user);
  const session = await MentorSession.findOne({
    _id: req.params.sessionId,
    mentor: mentor._id,
  });

  if (!session) {
    res.status(404);
    throw new Error("Mentor session not found.");
  }

  session.topic = cleanString(req.body.topic) || session.topic;
  session.agenda =
    req.body.agenda !== undefined
      ? cleanString(req.body.agenda)
      : session.agenda;
  session.notes =
    req.body.notes !== undefined ? cleanString(req.body.notes) : session.notes;
  session.feedback =
    req.body.feedback !== undefined
      ? cleanString(req.body.feedback)
      : session.feedback;
  session.joinInstructions =
    req.body.joinInstructions !== undefined
      ? cleanString(req.body.joinInstructions)
      : session.joinInstructions;

  if (
    req.body.status &&
    ["scheduled", "completed", "cancelled"].includes(req.body.status)
  ) {
    session.status = req.body.status;
  }

  if (req.body.scheduledFor) {
    const scheduledFor = new Date(req.body.scheduledFor);
    if (!Number.isNaN(scheduledFor.getTime())) {
      session.scheduledFor = scheduledFor;
    }
  }

  if (req.body.durationMinutes) {
    const durationMinutes = Number(req.body.durationMinutes);
    if (
      !Number.isNaN(durationMinutes) &&
      durationMinutes >= 15 &&
      durationMinutes <= 240
    ) {
      session.durationMinutes = durationMinutes;
    }
  }

  if (
    req.body.sessionType ||
    req.body.meetingProvider ||
    req.body.meetingLink !== undefined
  ) {
    const videoDetails = buildVideoSessionDetails({
      sessionType: req.body.sessionType || session.sessionType,
      meetingProvider: req.body.meetingProvider || session.meetingProvider,
      meetingLink:
        req.body.meetingLink !== undefined
          ? req.body.meetingLink
          : session.meetingLink,
    });

    session.sessionType = videoDetails.sessionType;
    session.meetingProvider = videoDetails.meetingProvider;
    session.meetingLink = videoDetails.meetingLink;
    session.meetingCode = videoDetails.meetingCode;
  }

  await session.save();
  await recalculateMentorCounts(mentor._id);

  const student = await User.findById(session.student).select(
    "firstName lastName email",
  );

  await createNotification({
    userId: session.student,
    type: "mentor_session",
    title: "Mentor session updated",
    message: `Your mentor session "${session.topic}" is now marked as ${session.status}.${session.meetingLink ? " Updated meeting details are available." : ""}`,
    link: "/notifications",
    metadata: {
      sessionId: session._id,
      status: session.status,
      meetingLink: session.meetingLink,
    },
  });

  if (student?.email) {
    await sendMentorSessionEmail({
      to: student.email,
      name: [student.firstName, student.lastName].filter(Boolean).join(" "),
      topic: session.topic,
      scheduledFor: session.scheduledFor,
      meetingLink: session.meetingLink,
      provider: session.meetingProvider,
    }).catch((error) => {
      console.error("Mentor session update email skipped:", error.message);
    });
  }

  res
    .status(200)
    .json({
      success: true,
      message: "Mentor session updated successfully.",
      session,
    });
});

export const createMentorResource = asyncHandler(async (req, res) => {
  const user = await findDbUser(req);
  const mentor = await ensureMentorProfile(user);
  const title = cleanString(req.body.title);

  if (!title) {
    res.status(400);
    throw new Error("title is required to share a mentor resource.");
  }

  const studentId = cleanString(req.body.studentId);
  const visibility = studentId ? "specific-student" : "all-assigned";

  if (studentId) {
    const isAssigned = (mentor.assignedStudents || []).some(
      (item) => String(item) === studentId,
    );
    if (!isAssigned && user.role !== "admin") {
      res.status(403);
      throw new Error(
        "You can only share student-specific resources with assigned students.",
      );
    }
  }

  const resource = await MentorResource.create({
    mentor: mentor._id,
    student: studentId || null,
    title,
    url: cleanString(req.body.url),
    description: cleanString(req.body.description),
    tags: cleanStringArray(req.body.tags),
    visibility,
  });

  await recalculateMentorCounts(mentor._id);

  const targetUsers = studentId ? [studentId] : mentor.assignedStudents || [];
  await createBulkNotifications(targetUsers, {
    type: "mentor_resource",
    title: "New mentor resource shared",
    message: `A mentor shared a new resource: ${title}.`,
    link: "/notifications",
    metadata: { resourceId: resource._id, resourceUrl: resource.url },
  });

  res
    .status(201)
    .json({
      success: true,
      message: "Mentor resource shared successfully.",
      resource,
    });
});
