import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { logout as apiLogout } from '../services/api';
import { Brain, Menu, X, LogOut, User, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiLogout();
    } finally {
      logoutUser();
      navigate('/');
      setUserMenuOpen(false);
      setMobileOpen(false);
    }
  };

  const linkClass = ({ isActive }) =>
    `transition-all duration-300 px-3 py-2 rounded-md text-sm font-medium ${
      isActive
        ? 'text-cyan-600 border-b-2 border-cyan-500'
        : 'text-[#1e3a5f] hover:text-cyan-600'
    }`;

  const navLinks = user
    ? [
        { to: '/', label: 'Home' },
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/predict', label: 'Analyze MRI' },
        { to: '/history', label: 'History' },
        { to: '/analytics', label: 'Analytics' },
        { to: '/about', label: 'About' },
        { to: '/model-performance', label: 'Model Performance' },
      ]
    : [
        { to: '/', label: 'Home' },
        { to: '/about', label: 'About' },
        { to: '/model-performance', label: 'Model Performance' },
      ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Brain className="h-8 w-8 text-cyan-600 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold text-[#0c2340]">BrainScan AI</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === '/'}>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-[#1e3a5f]"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.username}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-[#1e3a5f] hover:text-cyan-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center text-[#1e3a5f]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t animate-slideUp">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive ? 'text-cyan-600 bg-cyan-50' : 'text-[#1e3a5f] hover:bg-gray-100'
                  }`
                }
                onClick={() => setMobileOpen(false)}
                end={l.to === '/'}
              >
                {l.label}
              </NavLink>
            ))}
            <hr className="my-2" />
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-[#1e3a5f] hover:bg-gray-100 rounded-md"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 bg-cyan-600 text-white rounded-md text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
