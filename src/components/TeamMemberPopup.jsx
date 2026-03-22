import { useRef, useEffect } from 'react';
import { X, Mail, MessageSquare } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useTheme } from '@/context/ThemeContext';

export default function TeamMemberPopup({ user, onClose, onNavigate }) {
  const popupRef = useRef(null);
  const { t } = useTheme();

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-1 z-50 w-[240px] sm:w-[260px] bg-[#1a1a24] border border-white/[0.1] rounded-xl shadow-2xl p-4 sm:p-5 animate-fade-in-up"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none p-0"
      >
        <X size={14} />
      </button>

      <div className="flex flex-col items-center text-center mb-4">
        <Avatar user={user} size={48} showStatus />
        <div className="text-[14px] font-semibold text-white mt-2.5">{user.display_name}</div>
        <div className="text-[12px] text-kodo-text-muted mt-0.5">{user.job_title}</div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] rounded-lg">
          <Mail size={13} className="text-kodo-text-dim flex-shrink-0" />
          <span className="text-[12px] text-kodo-text-secondary truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] rounded-lg">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            user.presence_status === 'online' ? 'bg-green-400' :
            user.presence_status === 'away' ? 'bg-yellow-400' :
            user.presence_status === 'dnd' ? 'bg-red-400' : 'bg-gray-500'
          }`} />
          <span className="text-[12px] text-kodo-text-secondary">
            {t.presence[user.presence_status] || t.presence.offline}
          </span>
        </div>
      </div>

      <button
        onClick={() => { onClose(); onNavigate('messages', { dmUserId: user.id }); }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-kodo-accent/15 text-indigo-400 text-[13px] font-medium cursor-pointer border-none hover:bg-kodo-accent/25 transition-colors"
      >
        <MessageSquare size={15} />
        {t.dashboard.sendMessage}
      </button>
    </div>
  );
}
