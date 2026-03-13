import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

type RecentLog = {
  id: string
  check_in_time: string
  check_out_time?: string
  total_hours?: number
  check_in_photo_url?: string
  users: { full_name: string }
}

export default function AdminHome() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalStaff: 0,
    checkedInToday: 0,
    pendingRequests: 0,
  })
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const today = new Date().toLocaleDateString('en-CA')

      const [staffRes, todayRes, requestsRes, logsRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('role', 'faculty'),
        supabase.from('attendance_logs').select('id', { count: 'exact' }).eq('date', today),
        supabase.from('requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('attendance_logs')
          .select('*, users(full_name)')
          .eq('date', today)
          .order('check_in_time', { ascending: false })
          .limit(5),
      ])

      setStats({
        totalStaff: staffRes.count ?? 0,
        checkedInToday: todayRes.count ?? 0,
        pendingRequests: requestsRes.count ?? 0,
      })
      if (logsRes.data) setRecentLogs(logsRes.data as RecentLog[])
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-extrabold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'} 👋
        </h1>
        <p className="text-gray-400 mt-1">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Staff</p>
            <span className="text-xl">👥</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900">{stats.totalStaff}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Checked In Today</p>
            <span className="text-xl">✅</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900">{stats.checkedInToday}</p>
        </div>

        <div
          onClick={() => navigate('/admin/requests')}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Requests</p>
            <span className="text-xl">⏳</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900">{stats.pendingRequests}</p>
        </div>

        <div
          onClick={() => navigate('/admin/attendance')}
          className="bg-red-700 rounded-2xl p-5 shadow-lg shadow-red-100 cursor-pointer hover:bg-red-800 transition-all">
          <p className="text-xs font-bold text-red-200 uppercase tracking-widest mb-3">View Attendance</p>
          <p className="text-4xl font-extrabold text-white">→</p>
        </div>
      </div>

      {/* Today's check-ins */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Today's Check-ins</h2>
        </div>
        {loading && (
          <div className="p-6 text-gray-400 text-sm text-center">Loading...</div>
        )}
        {!loading && recentLogs.length === 0 && (
          <div className="p-6 text-gray-400 text-sm text-center">No check-ins today</div>
        )}
        {recentLogs.map((log) => (
          <div key={log.id} className="flex items-center justify-between px-6 py-4 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              {log.check_in_photo_url && (
                <img src={log.check_in_photo_url} className="w-10 h-10 rounded-xl object-cover" />
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">{log.users?.full_name}</p>
                <p className="text-xs text-gray-400">
                  In: {new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {log.check_out_time && ` · Out: ${new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              {log.check_out_time
                ? <span className="text-xs font-bold text-red-700">{log.total_hours}h</span>
                : <span className="text-xs font-bold text-green-600">Active</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}