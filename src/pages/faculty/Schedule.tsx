import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

type ScheduleDay = {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
}

const DAY_NAMES: Record<string, string> = {
  'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
  'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Schedule() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState<ScheduleDay[]>([])
  const [loading, setLoading] = useState(true)

  const todayShort = DAY_SHORT[new Date().getDay()]

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
      if (data) {
        const sorted = [...data].sort(
          (a, b) => DAY_SHORT.indexOf(a.day_of_week) - DAY_SHORT.indexOf(b.day_of_week)
        )
        setSchedule(sorted as ScheduleDay[])
      }
      setLoading(false)
    }
    load()
  }, [user?.id])

  const totalHoursPerWeek = schedule.reduce((sum, s) => {
    const [sh, sm] = s.start_time.split(':').map(Number)
    const [eh, em] = s.end_time.split(':').map(Number)
    return sum + (eh + em / 60) - (sh + sm / 60)
  }, 0)

  const scheduledDays = schedule.map(s => s.day_of_week)

  const fmt = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
  }

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
          My Schedule
        </h1>
        <p className="relative text-red-200 text-sm mt-1">Your weekly work schedule</p>
      </div>

      <div className="px-6 py-6 space-y-4">

        {/* Week strip */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between">
            {DAY_SHORT.map((day) => {
              const isScheduled = scheduledDays.includes(day)
              const isToday = day === todayShort
              return (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <p className={`text-xs font-bold ${isToday ? 'text-red-700' : 'text-gray-400'}`}>
                    {day}
                  </p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isToday && isScheduled ? 'bg-red-700 text-white' :
                    isToday ? 'bg-red-100 text-red-700' :
                    isScheduled ? 'bg-gray-900 text-white' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isScheduled ? '✓' : '–'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Weekly Summary</p>
          <div className="flex gap-4">
            <div className="flex-1 text-center bg-gray-50 rounded-xl py-3">
              <p className="text-xl font-extrabold text-gray-900">{schedule.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Days / week</p>
            </div>
            <div className="flex-1 text-center bg-gray-50 rounded-xl py-3">
              <p className="text-xl font-extrabold text-gray-900">{totalHoursPerWeek.toFixed(1)}h</p>
              <p className="text-xs text-gray-400 mt-0.5">Hours / week</p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        )}

        {/* Empty */}
        {!loading && schedule.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-400 font-medium">No schedule set yet</p>
            <p className="text-gray-300 text-sm mt-1">Your admin will set your schedule</p>
          </div>
        )}

        {/* Schedule list */}
        {schedule.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Daily Schedule</p>
            <div className="space-y-3">
              {schedule.map((s) => {
                const isToday = s.day_of_week === todayShort
                const [sh, sm] = s.start_time.split(':').map(Number)
                const [eh, em] = s.end_time.split(':').map(Number)
                const hours = (eh + em / 60) - (sh + sm / 60)
                return (
                  <div key={s.id}
                    className={`rounded-2xl p-4 border ${
                      isToday ? 'bg-red-700 border-red-700' : 'bg-white border-gray-100 shadow-sm'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-bold text-sm ${isToday ? 'text-white' : 'text-gray-900'}`}>
                          {DAY_NAMES[s.day_of_week]}
                          {isToday && (
                            <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">Today</span>
                          )}
                        </p>
                        <p className={`text-xs mt-1 ${isToday ? 'text-red-200' : 'text-gray-400'}`}>
                          {fmt(s.start_time)} – {fmt(s.end_time)}
                        </p>
                      </div>
                      <p className={`text-lg font-extrabold ${isToday ? 'text-white' : 'text-red-700'}`}>
                        {hours.toFixed(1)}h
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-xs font-medium text-yellow-700">
            💡 You can still check in on unscheduled days. If you check out before your scheduled end time, you'll be asked to confirm.
          </p>
        </div>
      </div>
    </div>
  )
}