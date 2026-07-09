import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm transition ${
    isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
  }`;

export default function Navbar() {
  const { user, isSignedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="rounded-xl bg-brand-600 p-2 text-white">
            <Sparkles size={18} />
          </span>
          CareerAI
        </Link>

        <nav className="hidden items-center gap-2 xl:flex">
          <NavLink to="/" className={linkClass}>
            Home
          </NavLink>
          {isSignedIn ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
              <NavLink to="/resume" className={linkClass}>
                Resume
              </NavLink>
              <NavLink to="/career-recommendation" className={linkClass}>
                Career
              </NavLink>
              <NavLink to="/mentor" className={linkClass}>
                Mentor
              </NavLink>
              <NavLink to="/chat" className={linkClass}>
                Chat
              </NavLink>
              <NavLink to="/notifications" className={linkClass}>
                Notifications
              </NavLink>
              <NavLink to="/reports" className={linkClass}>
                Reports
              </NavLink>
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/sign-up" className="btn-primary">
                Get Started
              </Link>
            </>
          ) : (
            <>
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-white">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'CareerAI User'}
                </p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-900 hover:text-white"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
