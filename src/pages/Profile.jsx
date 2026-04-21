import { useState, useEffect, useMemo } from 'react';
import {
  User, Mail, Briefcase, Building2, CheckCircle2, Clock, FolderKanban,
  TrendingUp, Edit3, Save, X, Loader2, Camera
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import ProgressBar from '@/components/ProgressBar';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { useTasks } from '@/context/TasksContext';
import { users as usersApi, timeEntries as timeEntriesApi } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/Toast';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { userProjects } = useProject();
  const { tasks } = useTasks();
  const { t, language } = useTheme();
  const toast = useToast();
  const locale = language === 'en' ? 'en-US' : 'hu-HU';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [totalHours, setTotalHours] = useState(0);
  const [formData, setFormData] = useState({
    display_name: '',
    job_title: '',
    department: '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        display_name: currentUser.display_name || '',
        job_title: currentUser.job_title || '',
        department: currentUser.department || '',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    timeEntriesApi.list({ per_page: 999 })
      .then(data => {
        const entries = data.time_entries || data.data || [];
        const hours = entries.reduce((s, e) => s + (e.hours || 0), 0);
        setTotalHours(Math.round(hours * 10) / 10);
      })
      .catch(() => {});
  }, []);

  const myTasks = useMemo(() => {
    return tasks.filter(t => (t.assignees || []).includes(currentUser?.id));
  }, [tasks, currentUser]);

  const completedTasks = myTasks.filter(t => t.status === 'done').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress').length;
  const completionRate = myTasks.length > 0 ? Math.round((completedTasks / myTasks.length) * 100) : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersApi.updateProfile(formData);
      toast.success(t.settings.profileSaved);
      setEditing(false);
    } catch (err) {
      toast.error(err.message || t.settings.profileSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const joinDate = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
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

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
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
          {language === 'hu' ? 'Személyes adatok és statisztikák' : 'Personal info and statistics'}
        </p>
      </div>

      {/* Profile Card */}
      <div className="kodo-card p-5 md:p-8 mb-4 md:mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group">
            <Avatar user={currentUser} size={80} />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera size={20} className="text-white" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-[20px] font-bold text-white">{currentUser.display_name}</h2>
            <p className="text-[13px] text-kodo-text-muted mt-0.5">{currentUser.job_title || (language === 'hu' ? 'Nincs pozíció' : 'No position')}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-[12px] text-kodo-text-dim">
              <span className="flex items-center gap-1.5">
                <Mail size={13} className="text-kodo-text-dim" />
                {currentUser.email}
              </span>
              {currentUser.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-kodo-text-dim" />
                  {currentUser.department}
                </span>
              )}
            </div>
            {joinDate && (
              <p className="text-[11px] text-kodo-text-dim mt-2">
                {language === 'hu' ? `Csatlakozott: ${joinDate}` : `Joined ${joinDate}`}
              </p>
            )}
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-kodo-text-secondary text-[12px] font-medium cursor-pointer hover:bg-white/[0.08] transition-colors"
          >
            <Edit3 size={13} />
            {language === 'hu' ? 'Szerkesztés' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="kodo-card p-5 md:p-6 mb-4 md:mb-6 animate-fade-in-up">
          <h3 className="text-[15px] font-semibold text-white mb-4">
            {language === 'hu' ? 'Profil szerkesztése' : 'Edit Profile'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-kodo-text-muted mb-1.5">
                {t.settings.displayName}
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={e => setFormData(p => ({ ...p, display_name: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-kodo-text-muted mb-1.5">
                {t.settings.position}
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={e => setFormData(p => ({ ...p, job_title: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-kodo-text-muted mb-1.5">
                {t.settings.department}
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-kodo-text-muted text-[12px] font-medium cursor-pointer hover:bg-white/[0.08] transition-colors"
            >
              <X size={13} />
              {t.common.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-500 text-white text-[12px] font-medium cursor-pointer hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              {t.common.save}
            </button>
          </div>
        </div>
      )}

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
            const pTasks = tasks.filter(t => (t.assignees || []).includes(currentUser?.id) && t.project_id === p.id);
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
