import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Staff = {
  id: string
  full_name: string
}

type ScheduleDay = {
  id: string
  user_id: string
  day_of_week: string
  start_time: string
  end_time: string
}

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function AdminSchedules() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedUser, setSelectedUser] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Draft state for editing
  const [draft, setDraft] = useState<Record<string, { enabled: boolean; start: string; end: string }>>({})

  useEffect(() => {
    const loadStaff = async () => {
      const { data } = await supabase.from('users').select('id, full_name').eq('role', 'faculty').order('full_name')
      if (data) setStaff(data)
    }
    loadStaff()
  }, [])

  useEffect(() => {
    if (!selectedUser) return
    const loadSchedule = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', selectedUser.id)

      // Build draft from existing schedule
      const newDraft: Record<string, { enabled: boolean; start: string; end: string }> = {}
      for (const day of DAY_SHORT) {
        const existing = (data as ScheduleDay[] ?? []).find(s => s.day_of_week === day)
        newDraft[day] = {
          enabled: !!existing,
          start: existing?.start_time?.slice(0, 5) ?? '09:00',
          end: existing?.end_time?.slice(0, 5) ?? '18:00',
        }
      }
      setDraft(newDraft)
      setLoading(false)
    }
    loadSchedule()
  }, [selectedUser])

  const handleSave = async () => {
    if (!selectedUser) return
    setSaving(true)

    // Delete existing schedule for this user
    await supabase.from('schedules').delete().eq('user_id', selectedUser.id)

    // Insert new schedule for enabled days
    const rows = DAY_SHORT
      .filter(day => draft[day]?.enabled)
      .map(day => ({
        user_id: selectedUser.id,
        day_of_week: day,
        start_time: draft[day].start,
        end_time: draft[day].end,
      }))

    if (rows.length > 0) {
      await supabase.from('schedules').insert(rows)
    }

    setSaving(false)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-extrabold text-gray-900">
          Schedules
        </h1>
        <p className="text-gray-400 mt-1">Set weekly schedules for each staff member</p>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Staff list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Staff Members</p>
          </div>
          {staff.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedUser(s)}
              className={`w-full px-5 py-4 text-left border-b border-gray-50 last:border-0 transition-all ${
                selectedUser?.id === s.id ? 'bg-red-700' : 'hover:bg-gray-50'
              }`}>
              <p className={`text-sm font-bold ${selectedUser?.id === s.id ? 'text-white' : 'text-gray-900'}`}>
                {s.full_name}
              </p>
            </button>
          ))}
        </div>

        {/* Schedule editor */}
        <div className="col-span-2">
          {!selectedUser && (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
              <div className="text-5xl mb-4">👈</div>
              <p className="text-gray-400 font-medium">Select a staff member to edit their schedule</p>
            </div>
          )}

          {selectedUser && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">{selectedUser.full_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Toggle days and set hours</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="px-5 py-2.5 bg-red-700 text-white text-sm font-bold rounded-xl hover:bg-red-800 disabled:opacity-40 transition-all shadow-lg shadow-red-100">
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>

              {loading && (
                <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
              )}

              {!loading && (
                <div className="p-6 space-y-3">
                  {DAY_SHORT.map((day) => (
                    <div key={day}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        draft[day]?.enabled ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
                      }`}>
                      {/* Toggle */}
                      <button
                        onClick={() => setDraft(d => ({ ...d, [day]: { ...d[day], enabled: !d[day]?.enabled } }))}
                        className={`w-12 h-6 rounded-full transition-all flex-shrink-0 ${
                          draft[day]?.enabled ? 'bg-red-700' : 'bg-gray-300'
                        }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
                          draft[day]?.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>

                      {/* Day name */}
                      <p className={`text-sm font-bold w-12 ${draft[day]?.enabled ? 'text-red-700' : 'text-gray-400'}`}>
                        {day}
                      </p>

                      {/* Times */}
                      {draft[day]?.enabled ? (
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="time"
                            value={draft[day].start}
                            onChange={(e) => setDraft(d => ({ ...d, [day]: { ...d[day], start: e.target.value } }))}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-sm text-gray-700 focus:outline-none focus:border-red-400 bg-white"
                          />
                          <span className="text-gray-400 text-sm">to</span>
                          <input
                            type="time"
                            value={draft[day].end}
                            onChange={(e) => setDraft(d => ({ ...d, [day]: { ...d[day], end: e.target.value } }))}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-sm text-gray-700 focus:outline-none focus:border-red-400 bg-white"
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Not scheduled</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}