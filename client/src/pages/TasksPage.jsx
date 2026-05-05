import React, { useEffect, useState } from 'react';
import { Search, Filter, Trash2, Edit2, Clock } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import { tasksAPI, projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue } from '../utils/helpers';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTask, setEditTask] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', project_id: '', search: '' });

  const load = () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v));
    tasksAPI.getAll(params)
      .then(r => setTasks(r.data.tasks))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [JSON.stringify(filters)]);
  useEffect(() => { projectsAPI.getAll().then(r => setProjects(r.data.projects)).catch(() => {}); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await tasksAPI.updateStatus(id, status);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      toast.success('Status updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id); setTasks(prev => prev.filter(t => t.id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const f = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));

  return (
    <Layout title="Tasks">
      <div className="page-header">
        <div>
          <h2 className="page-title">All Tasks</h2>
          <p className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="search-input" style={{ paddingLeft: 30 }} placeholder="Search tasks..." value={filters.search} onChange={e => f('search', e.target.value)} />
        </div>
        <select className="filter-select" value={filters.status} onChange={e => f('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="filter-select" value={filters.priority} onChange={e => f('priority', e.target.value)}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select className="filter-select" value={filters.project_id} onChange={e => f('project_id', e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {Object.values(filters).some(Boolean) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status: '', priority: '', project_id: '', search: '' })}>Clear</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <h3>No tasks found</h3>
          <p>Try adjusting your filters or create tasks from a project.</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task</th><th>Project</th><th>Assignee</th>
                  <th>Priority</th><th>Status</th><th>Due Date</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const over = isOverdue(task.due_date, task.status);
                  return (
                    <tr key={task.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}</div>}
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.project_color || 'var(--accent)', flexShrink: 0 }} />
                          {task.project_name}
                        </span>
                      </td>
                      <td>
                        {task.assignee_name
                          ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                              <Avatar name={task.assignee_name} src={task.assignee_avatar} size="sm" />{task.assignee_name}
                            </span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
                      </td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td>
                        <select className="filter-select" value={task.status} style={{ fontSize: 12, padding: '4px 8px' }}
                          onChange={e => handleStatusChange(task.id, e.target.value)}>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </td>
                      <td style={{ fontSize: 13, color: over ? 'var(--danger)' : 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {task.due_date && <Clock size={12} />}{formatDate(task.due_date)}
                          {over && <span style={{ fontSize: 10, fontWeight: 700 }}>OVERDUE</span>}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditTask(task)}><Edit2 size={14} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(task.id)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task">
        {editTask && <EditTaskForm task={editTask} onClose={() => setEditTask(null)} onSave={() => { setEditTask(null); load(); }} />}
      </Modal>
    </Layout>
  );
}

function EditTaskForm({ task, onClose, onSave }) {
  const { register, handleSubmit } = useForm({ defaultValues: { ...task, due_date: task.due_date?.split('T')[0] || '' } });
  const [saving, setSaving] = useState(false);
  const onSubmit = async (data) => {
    setSaving(true);
    try { await tasksAPI.update(task.id, data); toast.success('Task updated!'); onSave(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-group"><label className="form-label">Title</label><input className="form-input" {...register('title', { required: true })} /></div>
      <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} {...register('description')} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group"><label className="form-label">Priority</label>
          <select className="form-input filter-select" {...register('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
        </div>
        <div className="form-group"><label className="form-label">Status</label>
          <select className="form-input filter-select" {...register('status')}><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option></select>
        </div>
        <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" {...register('due_date')} /></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update Task'}</button>
      </div>
    </form>
  );
}
