import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckSquare, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Layout from '../components/layout/Layout';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue } from '../utils/helpers';
import Avatar from '../components/ui/Avatar';

const STATUS_COLORS = { todo: '#6b7280', in_progress: '#3b82f6', done: '#10b981' };
const PRIORITY_COLORS = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444' };

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className={`card stat-card ${color}`} style={{ padding: 24 }}>
      <div className="stat-icon" style={{ background: bg }}>
        <Icon size={22} color={Object.values(STATUS_COLORS)[0]} style={{ color: bg.replace('rgba(','').split(',')[0] }} />
      </div>
      <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.stats()
      .then(r => setStats(r.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="Dashboard">
      <div className="stats-grid">
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
      </div>
    </Layout>
  );

  const statusData = (stats?.tasksByStatus || []).map(r => ({
    name: r.status === 'in_progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1),
    value: parseInt(r.count),
    color: STATUS_COLORS[r.status],
  }));

  const priorityData = (stats?.tasksByPriority || []).map(r => ({
    name: r.priority.charAt(0).toUpperCase() + r.priority.slice(1),
    count: parseInt(r.count),
    fill: PRIORITY_COLORS[r.priority],
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="card" style={{ padding: '8px 14px', fontSize: 13 }}>
        <p style={{ fontWeight: 600 }}>{label || payload[0].name}</p>
        <p style={{ color: 'var(--accent-light)' }}>{payload[0].value} tasks</p>
      </div>
    );
  };

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div>
          <h2 className="page-title">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Projects', value: stats?.projects ?? 0, icon: FolderKanban, color: 'blue', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Total Tasks', value: stats?.tasks?.total ?? 0, icon: CheckSquare, color: 'blue', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Completed', value: stats?.tasks?.done ?? 0, icon: TrendingUp, color: 'blue', bg: 'rgba(59, 130, 246, 0.1)' },
          { label: 'Overdue', value: stats?.tasks?.overdue ?? 0, icon: AlertTriangle, color: 'blue', bg: 'rgba(59, 130, 246, 0.1)' },
        ].map(s => (
          <div key={s.label} className={`card stat-card`} style={{ padding: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <s.icon size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="two-col" style={{ marginBottom: 32 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 24 }}>Tasks by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No task data yet</p></div>}
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 24 }}>Tasks by Priority</h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6,6,0,0]}>
                  {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No task data yet</p></div>}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Recent Tasks</h3>
        {stats?.recentTasks?.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTasks.map(task => (
                  <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/tasks')}>
                    <td style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.project_color || 'var(--accent)' }} />
                        {task.project_name}
                      </span>
                    </td>
                    <td>
                      {task.assignee_name
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={task.assignee_name} src={task.assignee_avatar} size="sm" />
                            {task.assignee_name}
                          </span>
                        : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                    </td>
                    <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td><span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span></td>
                    <td style={{ color: isOverdue(task.due_date, task.status) ? 'var(--danger)' : 'var(--text-secondary)', fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />{formatDate(task.due_date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Create a project and add tasks to get started.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
