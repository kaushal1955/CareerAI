# CareerAI API

## Base URL
- Local: `http://localhost:5000/api`

## Authentication
Protected routes require a Clerk bearer token in the `Authorization` header.

## Users
- `POST /users/sync`
- `GET /users/me`
- `PATCH /users/:userId/role`

## Profiles
- `GET /profiles/me`
- `PUT /profiles/me`

## Resumes
- `GET /resumes/me`
- `GET /resumes/me/latest`
- `GET /resumes/:resumeId/view`
- `GET /resumes/:resumeId/download`
- `POST /resumes/upload`
- `PUT /resumes/:resumeId/replace`
- `POST /resumes/:resumeId/analyze`
- `DELETE /resumes/:resumeId`

## Resume Builder
- `GET /resume-builder/me`
- `PUT /resume-builder/me`
- `GET /resume-builder/me/export`

## Career Recommendation
- `GET /careers/recommendations/latest`
- `POST /careers/recommendations/generate`

## Skill Gap
- `GET /skill-gap/latest`
- `POST /skill-gap/generate`

## Learning Roadmap
- `GET /roadmaps/latest`
- `POST /roadmaps/generate`

## Mock Interview
- `GET /interviews/latest`
- `POST /interviews/generate`
- `POST /interviews/:interviewId/evaluate`

## Mentor Module
- `GET /mentor/dashboard`
- `PUT /mentor/profile`
- `POST /mentor/sessions`
- `PATCH /mentor/sessions/:sessionId`
- `POST /mentor/resources`

## Admin Dashboard
- `GET /admin/dashboard`
- `GET /admin/users`
- `GET /admin/resources`
- `PATCH /admin/resources/:resourceId/moderate`
- `PATCH /admin/users/:userId/status`
- `PATCH /users/:userId/role`
- `POST /admin/mentors/:mentorId/assign-student`
- `DELETE /admin/mentors/:mentorId/assign-student/:studentId`

## Chat
- `GET /chat/contacts`
- `GET /chat/conversations/:peerId`
- `POST /chat/messages`

## Notifications
- `GET /notifications/me`
- `PATCH /notifications/:notificationId/read`
- `PATCH /notifications/me/read-all`

## Reports
- `POST /reports`
- `GET /reports/me`
- `GET /reports/admin`
- `PATCH /reports/admin/:reportId`
