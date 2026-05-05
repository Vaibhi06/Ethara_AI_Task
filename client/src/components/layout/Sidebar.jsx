import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Menu, X, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div style={{
      width: 260, height: '100vh', position: 'fixed', top: 0, left: 0,
      background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-glow)',
          }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>TaskFlow</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Project Manager</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.2s ease',
            background: isActive ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'transparent',
            color: isActive ? '#fff' : 'var(--text-secondary)',
            boxShadow: isActive ? '0 4px 12px var(--accent-glow)' : 'none',
          })}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink to="/users" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            textDecoration: 'none', transition: 'all 0.2s ease',
            background: isActive ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'transparent',
            color: isActive ? '#fff' : 'var(--text-secondary)',
            boxShadow: isActive ? '0 4px 12px var(--accent-glow)' : 'none',
          })}>
            <Users size={18} />
            Team
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <NavLink to="/profile" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
          transition: 'all 0.2s', marginBottom: 8,
        }} className="card">
          <div className="avatar avatar-sm" style={{ background: 'var(--accent)', width: 34, height: 34, fontSize: 13 }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : getInitials(user?.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
          </div>
        </NavLink>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', gap: 8, fontSize: 13 }}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: 'none' }} className="desktop-sidebar"><SidebarContent /></div>
      <SidebarContent />
    </>
  );
}
