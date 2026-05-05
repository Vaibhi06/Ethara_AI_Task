import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, CheckSquare, Trash2, Edit2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Modal from '../components/ui/Modal';
import { projectsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getProgressPercent, PROJECT_COLORS } from '../utils/helpers';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

function ProjectForm({ onSubmit, loading, initial = {} }) {
  const [color, setColor] = useState(initial.color || '#7c3aed');
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial });
  return (
    <form onSubmit={handleSubmit(d => onSubmit({ ...d, color }))} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="form-group">
        <label className="form-label">Project Name *</label>
        <input className="form-input" placeholder="My Awesome Project" {...register('name', { required: 'Name required' })} />
        {errors.name && <span className="form-error">{errors.name.message}</span>}
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input" rows={3} placeholder="What is this project about?" {...register('description')} />
      </div>
      <div className="form-group">
        <label className="form-label">Project Color</label>
        <div className="color-picker">
          {PROJECT_COLORS.map(c => (
            <button key={c} type="button" className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-end' }}>
        {loading ? 'Saving...' : initial.id ? 'Update Project' : 'Create Project'}
      </button>
    </form>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  const load = () => {
    setLoading(true);
    projectsAPI.getAll()
      .then(r => setProjects(r.data.projects))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await projectsAPI.create(data);
      toast.success('Project created!');
      setShowCreate(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await projectsAPI.update(editProject.id, data);
      toast.success('Project updated!');
      setEditProject(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this project? This will also delete all tasks.')) return;
    try {
      await projectsAPI.delete(id);
      toast.success('Project deleted');
      load();
    } catch { toast.error('Failed to delete project'); }
  };

  return (
    <Layout title="Projects">
      <div className="page-header">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="projects-grid">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects yet</h3>
          <p>{isAdmin ? 'Create your first project to get started.' : 'Ask an admin to add you to a project.'}</p>
          {isAdmin && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}><Plus size={16} /> New Project</button>}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => {
            const pct = getProgressPercent(parseInt(p.done_count), parseInt(p.task_count));
            return (
              <div key={p.id} className="card project-card" onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="project-card-top">
                  <span className="project-dot" style={{ background: p.color }} />
                  <h3 className="project-name" style={{ flex: 1 }}>{p.name}</h3>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditProject(p)}><Edit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(p.id, e)}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                {p.description && <p className="project-desc">{p.description}</p>}
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                </div>
                <div className="project-footer">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Users size={13} /> {p.member_count} member{p.member_count !== '1' ? 's' : ''}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckSquare size={13} /> {p.done_count}/{p.task_count} tasks
                  </span>
                  <span style={{ color: p.color, fontWeight: 700 }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Project">
        <ProjectForm onSubmit={handleCreate} loading={saving} />
      </Modal>

      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
        {editProject && <ProjectForm onSubmit={handleUpdate} loading={saving} initial={editProject} />}
      </Modal>
    </Layout>
  );
}
