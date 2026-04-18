import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Pencil, Trash2, Globe, Users, FolderKanban, HardDrive, X, Loader2 } from 'lucide-react';
import { organizations as orgsApi } from '@/services/api';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/context/ThemeContext';

const PLAN_COLORS = {
  free: 'bg-gray-500/20 text-gray-400',
  standard: 'bg-blue-500/20 text-blue-400',
  business: 'bg-purple-500/20 text-purple-400',
  pro: 'bg-amber-500/20 text-amber-400',
  enterprise: 'bg-emerald-500/20 text-emerald-400',
};

function OrgFormModal({ org, onClose, onSave, t }) {
  const tp = t.organizationsPage;
  const [form, setForm] = useState({
    name: org?.name || '',
    description: org?.description || '',
    domain: org?.domain || '',
    plan_type: org?.plan_type || 'free',
    max_members: org?.max_members || 50,
    max_storage_gb: org?.max_storage_gb || 5,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#13131d] border border-white/[0.08] rounded-2xl w-full max-w-[460px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-[15px] font-semibold text-white m-0">
            {org ? tp.editOrg : tp.createOrg}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-kodo-text-dim hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer bg-transparent border-none">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3.5">
          <div>
            <label className="text-[12px] font-medium text-kodo-text-muted mb-1.5 block">{tp.name}</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder={tp.namePlaceholder}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-kodo-text placeholder:text-kodo-text-dim outline-none focus:border-kodo-accent/40 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-kodo-text-muted mb-1.5 block">{tp.description}</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder={tp.descriptionPlaceholder}
              rows={2}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-kodo-text placeholder:text-kodo-text-dim outline-none focus:border-kodo-accent/40 transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-kodo-text-muted mb-1.5 block">{tp.domain}</label>
              <input
                value={form.domain}
                onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}
                placeholder={tp.domainPlaceholder}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-kodo-text placeholder:text-kodo-text-dim outline-none focus:border-kodo-accent/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-kodo-text-muted mb-1.5 block">{tp.plan}</label>
              <select
                value={form.plan_type}
                onChange={e => setForm(p => ({ ...p, plan_type: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-kodo-text outline-none focus:border-kodo-accent/40 transition-colors appearance-none cursor-pointer"
              >
                {['free', 'standard', 'business', 'pro', 'enterprise'].map(p => (
                  <option key={p} value={p} className="bg-[#1a1a24]">{tp.plans[p]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-kodo-text-muted mb-1.5 block">{tp.maxMembers}</label>
              <input
                type="number"
                value={form.max_members}
                onChange={e => setForm(p => ({ ...p, max_members: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-kodo-text outline-none focus:border-kodo-accent/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-kodo-text-muted mb-1.5 block">{tp.storage} (GB)</label>
              <input
                type="number"
                value={form.max_storage_gb}
                onChange={e => setForm(p => ({ ...p, max_storage_gb: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-kodo-text outline-none focus:border-kodo-accent/40 transition-colors"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium text-kodo-text-muted bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer border-none">
            {tp.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || saving}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-kodo-accent hover:bg-kodo-accent/80 transition-colors cursor-pointer border-none disabled:opacity-40 disabled:cursor-default"
          >
            {org ? tp.save : tp.create}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationsPage() {
  const toast = useToast();
  const { t } = useTheme();
  const tp = t.organizationsPage;

  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);

  const fetchOrgs = useCallback(async () => {
    try {
      const data = await orgsApi.list();
      setOrgs(data.organizations || data.data || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const handleCreate = async (form) => {
    const data = await orgsApi.create(form);
    setOrgs(prev => [...prev, data.organization || data.data]);
    toast.success(tp.created);
  };

  const handleUpdate = async (form) => {
    const data = await orgsApi.update(editingOrg.id, form);
    setOrgs(prev => prev.map(o => o.id === editingOrg.id ? (data.organization || data.data || { ...o, ...form }) : o));
    toast.success(tp.updated);
  };

  const handleDelete = async (id) => {
    if (!confirm(tp.confirmDelete)) return;
    try {
      await orgsApi.destroy(id);
      setOrgs(prev => prev.filter(o => o.id !== id));
      toast.success(tp.deleted);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[20px] md:text-[28px] font-bold text-white/95 font-display m-0">{tp.title}</h1>
          <p className="text-kodo-text-muted mt-1 text-[13px] m-0">{tp.subtitle}</p>
        </div>
        <button
          onClick={() => { setEditingOrg(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium text-white bg-kodo-accent hover:bg-kodo-accent/80 transition-colors cursor-pointer border-none"
        >
          <Plus size={16} />
          {tp.newOrg}
        </button>
      </div>

      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
            <Building2 size={28} className="text-kodo-text-dim" />
          </div>
          <div className="text-[15px] font-semibold text-white mb-1">{tp.noOrgs}</div>
          <div className="text-[13px] text-kodo-text-muted">{tp.noOrgsDesc}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs.map(org => (
            <div
              key={org.id}
              className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-kodo-accent/15 flex items-center justify-center flex-shrink-0">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <Building2 size={20} className="text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-white m-0 truncate">{org.name}</h3>
                    {org.slug && (
                      <div className="text-[11px] text-kodo-text-dim truncate">/{org.slug}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditingOrg(org); setShowModal(true); }}
                    className="p-1.5 rounded-lg text-kodo-text-dim hover:text-indigo-400 hover:bg-white/[0.06] transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(org.id)}
                    className="p-1.5 rounded-lg text-kodo-text-dim hover:text-red-400 hover:bg-white/[0.06] transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {org.description && (
                <p className="text-[13px] text-kodo-text-muted m-0 mb-3 line-clamp-2">{org.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PLAN_COLORS[org.plan_type] || PLAN_COLORS.free}`}>
                  {tp.plans[org.plan_type] || org.plan_type}
                </span>
                {org.domain && (
                  <span className="flex items-center gap-1 text-[11px] text-kodo-text-dim">
                    <Globe size={11} />
                    {org.domain}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] text-kodo-text-dim">
                  <Users size={11} />
                  {org.max_members || 0} {tp.members.toLowerCase()}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-kodo-text-dim">
                  <HardDrive size={11} />
                  {org.max_storage_gb || 0} GB
                </span>
              </div>
              {(org.teams_count > 0 || org.projects_count > 0 || org.teams?.length > 0 || org.projects?.length > 0) && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06]">
                  <span className="flex items-center gap-1.5 text-[12px] text-kodo-text-muted">
                    <Users size={12} />
                    {org.teams_count || org.teams?.length || 0} {tp.teams.toLowerCase()}
                  </span>
                  <span className="flex items-center gap-1.5 text-[12px] text-kodo-text-muted">
                    <FolderKanban size={12} />
                    {org.projects_count || org.projects?.length || 0} {tp.projects.toLowerCase()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <OrgFormModal
          org={editingOrg}
          onClose={() => { setShowModal(false); setEditingOrg(null); }}
          onSave={editingOrg ? handleUpdate : handleCreate}
          t={t}
        />
      )}
    </div>
  );
}
