import { Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import HomePage from "../pages/Home/HomePage";
import LoginPage from "../pages/Login/LoginPage";
import SignUpPage from "../pages/SignUp/SignUpPage";
import ForgotPasswordPage from "../pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPassword/ResetPasswordPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import ResumePage from "../pages/Resume/ResumePage";
import ResumeHistoryPage from "../pages/ResumeHistory/ResumeHistoryPage";
import ResumeBuilderPage from "../pages/ResumeBuilder/ResumeBuilderPage";
import CareerRecommendationPage from "../pages/CareerRecommendation/CareerRecommendationPage";
import SkillGapPage from "../pages/SkillGap/SkillGapPage";
import LearningRoadmapPage from "../pages/LearningRoadmap/LearningRoadmapPage";
import MockInterviewPage from "../pages/MockInterview/MockInterviewPage";
import MentorPage from "../pages/Mentor/MentorPage";
import AdminPage from "../pages/Admin/AdminPage";
import ChatPage from "../pages/Chat/ChatPage";
import NotificationsPage from "../pages/Notifications/NotificationsPage";
import ReportsPage from "../pages/Reports/ReportsPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import NotFoundPage from "../pages/NotFound/NotFoundPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/resume/history" element={<ResumeHistoryPage />} />
          <Route path="/resume/builder" element={<ResumeBuilderPage />} />
          <Route
            path="/career-recommendation"
            element={<CareerRecommendationPage />}
          />
          <Route path="/skill-gap" element={<SkillGapPage />} />
          <Route path="/learning-roadmap" element={<LearningRoadmapPage />} />
          <Route path="/mock-interview" element={<MockInterviewPage />} />
          <Route path="/mentor" element={<MentorPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
