import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const navItems = [
  { icon: '🏠', label: 'Overview', path: '/admin' },
  { icon: '📍', label: 'Attendance', path: '/admin/attendance' },
  { icon: '📋', label: 'Requests', path: '/admin/requests' },
  { icon: '📅', label: 'Schedules', path: '/admin/schedules' },
  { icon: '📝', label: 'Reports', path: '/admin/reports' },
  { icon: '👥', label: 'Staff', path: '/admin/users' },
]

export default function AdminLayout() {
  const { user, signOut } = useAuthStore()


  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-gray-50 flex">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');`}</style>

      {/* Sidebar */}
      <div className="w-64 bg-gray-900 min-h-screen flex flex-col fixed left-0 top-0">
        {/* Logo */}
        <div className="px-6 py-8 border-b border-gray-800">
          <img src="/logo.png" alt="GobiScholars" className="h-7 object-contain mb-4" style={{ filter: 'brightness(0) invert(1)' }} />
          <p className="text-xs text-gray-400 font-medium">Admin Dashboard</p>
          <p className="text-white font-bold text-sm mt-0.5">{user?.full_name}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }>
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-4 pb-6">
          <button
            onClick={signOut}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all text-left flex items-center gap-3">
            <span>🚪</span> Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 flex-1 min-h-screen">
        <Outlet />
      </div>
    </div>
  )
}