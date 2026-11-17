import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/common/Loader'
import TherapistLayout from '../components/common/TherapistLayout'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import Dashboard from '../pages/therapist/Dashboard'
import Clients from '../pages/therapist/Clients'
import Schedule from '../pages/therapist/Schedule'
import Notes from '../pages/therapist/Notes'
import Analytics from '../pages/therapist/Analytics'
import ChatPage from '../pages/therapist/ChatPage'
import Subscription from '../pages/therapist/Subscription'
import Profile from '../pages/client/Profile'
import BookingPage from '../pages/client/BookingPage'
import ClientPortal from '../pages/client/ClientPortal'
import Payment from '../pages/client/Payment'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Protected><TherapistLayout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/subscription" element={<Subscription />} />
      </Route>

      {/* Public branded link: /dr-sharma  */}
      <Route path="/:slug" element={<Profile />} />
      <Route path="/:slug/book" element={<BookingPage />} />
      <Route path="/:slug/pay" element={<Payment />} />
      <Route path="/:slug/portal" element={<ClientPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
