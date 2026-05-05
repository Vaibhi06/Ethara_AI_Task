import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, Trash2, GripVertical } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/ui/Modal';
import Avatar from '../components/ui/Avatar';
import { projectsAPI, tasksAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, isOverdue } from '../utils/helpers';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#6b7280' },
  { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'done', label: 'Done', color: '#10b981' },
];

function TaskModal({ project, members, onClose, onSave, task = null }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: task || {} });
  const [saving, setSaving] = useState(false);
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (task) await tasksAPI.update(task.id, { ...data, project_id: project.id });
      else await tasksAPI.create({ ...data, project_id: project.id });
      toast.success(task ? 'Task updated!' : 'Task created!');
      onSave();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save task'); }
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="form-input" placeholder="Task title..." {...register('title', { required: 'Title required' })} />
        {errors.title && <span className="form-error">{errors.title.message}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={3} placeholder="Details..." {...register('description')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-input filter-select" {...register('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input filter-select" {...register('status')}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Assignee</label>
          <select className="form-input filter-select" {...register('assigned_to')}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input type="date" className="form-input" {...register('due_date')} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : task ? 'Update' : 'Create Task'}</button>
      </div>
    </form>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTask, setShowTask] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMember, setShowMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [addingMember, setAddingMember] = useState(false);
  const isAdmin = user?.role === 'admin' || project?.members?.find(m => m.id === user?.id)?.role === 'admin';

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, tRes] = await Promise.all([projectsAPI.getOne(id), tasksAPI.getAll({ project_id: id })]);
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
    } catch { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksAPI.updateStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch { toast.error('Failed to update status'); }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this task?')) return;
    try { await tasksAPI.delete(taskId); setTasks(prev => prev.filter(t => t.id !== taskId)); toast.success('Task deleted'); }
    catch { toast.error('Failed to delete task'); }
  };

  const handleAddMember = async () => {
    setAddingMember(true);
    try {
      await projectsAPI.addMember(id, { email: memberEmail, role: memberRole });
      toast.success('Member added!');
      setShowMember(false);
      setMemberEmail('');
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await projectsAPI.removeMember(id, userId); toast.success('Member removed'); loadAll(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to remove member'); }
  };

  if (loading) return <Layout title="Loading..."><div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading project...</div></Layout>;
  if (!project) return null;

  const members = project.members || [];

  return (
    <Layout title={project.name}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/projects')}><ArrowLeft size={16} /> Back</button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: project.color }} />
              <h2 className="page-title" style={{ fontSize: 22 }}>{project.name}</h2>
            </div>
            {project.description && <p className="page-subtitle">{project.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowMember(true)}><UserPlus size={15} /> Add Member</button>}
          {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setShowTask(true)}><Plus size={15} /> New Task</button>}
        </div>
      </div>

      {/* Members */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Team:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {members.map(m => (
            <div key={m.id} style={{ position: 'relative' }} title={`${m.name} (${m.role})`}>
              <Avatar name={m.name} src={m.avatar} size="sm" />
              {isAdmin && m.id !== user?.id && (
                <button onClick={() => handleRemoveMember(m.id)} style={{
                  position: 'absolute', top: -4, right: -4, width: 14, height: 14,
                  borderRadius: '50%', background: 'var(--danger)', color: '#fff',
                  fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer'
                }}>×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div key={col.key} className="kanban-col">
              <div className="kanban-col-header">
                <span className="kanban-col-title">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
                  {col.label}
                </span>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div className="kanban-tasks">
                {colTasks.length === 0
                  ? <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tasks</div>
                  : colTasks.map(task => (
                    <div key={task.id} className="card task-card" onClick={() => setEditTask(task)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <p className="task-title">{task.title}</p>
                        {isAdmin && <button className="btn btn-ghost" style={{ padding: 2 }} onClick={(e) => handleDeleteTask(task.id, e)}><Trash2 size={13} style={{ color: 'var(--danger)' }} /></button>}
                      </div>
                      {task.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.4 }}>{task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}</p>}
                      <div className="task-meta">
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        {task.assignee_name && <Avatar name={task.assignee_name} src={task.assignee_avatar} size="sm" />}
                      </div>
                      {task.due_date && (
                        <div className={`task-due ${isOverdue(task.due_date, task.status) ? 'overdue' : ''}`} style={{ marginTop: 8 }}>
                          📅 {formatDate(task.due_date)}
                        </div>
                      )}
                      {/* Quick status change */}
                      <div style={{ display: 'flex', gap: 4, marginTop: 10 }} onClick={e => e.stopPropagation()}>
                        {COLUMNS.filter(c => c.key !== col.key).map(c => (
                          <button key={c.key} className="btn btn-ghost" style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)' }}
                            onClick={() => handleStatusChange(task.id, c.key)}>
                            → {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                {isAdmin && (
                  <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: 8, fontSize: 13 }}
                    onClick={() => setShowTask(true)}>
                    <Plus size={14} /> Add task
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task modal */}
      <Modal isOpen={showTask} onClose={() => setShowTask(false)} title="Create Task">
        <TaskModal project={project} members={members} onClose={() => setShowTask(false)} onSave={loadAll} />
      </Modal>
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task">
        {editTask && <TaskModal project={project} members={members} task={editTask} onClose={() => setEditTask(null)} onSave={loadAll} />}
      </Modal>

      {/* Add member modal */}
      <Modal isOpen={showMember} onClose={() => setShowMember(false)} title="Add Team Member"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowMember(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddMember} disabled={addingMember || !memberEmail}>
              {addingMember ? 'Adding...' : 'Add Member'}
            </button>
          </>
        }>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="member@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Role</label>
          <select className="form-input filter-select" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </Modal>
    </Layout>
  );
}
