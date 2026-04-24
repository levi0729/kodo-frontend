import { X, Settings, LogOut } from 'lucide-react';
import Avatar from './Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { users as usersApi } from '@/services/api';

const STATUS_OPTIONS = [
  { key: 'online', color: '#22c55e' },
  { key: 'away', color: '#f59e0b' },
  { key: 'busy', color: '#ef4444' },
  { key: 'dnd', color: '#ef4444' },
  { key: 'offline', color: '#52525b' },
];

export default function UserStatusPopup({ onClose, onNavigate }) {
  const { currentUser, logout, updateUser } = useAuth();
  const { t } = useTheme();

  return (
    <div className="absolute bottom-full left-0 mb-2 w-[240px] bg-[#1a1a24] border border-white/[0.08] rounded-xl shadow-2xl p-4 z-50 animate-fade-in-up">
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-3 right-3 text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/[0.06]">
        <Avatar user={currentUser} size={40} showStatus />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-white truncate">{currentUser?.display_name}</div>
          <div className="text-[11px] text-kodo-text-dim truncate">{currentUser?.email}</div>
        </div>
      </div>
      <div className="text-[11px] text-kodo-text-muted mb-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
        {currentUser?.job_title || t.sidebar.noPosition}
      </div>
      <div className="mb-3 pb-3 border-b border-white/[0.06]">
        <div className="text-[10px] font-semibold text-kodo-text-dim uppercase tracking-wider mb-2">{t.sidebar.status}</div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => {
                usersApi.updateStatus(opt.key).catch(() => {});
                updateUser({ presence_status: opt.key });
                onClose();
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium cursor-pointer border transition-all ${
                currentUser?.presence_status === opt.key
                  ? 'bg-white/[0.08] border-white/[0.15] text-white'
                  : 'bg-transparent border-transparent text-kodo-text-muted hover:bg-white/[0.04]'
              }`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
              {t.sidebar.statusLabels[opt.key]}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => { onClose(); onNavigate('profile'); }}
        className="w-full flex items-center justify-center gap-2 py-2 mb-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-[12px] font-medium cursor-pointer border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
      >
        <Settings size={14} />
        {t.sidebar.viewProfile || (t.language === 'hu' ? 'Profil megtekintése' : 'View Profile')}
      </button>
      <button
        onClick={() => { onClose(); logout(); }}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 text-[12px] font-medium cursor-pointer border border-red-500/20 hover:bg-red-500/20 transition-colors"
      >
        <LogOut size={14} />
        {t.sidebar.logout}
      </button>
    </div>
  );
}
