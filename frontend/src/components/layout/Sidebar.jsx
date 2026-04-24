import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  User, 
  Settings, 
  LogOut,
  Sprout
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ user }) => {
  const location = useLocation();
  const { logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/fields', icon: Map, label: 'Fields' },
  ];

  if (isAdmin) {
    navItems.push({ path: '/users', icon: User, label: 'Users' });
  }

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col fixed h-full overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-shamba rounded-xl flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-gray-800">SmartSeason</h1>
            <p className="text-xs text-gray-500">Field Monitor</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            MAIN
          </p>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive(item.path)
                    ? 'bg-shamba/10 text-shamba'
                    : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-shamba' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">
            ACCOUNT
          </p>
          <div className="space-y-1">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200 hover:translate-x-1 group"
            >
              <User className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              <span className="text-sm font-medium">My Profile</span>
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 transition-all duration-200 hover:translate-x-1 group"
            >
              <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 hover:translate-x-1 group"
            >
              <LogOut className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-shamba/5 rounded-xl p-3">
          <p className="text-xs text-shamba font-medium">Need Help?</p>
          <p className="text-xs text-gray-500 mt-1">Contact support</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;