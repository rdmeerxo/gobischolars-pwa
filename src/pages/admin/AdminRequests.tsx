import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Request = {
  id: string
  type: string
  date_from: string
  date_to: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  created_at: string
  users: { full_name: string }
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    let query = supabase
      .from('requests')
      .select('*, users(full_name)')
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    if (data) setRequests(data as Request[])
    setLoading(false)
  }

  useEffect(() => { 
    const load = async () => {
      setLoading(true)
      let query = supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (filter !== 'all') query = query.eq('status', filter)
      const { data, error } = await query
      console.log('data:', data, 'error:', error)
      if (data) setRequests(data as unknown as Request[])
      setLoading(false)
    }
    load()
  }, [filter])

  const updateStatus = async (id: string, status: 'approved' | 'denied') => {
    setUpdating(id)
    await supabase.from('requests').update({ status }).eq('id', id)
    setUpdating(null)
    load()
  }

  const typeLabel: Record<string, string> = {
    sick_leave: '🤒 Sick Leave',
    absence: '📌 Absence',
    remote_work: '🏠 Remote Work',
  }

  const statusBadge = (status: string) => {
    if (status === 'pending') return 'bg-yellow-100 text-yellow-700'
    if (status === 'approved') return 'bg-green-100 text-green-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-3xl font-extrabold text-gray-900">
          Requests
        </h1>
        <p className="text-gray-400 mt-1">Approve or deny staff requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'denied', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
              filter === f ? 'bg-red-700 text-white shadow-lg shadow-red-100' : 'bg-white text-gray-400 border border-gray-100'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        )}
        {!loading && requests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 font-medium">No {filter === 'all' ? '' : filter} requests</p>
          </div>
        )}
        {requests.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900 text-sm">{req.users?.full_name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm text-red-700 font-medium">{typeLabel[req.type] ?? req.type}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(req.date_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {req.date_from !== req.date_to && ` – ${new Date(req.date_to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
                {req.reason && (
                  <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">{req.reason}</p>
                )}
                <p className="text-xs text-gray-300 mt-2">
                  Submitted {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => updateStatus(req.id, 'denied')}
                    disabled={updating === req.id}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all">
                    Deny
                  </button>
                  <button
                    onClick={() => updateStatus(req.id, 'approved')}
                    disabled={updating === req.id}
                    className="px-4 py-2 rounded-xl bg-red-700 text-white text-sm font-bold hover:bg-red-800 disabled:opacity-40 transition-all shadow-lg shadow-red-100">
                    {updating === req.id ? '...' : 'Approve'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}