import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [revealed, setRevealed] = useState(false)
  const { signIn, loading, user } = useAuthStore()

  useEffect(() => {
    setTimeout(() => setRevealed(true), 600)
 }, [])


  useEffect(() => {
    if (user) {
        navigate(user.role === 'admin' ? '/admin' : '/')
    }
  }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields'); return }
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-white flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');

        .reveal-panel {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #0a0a0a;
          transform-origin: top;
          transform: scaleY(1);
          transition: transform 1s cubic-bezier(0.76, 0, 0.24, 1);
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
        }
        .reveal-panel.done {
          transform: scaleY(0);
          pointer-events: none;
        }
        .scroll-text {
          height: 280px;
          object-fit: contain;
          opacity: 1;
          transition: opacity 0.4s ease;
        }
        .reveal-panel.done .scroll-text {
          opacity: 0;
        }
        .reveal-logo-img {
          width: 280px;
          object-fit: contain;
          opacity: 1;
          transition: opacity 0.4s ease;
        }
        .reveal-panel.done .reveal-logo-img {
          opacity: 0;
        }
      `}</style>

      {/* Reveal animation panel */}
      <div className={`reveal-panel ${revealed ? 'done' : ''}`}>
        <img src="/scrolltext.png" className="scroll-text" alt="" />
    
      </div>

      {/* Top red bar */}
      <div className="h-1.5 bg-red-700 w-full" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="GobiScholars Academy"
            className="w-64 object-contain mx-auto mb-4"
            style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(94%) saturate(2000%) hue-rotate(345deg) brightness(80%)' }}
          />
          <p className="text-gray-400 text-xs tracking-[0.2em] uppercase font-semibold">
            Attendance System
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl shadow-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Sign in to your account</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-red-700 hover:bg-red-800 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-red-100 mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>
          </div>

          <p className="text-center text-gray-300 text-xs mt-6">
            GobiScholars Academy · Ulaanbaatar, Mongolia
          </p>
        </div>
      </div>
    </div>
  )
}