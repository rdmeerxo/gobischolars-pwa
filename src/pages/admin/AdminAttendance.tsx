import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Log = {
  id: string
  date: string
  check_in_time: string
  check_out_time?: string
  total_hours?: number
  check_in_photo_url?: string
  check_in_lat?: number
  check_in_lng?: number
  filled_by_admin?: boolean
  users: { full_name: string }
  user_id: string
}

type Staff = {
  id: string
  full_name: string
}

export default function AdminAttendance() {
  const [logs, setLogs] = useState<Log[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null)

  // Manual add modal
  const [showModal, setShowModal] = useState(false)
  const [modalUserId, setModalUserId] = useState('')
  const [modalDate, setModalDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [modalCheckIn, setModalCheckIn] = useState('09:00')
  const [modalCheckOut, setModalCheckOut] = useState('18:00')
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')

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
        .from('attendance_logs')
        .select('*, users(full_name)')
        .order('date', { ascending: false })
        .order('check_in_time', { ascending: false })

      if (selectedUser !== 'all') query = query.eq('user_id', selectedUser)
      if (selectedDate) query = query.eq('date', selectedDate)

      const { data } = await query.limit(100)
      if (data) setLogs(data as Log[])
      setLoading(false)
    }
    load()
  }, [selectedUser, selectedDate])

  const handleManualAdd = async () => {
    if (!modalUserId || !modalDate) return
    setModalSaving(true)
    setModalError('')

    const checkInTime = new Date(`${modalDate}T${modalCheckIn}:00`).toISOString()
    const checkOutTime = new Date(`${modalDate}T${modalCheckOut}:00`).toISOString()
    const totalHours = Math.round(
      ((new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / 3600000) * 100
    ) / 100

    const { error } = await supabase.from('attendance_logs').insert({
      user_id: modalUserId,
      date: modalDate,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      total_hours: totalHours,
      status: 'present',
      filled_by_admin: true,
    })

    setModalSaving(false)
    if (error) {
      setModalError(error.message)
    } else {
      setShowModal(false)
      setModalUserId('')
      setModalDate(new Date().toLocaleDateString('en-CA'))
      setModalCheckIn('09:00')
      setModalCheckOut('18:00')
      // Refresh
      const { data } = await supabase
        .from('attendance_logs')
        .select('*, users(full_name)')
        .order('date', { ascending: false })
        .limit(100)
      if (data) setLogs(data as Log[])
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-extrabold text-gray-900">
            Attendance
          </h1>
          <p className="text-gray-400 mt-1">All staff check-in records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 bg-red-700 text-white text-sm font-bold rounded-xl hover:bg-red-800 transition-all shadow-lg shadow-red-100">
          + Add Manual Entry
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-red-400">
          <option value="all">All Staff</option>
          {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:border-red-400"
        />
        {selectedDate && (
          <button onClick={() => setSelectedDate('')}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 bg-white hover:bg-gray-50">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Staff</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Check In</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Check Out</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Hours</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Photo</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Source</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Loading...</td></tr>
            )}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No records found</td></tr>
            )}
            {logs.map((log) => (
              <>
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{log.users?.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.check_out_time
                      ? new Date(log.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : <span className="text-green-600 font-medium">Active</span>}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-red-700">
                    {log.total_hours != null ? `${log.total_hours}h` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {log.check_in_photo_url
                      ? <button onClick={() => setExpandedPhoto(expandedPhoto === log.id ? null : log.id)}>
                          <img src={log.check_in_photo_url} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
                        </button>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      log.filled_by_admin ? 'bg-yellow-100 text-yellow-700' : 'bg-green-50 text-green-700'
                    }`}>
                      {log.filled_by_admin ? 'Admin' : 'GPS'}
                    </span>
                  </td>
                </tr>
                {expandedPhoto === log.id && log.check_in_photo_url && (
                  <tr key={`${log.id}-photo`} className="bg-gray-50">
                    <td colSpan={7} className="px-6 py-4">
                      <img src={log.check_in_photo_url} className="h-48 rounded-xl object-cover border border-gray-100" />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Manual Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-extrabold text-gray-900 text-lg mb-5">Add Manual Entry</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Staff Member</label>
                <select
                  value={modalUserId}
                  onChange={(e) => setModalUserId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-red-400">
                  <option value="">Select staff...</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Date</label>
                <input type="date" value={modalDate} onChange={(e) => setModalDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-red-400" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Check In</label>
                  <input type="time" value={modalCheckIn} onChange={(e) => setModalCheckIn(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-red-400" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Check Out</label>
                  <input type="time" value={modalCheckOut} onChange={(e) => setModalCheckOut(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-red-400" />
                </div>
              </div>
              {modalError && <p className="text-red-600 text-xs">{modalError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setModalError('') }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleManualAdd} disabled={modalSaving || !modalUserId}
                className="flex-1 py-3 rounded-xl bg-red-700 text-white text-sm font-bold hover:bg-red-800 disabled:opacity-40">
                {modalSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}