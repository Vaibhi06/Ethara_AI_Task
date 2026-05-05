import React from 'react';
import { Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ title }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header style={{
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50,
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme} className="btn btn-ghost" style={{ padding: 8, borderRadius: 8 }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark'
            ? <Sun size={18} style={{ color: 'var(--warning)' }} />
            : <Moon size={18} style={{ color: 'var(--accent)' }} />}
        </button>

        {/* Role badge */}
        <span className={`badge badge-${user?.role}`}>{user?.role}</span>

        {/* Avatar */}
        <button onClick={() => navigate('/profile')} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--accent)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13,
          overflow: 'hidden', transition: 'all 0.2s',
          boxShadow: '0 0 0 2px var(--accent-glow)',
        }}>
          {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : getInitials(user?.name)}
        </button>
      </div>
    </header>
  );
}
