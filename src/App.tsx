import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import React from 'react'

import Login from './pages/auth/Login'
import FacultyHome from './pages/faculty/Home'
import CheckIn from './pages/faculty/CheckIn'
import Requests from './pages/faculty/Requests'
import History from './pages/faculty/History'
import Schedule from './pages/faculty/Schedule'
import WeeklyReport from './pages/faculty/WeeklyReports'
import Wrapped from './pages/faculty/Wrapped'
import AdminLayout from './pages/admin/AdminLayout'
import AdminHome from './pages/admin/AdminHome'
import AdminAttendance from './pages/admin/AdminAttendance'
import AdminRequests from './pages/admin/AdminRequests'
import AdminSchedules from './pages/admin/AdminSchedules'
import AdminReports from './pages/admin/AdminReports'
import AdminUsers from './pages/admin/AdminUsers'

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactElement, adminOnly?: boolean }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />
  if (!adminOnly && user.role === 'admin') return <Navigate to="/admin" />
  return children
}

export default function App() {
  const { setUser } = useAuthStore()
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase.from('users').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
          if (data) setUser(data)
            setAuthLoading(false)
        })
      } else {
        setAuthLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from('users').select('*').eq('id', session.user.id).maybeSingle().then(({ data }) => {
          if (data) setUser(data)
            setAuthLoading(false)
        })
      } else {
        setUser(null)
        setAuthLoading(false)
      }
     })

     return () => subscription.unsubscribe()
    }, [])


  if (authLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-300 text-sm">Loading...</div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Faculty routes */}
        <Route path="/" element={<ProtectedRoute><FacultyHome /></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><WeeklyReport /></ProtectedRoute>} />
        <Route path="/wrapped" element={<ProtectedRoute><Wrapped /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminHome />} />
          <Route path="attendance" element={<AdminAttendance />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="schedules" element={<AdminSchedules />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}