import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

type Log = {
  date: string
  check_in_time: string
  check_out_time?: string
  total_hours?: number
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function Wrapped() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [logs, setLogs] = useState<Log[]>([])
  const [targetHours, setTargetHours] = useState<number | null>(null)
  const [totalWorked, setTotalWorked] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      setLoading(true)

      const { data: userData } = await supabase
        .from('users')
        .select('target_hours')
        .eq('id', user.id)
        .maybeSingle()
      if (userData?.target_hours) setTargetHours(userData.target_hours)

      const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const monthEnd = new Date(year, month + 1, 0).toLocaleDateString('en-CA')

      const { data: logsData } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: true })
      if (logsData) setLogs(logsData as Log[])

      // total all-time hours for internship progress
      const { data: allLogs } = await supabase
        .from('attendance_logs')
        .select('total_hours')
        .eq('user_id', user.id)
      if (allLogs) {
        setTotalWorked(allLogs.reduce((s, l) => s + (l.total_hours ?? 0), 0))
      }

      setLoading(false)
    }
    load()
  }, [user?.id, month, year])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear()

  // Stats
  const monthHours = logs.reduce((s, l) => s + (l.total_hours ?? 0), 0)
  const daysPresent = logs.length
  const avgHours = daysPresent ? monthHours / daysPresent : 0

  const mostProductiveLog = logs.reduce<Log | null>(
    (best, l) => (!best || (l.total_hours ?? 0) > (best.total_hours ?? 0)) ? l : best, null
  )
  const mostProductiveDay = mostProductiveLog
    ? DAY_NAMES[new Date(mostProductiveLog.date).getDay()]
    : null

  const earliestCheckIn = logs.reduce<string | null>((earliest, l) => {
    const t = new Date(l.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (!earliest) return t
    return new Date(l.check_in_time) < new Date(logs.find(x =>
      new Date(x.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) === earliest
    )?.check_in_time ?? l.check_in_time) ? t : earliest
  }, null)

  const latestCheckOut = logs.reduce<string | null>((latest, l) => {
    if (!l.check_out_time) return latest
    const t = new Date(l.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (!latest) return t
    return new Date(l.check_out_time) > new Date(logs.find(x =>
      x.check_out_time && new Date(x.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) === latest
    )?.check_out_time ?? l.check_out_time) ? t : latest
  }, null)

  const hoursLeft = targetHours ? Math.max(0, targetHours - totalWorked) : null
  const progressPct = targetHours ? Math.min(100, (totalWorked / targetHours) * 100) : 0

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');`}</style>

      {/* Header */}
      <div className="bg-red-700 px-6 pt-12 pb-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-red-600 opacity-50" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-red-800 opacity-40" />
        <button onClick={() => navigate('/')} className="relative text-red-200 text-sm mb-4 block">
          ← Back
        </button>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }}
          className="relative text-2xl font-extrabold text-white">
          🎉 My Wrapped
        </h1>
        <p className="relative text-red-200 text-sm mt-1">Your monthly attendance stats</p>
      </div>

      <div className="px-6 py-6 space-y-4">

        {/* Month selector */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <button onClick={prevMonth}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-lg active:scale-95 transition-all">
            ‹
          </button>
          <div className="text-center">
            <p className="font-extrabold text-gray-900">{MONTH_NAMES[month]}</p>
            <p className="text-xs text-gray-400">{year}</p>
          </div>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 font-bold text-lg active:scale-95 transition-all disabled:opacity-30">
            ›
          </button>
        </div>

        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        )}

        {!loading && logs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 font-medium">No data for this month</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <>
            {/* Hero stat */}
            <div className="bg-red-700 rounded-2xl p-6 shadow-lg shadow-red-100 text-center">
              <p className="text-red-200 text-xs font-bold uppercase tracking-widest mb-2">Total hours this month</p>
              <p style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-6xl font-extrabold text-white">{monthHours.toFixed(1)}</p>
              <p className="text-red-200 text-sm mt-1">hours worked</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Days present</p>
                <p className="text-3xl font-extrabold text-gray-900">{daysPresent}</p>
                <p className="text-xs text-gray-400 mt-0.5">days this month</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Avg per day</p>
                <p className="text-3xl font-extrabold text-gray-900">{avgHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-400 mt-0.5">average hours</p>
              </div>
              {mostProductiveDay && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Most productive</p>
                  <p className="text-xl font-extrabold text-red-700">{mostProductiveDay}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{mostProductiveLog?.total_hours?.toFixed(1)}h worked</p>
                </div>
              )}
              {earliestCheckIn && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Earliest check-in</p>
                  <p className="text-xl font-extrabold text-red-700">{earliestCheckIn}</p>
                  <p className="text-xs text-gray-400 mt-0.5">earliest this month</p>
                </div>
              )}
              {latestCheckOut && (
                <div className="col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Latest check-out</p>
                  <p className="text-2xl font-extrabold text-red-700">{latestCheckOut}</p>
                  <p className="text-xs text-gray-400 mt-0.5">latest this month</p>
                </div>
              )}
            </div>

            {/* Internship progress */}
            {targetHours && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Internship Progress</p>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900">{totalWorked.toFixed(1)}h</p>
                    <p className="text-xs text-gray-400">of {targetHours}h target (all time)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-700">{hoursLeft?.toFixed(1)}h</p>
                    <p className="text-xs text-gray-400">remaining</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mt-3">
                  <div className="bg-red-700 h-3 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">{progressPct.toFixed(0)}% complete</p>
              </div>
            )}

            {/* Fun message */}
            <div className="bg-gray-900 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-2">
                {progressPct >= 100 ? '🎓' : monthHours >= 40 ? '🔥' : monthHours >= 20 ? '💪' : '🌱'}
              </p>
              <p style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-white font-bold text-lg">
                {progressPct >= 100
                  ? 'Internship complete!'
                  : monthHours >= 40
                  ? 'Incredible month!'
                  : monthHours >= 20
                  ? 'Great effort!'
                  : 'Keep it up!'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {progressPct >= 100
                  ? 'You did it. Well done.'
                  : `${hoursLeft?.toFixed(0)} hours left in your internship.`}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}