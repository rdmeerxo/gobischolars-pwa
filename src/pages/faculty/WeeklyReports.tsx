import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

type Report = {
  id: string
  week_start_date: string
  worked_on: string
  challenges: string
  next_goals: string
  created_at: string
}

function getWeekStart(date: Date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toLocaleDateString('en-CA')
}

function getWeekLabel(weekStart: string) {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export default function WeeklyReport() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'new' | 'history'>('new')
  const [workedOn, setWorkedOn] = useState('')
  const [challenges, setChallenges] = useState('')
  const [nextGoals, setNextGoals] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const currentWeekStart = getWeekStart()

  useEffect(() => {
    const checkThisWeek = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('weekly_reports')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start_date', currentWeekStart)
        .maybeSingle()
      if (data) setAlreadySubmitted(true)
    }
    checkThisWeek()
  }, [user?.id])

  useEffect(() => {
    if (tab !== 'history') return
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('week_start_date', { ascending: false })
      if (data) setReports(data as Report[])
      setLoading(false)
    }
    load()
  }, [tab, user?.id])

  const handleSubmit = async () => {
    if (!workedOn.trim() || !challenges.trim() || !nextGoals.trim() || !user) return
    setSubmitting(true)
    setSubmitError('')

    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const currentWeekEnd = weekEnd.toLocaleDateString('en-CA')

    const { error } = await supabase.from('weekly_reports').insert({
      user_id: user.id,
      week_start_date: currentWeekStart,
      week_end_date: currentWeekEnd,
      worked_on: workedOn.trim(),
      challenges: challenges.trim(),
      next_goals: nextGoals.trim(),
    })
    setSubmitting(false)
    if (error) {
      setSubmitError(error.message)
    } else {
      setSuccess(true)
      setAlreadySubmitted(true)
      setWorkedOn('')
      setChallenges('')
      setNextGoals('')
    }
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
          Weekly Report
        </h1>
        <p className="relative text-red-200 text-sm mt-1">
          {getWeekLabel(currentWeekStart)}
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-6 flex gap-3">
        <button
          onClick={() => setTab('new')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'new' ? 'bg-red-700 text-white shadow-lg shadow-red-100' : 'bg-white text-gray-400 border border-gray-100'
          }`}>
          This Week
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'history' ? 'bg-red-700 text-white shadow-lg shadow-red-100' : 'bg-white text-gray-400 border border-gray-100'
          }`}>
          Past Reports
        </button>
      </div>

      <div className="px-6 py-6">

        {/* THIS WEEK */}
        {tab === 'new' && (
          <div className="space-y-4">

            {/* Already submitted */}
            {alreadySubmitted && !success && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 font-medium text-sm text-center">
                ✅ You already submitted this week's report!
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 font-medium text-sm text-center">
                ✅ Report submitted successfully!
              </div>
            )}

            {/* Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
                ❌ {submitError}
              </div>
            )}

            {!alreadySubmitted && (
              <>
                {/* What I worked on */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">What I worked on</p>
                  <p className="text-xs text-gray-300 mb-3">Describe your main tasks and activities this week</p>
                  <textarea
                    value={workedOn}
                    onChange={(e) => setWorkedOn(e.target.value)}
                    placeholder="e.g. Prepared lesson plans, conducted SAT sessions, reviewed student essays..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>

                {/* Challenges */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Challenges faced</p>
                  <p className="text-xs text-gray-300 mb-3">Any difficulties or blockers you encountered</p>
                  <textarea
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="e.g. Students struggling with reading comprehension, need more practice materials..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>

                {/* Goals for next week */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Goals for next week</p>
                  <p className="text-xs text-gray-300 mb-3">What you plan to focus on next week</p>
                  <textarea
                    value={nextGoals}
                    onChange={(e) => setNextGoals(e.target.value)}
                    placeholder="e.g. Complete mock test grading, prepare unit 4 materials..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-red-400 resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !workedOn.trim() || !challenges.trim() || !nextGoals.trim()}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-red-700 hover:bg-red-800 active:scale-95 transition-all shadow-lg shadow-red-100 disabled:opacity-40 disabled:scale-100">
                  {submitting ? 'Submitting...' : 'Submit Report →'}
                </button>
              </>
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div>
            {loading && (
              <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
            )}
            {!loading && reports.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-400 font-medium">No reports yet</p>
              </div>
            )}
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="w-full p-5 text-left flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{getWeekLabel(r.week_start_date)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Submitted {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-gray-400 text-lg">{expandedId === r.id ? '▲' : '▼'}</span>
                  </button>
                  {expandedId === r.id && (
                    <div className="px-5 pb-5 space-y-4 border-t border-gray-50 pt-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">What I worked on</p>
                        <p className="text-sm text-gray-700">{r.worked_on}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Challenges faced</p>
                        <p className="text-sm text-gray-700">{r.challenges}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Goals for next week</p>
                        <p className="text-sm text-gray-700">{r.next_goals}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}