import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import MobileNavigation from './components/MobileNavigation'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ResidentDashboard from './pages/ResidentDashboard'
import UtilityInsights from './pages/UtilityInsights'
import ReportProblem from './pages/ReportProblem'
import NearbyServices from './pages/NearbyServices'
import MyRequests from './pages/MyRequests'
import RequestDetails from './pages/RequestDetails'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import ProviderDashboard from './pages/ProviderDashboard'
import NearbyRequests from './pages/NearbyRequests'
import MyJobs from './pages/MyJobs'

function ResidentShell() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNav = (label) => {
    setSidebarOpen(false)
    if (label === 'Logout') {
      logout()
    }
  }

  return (
    <div className="app-shell">
      <Sidebar role="resident" collapsed={sidebarOpen} onNavigate={handleNav} />
      <div className="app-content">
        <Navbar user={user} onMenuClick={() => setSidebarOpen((prev) => !prev)} />

        <main className="main-panel">
          <Routes>
            <Route index element={<ResidentDashboard />} />
            <Route path="utility-insights" element={<UtilityInsights />} />
            <Route path="report-problem" element={<ReportProblem />} />
            <Route path="nearby-services" element={<NearbyServices />} />
            <Route path="my-requests" element={<MyRequests />} />
            <Route path="request-details/:id" element={<RequestDetails />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/resident" replace />} />
          </Routes>
        </main>
      </div>

      <MobileNavigation role="resident" />
    </div>
  )
}

function ProviderShell() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNav = (label) => {
    setSidebarOpen(false)
    if (label === 'Logout') {
      logout()
    }
  }

  return (
    <div className="app-shell">
      <Sidebar role="provider" collapsed={sidebarOpen} onNavigate={handleNav} />
      <div className="app-content">
        <Navbar user={user} onMenuClick={() => setSidebarOpen((prev) => !prev)} />

        <main className="main-panel">
          <Routes>
            <Route index element={<ProviderDashboard />} />
            <Route path="nearby-requests" element={<NearbyRequests />} />
            <Route path="my-jobs" element={<MyJobs />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/provider" replace />} />
          </Routes>
        </main>
      </div>

      <MobileNavigation role="provider" />
    </div>
  )
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === 'provider' || user.role === 'serviceProvider' ? '/provider' : '/resident'} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to={user.role === 'provider' || user.role === 'serviceProvider' ? '/provider' : '/resident'} replace /> : <Register />}
      />
      <Route
        path="/resident/*"
        element={user && user.role === 'resident' ? <ResidentShell /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/provider/*"
        element={user && (user.role === 'provider' || user.role === 'serviceProvider') ? <ProviderShell /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
