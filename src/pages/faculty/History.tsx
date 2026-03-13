import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

type Log = {
  id: string
  date: string
  check_in_time: string
  check_out_time?: string
  total_hours?: number
  check_in_photo_url?: string
}

function getWeekLabel(dateStr: string) {
  const date = new Date(dateStr)
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay() + 1)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(startOfWeek)} – ${fmt(endOfWeek)}`
}

function groupByWeek(logs: Log[]) {
  const groups: Record<string, Log[]> = {}
  for (const log of logs) {
    const label = getWeekLabel(log.date)
    if (!groups[label]) groups[label] = []
    groups[label].push(log)
  }
  return groups
}

export default function History() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [targetHours, setTargetHours] = useState<number | null>(null)
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return

      const { data: userData } = await supabase
        .from('users')
        .select('target_hours')
        .eq('id', user.id)
        .maybeSingle()
      if (userData?.target_hours) setTargetHours(userData.target_hours)

      const { data: logsData } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
      if (logsData) setLogs(logsData as Log[])

      setLoading(false)
    }
    load()
  }, [user?.id])

  const totalHoursWorked = logs.reduce((sum, l) => sum + (l.total_hours ?? 0), 0)
  const hoursLeft = targetHours ? Math.max(0, targetHours - totalHoursWorked) : null
  const progressPct = targetHours ? Math.min(100, (totalHoursWorked / targetHours) * 100) : 0
  const grouped = groupByWeek(logs)

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');`}</style>

      {/* Header */}
      <div className="bg-red-700 px-6 pt-12 pb-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-red-600 opacity-50" />
        <button onClick={() => navigate('/')} className="relative text-red-200 text-sm mb-4 block">
          ← Back
        </button>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }}
          className="relative text-2xl font-extrabold text-white">
          Attendance History
        </h1>
        <p className="relative text-red-200 text-sm mt-1">Your check-in records</p>
      </div>

      <div className="px-6 py-6 space-y-4">

        {/* Internship progress */}
        {targetHours && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Internship Progress</p>
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-2xl font-extrabold text-gray-900">{totalHoursWorked.toFixed(1)}h</p>
                <p className="text-xs text-gray-400">of {targetHours}h target</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-700">{hoursLeft?.toFixed(1)}h</p>
                <p className="text-xs text-gray-400">remaining</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mt-3">
              <div
                className="bg-red-700 h-3 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">{progressPct.toFixed(0)}% complete</p>
          </div>
        )}

        {/* Summary card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Summary</p>
          <div className="flex gap-4">
            <div className="flex-1 text-center bg-gray-50 rounded-xl py-3">
              <p className="text-xl font-extrabold text-gray-900">{logs.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Days present</p>
            </div>
            <div className="flex-1 text-center bg-gray-50 rounded-xl py-3">
              <p className="text-xl font-extrabold text-gray-900">{totalHoursWorked.toFixed(1)}h</p>
              <p className="text-xs text-gray-400 mt-0.5">Total hours</p>
            </div>
            <div className="flex-1 text-center bg-gray-50 rounded-xl py-3">
              <p className="text-xl font-extrabold text-gray-900">
                {logs.length ? (totalHoursWorked / logs.length).toFixed(1) : '0'}h
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Avg / day</p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        )}

        {/* Empty */}
        {!loading && logs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 font-medium">No attendance records yet</p>
          </div>
        )}

        {/* Grouped by week */}
        {Object.entries(grouped).map(([week, weekLogs]) => {
          const weekHours = weekLogs.reduce((s, l) => s + (l.total_hours ?? 0), 0)
          return (
            <div key={week}>
              <div className="flex justify-between items-center mb-2 px-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{week}</p>
                <p className="text-xs font-bold text-red-700">{weekHours.toFixed(1)}h</p>
              </div>
              <div className="space-y-3">
                {weekLogs.map((log) => (
                  <div key={log.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex gap-4">
                      {/* Photo */}
                      {log.check_in_photo_url && (
                        <button onClick={() => setExpandedPhoto(expandedPhoto === log.id ? null : log.id)}>
                          <img
                            src={log.check_in_photo_url}
                            className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                          />
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(log.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-500">
                            🟢 {new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {log.check_out_time && (
                            <span className="text-xs text-gray-500">
                              🔴 {new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          {!log.check_out_time && (
                            <span className="text-xs text-yellow-600 font-medium">No checkout</span>
                          )}
                        </div>
                        {log.total_hours != null && (
                          <p className="text-xs font-bold text-red-700 mt-1">{log.total_hours}h worked</p>
                        )}
                      </div>
                    </div>
                    {/* Expanded photo */}
                    {expandedPhoto === log.id && log.check_in_photo_url && (
                      <img
                        src={log.check_in_photo_url}
                        className="w-full rounded-xl mt-3 border border-gray-100"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}