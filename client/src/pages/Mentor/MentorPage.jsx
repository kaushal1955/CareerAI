import { useEffect, useMemo, useState } from "react";
import { useAuth } from '../../context/AuthContext';
import { Link } from "react-router-dom";
import { BookOpen, CalendarPlus, GraduationCap, Save } from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import useCurrentUserData from "../../hooks/useCurrentUserData";
import {
  createMentorResource,
  createMentorSession,
  getMentorDashboard,
  saveMentorProfile,
  updateMentorSession,
} from "../../services/mentorService";

function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

const splitCsv = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function MentorPage() {
  const { getToken } = useAuth();
  const { user, loading: userLoading } = useCurrentUserData();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [sharingResource, setSharingResource] = useState(false);
  const [sessionActionId, setSessionActionId] = useState("");
  const [profileForm, setProfileForm] = useState({
    headline: "",
    bio: "",
    expertiseCsv: "",
    availability: "",
  });
  const [sessionForm, setSessionForm] = useState({
    studentId: "",
    topic: "",
    agenda: "",
    scheduledFor: "",
    sessionType: "video",
    meetingProvider: "google-meet",
    durationMinutes: 30,
    meetingLink: "",
    joinInstructions: "",
  });
  const [resourceForm, setResourceForm] = useState({
    studentId: "",
    title: "",
    url: "",
    description: "",
    tagsCsv: "",
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await getMentorDashboard(getToken);
      setDashboard(response);
      setProfileForm({
        headline: response.mentor?.headline || "",
        bio: response.mentor?.bio || "",
        expertiseCsv: (response.mentor?.expertise || []).join(", "),
        availability: response.mentor?.availability || "",
      });
      if (!sessionForm.studentId && response.assignedStudents?.[0]?._id) {
        setSessionForm((prev) => ({
          ...prev,
          studentId: response.assignedStudents[0]._id,
        }));
      }
      setError("");
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
          "Unable to load mentor dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const assignedStudents = dashboard?.assignedStudents || [];
  const sessions = dashboard?.sessions || [];
  const resources = dashboard?.resources || [];

  const assignedStudentOptions = useMemo(
    () =>
      assignedStudents.map((student) => ({
        value: student._id,
        label:
          `${student.firstName || ""} ${student.lastName || ""}`.trim() ||
          student.email,
      })),
    [assignedStudents],
  );

  if (userLoading || loading) {
    return <LoadingSpinner label="Loading mentor dashboard..." />;
  }

  if (user?.role !== "mentor" && user?.role !== "admin") {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-2xl font-bold text-white">Mentor access only</h1>
        <p className="mt-3 text-slate-400">
          Ask an admin to grant your account the mentor role.
        </p>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      setMessage("");
      setError("");
      await saveMentorProfile(getToken, {
        headline: profileForm.headline,
        bio: profileForm.bio,
        expertise: splitCsv(profileForm.expertiseCsv),
        availability: profileForm.availability,
      });
      setMessage("Mentor profile saved successfully.");
      await loadDashboard();
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message || "Unable to save mentor profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setSavingSession(true);
      setMessage("");
      setError("");
      await createMentorSession(getToken, sessionForm);
      setMessage("Mentor session scheduled successfully.");
      setSessionForm((prev) => ({
        ...prev,
        topic: "",
        agenda: "",
        scheduledFor: "",
        sessionType: "video",
        meetingProvider: "google-meet",
        durationMinutes: 30,
        meetingLink: "",
        joinInstructions: "",
      }));
      await loadDashboard();
    } catch (sessionError) {
      setError(
        sessionError?.response?.data?.message ||
          "Unable to schedule mentor session.",
      );
    } finally {
      setSavingSession(false);
    }
  };

  const handleShareResource = async () => {
    try {
      setSharingResource(true);
      setMessage("");
      setError("");
      await createMentorResource(getToken, {
        studentId: resourceForm.studentId,
        title: resourceForm.title,
        url: resourceForm.url,
        description: resourceForm.description,
        tags: splitCsv(resourceForm.tagsCsv),
      });
      setMessage("Mentor resource shared successfully.");
      setResourceForm({
        studentId: "",
        title: "",
        url: "",
        description: "",
        tagsCsv: "",
      });
      await loadDashboard();
    } catch (resourceError) {
      setError(
        resourceError?.response?.data?.message ||
          "Unable to share mentor resource.",
      );
    } finally {
      setSharingResource(false);
    }
  };

  const handleSessionStatus = async (sessionId, status) => {
    try {
      setSessionActionId(sessionId);
      setMessage("");
      setError("");
      await updateMentorSession(getToken, sessionId, { status });
      setMessage("Session updated successfully.");
      await loadDashboard();
    } catch (sessionError) {
      setError(
        sessionError?.response?.data?.message || "Unable to update session.",
      );
    } finally {
      setSessionActionId("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-6">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-300">
          Mentor module
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          Guide students with sessions, resources, and feedback
        </h1>
        <p className="mt-2 max-w-3xl text-slate-400">
          Manage your mentor profile, track assigned students, schedule guidance
          sessions, and share learning resources.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="btn-secondary" to="/chat">
            Open mentor chat
          </Link>
          <Link className="btn-secondary" to="/notifications">
            View notifications
          </Link>
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

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Assigned students"
          value={dashboard?.summary?.assignedStudents || 0}
          hint="Students currently assigned to your guidance queue."
        />
        <StatCard
          label="Upcoming sessions"
          value={dashboard?.summary?.upcomingSessions || 0}
          hint="Scheduled sessions waiting to be conducted."
        />
        <StatCard
          label="Completed sessions"
          value={dashboard?.summary?.completedSessions || 0}
          hint="Sessions you have already completed."
        />
        <StatCard
          label="Shared resources"
          value={dashboard?.summary?.sharedResources || 0}
          hint="Learning resources you shared with students."
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <Save size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">
              Mentor profile
            </p>
          </div>
          <div className="mt-5 space-y-4">
            <input
              className="input"
              placeholder="Headline"
              value={profileForm.headline}
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  headline: e.target.value,
                }))
              }
            />
            <textarea
              className="input min-h-32"
              placeholder="Mentor bio"
              value={profileForm.bio}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, bio: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Expertise (comma separated)"
              value={profileForm.expertiseCsv}
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  expertiseCsv: e.target.value,
                }))
              }
            />
            <input
              className="input"
              placeholder="Availability summary"
              value={profileForm.availability}
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  availability: e.target.value,
                }))
              }
            />
            <button
              className="btn-primary w-full"
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? "Saving profile..." : "Save mentor profile"}
            </button>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <GraduationCap size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">
              Assigned students
            </p>
          </div>
          <div className="mt-5 space-y-4">
            {assignedStudents.length ? (
              assignedStudents.map((student) => (
                <div
                  key={student._id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {[student.firstName, student.lastName]
                          .filter(Boolean)
                          .join(" ") || student.email}
                      </h3>
                      <p className="text-sm text-slate-400">{student.email}</p>
                    </div>
                    <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      Profile {student.profileCompletion || 0}%
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Preferred career:{" "}
                    <span className="text-slate-200">
                      {student.preferredCareer || "Not selected"}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Experience:{" "}
                    <span className="capitalize text-slate-200">
                      {student.experienceLevel || "beginner"}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Resume ATS:{" "}
                    <span className="text-slate-200">
                      {student.resumeAtsScore ?? "N/A"}
                    </span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(student.topSkills || []).length ? (
                      student.topSkills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No top skills added yet.
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No students assigned yet. Ask an admin to assign students to
                your mentor account.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <CalendarPlus size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">
              Schedule session
            </p>
          </div>
          <div className="mt-5 space-y-4">
            <select
              className="input"
              value={sessionForm.studentId}
              onChange={(e) =>
                setSessionForm((prev) => ({
                  ...prev,
                  studentId: e.target.value,
                }))
              }
            >
              <option value="">Select student</option>
              {assignedStudentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Session topic"
              value={sessionForm.topic}
              onChange={(e) =>
                setSessionForm((prev) => ({ ...prev, topic: e.target.value }))
              }
            />
            <textarea
              className="input min-h-28"
              placeholder="Agenda"
              value={sessionForm.agenda}
              onChange={(e) =>
                setSessionForm((prev) => ({ ...prev, agenda: e.target.value }))
              }
            />
            <input
              className="input"
              type="datetime-local"
              value={sessionForm.scheduledFor}
              onChange={(e) =>
                setSessionForm((prev) => ({
                  ...prev,
                  scheduledFor: e.target.value,
                }))
              }
            />
            <div className="grid gap-4 md:grid-cols-3">
              <select
                className="input"
                value={sessionForm.sessionType}
                onChange={(e) =>
                  setSessionForm((prev) => ({
                    ...prev,
                    sessionType: e.target.value,
                  }))
                }
              >
                <option value="video">Video</option>
                <option value="phone">Phone</option>
                <option value="chat">Chat</option>
                <option value="in-person">In-person</option>
              </select>
              <select
                className="input"
                value={sessionForm.meetingProvider}
                onChange={(e) =>
                  setSessionForm((prev) => ({
                    ...prev,
                    meetingProvider: e.target.value,
                  }))
                }
              >
                <option value="google-meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="teams">Microsoft Teams</option>
                <option value="custom">Custom link</option>
              </select>
              <input
                className="input"
                type="number"
                min="15"
                max="240"
                placeholder="Duration minutes"
                value={sessionForm.durationMinutes}
                onChange={(e) =>
                  setSessionForm((prev) => ({
                    ...prev,
                    durationMinutes: e.target.value,
                  }))
                }
              />
            </div>
            <input
              className="input"
              placeholder="Meeting link (required for video sessions — paste a real link, e.g. from meet.google.com/new)"
              value={sessionForm.meetingLink}
              onChange={(e) =>
                setSessionForm((prev) => ({
                  ...prev,
                  meetingLink: e.target.value,
                }))
              }
            />
            <textarea
              className="input min-h-24"
              placeholder="Join instructions"
              value={sessionForm.joinInstructions}
              onChange={(e) =>
                setSessionForm((prev) => ({
                  ...prev,
                  joinInstructions: e.target.value,
                }))
              }
            />
            <button
              className="btn-primary w-full"
              type="button"
              onClick={handleCreateSession}
              disabled={savingSession}
            >
              {savingSession ? "Scheduling..." : "Schedule mentor session"}
            </button>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 text-brand-300">
            <BookOpen size={18} />
            <p className="text-sm font-medium uppercase tracking-[0.2em]">
              Share resource
            </p>
          </div>
          <div className="mt-5 space-y-4">
            <select
              className="input"
              value={resourceForm.studentId}
              onChange={(e) =>
                setResourceForm((prev) => ({
                  ...prev,
                  studentId: e.target.value,
                }))
              }
            >
              <option value="">Share with all assigned students</option>
              {assignedStudentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Resource title"
              value={resourceForm.title}
              onChange={(e) =>
                setResourceForm((prev) => ({ ...prev, title: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Resource URL"
              value={resourceForm.url}
              onChange={(e) =>
                setResourceForm((prev) => ({ ...prev, url: e.target.value }))
              }
            />
            <textarea
              className="input min-h-28"
              placeholder="Resource description"
              value={resourceForm.description}
              onChange={(e) =>
                setResourceForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <input
              className="input"
              placeholder="Tags (comma separated)"
              value={resourceForm.tagsCsv}
              onChange={(e) =>
                setResourceForm((prev) => ({
                  ...prev,
                  tagsCsv: e.target.value,
                }))
              }
            />
            <button
              className="btn-primary w-full"
              type="button"
              onClick={handleShareResource}
              disabled={sharingResource}
            >
              {sharingResource ? "Sharing..." : "Share learning resource"}
            </button>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-white">Mentor sessions</h2>
          <div className="mt-5 space-y-4">
            {sessions.length ? (
              sessions.map((session) => (
                <div
                  key={session._id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {session.topic}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Student:{" "}
                        {[session.student?.firstName, session.student?.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                          session.student?.email ||
                          "Unknown"}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">
                        {new Date(session.scheduledFor).toLocaleString()}
                      </p>
                      <p className="mt-2 text-sm text-slate-400 capitalize">
                        {session.sessionType || "video"} ·{" "}
                        {session.meetingProvider || "none"} ·{" "}
                        {session.durationMinutes || 30} min
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {session.agenda || "No agenda added."}
                      </p>
                      {session.joinInstructions ? (
                        <p className="mt-2 text-sm text-slate-500">
                          Instructions: {session.joinInstructions}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs capitalize text-slate-300">
                      {session.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {session.meetingLink ? (
                      <a
                        className="btn-secondary"
                        href={session.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join session
                      </a>
                    ) : null}
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() =>
                        handleSessionStatus(session._id, "completed")
                      }
                      disabled={sessionActionId === session._id}
                    >
                      Mark completed
                    </button>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() =>
                        handleSessionStatus(session._id, "cancelled")
                      }
                      disabled={sessionActionId === session._id}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No mentor sessions scheduled yet.
              </p>
            )}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-xl font-semibold text-white">Shared resources</h2>
          <div className="mt-5 space-y-4">
            {resources.length ? (
              resources.map((resource) => (
                <div
                  key={resource._id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {resource.student
                          ? `Shared with ${[resource.student.firstName, resource.student.lastName].filter(Boolean).join(" ") || resource.student.email}`
                          : "Shared with all assigned students"}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 capitalize">
                      {resource.visibility.replace("-", " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {resource.description || "No description provided."}
                  </p>
                  {resource.url ? (
                    <a
                      className="mt-3 inline-block text-sm font-medium text-brand-300 hover:text-brand-200"
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open resource
                    </a>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(resource.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No resources shared yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
