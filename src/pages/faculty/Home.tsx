import { useAuthStore } from '../../store/authStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const actions = [
  { icon: '📍', label: 'Check In / Out', sub: 'GPS verified', path: '/checkin', highlight: true },
  { icon: '📋', label: 'Requests', sub: 'Leave & remote', path: '/requests', highlight: false },
  { icon: '📅', label: 'Schedule', sub: 'Your timetable', path: '/schedule', highlight: false },
  { icon: '🕐', label: 'History', sub: 'Past attendance', path: '/history', highlight: false },
  { icon: '📝', label: 'Weekly Report', sub: 'Submit report', path: '/reports', highlight: false },
  { icon: '🎉', label: 'My Wrapped', sub: 'Monthly stats', path: '/wrapped', highlight: true },
]

export default function FacultyHome() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [todayLog, setTodayLog] = useState<{
    check_in_time: string
    check_out_time?: string
    total_hours?: number
  } | null>(null)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  useEffect(() => {
    const load = async () => {
        const stateLog = location.state?.todayLog 
        if (stateLog) {
            await Promise.resolve()
            setTodayLog(stateLog)
            return
        }
        if (!user?.id) return
        const todayDate = new Date().toLocaleDateString('en-CA')
        const { data } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', todayDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        setTodayLog(data ?? null)
    }
    load()
  }, [user?.id, location.state])


  const isCheckedIn = todayLog && !todayLog.check_out_time
  const isCheckedOut = todayLog && todayLog.check_out_time

  const statusText = isCheckedOut
    ? `Done for today · ${todayLog.total_hours}h worked`
    : isCheckedIn
    ? `Checked in since ${new Date(todayLog.check_in_time).toLocaleTimeString()}`
    : 'Not checked in'

  const buttonText = isCheckedOut
    ? 'View Attendance'
    : isCheckedIn
    ? 'Check Out Now →'
    : 'Check In Now →'

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');`}</style>

      {/* Header */}
      <div className="bg-red-700 px-6 pt-12 pb-16 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-red-600 opacity-50" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-red-800 opacity-40" />

        <div className="relative">
          <img
            src="/logo.png"
            alt="GobiScholars Academy"
            className="h-8 object-contain mx-auto mb-5 block"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <p className="text-red-200 text-sm font-medium">{greeting} 👋</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-3xl font-extrabold mt-1 text-white">
            {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-red-200 text-sm mt-1">{today}</p>

          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white text-xs font-medium capitalize">
              {user?.position ?? user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Check in card */}
      <div className="px-6 -mt-8 mb-6 relative z-10">
        <div className="bg-white rounded-2xl p-5 shadow-xl shadow-gray-200 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Status</p>
              <p className={`font-bold mt-1 ${isCheckedOut ? 'text-red-700' : isCheckedIn ? 'text-green-600' : 'text-gray-900'}`}>
                {statusText}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">
              {isCheckedOut ? '✅' : isCheckedIn ? '🟢' : '📍'}
            </div>
          </div>
          <button
            onClick={() => navigate('/checkin', { state: { todayLog } })}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-red-700 hover:bg-red-800 active:scale-95 transition-all shadow-lg shadow-red-100">
            {buttonText}
          </button>
        </div>
      </div>

      {/* Actions grid */}
      <div className="px-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`rounded-2xl p-4 text-left active:scale-95 transition-all border ${
                item.highlight
                  ? 'bg-red-700 border-red-700 shadow-lg shadow-red-100'
                  : 'bg-white border-gray-100 shadow-sm shadow-gray-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${
                item.highlight ? 'bg-red-600' : 'bg-gray-50'
              }`}>
                {item.icon}
              </div>
              <p className={`text-sm font-bold ${item.highlight ? 'text-white' : 'text-gray-900'}`}>
                {item.label}
              </p>
              <p className={`text-xs mt-0.5 ${item.highlight ? 'text-red-200' : 'text-gray-400'}`}>
                {item.sub}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <button onClick={signOut}
        className="w-full mt-8 mb-10 text-xs text-gray-300 hover:text-red-500 transition">
        Sign out
      </button>
    </div>
  )
}