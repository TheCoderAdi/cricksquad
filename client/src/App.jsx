import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import RSVPPage from './pages/RSVPPage'
import TeamsPage from './pages/TeamsPage'
import VenuePage from './pages/VenuePage'
import ExpensesPage from './pages/ExpensesPage'
import ScorecardPage from './pages/ScorecardPage'
import LeaderboardPage from './pages/LeaderboardPage'
import PollsPage from './pages/PollsPage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import GalleryPage from './pages/GalleryPage'
import ProfilePage from './pages/ProfilePage'
import GroupSettingsPage from './pages/GroupSettingsPage'
import CreateGroupPage from './pages/CreateGroupPage'
import JoinGroupPage from './pages/JoinGroupPage'
import NotFoundPage from './pages/NotFoundPage'

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><RegisterPage /></PublicRoute>
        } />
      </Route>

      <Route element={
        <ProtectedRoute><AppLayout /></ProtectedRoute>
      }>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rsvp/:matchId" element={<RSVPPage />} />
        <Route path="/teams/:matchId" element={<TeamsPage />} />
        <Route path="/venue/:matchId" element={<VenuePage />} />
        <Route path="/expenses/:matchId" element={<ExpensesPage />} />
        <Route path="/scorecard/:matchId" element={<ScorecardPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/polls" element={<PollsPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/gallery/:matchId" element={<GalleryPage />} />
        <Route path="/profile/:userId?" element={<ProfilePage />} />
        <Route path="/group/settings" element={<GroupSettingsPage />} />
        <Route path="/group/create" element={<CreateGroupPage />} />
        <Route path="/group/join" element={<JoinGroupPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App