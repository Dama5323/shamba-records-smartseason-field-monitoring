import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  Users, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sprout,
  Shield,
  UserPlus,
  Activity,
  User,
  ChevronDown,
  Edit,
  UserCircle
} from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/fields', icon: Map, label: 'Fields' },
    { path: '/observations', icon: Activity, label: 'Observations' },
    { path: '/at-risk', icon: AlertTriangle, label: 'At Risk' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/users', icon: Users, label: 'Users' });
    navItems.push({ path: '/analytics', icon: BarChart3, label: 'Analytics' });
  }

  const isActive = (path) => location.pathname === path;

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = (action) => {
    setIsProfileOpen(false);
    if (action === 'profile') {
      navigate('/profile');
    } else if (action === 'edit') {
      navigate('/profile/edit');
    } else if (action === 'settings') {
      navigate('/settings');
    } else if (action === 'logout') {
      logout();
    }
  };

  const getInitials = () => {
    const first = user?.first_name?.charAt(0) || '';
    const last = user?.last_name?.charAt(0) || '';
    if (first || last) return `${first}${last}`.toUpperCase();
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  const getFullName = () => {
    if (user?.first_name || user?.last_name) {
      return `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    }
    return user?.username || 'User';
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden bg-emerald-600 text-white p-2 rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full bg-white shadow-xl z-50 transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo Area */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-200 ${isCollapsed ? 'flex-col' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Sprout className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-gray-800">SmartSeason</h1>
                <p className="text-xs text-gray-500">Field Monitor</p>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden md:block text-gray-400 hover:text-gray-600"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all
                    ${isActive(item.path) 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section with Profile Dropdown */}
        <div className={`border-t border-gray-200 p-4 ${isCollapsed ? 'text-center' : ''}`}>
          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-3 w-full ${isCollapsed ? 'justify-center' : ''} hover:bg-gray-50 rounded-lg p-2 transition-colors`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {getInitials()}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getFullName()}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              )}
              {!isCollapsed && (
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && !isCollapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500">Signed in as</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => handleProfileClick('profile')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  <span>View Profile</span>
                </button>
                
                <button
                  onClick={() => handleProfileClick('edit')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
                
                {isAdmin && (
                  <button
                    onClick={() => handleProfileClick('settings')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                )}
                
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => handleProfileClick('logout')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* When collapsed, show icons */}
          {isCollapsed && (
            <>
              <button
                onClick={() => handleProfileClick('profile')}
                className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg mb-2"
                title="Profile"
              >
                <UserCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleProfileClick('logout')}
                className="w-full flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Spacer */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} hidden md:block`} />
    </>
  );
};

export default Sidebar;