import { useMemo, useState, useEffect } from 'react';
import {
  CalendarDays, Clock, TrendingUp, CheckCircle2,
  ArrowRight, Video, BarChart3, ListChecks, X, Mail, MessageSquare, Loader2
} from 'lucide-react';
import Avatar, { AvatarStack } from '@/components/Avatar';
import ProgressBar from '@/components/ProgressBar';
import { PriorityBadge, StatusBadge } from '@/components/Badges';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { calendarEvents as calendarApi, timeEntries as timeEntriesApi, participants as participantsApi } from '@/services/api';
import { useTasks } from '@/context/TasksContext';
import { useTheme } from '@/context/ThemeContext';

/* WeeklyChart */
function WeeklyChart({ projectId, teamMembers, timeEntries }) {
  const { t } = useTheme();
  const days = t.dashboard.days;
  const memberColors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e'];

  const memberData = teamMembers.slice(0, 6).map((member, idx) => {
    const entries = timeEntries.filter(e => e.user_id === member.id);
    const dailyHours = days.map((_, di) => {
      const dayEntries = entries.filter(e => {
        const d = new Date(e.date);
        return (d.getDay() + 6) % 7 === di; // Monday=0
      });
      return Math.round(dayEntries.reduce((sum, e) => sum + (e.hours || 0), 0) * 10) / 10;
    });
    const totalHours = dailyHours.reduce((s, h) => s + h, 0);
    return {
      ...member,
      color: memberColors[idx % memberColors.length],
      dailyHours,
      totalHours,
    };
  });

  const dailyTotals = days.map((_, di) =>
    memberData.reduce((sum, m) => sum + m.dailyHours[di], 0)
  );
  const maxTotal = Math.max(...dailyTotals, 1);

  return (
    <div>
      <div className="flex items-end gap-2 md:gap-3 h-[150px] md:h-[190px] px-1 md:px-2">
        {days.map((day, di) => {
          const dayTotal = dailyTotals[di];
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[11px] font-semibold text-kodo-text-secondary">
                {dayTotal > 0 ? `${Math.round(dayTotal)}h` : ''}
              </span>
              <div className="w-full flex-1 flex items-end">
                <div className="w-full h-full relative bg-white/[0.04] rounded-md overflow-hidden border border-white/[0.08] flex flex-col-reverse">
                  {memberData.map((member) => {
                    const hours = member.dailyHours[di];
                    if (hours <= 0) return null;
                    const pct = (hours / maxTotal) * 100;
                    return (
                      <div
                        key={member.id}
                        className="w-full transition-all duration-500"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: member.color,
                          opacity: 0.85,
                        }}
                        title={`${member.display_name}: ${hours}h`}
                      />
                    );
                  })}
                </div>
              </div>
              <span className="text-[11px] font-medium text-kodo-text-dim">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* MiniCalendar */
function MiniCalendar({ calendarEvents }) {
  const { t } = useTheme();
  const today = 14;
  const days = t.dashboard.calendarDays;
  const weekStart = 9;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-semibold text-white">{t.dashboard.march}</span>
        <span className="text-[11px] text-kodo-text-dim">2026</span>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {days.map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[10px] font-semibold text-kodo-text-dim uppercase py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = weekStart + i;
          const isToday = day === today;
          const hasEvent = calendarEvents.some(e => {
            const d = new Date(e.start_time);
            return d.getDate() === day && d.getMonth() === 2;
          });
          return (
            <div
              key={day}
              className={`text-center py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all ${
                isToday
                  ? 'bg-kodo-accent text-white font-bold'
                  : hasEvent
                    ? 'bg-white/[0.04] text-kodo-text-secondary'
                    : 'text-kodo-text-dim hover:bg-white/[0.04]'
              }`}
            >
              {day}
              {hasEvent && !isToday && (
                <div className="w-1 h-1 rounded-full bg-indigo-400 mx-auto mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* TodaySchedule */
function TodaySchedule({ project, onNavigate, calendarEvents }) {
  const { t, language } = useTheme();
  const locale = language === 'en' ? 'en-US' : 'hu-HU';

  const todayEvents = calendarEvents.filter(e => {
    const d = new Date(e.start_time);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const upcomingEvents = calendarEvents
    .filter(e => {
      const d = new Date(e.start_time);
      return d >= new Date();
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 3);

  const events = todayEvents.length > 0 ? todayEvents : upcomingEvents;

  return (
    <div className="flex flex-col gap-2">
      {events.map(evt => {
        const start = new Date(evt.start_time);
        const end = new Date(evt.end_time);
        const timeStr = `${start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;

        return (
          <div
            key={evt.id}
            onClick={() => onNavigate('calendar')}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-indigo-500/20 transition-all cursor-pointer"
          >
            <div
              className="w-1 h-10 rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: evt.color || '#6366f1' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-kodo-text truncate">{evt.title}</div>
              <div className="text-[11px] text-kodo-text-dim flex items-center gap-1 mt-0.5">
                <Clock size={10} /> {timeStr}
              </div>
              {evt.is_online_meeting && (
                <div className="text-[10px] text-indigo-400 flex items-center gap-1 mt-0.5">
                  <Video size={10} /> Online
                </div>
              )}
            </div>
            <ArrowRight size={14} className="text-kodo-text-dim mt-1 flex-shrink-0" />
          </div>
        );
      })}
      {events.length === 0 && (
        <div className="text-center text-[12px] text-kodo-text-dim py-4">
          {t.dashboard.noTodayEvent}
        </div>
      )}
    </div>
  );
}

/* MemberPopup */
function MemberPopup({ user, onClose, onNavigate }) {
  const { t } = useTheme();

  return (
    <div
      className="kodo-member-popup absolute right-0 sm:right-0 left-0 sm:left-auto top-full mt-1 z-50 w-auto sm:w-[260px] bg-[#1a1a24] border border-white/[0.1] rounded-xl shadow-2xl p-4 md:p-5 animate-fade-in-up"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
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
        onClick={(e) => {
          e.stopPropagation();
          onClose();
          onNavigate('messages', { dmUserId: user.id });
        }}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-kodo-accent/15 text-indigo-400 text-[13px] font-medium cursor-pointer border-none hover:bg-kodo-accent/25 transition-colors"
      >
        <MessageSquare size={15} />
        {t.dashboard.sendMessage}
      </button>
    </div>
  );
}

/* Dashboard */
export default function Dashboard({ onNavigate }) {
  const { activeProject, userProjects } = useProject();
  const { currentUser } = useAuth();
  const { tasks: allTasks } = useTasks();
  const { t, language } = useTheme();
  const locale = language === 'en' ? 'en-US' : 'hu-HU';
  const projectId = activeProject?.id || 1;

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [timeEntriesData, setTimeEntriesData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);

  const [selectedMemberId, setSelectedMemberId] = useState(null);

  useEffect(() => {
    if (!activeProject) return;
    setDashLoading(true);
    Promise.all([
      participantsApi.list('project', projectId).catch(() => ({ data: [] })),
      calendarApi.list().catch(() => ({ data: [] })),
      timeEntriesApi.list({ project_id: projectId, team: 1, per_page: 100 }).catch(() => ({ data: [] })),
    ]).then(([membersRes, eventsRes, entriesRes]) => {
      setTeamMembers((membersRes.participants || membersRes.data || []).map(p => p.user || p));
      setCalendarEvents(eventsRes.calendar_events || eventsRes.data || []);
      setTimeEntriesData(entriesRes.time_entries || entriesRes.data || []);
      setDashLoading(false);
    });
  }, [activeProject, projectId]);

  const myTasks = useMemo(() => {
    return allTasks.filter(t => (t.assignees || []).includes(currentUser?.id) && t.project_id === projectId);
  }, [allTasks, projectId, currentUser]);
  const doneTasks = myTasks.filter(t => t.status === 'done');

  const userProjectsWithTasks = useMemo(() => {
    return userProjects.map(p => {
      const pTasks = allTasks.filter(t => (t.assignees || []).includes(currentUser?.id) && t.project_id === p.id);
      const totalTasks = pTasks.length;
      const doneCount = pTasks.filter(t => t.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
      const dl = p.target_end_date ? Math.ceil((new Date(p.target_end_date) - new Date()) / (1000*60*60*24)) : null;
      return { ...p, userProgress: progress, userTasks: totalTasks, userDone: doneCount, daysLeft: dl };
    });
  }, [activeProject, allTasks, userProjects, currentUser]);

  const allProjectTasks = useMemo(() => {
    return allTasks.filter(t => t.project_id === projectId);
  }, [allTasks, projectId]);

  const assignmentStats = useMemo(() => {
    const total = allProjectTasks.length;
    const done = allProjectTasks.filter(t => t.status === 'done').length;
    return { total, done };
  }, [allProjectTasks]);

  const teamTotalHours = useMemo(() => {
    return Math.round(timeEntriesData.reduce((s, e) => s + (e.hours || 0), 0));
  }, [timeEntriesData]);

  const teamAvgDaily = useMemo(() => {
    return Math.round(teamTotalHours / 5);
  }, [teamTotalHours]);

  const firstName = (currentUser?.display_name || '').split(' ')[1] || (currentUser?.display_name || '').split(' ')[0] || '';

  if (dashLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="pb-6 md:pb-10">
      <div className="mb-5 md:mb-8">
        <h1 className="text-[20px] md:text-[28px] font-bold text-white/95 font-display m-0">
          {t.dashboard.greeting.replace('{name}', firstName)}
        </h1>
        <p className="text-kodo-text-muted mt-1 md:mt-1.5 text-[13px] md:text-[14px]">
          {t.dashboard.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4 md:gap-6">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="kodo-card p-3.5 md:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full" />
            <h2 className="text-[16px] md:text-[22px] font-bold text-white font-display mb-0.5 md:mb-1">{t.dashboard.todayTasks}</h2>
            <p className="text-[12px] md:text-[13px] text-kodo-text-muted mb-3 md:mb-4">
              {t.dashboard.todayTasksDesc}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('calendar')}
                className="kodo-btn-primary text-[12px] py-2 px-4"
              >
                <CalendarDays size={14} />
                {t.dashboard.todaySchedule}
              </button>
              <div className="flex items-center gap-2 text-[12px] text-kodo-text-secondary">
                <CheckCircle2 size={14} className="text-green-400" />
                <span>{doneTasks.length}/{myTasks.length} {t.dashboard.done}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[16px] font-semibold text-white/90 font-display mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" />
              {t.dashboard.yourProjects}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {userProjectsWithTasks.map((p, i) => (
                <div
                  key={p.id}
                  className={`kodo-card p-4 md:p-5 relative overflow-hidden animate-fade-in-up stagger-${(i % 3) + 1}`}
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: p.color }} />
                  <div className="text-[11px] text-kodo-text-dim mb-1">
                    {new Date(p.start_date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="text-[14px] font-semibold text-white mb-0.5 truncate">{p.name}</h3>
                  <div className="text-[11px] text-kodo-text-dim mb-4">
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-kodo-text-muted">{t.dashboard.progress}</span>
                    <span className="text-[12px] font-semibold" style={{ color: p.color }}>{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} color={p.color} height={5} />
                  <div className="flex items-center justify-between mt-4">
                    <AvatarStack
                      users={teamMembers.slice(0, 3)}
                      size={22}
                      max={3}
                    />
                    <span className={`text-[11px] font-medium ${p.daysLeft !== null && p.daysLeft <= 7 ? 'text-red-400' : 'text-kodo-text-dim'}`}>
                      {p.daysLeft === null
                        ? t.dashboard.noDeadline
                        : p.daysLeft > 0
                          ? t.dashboard.daysLeft.replace('{n}', p.daysLeft)
                          : t.dashboard.expired}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="kodo-card p-3.5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-kodo-text-muted" />
                  <h3 className="text-[14px] font-semibold text-white m-0">{t.dashboard.weeklyActivity}</h3>
                </div>
                <span className="text-[11px] text-kodo-text-dim bg-white/[0.04] px-2 py-0.5 rounded-md">
                  {t.dashboard.team}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <div className="text-[11px] text-kodo-text-dim mb-0.5">{t.dashboard.totalTime}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[22px] font-bold text-white font-display">{teamTotalHours}h</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-kodo-text-dim mb-0.5">{t.dashboard.dailyAvg}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[22px] font-bold text-white font-display">{teamAvgDaily}h</span>
                  </div>
                </div>
              </div>
              <WeeklyChart projectId={projectId} teamMembers={teamMembers} timeEntries={timeEntriesData} />
            </div>

            <div className="kodo-card p-3.5 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ListChecks size={16} className="text-kodo-text-muted" />
                  <h3 className="text-[14px] font-semibold text-white m-0">
                    {t.dashboard.tasks} ({allProjectTasks.length})
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-green-400">
                  <CheckCircle2 size={12} />
                  {assignmentStats.done}/{assignmentStats.total} {t.dashboard.done}
                </div>
              </div>
              <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
                {[...allProjectTasks].sort((a, b) => {
                  const order = { todo: 0, in_progress: 1, in_review: 2, done: 3 };
                  return (order[a.status] ?? 4) - (order[b.status] ?? 4);
                }).slice(0, 8).map(task => (
                  <div
                    key={task.id}
                    onClick={() => onNavigate('task', { highlightTaskId: task.id })}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-indigo-500/20 transition-all cursor-pointer group"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      task.status === 'done' ? 'bg-green-400' :
                      task.status === 'in_progress' ? 'bg-indigo-400' :
                      task.status === 'in_review' ? 'bg-yellow-400' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[12px] font-medium truncate ${
                        task.status === 'done' ? 'text-kodo-text-dim line-through' : 'text-kodo-text'
                      }`}>
                        {task.title}
                      </div>
                      <div className="text-[10px] text-kodo-text-dim mt-0.5">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:gap-5">
          <div className="kodo-card p-4 md:p-5">
            <MiniCalendar calendarEvents={calendarEvents} />
          </div>

          <div className="kodo-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-white m-0">{t.dashboard.schedule}</h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-[11px] text-indigo-400 font-medium cursor-pointer bg-transparent border-none hover:text-indigo-300"
              >
                {t.dashboard.allSchedule}
              </button>
            </div>
            <TodaySchedule project={activeProject} onNavigate={onNavigate} calendarEvents={calendarEvents} />
          </div>

          <div className="kodo-card p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-white m-0">{t.dashboard.teamMembers}</h3>
              <button
                onClick={() => onNavigate('teams')}
                className="text-[11px] text-indigo-400 font-medium cursor-pointer bg-transparent border-none hover:text-indigo-300"
              >
                {t.dashboard.all}
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {teamMembers.slice(0, 5).map(u => (
                <div key={u.id} className="relative">
                  <div
                    onClick={() => setSelectedMemberId(selectedMemberId === u.id ? null : u.id)}
                    className={`flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-white/[0.04] rounded-lg px-2 transition-all ${
                      selectedMemberId === u.id ? 'bg-white/[0.04] border border-indigo-500/20' : 'border border-transparent'
                    }`}
                  >
                    <Avatar user={u} size={30} showStatus />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-kodo-text truncate">{u.display_name}</div>
                      <div className="text-[10px] text-kodo-text-dim">{u.job_title}</div>
                    </div>
                  </div>
                  {selectedMemberId === u.id && (
                    <MemberPopup
                      user={u}
                      onClose={() => setSelectedMemberId(null)}
                      onNavigate={onNavigate}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
