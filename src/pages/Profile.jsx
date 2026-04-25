import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Mail, Building2, CheckCircle2, Clock, FolderKanban,
  TrendingUp, Edit3, Loader2
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import ProgressBar from '@/components/ProgressBar';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { useTasks } from '@/context/TasksContext';
import { users as usersApi, timeEntries as timeEntriesApi } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/Toast';

function isAssignedTo(task, userId) {
  return (task.assignees || []).some(a => (a.id ?? a) === userId);
}

export default function ProfilePage({ onNavigate }) {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { userProjects } = useProject();
  const { tasks } = useTasks();
  const { t, language } = useTheme();
  const toast = useToast();
  const locale = language === 'en' ? 'en-US' : 'hu-HU';

  const isOwnProfile = !paramUserId || Number(paramUserId) === currentUser?.id;
  const [profileUser, setProfileUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [totalHours, setTotalHours] = useState(0);

  // Load other user's profile if viewing someone else
  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(null);
      return;
    }
    setProfileLoading(true);
    usersApi.show(paramUserId)
      .then(data => setProfileUser(data.user || data.data || data))
      .catch(() => setProfileUser(null))
      .finally(() => setProfileLoading(false));
  }, [paramUserId, isOwnProfile]);

  const displayUser = isOwnProfile ? currentUser : profileUser;
  const displayUserId = displayUser?.id;

  useEffect(() => {
    if (!displayUserId) return;
    timeEntriesApi.list({ per_page: 999 })
      .then(data => {
        const entries = data.time_entries || data.data || [];
        const hours = entries.reduce((s, e) => s + (e.hours || 0), 0);
        setTotalHours(Math.round(hours * 10) / 10);
      })
      .catch(() => {});
  }, [displayUserId]);

  const myTasks = useMemo(() => {
    if (!displayUserId) return [];
    return tasks.filter(t => isAssignedTo(t, displayUserId) || t.created_by === displayUserId);
  }, [tasks, displayUserId]);

  const completedTasks = myTasks.filter(t => t.status === 'done').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress').length;
  const completionRate = myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0;

  const joinDate = displayUser?.created_at
    ? new Date(displayUser.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const stats = [
    {
      label: language === 'hu' ? 'Elvégzett feladatok' : 'Tasks completed',
      value: completedTasks,
      icon: CheckCircle2,
      color: '#4ade80',
    },
    {
      label: language === 'hu' ? 'Folyamatban' : 'In progress',
      value: inProgressTasks,
      icon: TrendingUp,
      color: '#818cf8',
    },
    {
      label: language === 'hu' ? 'Összes óra' : 'Hours tracked',
      value: `${totalHours}h`,
      icon: Clock,
      color: '#fbbf24',
    },
    {
      label: language === 'hu' ? 'Projektek' : 'Projects',
      value: userProjects.length,
      icon: FolderKanban,
      color: '#ec4899',
    },
  ];

  if (!displayUser && !profileLoading) {
    if (!currentUser) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      );
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <User size={32} className="text-kodo-text-dim mb-3" />
        <div className="text-[14px] text-kodo-text-muted">
          {language === 'hu' ? 'Felhasználó nem található' : 'User not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6 md:pb-10 max-w-[800px] mx-auto">
      <div className="mb-5 md:mb-8">
        <h1 className="text-[20px] md:text-[28px] font-bold text-white/95 font-display m-0">
          {language === 'hu' ? 'Profil' : 'Profile'}
        </h1>
        <p className="text-kodo-text-muted mt-1 text-[13px]">
          {isOwnProfile
            ? (language === 'hu' ? 'Személyes adatok és statisztikák' : 'Personal info and statistics')
            : displayUser.display_name
          }
        </p>
      </div>

      {/* Profile Card */}
      <div className="kodo-card p-5 md:p-8 mb-4 md:mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group">
            <Avatar user={displayUser} size={80} showStatus />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-[20px] font-bold text-white">{displayUser.display_name}</h2>
            <p className="text-[13px] text-kodo-text-muted mt-0.5">{displayUser.job_title || (language === 'hu' ? 'Nincs pozíció' : 'No position')}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-[12px] text-kodo-text-dim">
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="text-kodo-text-dim" />
                {displayUser.email}
              </span>
              {displayUser.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-kodo-text-dim" />
                  {displayUser.department}
                </span>
              )}
            </div>
            {joinDate && (
              <p className="text-[11px] text-kodo-text-dim mt-2">
                {language === 'hu' ? `Csatlakozott: ${joinDate}` : `Joined ${joinDate}`}
              </p>
            )}
          </div>

          {isOwnProfile && (
            <button
              onClick={() => {
                if (onNavigate) onNavigate('settings');
                else navigate('/settings');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-kodo-text-secondary text-[12px] font-medium cursor-pointer hover:bg-white/[0.08] transition-colors"
            >
              <Edit3 size={13} />
              {language === 'hu' ? 'Szerkesztés' : 'Edit'}
            </button>
          )}
        </div>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {stats.map(stat => (
          <div key={stat.label} className="kodo-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
            </div>
            <div className="text-[22px] font-bold text-white font-display">{stat.value}</div>
            <div className="text-[11px] text-kodo-text-dim mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Completion Rate */}
      <div className="kodo-card p-5 md:p-6 mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold text-white m-0">
            {language === 'hu' ? 'Teljesítési arány' : 'Completion rate'}
          </h3>
          <span className="text-[13px] font-bold" style={{ color: completionRate >= 70 ? '#4ade80' : completionRate >= 40 ? '#fbbf24' : '#ef4444' }}>
            {completionRate}%
          </span>
        </div>
        <ProgressBar value={completionRate} color={completionRate >= 70 ? '#4ade80' : completionRate >= 40 ? '#fbbf24' : '#ef4444'} height={8} />
        <p className="text-[11px] text-kodo-text-dim mt-2">
          {language === 'hu'
            ? `${completedTasks} elvégzett / ${myTasks.length} összes feladat`
            : `${completedTasks} completed out of ${myTasks.length} total tasks`}
        </p>
      </div>

      {/* Projects Overview */}
      <div className="kodo-card p-5 md:p-6">
        <h3 className="text-[14px] font-semibold text-white mb-4 m-0">
          {language === 'hu' ? 'Projektjeid' : 'Your projects'}
        </h3>
        <div className="flex flex-col gap-3">
          {userProjects.map(p => {
            const pTasks = tasks.filter(t => (isAssignedTo(t, displayUserId) || t.created_by === displayUserId) && t.project_id === p.id);
            const done = pTasks.filter(t => t.status === 'done').length;
            const pct = pTasks.length > 0 ? Math.round((done / pTasks.length) * 100) : 0;
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || '#6366f1' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-kodo-text truncate">{p.name}</div>
                  <div className="text-[11px] text-kodo-text-dim mt-0.5">
                    {done}/{pTasks.length} {language === 'hu' ? 'feladat kész' : 'tasks done'}
                  </div>
                </div>
                <div className="w-20 flex-shrink-0">
                  <ProgressBar value={pct} color={p.color || '#6366f1'} height={4} />
                </div>
                <span className="text-[12px] font-semibold text-kodo-text-secondary w-10 text-right">{pct}%</span>
              </div>
            );
          })}
          {userProjects.length === 0 && (
            <p className="text-[12px] text-kodo-text-dim text-center py-4">
              {language === 'hu' ? 'Nincs projekt' : 'No projects yet'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
