import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Report = {
  id: string
  week_start_date: string
  week_end_date: string
  worked_on: string
  challenges: string
  next_goals: string
  created_at: string
  users: { full_name: string }
}

type Staff = {
  id: string
  full_name: string
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const loadStaff = async () => {
      const { data } = await supabase.from('users').select('id, full_name').eq('role', 'faculty').order('full_name')
      if (data) setStaff(data)
    }
    loadStaff()
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase
        .from('weekly_reports')
        .select('*, users(full_name)')
        .order('week_start_date', { ascending: false })
      if (selectedUser !== 'all') query = query.eq('user_id', selectedUser)
      const { data } = await query
      if (data) setReports(data as Report[])
      setLoading(false)
    }
    load()
  }, [selectedUser])

  const getWeekLabel = (start: string, end: string) => {
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-extrabold text-gray-900">
          Weekly Reports
        </h1>
        <p className="text-gray-400 mt-1">View submitted reports from all staff</p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-red-400">
          <option value="all">All Staff</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      {/* Reports */}
      {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>}
      {!loading && reports.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400 font-medium">No reports found</p>
        </div>
      )}

      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-sm font-bold text-gray-900">{r.users?.full_name}</p>
                  <span className="text-xs bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full">
                    {getWeekLabel(r.week_start_date, r.week_end_date)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Submitted {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <span className="text-gray-400 text-lg">{expandedId === r.id ? '▲' : '▼'}</span>
            </button>

            {expandedId === r.id && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-50 pt-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">What I worked on</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{r.worked_on}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Challenges faced</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{r.challenges}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Goals for next week</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{r.next_goals}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}