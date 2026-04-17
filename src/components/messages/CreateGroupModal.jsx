import { useState } from 'react';
import { X, Users, Check } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useTheme } from '@/context/ThemeContext';

export default function CreateGroupModal({ allUsers, currentUser, onClose, onCreate }) {
  const { t } = useTheme();
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const others = allUsers.filter(u => u.id !== currentUser?.id);
  const filtered = search
    ? others.filter(u =>
        u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())
      )
    : others;

  const toggle = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedIds.size === 0) return;
    setLoading(true);
    try {
      await onCreate(name.trim(), [...selectedIds]);
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#13131d] border border-white/[0.08] rounded-2xl w-full max-w-[400px] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-400" />
            <h3 className="text-[15px] font-semibold text-white m-0">{t.messagesPage.createGroup}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-kodo-text-dim hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer bg-transparent border-none">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-medium text-kodo-text-muted mb-1.5 block">{t.messagesPage.groupName}</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.messagesPage.groupNamePlaceholder}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-kodo-text placeholder:text-kodo-text-dim outline-none focus:border-kodo-accent/40 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-kodo-text-muted mb-1.5 block">
              {t.messagesPage.selectMembers} ({selectedIds.size})
            </label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.messagesPage.search}
              className="w-full px-3 py-2 mb-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[12px] text-kodo-text placeholder:text-kodo-text-dim outline-none focus:border-kodo-accent/40 transition-colors"
            />
            <div className="max-h-[200px] overflow-y-auto flex flex-col gap-0.5">
              {filtered.map(u => {
                const selected = selectedIds.has(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggle(u.id)}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left cursor-pointer transition-all border-none ${
                      selected ? 'bg-kodo-accent/10' : 'bg-transparent hover:bg-white/[0.04]'
                    }`}
                  >
                    <Avatar user={u} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-kodo-text truncate">{u.display_name}</div>
                      {u.job_title && <div className="text-[11px] text-kodo-text-dim truncate">{u.job_title}</div>}
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-kodo-text-muted bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer border-none"
          >
            {t.messagesPage.cancel}
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selectedIds.size === 0 || loading}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-kodo-accent hover:bg-kodo-accent/80 transition-colors cursor-pointer border-none disabled:opacity-40 disabled:cursor-default"
          >
            {t.messagesPage.create}
          </button>
        </div>
      </div>
    </div>
  );
}
