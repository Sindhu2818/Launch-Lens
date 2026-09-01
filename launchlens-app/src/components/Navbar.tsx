import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Rocket, ChevronDown, LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <Rocket size={20} />
        <span>LaunchLens</span>
      </Link>
      <div className="navbar-right">
        {user ? (
          <div className="avatar-wrapper" ref={dropdownRef}>
            <button className="avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <span className="avatar-circle">{getInitials(user.name)}</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen && (
              <div className="avatar-dropdown">
                <div className="dropdown-header">
                  <span className="dropdown-name">{user.name}</span>
                  <span className="dropdown-email">{user.email}</span>
                </div>
                <div className="dropdown-divider" />
                <button onClick={() => { setDropdownOpen(false); navigate('/dashboard'); }}>
                  <LayoutDashboard size={16} /> My Dashboard
                </button>
                <button onClick={() => { setDropdownOpen(false); navigate('/submit'); }}>
                  <PlusCircle size={16} /> New Idea
                </button>
                <div className="dropdown-divider" />
                <button onClick={() => { setDropdownOpen(false); logout(); navigate('/'); }} className="dropdown-logout">
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/auth" className="btn btn-secondary hide-mobile">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
