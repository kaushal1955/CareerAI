# CareerAI

CareerAI is a production-oriented full-stack starter for an AI-powered career guidance platform.

## Scope included in this scaffold

This version includes the **Auth + Profile + Resume + Mentor + Admin + Career Intelligence foundation**:

- Clerk-based authentication readiness for Google login
- Protected React routes
- Express API secured with Clerk middleware
- MongoDB user sync on first authenticated request
- Student profile onboarding form
- Profile completion tracking
- PDF resume upload with Multer
- Secure resume preview and download
- Resume history with reanalyze, replace, and delete actions
- Resume builder draft storage and PDF export
- AI/fallback ATS-style resume analysis
- Career recommendation engine based on profile and resume signals
- Skill-gap analysis for target roles
- Learning roadmap generator with stages and milestones
- Mock interview generator with answer evaluation and feedback
- Mentor dashboard for assigned students, sessions, resources, and guidance workflow
- Mentor-student real-time chat with Socket.IO event delivery
- Email notification delivery through SMTP/Nodemailer
- Notification system for chat, admin updates, mentor sessions, resources, and assignments
- Video-ready mentor session scheduling with provider, duration, join links, and instructions
- Admin dashboard with advanced analytics, user management, role control, mentor assignment, moderation, and reports review
- User report submission workflow for bugs, content issues, mentor issues, and moderation review
- Optional Cloudinary storage for uploaded resumes
- Role-ready backend authorization (`student`, `mentor`, `admin`)

## Tech stack

### Frontend
- React + Vite
- Tailwind CSS
- React Router
- React Hook Form
- Clerk React SDK
- Axios
- Socket.IO Client

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Clerk Express SDK
- Helmet, CORS, rate limiting, Morgan
- Multer, pdf-parse, PDFKit
- Socket.IO
- Nodemailer

## Quick start

### 1. Install dependencies

```bash
npm install
npm install --workspace client
npm install --workspace server
```

### 2. Add environment variables
Copy:
- `client/.env.example` -> `client/.env`
- `server/.env.example` -> `server/.env`

### 3. Run

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Email notification setup
Add SMTP credentials in `server/.env`:

```env
EMAIL_NOTIFICATIONS_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email_username
SMTP_PASS=your_email_password_or_app_password
EMAIL_FROM=CareerAI <no-reply@careerai.local>
```

If these are missing, in-app notifications still work and email delivery is skipped.

## Current API endpoints

### Auth
- `GET /api/auth/session`

### Users
- `POST /api/users/sync`
- `GET /api/users/me`
- `PATCH /api/users/:userId/role`

### Profiles
- `GET /api/profiles/me`
- `PUT /api/profiles/me`

### Resumes
- `GET /api/resumes/me`
- `GET /api/resumes/me/latest`
- `GET /api/resumes/:resumeId/view`
- `GET /api/resumes/:resumeId/download`
- `POST /api/resumes/upload`
- `PUT /api/resumes/:resumeId/replace`
- `POST /api/resumes/:resumeId/analyze`
- `DELETE /api/resumes/:resumeId`

### Resume Builder
- `GET /api/resume-builder/me`
- `PUT /api/resume-builder/me`
- `GET /api/resume-builder/me/export`

### Career Recommendation
- `GET /api/careers/recommendations/latest`
- `POST /api/careers/recommendations/generate`

### Skill Gap
- `GET /api/skill-gap/latest`
- `POST /api/skill-gap/generate`

### Learning Roadmap
- `GET /api/roadmaps/latest`
- `POST /api/roadmaps/generate`

### Mock Interview
- `GET /api/interviews/latest`
- `POST /api/interviews/generate`
- `POST /api/interviews/:interviewId/evaluate`

### Mentor Module
- `GET /api/mentor/dashboard`
- `PUT /api/mentor/profile`
- `POST /api/mentor/sessions`
- `PATCH /api/mentor/sessions/:sessionId`
- `POST /api/mentor/resources`

### Admin Dashboard
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/resources`
- `PATCH /api/admin/resources/:resourceId/moderate`
- `PATCH /api/admin/users/:userId/status`
- `PATCH /api/users/:userId/role`
- `POST /api/admin/mentors/:mentorId/assign-student`
- `DELETE /api/admin/mentors/:mentorId/assign-student/:studentId`

### Chat
- `GET /api/chat/contacts`
- `GET /api/chat/conversations/:peerId`
- `POST /api/chat/messages`

### Notifications
- `GET /api/notifications/me`
- `PATCH /api/notifications/:notificationId/read`
- `PATCH /api/notifications/me/read-all`

### Reports
- `POST /api/reports`
- `GET /api/reports/me`
- `GET /api/reports/admin`
- `PATCH /api/reports/admin/:reportId`

## Next recommended modules

1. Jobs and internship portal
2. Mentor-student video provider APIs (Zoom/Meet native integrations)
3. Email templates and delivery analytics
4. Push notifications and mobile-ready delivery
