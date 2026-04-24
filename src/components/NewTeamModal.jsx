import { useState, useRef, useEffect } from 'react';
import { X, Lock, Globe } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function NewTeamModal({ isOpen, onClose, onTeamCreate, availableUsers, projects, activeProjectId }) {
  const { currentUser } = useAuth();
  const { t, language } = useTheme();
  const m = t.newTeamModal;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public',
    password: '',
    color: '#6366f1',
    selectedMembers: [],
    project_id: activeProjectId || null,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);

  const colors = [
    '#6366f1', '#ec4899', '#14b8a6', '#f59e0b',
    '#ef4444', '#22c55e', '#8b5cf6', '#f97316'
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = m.errors.nameRequired;
    }

    if (formData.visibility === 'private' && !formData.password.trim()) {
      newErrors.password = m.errors.passwordRequired;
    }

    if (formData.selectedMembers.length === 0) {
      newErrors.members = m.errors.membersRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || !validateForm()) return;
    setSubmitting(true);
    try {
      await onTeamCreate({
        ...formData,
        created_by: currentUser?.id || 1
      });

      setFormData({
        name: '',
        description: '',
        visibility: 'public',
        password: '',
        color: '#6366f1',
        selectedMembers: [],
        project_id: activeProjectId || null,
      });
      setErrors({});
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMember = (userId) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(userId)
        ? prev.selectedMembers.filter(id => id !== userId)
        : [...prev.selectedMembers, userId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={m.title}>
      <div
        ref={modalRef}
        className="bg-[#1a1a24] border border-white/[0.1] rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-y-auto animate-fade-in-up mx-2 sm:mx-0"
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/[0.06]">
          <h2 className="text-[16px] md:text-[18px] font-semibold text-white">{m.title}</h2>
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
              {m.teamName} <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              aria-required="true"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'team-name-error' : undefined}
              className={`w-full px-3 py-2 bg-white/[0.04] border rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 ${
                errors.name ? 'border-red-500/50' : 'border-white/[0.08]'
              }`}
              placeholder={m.teamNamePlaceholder}
            />
            {errors.name && (
              <p id="team-name-error" className="text-[11px] text-red-400 mt-1">{errors.name}</p>
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

          {projects && projects.length > 0 && (
            <div className="mb-5">
              <label className="block text-[13px] font-medium text-kodo-text mb-2">
                {language === 'hu' ? 'Projekt' : 'Project'} <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <select
                value={formData.project_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, project_id: Number(e.target.value) || null }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#1a1a24] text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-[13px] font-medium text-kodo-text mb-2">
              {m.visibility}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                  formData.visibility === 'public'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    : 'bg-white/[0.04] border-white/[0.08] text-kodo-text hover:bg-white/[0.06]'
                }`}
              >
                <Globe size={16} />
                <div className="text-left">
                  <div className="text-[12px] font-medium">{m.public}</div>
                  <div className="text-[10px] text-kodo-text-dim">{m.publicDesc}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                  formData.visibility === 'private'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    : 'bg-white/[0.04] border-white/[0.08] text-kodo-text hover:bg-white/[0.06]'
                }`}
              >
                <Lock size={16} />
                <div className="text-left">
                  <div className="text-[12px] font-medium">{m.private}</div>
                  <div className="text-[10px] text-kodo-text-dim">{m.privateDesc}</div>
                </div>
              </button>
            </div>
          </div>

          {formData.visibility === 'private' && (
            <div className="mb-5">
              <label className="block text-[13px] font-medium text-kodo-text mb-2">
                {m.password} <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                aria-required="true"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'team-password-error' : undefined}
                className={`w-full px-3 py-2 bg-white/[0.04] border rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 ${
                  errors.password ? 'border-red-500/50' : 'border-white/[0.08]'
                }`}
                placeholder={m.passwordPlaceholder}
              />
              {errors.password && (
                <p id="team-password-error" className="text-[11px] text-red-400 mt-1">{errors.password}</p>
              )}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-[13px] font-medium text-kodo-text mb-2">
              {m.color}
            </label>
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    formData.color === color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[13px] font-medium text-kodo-text mb-2">
              {m.members} <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <div className="max-h-40 overflow-y-auto border border-white/[0.08] rounded-lg p-2">
              {availableUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => toggleMember(user.id)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    formData.selectedMembers.includes(user.id)
                      ? 'bg-indigo-500/10 border border-indigo-500/20'
                      : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedMembers.includes(user.id)}
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
            {errors.members && (
              <p className="text-[11px] text-red-400 mt-1" role="alert">{errors.members}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] text-kodo-text rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {m.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer text-[13px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {m.createTeam}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
