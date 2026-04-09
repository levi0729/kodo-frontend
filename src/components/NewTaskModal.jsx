import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { participants as participantsApi } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';

const LABEL_SUGGESTIONS = ['frontend', 'backend', 'design', 'docs', 'urgent', 'ux', 'security', 'infra', 'fullstack'];

export default function NewTaskModal({ isOpen, onClose, onTaskCreate, projectId }) {
  const { t } = useTheme();
  const m = t.newTaskModal;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    estimated_hours: '',
    labels: [],
    assignees: [],
  });

  const [labelInput, setLabelInput] = useState('');
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    if (!projectId) return;
    participantsApi.list('project', projectId)
      .then(data => setTeamMembers((data.participants || data.data || []).map(p => p.user || p)))
      .catch(() => {});
  }, [projectId]);

  const PRIORITY_OPTIONS = [
    { value: 'low', label: t.tasksPage.priority.low, color: '#94a3b8' },
    { value: 'medium', label: t.tasksPage.priority.medium, color: '#fbbf24' },
    { value: 'high', label: t.tasksPage.priority.high, color: '#ef4444' },
  ];

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e) {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      estimated_hours: '',
      labels: [],
      assignees: [],
    });
    setLabelInput('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = m.errors.titleRequired;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onTaskCreate({
        ...formData,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : 0,
      });
      resetForm();
      onClose();
    }
  };

  const toggleAssignee = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.includes(userId)
        ? prev.assignees.filter(id => id !== userId)
        : [...prev.assignees, userId],
    }));
  };

  const addLabel = (label) => {
    const trimmed = label.trim().toLowerCase();
    if (trimmed && !formData.labels.includes(trimmed)) {
      setFormData(prev => ({ ...prev, labels: [...prev.labels, trimmed] }));
    }
    setLabelInput('');
  };

  const removeLabel = (label) => {
    setFormData(prev => ({ ...prev, labels: prev.labels.filter(l => l !== label) }));
  };

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLabel(labelInput);
    }
  };

  if (!isOpen) return null;

  const availableSuggestions = LABEL_SUGGESTIONS.filter(l => !formData.labels.includes(l));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        ref={modalRef}
        className="bg-[#1a1a24] border border-white/[0.1] rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto animate-fade-in-up mx-2 sm:mx-0"
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/[0.06]">
          <h2 className="text-[18px] font-semibold text-white">{m.title}</h2>
          <button
            onClick={onClose}
            className="text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          <div className="mb-5">
            <label className="block text-[13px] font-medium text-kodo-text mb-2">
              {m.taskName}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 bg-white/[0.04] border rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 ${
                errors.title ? 'border-red-500/50' : 'border-white/[0.08]'
              }`}
              placeholder={m.taskNamePlaceholder}
            />
            {errors.title && (
              <p className="text-[11px] text-red-400 mt-1">{errors.title}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-[13px] font-medium text-kodo-text mb-2">
              {m.description}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 resize-none"
              rows={3}
              placeholder={m.descriptionPlaceholder}
            />
          </div>

          <div className="mb-5">
            <label className="block text-[13px] font-medium text-kodo-text mb-2">
              {m.priority}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, priority: opt.value }))}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer text-[12px] font-medium ${
                    formData.priority === opt.value
                      ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                      : 'border-white/[0.08] bg-white/[0.04] text-kodo-text-secondary hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[13px] font-medium text-kodo-text mb-2">
                {m.dueDate}
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-kodo-text mb-2">
                {m.estimatedHours}
              </label>
              <input
                type="number"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
                placeholder="0"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[13px] font-medium text-kodo-text mb-2">
              {m.labels}
            </label>
            {formData.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formData.labels.map(l => (
                  <span
                    key={l}
                    className="text-[11px] px-2 py-1 rounded-md bg-indigo-500/15 text-indigo-300 font-medium flex items-center gap-1"
                  >
                    {l}
                    <button
                      type="button"
                      onClick={() => removeLabel(l)}
                      className="text-indigo-400 hover:text-white ml-0.5 bg-transparent border-none cursor-pointer p-0 leading-none text-[13px]"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={handleLabelKeyDown}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
              placeholder={m.labelsPlaceholder}
            />
            {availableSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {availableSuggestions.map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => addLabel(l)}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-kodo-text-dim hover:bg-white/[0.08] hover:text-kodo-text-secondary transition-colors cursor-pointer border-none font-medium"
                  >
                    + {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-[13px] font-medium text-kodo-text mb-2">
              {m.assignees}
            </label>
            <div className="max-h-40 overflow-y-auto border border-white/[0.08] rounded-lg p-2">
              {teamMembers.map(user => (
                <div
                  key={user.id}
                  onClick={() => toggleAssignee(user.id)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    formData.assignees.includes(user.id)
                      ? 'bg-indigo-500/10 border border-indigo-500/20'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.assignees.includes(user.id)}
                    onChange={() => {}}
                    className="w-4 h-4 text-indigo-500 bg-white/[0.04] border-white/[0.2] rounded focus:ring-indigo-500/20"
                  />
                  <Avatar user={user} size={24} showStatus />
                  <div className="flex-1">
                    <div className="text-[12px] font-medium text-kodo-text">{user.display_name}</div>
                    <div className="text-[10px] text-kodo-text-dim">{user.job_title}</div>
                  </div>
                </div>
              ))}
            </div>
            {errors.assignees && (
              <p className="text-[11px] text-red-400 mt-1">{errors.assignees}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] text-kodo-text rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer text-[13px] font-medium"
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer text-[13px] font-medium flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              {m.createTask}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
