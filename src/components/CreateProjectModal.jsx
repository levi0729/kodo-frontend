import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { useProject } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { projects as projectsApi } from '@/services/api';
import { useToast } from '@/components/Toast';

const PROJECT_COLORS = [
  '#6366f1', '#14b8a6', '#ec4899', '#f59e0b',
  '#ef4444', '#22c55e', '#a855f7', '#3b82f6',
  '#f97316', '#06b6d4', '#8b5cf6', '#10b981',
];

const PROJECT_TYPES = [
  { key: 'kanban', label: 'Kanban' },
  { key: 'list', label: 'List' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'calendar', label: 'Calendar' },
];

const PROJECT_STATUSES = [
  { key: 'planning', label: { hu: 'Tervezés', en: 'Planning' } },
  { key: 'active', label: { hu: 'Aktív', en: 'Active' } },
  { key: 'on_hold', label: { hu: 'Szüneteltetve', en: 'On Hold' } },
];

export default function CreateProjectModal({ isOpen, onClose }) {
  const { fetchProjects, setActiveProjectId } = useProject();
  const { t, language } = useTheme();
  const toast = useToast();
  const sb = t.sidebar;

  const [form, setForm] = useState({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
    project_type: 'kanban',
    status: 'active',
    start_date: '',
    target_end_date: '',
  });
  const [creating, setCreating] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm({
      name: '',
      description: '',
      color: PROJECT_COLORS[0],
      project_type: 'kanban',
      status: 'active',
      start_date: '',
      target_end_date: '',
    });
  };

  const handleClose = () => {
    if (creating) return;
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!form.name.trim() || creating) return;
    setCreating(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        color: form.color,
        project_type: form.project_type,
        status: form.status,
        start_date: form.start_date || undefined,
        target_end_date: form.target_end_date || undefined,
      };
      const data = await projectsApi.create(payload);
      const newProject = data.project;
      await fetchProjects();
      if (newProject?.id) setActiveProjectId(newProject.id);
      toast.success(t.taskToasts?.projectCreateSuccess || 'Project created');
      reset();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#1a1a24] border border-white/[0.08] rounded-2xl w-full max-w-[520px] mx-4 p-5 md:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-semibold text-white">{sb.newProjectTitle}</h3>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer border-none"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
              {sb.projectName} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder={sb.projectNamePlaceholder}
              className="kodo-input w-full"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
              {sb.projectDescription}
            </label>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder={sb.projectDescriptionPlaceholder}
              rows={3}
              className="kodo-input w-full resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
              {sb.projectColor}
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => update('color', c)}
                  className={clsx(
                    'w-7 h-7 rounded-lg cursor-pointer border-2 transition-all',
                    form.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Type + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                {sb.projectType}
              </label>
              <div className="flex flex-wrap gap-1">
                {PROJECT_TYPES.map(pt => (
                  <button
                    key={pt.key}
                    onClick={() => update('project_type', pt.key)}
                    className={clsx(
                      'px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all border',
                      form.project_type === pt.key
                        ? 'bg-kodo-accent/10 border-kodo-accent/30 text-indigo-400'
                        : 'bg-transparent border-white/[0.08] text-kodo-text-dim hover:text-kodo-text-secondary'
                    )}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                {sb.projectStatus}
              </label>
              <div className="flex flex-wrap gap-1">
                {PROJECT_STATUSES.map(ps => (
                  <button
                    key={ps.key}
                    onClick={() => update('status', ps.key)}
                    className={clsx(
                      'px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all border',
                      form.status === ps.key
                        ? 'bg-kodo-accent/10 border-kodo-accent/30 text-indigo-400'
                        : 'bg-transparent border-white/[0.08] text-kodo-text-dim hover:text-kodo-text-secondary'
                    )}
                  >
                    {ps.label[language] || ps.label.en}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                {sb.startDate}
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => update('start_date', e.target.value)}
                className="kodo-input w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                {sb.targetEndDate}
              </label>
              <input
                type="date"
                value={form.target_end_date}
                onChange={e => update('target_end_date', e.target.value)}
                className="kodo-input w-full"
              />
            </div>
          </div>
        </div>

        <button
          disabled={!form.name.trim() || creating}
          onClick={handleCreate}
          className={clsx(
            'w-full mt-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all border-none cursor-pointer flex items-center justify-center gap-2',
            form.name.trim() && !creating
              ? 'bg-kodo-accent text-white hover:bg-kodo-accent/90'
              : 'bg-white/[0.04] text-kodo-text-dim cursor-not-allowed'
          )}
        >
          {creating && <Loader2 size={14} className="animate-spin" />}
          {sb.createProject}
        </button>
      </div>
    </div>
  );
}
