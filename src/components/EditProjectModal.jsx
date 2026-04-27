import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import Avatar from './Avatar';
import { useProject } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { projects as projectsApi, participants as participantsApi } from '@/services/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useAppData } from '@/context/AppDataContext';

const PROJECT_COLORS = [
  '#6366f1', '#14b8a6', '#ec4899', '#f59e0b',
  '#ef4444', '#22c55e', '#a855f7', '#3b82f6',
  '#f97316', '#06b6d4', '#8b5cf6', '#10b981',
];

const PROJECT_STATUSES = [
  { key: 'planning', label: { hu: 'Tervezés', en: 'Planning' } },
  { key: 'active', label: { hu: 'Aktív', en: 'Active' } },
  { key: 'on_hold', label: { hu: 'Szüneteltetve', en: 'On Hold' } },
  { key: 'completed', label: { hu: 'Befejezett', en: 'Completed' } },
];

export default function EditProjectModal({ isOpen, onClose }) {
  const { activeProject, fetchProjects, deleteProject } = useProject();
  const { currentUser } = useAuth();
  const { t, language } = useTheme();
  const toast = useToast();
  const { friendsList, invalidate: invalidateCache } = useAppData();
  const sb = t.sidebar;

  const [form, setForm] = useState({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
    status: 'active',
    start_date: '',
    target_end_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [addingUser, setAddingUser] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && activeProject) {
      setForm({
        name: activeProject.name || '',
        description: activeProject.description || '',
        color: activeProject.color || PROJECT_COLORS[0],
        status: activeProject.status || 'active',
        start_date: activeProject.start_date || '',
        target_end_date: activeProject.target_end_date || '',
      });
      loadMembers();
    }
  }, [isOpen, activeProject?.id]);

  const loadMembers = async () => {
    if (!activeProject?.id) return;
    setMembersLoading(true);
    try {
      const res = await participantsApi.list('project', activeProject.id);
      setMembers((res.participants || res.data || []).map(p => ({ ...p, user: p.user || p })));
    } catch { setMembers([]); }
    finally { setMembersLoading(false); }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const memberIds = members.map(m => m.user?.id || m.user_id);
    const q = query.toLowerCase();
    const filtered = friendsList.filter(u => {
      if (memberIds.includes(u.id)) return false;
      const name = (u.display_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
    setSearchResults(filtered);
  };

  const handleAddMember = async (userId) => {
    if (!activeProject?.id) return;
    setAddingUser(true);
    try {
      await participantsApi.add('project', activeProject.id, userId);
      toast.success(language === 'hu' ? 'Tag hozzáadva' : 'Member added');
      setSearchQuery('');
      setSearchResults([]);
      await loadMembers();
      invalidateCache();
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    } finally { setAddingUser(false); }
  };

  const handleRemoveMember = async (userId) => {
    if (!activeProject?.id || userId === currentUser?.id) return;
    try {
      await participantsApi.remove('project', activeProject.id, userId);
      toast.success(language === 'hu' ? 'Tag eltávolítva' : 'Member removed');
      await loadMembers();
      invalidateCache();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim() || saving || !activeProject?.id) return;
    setSaving(true);
    try {
      await projectsApi.update(activeProject.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        color: form.color,
        status: form.status,
        start_date: form.start_date || undefined,
        target_end_date: form.target_end_date || undefined,
      });
      await fetchProjects();
      toast.success(language === 'hu' ? 'Projekt frissítve' : 'Project updated');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to update project');
    } finally { setSaving(false); }
  };

  const isProjectOwner = currentUser?.id === activeProject?.owner_id;

  const handleDelete = async () => {
    if (!activeProject?.id || deleting) return;
    const msg = language === 'hu'
      ? `Biztosan törölni szeretnéd a "${activeProject.name}" projektet? Ez a művelet nem vonható vissza.`
      : `Are you sure you want to delete "${activeProject.name}"? This action cannot be undone.`;
    if (!confirm(msg)) return;
    setDeleting(true);
    try {
      await deleteProject(activeProject.id);
      onClose();
    } catch {
      // error already handled in context
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !activeProject) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#1a1a24] border border-white/[0.08] rounded-2xl w-full max-w-[560px] mx-4 p-5 md:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[16px] font-semibold text-white">
            {language === 'hu' ? 'Projekt szerkesztése' : 'Edit Project'}
          </h3>
          <button
            onClick={onClose}
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
              className="kodo-input w-full"
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

          {/* Status */}
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

          {/* Dates */}
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

          {/* Members */}
          <div>
            <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
              {language === 'hu' ? 'Tagok' : 'Members'}
            </label>

            {/* Search to add */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder={language === 'hu' ? 'Ismerős keresése...' : 'Search friends...'}
                className="kodo-input w-full text-[13px]"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a24] border border-white/[0.08] rounded-xl py-1 z-50 shadow-2xl max-h-[160px] overflow-y-auto">
                  {searchResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleAddMember(u.id)}
                      disabled={addingUser}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left border-none cursor-pointer transition-colors bg-transparent hover:bg-white/[0.04] text-[13px]"
                    >
                      <Avatar user={u} size={24} />
                      <span className="text-kodo-text-secondary truncate flex-1">{u.display_name}</span>
                      <UserPlus size={14} className="text-indigo-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Member list */}
            {membersLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin text-indigo-400" />
              </div>
            ) : (
              <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto">
                {members.map(m => {
                  const user = m.user;
                  if (!user) return null;
                  const isOwner = user.id === activeProject.owner_id;
                  return (
                    <div key={user.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <Avatar user={user} size={24} />
                      <span className="text-[12px] text-kodo-text truncate flex-1">{user.display_name}</span>
                      {isOwner && (
                        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          {language === 'hu' ? 'Tulajdonos' : 'Owner'}
                        </span>
                      )}
                      <span className="text-[10px] text-kodo-text-dim">{m.role || 'member'}</span>
                      {!isOwner && user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleRemoveMember(user.id)}
                          className="p-1 rounded hover:bg-red-500/15 transition-colors cursor-pointer border-none bg-transparent text-kodo-text-dim hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button
          disabled={!form.name.trim() || saving}
          onClick={handleSave}
          className={clsx(
            'w-full mt-6 py-2.5 rounded-lg text-[13px] font-semibold transition-all border-none cursor-pointer flex items-center justify-center gap-2',
            form.name.trim() && !saving
              ? 'bg-kodo-accent text-white hover:bg-kodo-accent/90'
              : 'bg-white/[0.04] text-kodo-text-dim cursor-not-allowed'
          )}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {language === 'hu' ? 'Mentés' : 'Save'}
        </button>

        {isProjectOwner && (
          <button
            disabled={deleting}
            onClick={handleDelete}
            className="w-full mt-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all border border-red-500/20 cursor-pointer flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {language === 'hu' ? 'Projekt törlése' : 'Delete project'}
          </button>
        )}
      </div>
    </div>
  );
}
