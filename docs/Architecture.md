# CareerAI Architecture

## Current implementation focus

This starter currently implements:

- authentication boundary
- backend user synchronization
- profile onboarding
- resume upload, preview, download, replacement, deletion, and analysis
- resume builder draft persistence and PDF export
- career recommendation generation from profile and resume signals
- skill-gap analysis for target careers
- learning roadmap generation from identified gaps
- mock interview generation and evaluation
- mentor dashboards, sessions, and resource sharing
- video-ready mentor session scheduling with provider metadata and join links
- real-time mentor-student chat delivery with Socket.IO
- in-app + email notifications for important events
- admin analytics, moderation, and user/mentor management
- user report submission and admin review workflow
- role-ready authorization

## High-level flow

1. User signs in with Clerk.
2. Frontend calls protected backend endpoints with the Clerk token.
3. Backend verifies the token and syncs the MongoDB user.
4. User completes the profile.
5. User uploads one or more resumes for ATS-style analysis.
6. Career recommendations are generated from profile + resume signals.
7. Skill-gap analysis identifies missing capabilities.
8. Learning roadmap converts missing skills into staged progress steps.
9. Mock interviews help the user practice and receive feedback.
10. Mentors guide assigned students through sessions, resources, and chat.
11. Session scheduling stores provider, duration, join instructions, and meeting link details.
12. Notifications inform users about chat, assignments, sessions, reports, and admin updates.
13. Email delivery sends important notifications when SMTP is configured.
14. Admins monitor analytics, review reports, moderate resources, and manage roles and mentor assignments.
