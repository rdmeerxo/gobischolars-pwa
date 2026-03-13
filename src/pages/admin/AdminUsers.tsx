import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type User = {
  id: string
  full_name: string
  role: string
  position?: string
  target_hours?: number
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editHours, setEditHours] = useState('')
  const [editPosition, setEditPosition] = useState('')
  const [saving, setSaving] = useState(false)
  const [totalHoursMap, setTotalHoursMap] = useState<Record<string, number>>({})

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'faculty')
        .order('full_name')
      if (usersData) setUsers(usersData as User[])

      // Load total hours worked per user
      const { data: logsData } = await supabase
        .from('attendance_logs')
        .select('user_id, total_hours')
      if (logsData) {
        const map: Record<string, number> = {}
        for (const log of logsData) {
          map[log.user_id] = (map[log.user_id] ?? 0) + (log.total_hours ?? 0)
        }
        setTotalHoursMap(map)
      }

      setLoading(false)
    }
    load()
  }, [])

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setEditHours(user.target_hours?.toString() ?? '')
    setEditPosition(user.position ?? '')
  }

  const handleSave = async (userId: string) => {
    setSaving(true)
    await supabase.from('users').update({
      target_hours: editHours ? parseFloat(editHours) : null,
      position: editPosition || null,
    }).eq('id', userId)

    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, target_hours: editHours ? parseFloat(editHours) : undefined, position: editPosition || undefined }
        : u
    ))
    setSaving(false)
    setEditingId(null)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-extrabold text-gray-900">
          Staff
        </h1>
        <p className="text-gray-400 mt-1">Manage staff details and internship hours</p>
      </div>

      {loading && <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>}

      <div className="space-y-4">
        {users.map((user) => {
          const worked = totalHoursMap[user.id] ?? 0
          const target = user.target_hours
          const progressPct = target ? Math.min(100, (worked / target) * 100) : 0
          const isEditing = editingId === user.id

          return (
            <div key={user.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{user.full_name}</p>
                  {!isEditing && (
                    <p className="text-xs text-gray-400 mt-0.5">{user.position ?? 'No position set'}</p>
                  )}
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => startEdit(user)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all">
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSave(user.id)}
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-red-700 text-white text-sm font-bold hover:bg-red-800 disabled:opacity-40 shadow-lg shadow-red-100">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {/* Edit fields */}
              {isEditing && (
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Position</label>
                    <input
                      type="text"
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                      placeholder="e.g. SAT Instructor"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-red-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Target Hours</label>
                    <input
                      type="number"
                      value={editHours}
                      onChange={(e) => setEditHours(e.target.value)}
                      placeholder="e.g. 160"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-red-400"
                    />
                  </div>
                </div>
              )}

              {/* Progress */}
              {target ? (
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="text-sm font-bold text-gray-900">{worked.toFixed(1)}h</span>
                      <span className="text-xs text-gray-400"> / {target}h internship target</span>
                    </div>
                    <span className="text-xs font-bold text-red-700">
                      {Math.max(0, target - worked).toFixed(1)}h left
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-red-700 h-2.5 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{progressPct.toFixed(0)}% complete</p>
                </div>
              ) : (
                <p className="text-xs text-gray-300">No internship target set — click Edit to assign one</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}