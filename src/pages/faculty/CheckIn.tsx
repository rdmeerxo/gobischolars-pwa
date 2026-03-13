import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { OFFICE_LOCATION } from '../../constants'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef } from 'react'

type Step = 'idle' | 'locating' | 'camera' | 'preview' | 'submitting' | 'done' | 'error'

type AttendanceLog = {
  id: string
  check_in_time: string
  check_out_time?: string
  total_hours?: number
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function CheckIn() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isCheckOut, setIsCheckOut] = useState(false)
  const [todayLog] = useState<AttendanceLog | null>(location.state?.todayLog ?? null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const freshLogRef = useRef<AttendanceLog | null>(null)

  const startCheckIn = async () => {
    setError('')
    setStep('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = getDistance(
          pos.coords.latitude, pos.coords.longitude,
          OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude
        )
        if (dist > OFFICE_LOCATION.radius) {
          setError(`You are ${Math.round(dist)}m away from the office. Must be within ${OFFICE_LOCATION.radius}m.`)
          setStep('error')
          return
        }
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        openCamera()
      },
      () => {
        setError('Could not get your location. Please allow location access.')
        setStep('error')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const openCamera = async () => {
    setStep('camera')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setError('Could not access camera. Please allow camera access.')
      setStep('error')
    }
  }

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(videoRef.current, 0, 0)
    const url = canvas.toDataURL('image/jpeg', 0.8)
    setPhotoUrl(url)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setStep('preview')
  }

  const submitCheckIn = async () => {
    if (!coords || !photoUrl || !user) return
    setStep('submitting')

    const blob = await (await fetch(photoUrl)).blob()
    const filename = `${user.id}/${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('checkin-photos')
      .upload(filename, blob, { contentType: 'image/jpeg' })

    if (uploadError) {
      setError('Failed to upload photo.')
      setStep('error')
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('checkin-photos')
      .getPublicUrl(filename)

    const today = new Date().toLocaleDateString('en-CA')

    const { data: dbLog } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let resultLog: AttendanceLog

    if (dbLog && !dbLog.check_out_time) {
      const checkOutTime = new Date().toISOString()
      const totalHours = Math.round(
        ((new Date(checkOutTime).getTime() - new Date(dbLog.check_in_time).getTime()) / 3600000) * 100
      ) / 100
      await supabase.from('attendance_logs').update({
        check_out_time: checkOutTime,
        total_hours: totalHours,
      }).eq('id', dbLog.id)
      resultLog = { ...dbLog, check_out_time: checkOutTime, total_hours: totalHours }
    } else {
      const checkInTime = new Date().toISOString()
      await supabase.from('attendance_logs').insert({
        user_id: user.id,
        date: today,
        check_in_time: checkInTime,
        check_in_lat: coords.lat,
        check_in_lng: coords.lng,
        check_in_photo_url: publicUrl,
        status: 'present',
        filled_by_admin: false,
      })
      resultLog = { id: '', check_in_time: checkInTime }
    }

    freshLogRef.current = resultLog
    setIsCheckOut(!!(resultLog.check_out_time))
    setStep('done')
  }

  const reset = () => {
    setStep('idle')
    setError('')
    setPhotoUrl('')
    setCoords(null)
  }

  const isCheckedIn = todayLog && !todayLog.check_out_time
  const isCheckedOut = todayLog && todayLog.check_out_time

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-gray-50">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');`}</style>

      <div className="bg-red-700 px-6 pt-12 pb-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-red-600 opacity-50" />
        <button onClick={() => navigate('/', { state: { todayLog: freshLogRef.current } })} className="relative text-red-200 text-sm mb-4 block">
          ← Back
        </button>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }}
          className="relative text-2xl font-extrabold text-white">
          Check In / Out
        </h1>
        <p className="relative text-red-200 text-sm mt-1">GPS + photo verification required</p>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Today's Status</p>
          {!todayLog && <p className="text-gray-900 font-bold">Not checked in</p>}
          {isCheckedIn && (
            <div>
              <p className="text-green-600 font-bold">Checked in ✓</p>
              <p className="text-gray-400 text-xs mt-1">Since {new Date(todayLog.check_in_time).toLocaleTimeString()}</p>
            </div>
          )}
          {isCheckedOut && (
            <div>
              <p className="text-red-700 font-bold">Done for today ✓</p>
              <p className="text-gray-400 text-xs mt-1">{todayLog.total_hours}h worked</p>
            </div>
          )}
        </div>

        {step === 'idle' && !isCheckedOut && (
          <button onClick={startCheckIn}
            className="w-full py-4 rounded-2xl font-bold text-white bg-red-700 hover:bg-red-800 active:scale-95 transition-all shadow-lg shadow-red-100">
            {isCheckedIn ? 'Check Out Now →' : 'Check In Now →'}
          </button>
        )}

        {step === 'locating' && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 animate-pulse">📍</div>
            <p className="text-gray-500 font-medium">Getting your location...</p>
          </div>
        )}

        {step === 'camera' && (
          <div>
            <p className="text-gray-500 text-sm text-center mb-4">Take a selfie!</p>
            <video ref={videoRef} autoPlay playsInline
              className="w-full rounded-2xl mb-4 border border-gray-100 shadow-sm"
              style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} className="hidden" />
            <button onClick={takePhoto}
              className="w-full py-4 rounded-2xl font-bold text-white bg-red-700 hover:bg-red-800 active:scale-95 transition-all shadow-lg shadow-red-100">
              📸 Take Photo
            </button>
          </div>
        )}

        {step === 'preview' && (
          <div>
            <p className="text-gray-500 text-sm text-center mb-4">Looking good? Confirm to submit.</p>
            <img src={photoUrl} className="w-full rounded-2xl mb-4 border border-gray-100 shadow-sm" />
            <div className="flex gap-3">
              <button onClick={() => { setPhotoUrl(''); openCamera() }}
                className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-white border border-gray-200">
                Retake
              </button>
              <button onClick={submitCheckIn}
                className="flex-1 py-4 rounded-2xl font-bold text-white bg-red-700 hover:bg-red-800 active:scale-95 transition-all shadow-lg shadow-red-100">
                Confirm ✓
              </button>
            </div>
          </div>
        )}

        {step === 'submitting' && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-500 font-medium">Submitting...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-gray-900 font-bold text-xl">
              {isCheckOut ? 'Checked out!' : 'Checked in!'}
            </p>
            <p className="text-gray-400 text-sm mt-2">{new Date().toLocaleTimeString()}</p>
            <button onClick={() => navigate('/', { state: { todayLog: freshLogRef.current } })}
              className="mt-6 w-full py-4 rounded-2xl font-bold text-white bg-red-700 shadow-lg shadow-red-100">
              Back to Home
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-red-600 text-sm font-medium">{error}</p>
            <button onClick={reset}
              className="mt-6 w-full py-4 rounded-2xl font-bold text-white bg-red-700 shadow-lg shadow-red-100">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}