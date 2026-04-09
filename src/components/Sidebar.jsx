import { useState } from 'react';
import {
  LayoutDashboard, Users, FolderKanban, MessageSquare,
  CalendarDays, Settings, ChevronDown,
  Check, Plus, X, Eye, EyeOff, LogOut,
  Clock, UserPlus, Activity
} from 'lucide-react';
import clsx from 'clsx';
import Avatar from './Avatar';
import { useProject } from '@/context/ProjectContext';
import { useMessages } from '@/context/MessagesContext';
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

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  calendar: CalendarDays,
  task: FolderKanban,
  teams: Users,
  messages: MessageSquare,
  'time-tracking': Clock,
  friends: UserPlus,
  activity: Activity,
};

const NAV_KEYS = ['dashboard', 'calendar', 'task', 'teams', 'messages', 'time-tracking', 'friends', 'activity'];
const NAV_LABEL_KEYS = {
  dashboard: 'dashboard',
  calendar: 'calendar',
  task: 'tasks',
  teams: 'teams',
  messages: 'messages',
  'time-tracking': 'timeTracking',
  friends: 'friends',
  activity: 'activity',
};

export default function Sidebar({ activePage, onNavigate, mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectPassword, setNewProjectPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const { activeProject, setActiveProjectId, userProjects, addProject } = useProject();
  const { unreadCount } = useMessages();
  const { currentUser, logout } = useAuth();
  const { t } = useTheme();

  const navItems = NAV_KEYS.map(key => {
    const item = { key, label: t.nav[NAV_LABEL_KEYS[key]], icon: NAV_ICONS[key] };
    if (key === 'messages' && unreadCount > 0) item.badge = unreadCount;
    return item;
  });

  const isExpanded = !collapsed || mobileOpen;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
      )}
    <nav
      className={clsx(
        'flex flex-col bg-white/[0.02] border-r border-white/[0.06] transition-all duration-300 ease-out flex-shrink-0',
        'fixed inset-y-0 left-0 z-50 w-[260px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:z-20 lg:translate-x-0',
        collapsed ? 'lg:w-[68px]' : 'lg:w-[260px]'
      )}
    >
      <div className={clsx('flex items-center gap-2.5 py-5', !isExpanded ? 'px-0 justify-center' : 'px-5')}>
        <div
          className="w-[50px] h-[50px] rounded-[10px] flex items-center justify-center flex-shrink-0 cursor-pointer hidden lg:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          <img src="/kodo.png" alt="Kodo logo" className="w-[60px] h-[60px] object-contain" />
        </div>
        <div className="w-[50px] h-[50px] rounded-[10px] flex items-center justify-center flex-shrink-0 lg:hidden">
          <img src="/kodo.png" alt="Kodo logo" className="w-[60px] h-[60px] object-contain" />
        </div>
        {isExpanded && (
          <span className="text-[17px] font-bold text-white/95 font-display tracking-tight">KODO</span>
        )}
      </div>

      {isExpanded && (
        <div className="px-3 mb-3 relative">
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all cursor-pointer text-left"
          >
            <div className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ backgroundColor: activeProject?.color || '#6366f1' }} />
            <span className="text-[13px] font-medium text-kodo-text truncate flex-1">
              {activeProject?.name || t.sidebar.selectProject}
            </span>
            <ChevronDown size={14} className={clsx('text-kodo-text-dim transition-transform', projectDropdownOpen && 'rotate-180')} />
          </button>

          {projectDropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-[#1a1a24] border border-white/[0.08] rounded-xl py-1.5 z-50 shadow-2xl animate-fade-in-up">
              <div className="px-3 py-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-kodo-text-dim uppercase tracking-[0.1em]">{t.sidebar.projects}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); setProjectDropdownOpen(false); }}
                  className="w-5 h-5 rounded flex items-center justify-center bg-white/[0.06] hover:bg-kodo-accent/20 hover:text-indigo-400 text-kodo-text-dim transition-colors cursor-pointer border-none"
                  title={t.sidebar.newProjectTitle}
                >
                  <Plus size={12} />
                </button>
              </div>
              {userProjects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setActiveProjectId(p.id); setProjectDropdownOpen(false); }}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-left border-none cursor-pointer transition-colors text-[13px]',
                    p.id === activeProject?.id
                      ? 'bg-kodo-accent/10 text-indigo-400'
                      : 'bg-transparent text-kodo-text-secondary hover:bg-white/[0.04] hover:text-kodo-text'
                  )}
                >
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate flex-1 font-medium">{p.name}</span>
                  {p.id === activeProject?.id && <Check size={14} className="text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={clsx('flex-1 flex flex-col gap-0.5 px-2.5')}>
        {isExpanded && <div className="kodo-section-title">{t.nav.menu}</div>}
        {navItems.map(item => {
          const active = activePage === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={clsx(
                'flex items-center gap-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 border-none relative w-full',
                !isExpanded ? 'p-2.5 justify-center' : 'px-3 py-2.5',
                active
                  ? 'bg-kodo-accent/10 text-indigo-400'
                  : 'bg-transparent text-kodo-text-muted hover:bg-white/[0.04] hover:text-kodo-text-secondary'
              )}
            >
              {active && (
                <div className={clsx(
                  'absolute top-1.5 bottom-1.5 w-[3px] rounded-full bg-kodo-accent',
                  !isExpanded ? 'left-1' : 'left-0'
                )} />
              )}
              <Icon size={18} />
              {isExpanded && <span>{item.label}</span>}
              {isExpanded && item.badge && (
                <span className="ml-auto text-[10px] font-bold text-white bg-red-500 rounded-full px-1.5 min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
              {!isExpanded && item.badge && (
                <div className="absolute top-1.5 right-2 w-[7px] h-[7px] rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className={clsx('border-t border-white/[0.06] flex flex-col gap-0.5 p-2.5')}>
        <button
          onClick={() => onNavigate('settings')}
          className={clsx(
            'flex items-center gap-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-150 border-none w-full',
            !isExpanded ? 'p-2.5 justify-center' : 'px-3 py-2.5',
            activePage === 'settings'
              ? 'bg-kodo-accent/10 text-indigo-400'
              : 'bg-transparent text-kodo-text-muted hover:bg-white/[0.04] hover:text-kodo-text-secondary'
          )}
        >
          <Settings size={18} />
          {isExpanded && <span>{t.nav.settings}</span>}
        </button>

        <div className="relative">
          <div
            onClick={() => setShowUserPopup(!showUserPopup)}
            className={clsx(
              'flex items-center gap-2.5 rounded-lg p-2 cursor-pointer transition-colors hover:bg-white/[0.04]',
              showUserPopup && 'bg-white/[0.04]',
              !isExpanded ? 'justify-center' : ''
            )}
          >
            <Avatar user={currentUser} size={32} showStatus />
            {isExpanded && (
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-kodo-text truncate">{currentUser?.display_name}</div>
                <div className="text-[10px] text-kodo-text-dim">{t.sidebar.statusLabels[currentUser?.presence_status] || t.sidebar.online}</div>
              </div>
            )}
          </div>

          {showUserPopup && (
            <div className="absolute bottom-full left-0 mb-2 w-[240px] bg-[#1a1a24] border border-white/[0.08] rounded-xl shadow-2xl p-4 z-50 animate-fade-in-up">
              <button
                onClick={(e) => { e.stopPropagation(); setShowUserPopup(false); }}
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
                        if (currentUser) currentUser.presence_status = opt.key;
                        setShowUserPopup(false);
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
                onClick={() => { setShowUserPopup(false); logout(); }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 text-[12px] font-medium cursor-pointer border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <LogOut size={14} />
                {t.sidebar.logout}
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-fade-in-up" onClick={() => setShowCreateModal(false)}>
          <div className="bg-[#1a1a24] border border-white/[0.08] rounded-2xl w-full max-w-[380px] mx-4 p-5 md:p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-kodo-text">{t.sidebar.newProjectTitle}</h3>
              <button
                onClick={() => { setShowCreateModal(false); setNewProjectName(''); setNewProjectPassword(''); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer border-none"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                  {t.sidebar.projectName}
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder={t.sidebar.projectNamePlaceholder}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-kodo-text placeholder:text-kodo-text-dim/50 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                  {t.sidebar.password}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newProjectPassword}
                    onChange={e => setNewProjectPassword(e.target.value)}
                    placeholder={t.sidebar.projectPassword}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-kodo-text placeholder:text-kodo-text-dim/50 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              disabled={!newProjectName.trim() || !newProjectPassword.trim()}
              onClick={() => {
                addProject(newProjectName.trim(), '', newProjectPassword.trim());
                setShowCreateModal(false);
                setNewProjectName('');
                setNewProjectPassword('');
              }}
              className={clsx(
                'w-full mt-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all border-none cursor-pointer',
                newProjectName.trim() && newProjectPassword.trim()
                  ? 'bg-kodo-accent text-white hover:bg-kodo-accent/90'
                  : 'bg-white/[0.04] text-kodo-text-dim cursor-not-allowed'
              )}
            >
              {t.sidebar.createProject}
            </button>
          </div>
        </div>
      )}
    </nav>
    </>
  );
}
