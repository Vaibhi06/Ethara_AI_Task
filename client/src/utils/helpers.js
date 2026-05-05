import { format, isAfter, isBefore, parseISO } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  try { return format(parseISO(date), 'MMM d, yyyy'); } catch { return '—'; }
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  return isBefore(parseISO(dueDate), new Date());
};

export const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export const getPriorityColor = (priority) => ({
  low: '#9ca3af', medium: '#f59e0b', high: '#ef4444',
}[priority] || '#9ca3af');

export const getStatusColor = (status) => ({
  todo: '#6b7280', in_progress: '#3b82f6', done: '#10b981',
}[status] || '#6b7280');

export const getProgressPercent = (done, total) =>
  total === 0 ? 0 : Math.round((done / total) * 100);

export const PROJECT_COLORS = [
  '#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444',
  '#ec4899','#06b6d4','#8b5cf6','#f97316','#84cc16',
];
