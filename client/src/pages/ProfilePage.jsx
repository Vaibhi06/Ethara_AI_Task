import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Shield, Calendar, Edit2, Save, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, fetchMe } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: user?.name } });

  useEffect(() => { reset({ name: user?.name }); }, [user]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await usersAPI.update(user.id, data);
      await fetchMe();
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <Layout title="Profile">
      <div style={{ maxWidth: 640 }}>
        <div className="page-header">
          <div>
            <h2 className="page-title">My Profile</h2>
            <p className="page-subtitle">Manage your account information</p>
          </div>
          {!editing
            ? <button className="btn btn-secondary" onClick={() => setEditing(true)}><Edit2 size={15} /> Edit Profile</button>
            : <button className="btn btn-ghost" onClick={() => setEditing(false)}><X size={15} /> Cancel</button>}
        </div>

        {/* Avatar + Role card */}
        <div className="card" style={{ padding: 32, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
          <Avatar name={user?.name} src={user?.avatar} size="xl" />
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{user?.name}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>{user?.email}</p>
            <span className={`badge badge-${user?.role}`} style={{ fontSize: 12, padding: '4px 12px' }}>
              <Shield size={12} /> {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </span>
          </div>
        </div>

        {/* Info card */}
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Account Details</h3>

          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" {...register('name', { required: 'Name required', minLength: { value: 2 } })} />
              </div>
              {!user?.google_id && (
                <div className="form-group">
                  <label className="form-label">New Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(leave blank to keep current)</span></label>
                  <input type="password" className="form-input" placeholder="••••••••" {...register('password', { minLength: { value: 6, message: 'Min 6 chars' } })} />
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {[
                { icon: User, label: 'Full Name', value: user?.name },
                { icon: Mail, label: 'Email', value: user?.email },
                { icon: Shield, label: 'Role', value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
                { icon: Calendar, label: 'Member since', value: formatDate(user?.created_at) },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                    <Icon size={16} style={{ color: 'var(--accent-light)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{value}</div>
                  </div>
                </div>
              ))}
              {user?.google_id && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(66,133,244,0.1)', border: '1px solid rgba(66,133,244,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Signed in with Google</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
