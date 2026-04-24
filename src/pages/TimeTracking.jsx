import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Trash2, Loader2, Clock, BarChart3, Download, ChevronDown } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { useTasks } from '@/context/TasksContext';
import { timeEntries as timeEntriesApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/context/ThemeContext';

const TIMER_STORAGE_KEY = 'kodo_timer_state';

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getMonday(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  r.setHours(0, 0, 0, 0);
  return r;
}

function getDayAbbr(dayIndex) {
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
}

export default function TimeTracking() {
  const { currentUser } = useAuth();
  const { activeProject } = useProject();
  const { tasks } = useTasks();
  const toast = useToast();
  const { t, language } = useTheme();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [taskDropdownOpen, setTaskDropdownOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const taskDropdownRef = useRef(null);

  // Available tasks for the active project
  const projectTasks = (tasks || []).filter(t => t.status !== 'done');
  const selectedTask = projectTasks.find(t => t.id === Number(selectedTaskId));

  // Restore timer state from sessionStorage (persists across tab switches and page navigation)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const { startTime, taskId, projectId } = JSON.parse(saved);
        if (startTime && Date.now() - startTime < 24 * 60 * 60 * 1000) {
          startTimeRef.current = startTime;
          setSelectedTaskId(taskId || '');
          setIsRunning(true);
          setElapsed(Math.floor((Date.now() - startTime) / 1000));
        } else {
          sessionStorage.removeItem(TIMER_STORAGE_KEY);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Close task dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (taskDropdownRef.current && !taskDropdownRef.current.contains(e.target)) {
        setTaskDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [activeProject]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = { per_page: 100 };
      if (activeProject?.id) params.project_id = activeProject.id;
      const res = await timeEntriesApi.list(params);
      setEntries(res.time_entries || res.data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Timer tick - uses requestAnimationFrame-friendly approach
  useEffect(() => {
    if (isRunning) {
      const tick = () => {
        if (startTimeRef.current) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Re-sync elapsed when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && isRunning && startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning]);

  const handleStart = () => {
    const now = Date.now();
    startTimeRef.current = now;
    setElapsed(0);
    setIsRunning(true);
    sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({
      startTime: now,
      taskId: selectedTaskId,
      projectId: activeProject?.id,
    }));
  };

  const handleStop = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    sessionStorage.removeItem(TIMER_STORAGE_KEY);

    const hours = Math.max(0.01, Math.round((elapsed / 3600) * 100) / 100);
    const date = new Date().toISOString().slice(0, 10);

    const taskId = selectedTaskId ? Number(selectedTaskId) : undefined;
    const description = selectedTask?.title || undefined;

    try {
      await timeEntriesApi.create({
        description,
        hours,
        date,
        project_id: activeProject?.id || undefined,
        task_id: taskId,
      });
      setSelectedTaskId('');
      setElapsed(0);
      await loadEntries();
    } catch (err) {
      toast.error(err.message || t.timeTracking.saveFailed);
    }
  };

  const handleDelete = async (id) => {
    try {
      await timeEntriesApi.destroy(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success(t.timeTracking.entryDeleted);
    } catch (err) {
      toast.error(err.message || t.timeTracking.deleteFailed);
    }
  };

  // Weekly summary calculation
  const weeklySummary = useCallback(() => {
    const monday = getMonday(new Date());
    const dailyTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

    entries.forEach(entry => {
      const entryDate = new Date(entry.date || entry.created_at);
      if (entryDate >= monday) {
        const dayIndex = (entryDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
        dailyTotals[dayIndex] += Math.round((entry.hours || 0) * 60);
      }
    });

    const totalMinutes = dailyTotals.reduce((a, b) => a + b, 0);
    const maxMinutes = Math.max(...dailyTotals, 1);

    return { dailyTotals, totalMinutes, maxMinutes };
  }, [entries]);

  const summary = weeklySummary();
  const todayIndex = (new Date().getDay() + 6) % 7;

  const exportCSV = () => {
    if (entries.length === 0) return;
    const header = 'Description,Hours,Date,Project\n';
    const rows = entries.map(e =>
      `"${(e.description || '').replace(/"/g, '""')}",${e.hours || 0},"${formatDate(e.date || e.created_at)}","${(e.project?.name || '').replace(/"/g, '""')}"`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `time-entries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t.timeTracking.exported || 'CSV exported');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="pb-6 md:pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-7 gap-2 sm:gap-3">
        <div>
          <h1 className="text-[20px] md:text-[28px] font-bold text-white/95 font-display m-0">
            {t.timeTracking.title}
          </h1>
          <p className="text-kodo-text-muted mt-1 text-[13px]">
            {t.timeTracking.subtitle}
            {activeProject && (
              <> — <span className="text-indigo-400 font-medium">{activeProject.name}</span></>
            )}
          </p>
        </div>
        {entries.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-kodo-text-secondary text-[12px] font-medium cursor-pointer hover:bg-white/[0.08] transition-colors flex-shrink-0"
          >
            <Download size={14} />
            {t.timeTracking.exportCSV || 'Export CSV'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left column: Timer + Entries */}
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
          {/* Active Timer */}
          <div className="kodo-card p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-indigo-400" />
              <span className="text-[14px] font-semibold text-white">
                {isRunning ? t.timeTracking.stopTimer : t.timeTracking.startTimer}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Task selector dropdown */}
              <div className="relative" ref={taskDropdownRef}>
                <button
                  onClick={() => !isRunning && setTaskDropdownOpen(!taskDropdownOpen)}
                  disabled={isRunning}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-[13px] text-left border transition-colors ${
                    isRunning
                      ? 'bg-white/[0.02] border-white/[0.04] text-kodo-text-dim cursor-not-allowed'
                      : 'bg-white/[0.04] border-white/[0.08] text-white cursor-pointer hover:bg-white/[0.06]'
                  }`}
                >
                  <span className={selectedTask ? 'text-white' : 'text-kodo-text-muted'}>
                    {selectedTask
                      ? selectedTask.title
                      : (language === 'hu' ? 'Válassz feladatot...' : 'Select a task...')}
                  </span>
                  <ChevronDown size={14} className={`text-kodo-text-dim transition-transform ${taskDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {taskDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a24] border border-white/[0.08] rounded-xl py-1 z-50 shadow-2xl animate-fade-in-up max-h-[240px] overflow-y-auto">
                    {projectTasks.length === 0 ? (
                      <div className="px-3 py-3 text-[12px] text-kodo-text-dim text-center">
                        {language === 'hu' ? 'Nincs elérhető feladat' : 'No tasks available'}
                      </div>
                    ) : (
                      projectTasks.map(task => (
                        <button
                          key={task.id}
                          onClick={() => {
                            setSelectedTaskId(String(task.id));
                            setTaskDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left border-none cursor-pointer transition-colors text-[13px] ${
                            String(task.id) === selectedTaskId
                              ? 'bg-kodo-accent/10 text-indigo-400'
                              : 'bg-transparent text-kodo-text-secondary hover:bg-white/[0.04] hover:text-kodo-text'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            task.status === 'in_progress' ? 'bg-indigo-400' :
                            task.status === 'in_review' ? 'bg-yellow-400' :
                            'bg-gray-500'
                          }`} />
                          <span className="truncate">{task.title}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {isRunning && (
                  <div className="flex items-center justify-center px-4 py-2 bg-white/[0.04] rounded-lg border border-white/[0.08] font-mono text-[20px] text-indigo-400 font-bold tabular-nums tracking-wider min-w-[130px]">
                    {formatElapsed(elapsed)}
                  </div>
                )}

                <button
                  onClick={isRunning ? handleStop : handleStart}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer border-none transition-all ${
                    isRunning
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'kodo-btn-primary'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Square size={14} />
                      {t.timeTracking.stopTimer}
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      {t.timeTracking.startTimer}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Entries List */}
          <div className="kodo-card p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-indigo-400" />
              <span className="text-[14px] font-semibold text-white">{t.timeTracking.entries}</span>
              <span className="text-[12px] text-kodo-text-muted ml-auto">{entries.length}</span>
            </div>

            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                  <Clock size={22} className="text-kodo-text-dim" />
                </div>
                <div className="text-[13px] text-kodo-text-muted">{t.timeTracking.noEntries}</div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {/* Table header */}
                <div className="hidden sm:grid grid-cols-[1fr_100px_120px_40px] gap-3 px-3 py-2 text-[11px] font-semibold text-kodo-text-muted uppercase tracking-[0.06em]">
                  <span>{t.timeTracking.description}</span>
                  <span>{t.timeTracking.duration}</span>
                  <span>{t.timeTracking.date}</span>
                  <span></span>
                </div>

                {entries.map(entry => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_100px_120px_40px] gap-1 sm:gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors items-center"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-[13px] text-white truncate">
                        {entry.description || '—'}
                      </span>
                      {entry.project_name && (
                        <span className="text-[11px] text-indigo-400/70 sm:hidden">
                          {entry.project_name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:contents">
                      <span className="text-[13px] text-kodo-text-muted font-mono tabular-nums">
                        {formatDuration(Math.round((entry.hours || 0) * 60))}
                      </span>
                      <span className="text-[12px] text-kodo-text-muted hidden sm:inline">
                        {formatDate(entry.date || entry.created_at)}
                      </span>
                      <span className="text-[11px] text-kodo-text-dim sm:hidden">
                        · {formatDate(entry.date || entry.created_at)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 sm:p-1.5 rounded-lg hover:bg-red-500/15 transition-colors cursor-pointer border-none bg-transparent text-kodo-text-dim hover:text-red-400 justify-self-end sm:justify-self-auto"
                      title={t.timeTracking.delete}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Weekly Summary */}
        <div className="lg:col-span-1">
          <div className="kodo-card p-4 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={18} className="text-indigo-400" />
              <span className="text-[14px] font-semibold text-white">{t.timeTracking.weeklySummary}</span>
            </div>

            {/* Total this week */}
            <div className="mb-6 text-center">
              <div className="text-[11px] font-semibold text-kodo-text-muted uppercase tracking-[0.06em] mb-1">
                {t.timeTracking.totalThisWeek}
              </div>
              <div className="text-[28px] font-bold text-white font-mono tabular-nums">
                {formatDuration(summary.totalMinutes)}
              </div>
            </div>

            {/* Daily bar chart */}
            <div className="flex items-end justify-between gap-2 h-[120px] mb-2">
              {summary.dailyTotals.map((minutes, i) => {
                const heightPct = summary.maxMinutes > 0 ? (minutes / summary.maxMinutes) * 100 : 0;
                const isToday = i === todayIndex;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    {minutes > 0 && (
                      <span className="text-[10px] text-kodo-text-muted font-mono tabular-nums">
                        {formatDuration(minutes)}
                      </span>
                    )}
                    <div
                      className={`w-full rounded-t-md transition-all min-h-[4px] ${
                        isToday
                          ? 'bg-indigo-500'
                          : minutes > 0
                          ? 'bg-indigo-500/40'
                          : 'bg-white/[0.06]'
                      }`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Day labels */}
            <div className="flex items-center justify-between gap-2">
              {summary.dailyTotals.map((_, i) => {
                const isToday = i === todayIndex;
                return (
                  <div key={i} className="flex-1 text-center">
                    <span className={`text-[10px] font-medium ${
                      isToday ? 'text-indigo-400' : 'text-kodo-text-dim'
                    }`}>
                      {isToday ? t.timeTracking.today : getDayAbbr(i)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
