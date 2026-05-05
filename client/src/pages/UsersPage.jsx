import React, { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import Avatar from '../components/ui/Avatar';
import { usersAPI } from '../services/api';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    setLoading(true);
    usersAPI.getAll()
      .then(r => setUsers(r.data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (id) => {
    try {
      await usersAPI.approve(id);
      toast.success('User approved!');
      loadUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  return (
    <Layout title="Team">
      <div className="page-header">
        <div>
          <h2 className="page-title">Team Members</h2>
          <p className="page-subtitle">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>User</th><th>Role</th><th>Status</th><th>Projects</th><th>Tasks</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar name={u.name} src={u.avatar} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                    <td>
                      {u.is_approved ? (
                        <span className="badge badge-done">Approved</span>
                      ) : (
                        <button onClick={() => handleApprove(u.id)} className="btn btn-sm btn-primary">Approve</button>
                      )}
                    </td>
                    <td style={{ fontSize: 14, fontWeight: 600 }}>{u.project_count}</td>
                    <td style={{ fontSize: 14, fontWeight: 600 }}>{u.task_count}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
