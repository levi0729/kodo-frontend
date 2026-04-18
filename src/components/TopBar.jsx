import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, AtSign, X, Menu, Loader2, Search } from 'lucide-react';
import Avatar from './Avatar';
import { useProject } from '@/context/ProjectContext';
import { useMessages } from '@/context/MessagesContext';
import { notifications as notificationsApi, users as usersApi } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';

export default function TopBar({ activePage, onMenuToggle, onSearchOpen }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { activeProject } = useProject();
  const { notifications: mentionNotifs, markAllNotificationsRead } = useMessages();
  const { t } = useTheme();
  const dropdownRef = useRef(null);
  const prevCountRef = useRef(mentionNotifs.length);

  const [apiNotifications, setApiNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [usersCache, setUsersCache] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function fetchNotifs() {
      setNotifLoading(true);
      try {
        const data = await notificationsApi.list();
        if (!cancelled) setApiNotifications(data.notifications || data.data || []);
      } catch {}
      if (!cancelled) setNotifLoading(false);
    }
    fetchNotifs();
    return () => { cancelled = true; };
  }, []);

  const getUserById = (id) => usersCache[id] || null;

  useEffect(() => {
    const ids = [...new Set([
      ...mentionNotifs.map(n => n.actor_id),
      ...apiNotifications.map(n => n.actor_id),
    ].filter(Boolean))];
    const missing = ids.filter(id => !usersCache[id]);
    if (missing.length === 0) return;
    Promise.all(missing.map(id => usersApi.show(id).catch(() => null)))
      .then(results => {
        const cache = { ...usersCache };
        results.forEach(r => {
          const user = r?.user || r?.data;
          if (user) cache[user.id] = user;
        });
        setUsersCache(cache);
      });
  }, [apiNotifications, mentionNotifs]);

  const allNotifications = [
    ...mentionNotifs.map(n => ({ ...n, source: 'mention' })),
    ...apiNotifications.map(n => ({ ...n, source: 'system' })),
  ];
  const unread = allNotifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (mentionNotifs.length > prevCountRef.current) {
      const latest = mentionNotifs[0];
      setToast(latest);
      const timer = setTimeout(() => setToast(null), 4000);
      prevCountRef.current = mentionNotifs.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = mentionNotifs.length;
  }, [mentionNotifs]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageLabel = t.topbar.pageLabels[activePage] || activePage;

  return (
    <header className="h-[52px] flex items-center justify-between px-3 md:px-8 border-b border-white/[0.06] flex-shrink-0 gap-2">
      <div className="flex items-center gap-2 text-[13px] min-w-0 flex-1">
        <button
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          className="p-2.5 rounded-lg text-kodo-text-muted hover:text-kodo-text-secondary hover:bg-white/[0.04] transition-colors cursor-pointer bg-transparent border-none lg:hidden flex-shrink-0"
        >
          <Menu size={20} />
        </button>
        <span className="text-kodo-text-dim font-medium hidden sm:inline truncate">{activeProject?.name}</span>
        <span className="text-kodo-text-dim/40 hidden sm:inline flex-shrink-0">/</span>
        <span className="text-kodo-text-secondary font-medium truncate">{pageLabel}</span>
      </div>

      <div className="flex items-center gap-1 relative" ref={dropdownRef}>
        <button
          onClick={onSearchOpen}
          aria-label={t.common.search}
          className="p-2 rounded-lg bg-transparent border-none cursor-pointer text-kodo-text-muted hover:text-kodo-text-secondary hover:bg-white/[0.04] transition-colors hidden sm:flex items-center gap-2"
        >
          <Search size={18} />
          <kbd className="text-[10px] text-kodo-text-dim bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08] font-mono">
            ⌘K
          </kbd>
        </button>
        <button
          onClick={onSearchOpen}
          aria-label={t.common.search}
          className="p-2.5 rounded-lg bg-transparent border-none cursor-pointer text-kodo-text-muted hover:text-kodo-text-secondary hover:bg-white/[0.04] transition-colors sm:hidden"
        >
          <Search size={18} />
        </button>
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          aria-label={t.topbar.notifications}
          className="p-2.5 rounded-lg bg-transparent border-none cursor-pointer text-kodo-text-muted hover:text-kodo-text-secondary hover:bg-white/[0.04] transition-colors relative"
        >
          <Bell size={18} />
          {unread > 0 && (
            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-kodo-bg" />
          )}
        </button>

        {notifOpen && (
          <div className="fixed inset-x-3 top-[60px] sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[360px] bg-[#18181f] border border-white/[0.08] rounded-2xl py-1 z-50 shadow-2xl animate-fade-in-up overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-[14px] font-semibold text-white">{t.topbar.notifications}</span>
              <button
                onClick={() => {
                  markAllNotificationsRead();
                  notificationsApi.markAllRead().catch(() => {});
                  setApiNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                }}
                className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-medium cursor-pointer bg-transparent border-none hover:text-indigo-300 transition-colors"
              >
                <CheckCheck size={13} />
                {t.topbar.markAllRead}
              </button>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {allNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                    <Bell size={18} className="text-kodo-text-dim" />
                  </div>
                  <div className="text-[13px] font-medium text-kodo-text-secondary">{t.topbar.noNotifications || 'No notifications'}</div>
                  <div className="text-[11px] text-kodo-text-dim mt-1">{t.topbar.noNotificationsDesc || "You're all caught up!"}</div>
                </div>
              ) : (
                allNotifications.map(n => {
                  const actor = getUserById(n.actor_id);
                  return (
                    <div
                      key={`${n.source}-${n.id}`}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.04] ${
                        !n.is_read ? 'bg-indigo-500/[0.04]' : ''
                      }`}
                    >
                      {actor && <Avatar user={actor} size={32} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {n.source === 'mention' && <AtSign size={12} className="text-indigo-400 flex-shrink-0" />}
                          <div className="text-[12px] font-medium text-kodo-text">{n.title}</div>
                        </div>
                        <div className="text-[11px] text-kodo-text-muted mt-0.5 line-clamp-2">{n.body}</div>
                      </div>
                      {!n.is_read && (
                        <div className="w-[6px] h-[6px] rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-4 left-3 right-3 sm:left-auto sm:right-4 z-[100] animate-fade-in-up">
          <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 bg-[#1a1a24] border border-white/[0.1] rounded-xl shadow-2xl sm:min-w-[280px]">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <AtSign size={16} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-white">{toast.title}</div>
              <div className="text-[11px] text-kodo-text-muted mt-0.5 truncate">{toast.body}</div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-kodo-text-dim hover:text-kodo-text-secondary bg-transparent border-none cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
