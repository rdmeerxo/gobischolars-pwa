import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

type RequestType = 'sick_leave' | 'absence' | 'remote_work'
type RequestStatus = 'pending' | 'approved' | 'denied'

type Request = {
  id: string
  type: RequestType
  date: string
  reason: string
  status: RequestStatus
  created_at: string
}

const TYPE_LABELS: Record<RequestType, string> = {
  sick_leave: '🤒 Sick Leave',
  absence: '📅 Absence / Day Off',
  remote_work: '🏠 Remote Work',
}

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  denied: 'bg-red-50 text-red-700 border-red-200',
}

export default function Requests() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'new' | 'history'>('new')
  const [type, setType] = useState<RequestType>('sick_leave')
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (tab !== 'history') return
    const load = async () => {
        await Promise.resolve()
        setLoading(true)
        const { data } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        if (data) setRequests(data as Request[])
            setLoading(false)
    }
    load()
  }, [tab, user?.id])

  const handleSubmit = async () => {
    if (!date || !reason.trim() || !user) return
    setSubmitting(true)
    setSubmitError('')
    console.log('Inserting:', { user_id: user.id, type, date, reason: reason.trim() })
    const { data, error } = await supabase.from('requests').insert({
        user_id: user.id,
        type,
        date_from: date,
        date_to: date,
        reason: reason.trim(),
        status: 'pending',
    }).select()
    console.log('Result:', data, error)
    setSubmitting(false)
    if (error) {
        setSubmitError(error.message)
    } else {
        setSuccess(true)
        setDate('')
        setReason('')
        setTimeout(() => setSuccess(false), 3000)
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
          Requests
        </h1>
        <p className="relative text-red-200 text-sm mt-1">Submit leave & remote work requests</p>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-6 flex gap-3">
        <button
          onClick={() => setTab('new')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'new' ? 'bg-red-700 text-white shadow-lg shadow-red-100' : 'bg-white text-gray-400 border border-gray-100'
          }`}>
          New Request
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'history' ? 'bg-red-700 text-white shadow-lg shadow-red-100' : 'bg-white text-gray-400 border border-gray-100'
          }`}>
          My Requests
        </button>
      </div>

      <div className="px-6 py-6">

        {/* NEW REQUEST */}
        {tab === 'new' && (
          <div className="space-y-4">

            {/* Success banner */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 font-medium text-sm text-center">
                ✅ Request submitted! Pending admin approval.
              </div>
            )}

            {/* Error banner */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
                ❌ {submitError}
              </div>
            )}

            {/* Type selector */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Request Type</p>
              <div className="space-y-2">
                {(Object.keys(TYPE_LABELS) as RequestType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                      type === t
                        ? 'bg-red-700 text-white border-red-700'
                        : 'bg-gray-50 text-gray-700 border-gray-100'
                    }`}>
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Date picker */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Date</p>
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-red-400"
              />
            </div>

            {/* Reason */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Reason</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain your reason..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-red-400 resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !date || !reason.trim()}
              className="w-full py-4 rounded-2xl font-bold text-white bg-red-700 hover:bg-red-800 active:scale-95 transition-all shadow-lg shadow-red-100 disabled:opacity-40 disabled:scale-100">
              {submitting ? 'Submitting...' : 'Submit Request →'}
            </button>
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div>
            {loading && (
              <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
            )}
            {!loading && requests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-400 font-medium">No requests yet</p>
              </div>
            )}
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-bold text-gray-900">{TYPE_LABELS[req.type]}</p>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border capitalize ${STATUS_STYLES[req.status]}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">
                    📅 {new Date(req.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{req.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}