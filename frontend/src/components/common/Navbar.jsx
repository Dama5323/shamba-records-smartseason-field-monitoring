import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LayoutDashboard, 
  Sprout, 
  User, 
  LogOut,
  Menu,
  X,
  AlertTriangle
} from 'lucide-react'

// Logo image URL
const LOGO_URL = 'https://res.cloudinary.com/dzyqof9it/image/upload/v1777133180/shamba_n7wgns.jpg'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/fields', label: 'Fields', icon: Sprout },
    { path: '/at-risk', label: 'At Risk', icon: AlertTriangle },
  ]
  
  // Add admin-only links
  const isAdmin = user?.role === 'admin'
  if (isAdmin) {
    navLinks.push({ path: '/users', label: 'Users', icon: User })
  }
  
  const isActive = (path) => location.pathname === path
  
  const userDisplayName = user?.first_name || user?.username || user?.email?.split('@')[0] || 'User'
  const userInitial = userDisplayName.charAt(0).toUpperCase()
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo with Image */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <img 
              src={LOGO_URL} 
              alt="SmartSeason Logo" 
              className="h-10 w-auto rounded-lg transition-transform group-hover:scale-105"
            />
            <div>
              <span className="text-lg font-bold text-gray-900">SmartSeason</span>
              <p className="text-xs text-gray-500 -mt-1">Field Monitor</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  isActive(link.path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
          
          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/profile" className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-2 py-1 transition">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                {userInitial}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Agent'}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
                  isActive(link.path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <link.icon className="h-5 w-5" />
                <span>{link.label}</span>
              </Link>
            ))}
            <div className="border-t border-gray-100 my-2 pt-2">
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <User className="h-5 w-5" />
                <span>My Profile</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
          
          {/* Mobile User Info */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                {userInitial}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar