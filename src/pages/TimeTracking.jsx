import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Trash2, Loader2, Clock, BarChart3 } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { timeEntries as timeEntriesApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/context/ThemeContext';

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
  const toast = useToast();
  const { t } = useTheme();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [activeProject]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeProject?.id) params.project_id = activeProject.id;
      const res = await timeEntriesApi.list(params);
      setEntries(res.time_entries || res.data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsRunning(true);
  };

  const handleStop = async () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    const durationMinutes = Math.max(1, Math.round(elapsed / 60));
    const startedAt = new Date(startTimeRef.current).toISOString();
    const endedAt = new Date().toISOString();

    try {
      await timeEntriesApi.create({
        description: description || undefined,
        duration_minutes: durationMinutes,
        started_at: startedAt,
        ended_at: endedAt,
        project_id: activeProject?.id || undefined,
      });
      setDescription('');
      setElapsed(0);
      await loadEntries();
    } catch (err) {
      toast.error(err.message || 'Failed to save time entry');
    }
  };

  const handleDelete = async (id) => {
    try {
      await timeEntriesApi.destroy(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success(t.timeTracking.entryDeleted);
    } catch (err) {
      toast.error(err.message || 'Failed to delete entry');
    }
  };

  // Weekly summary calculation
  const weeklySummary = useCallback(() => {
    const monday = getMonday(new Date());
    const dailyTotals = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun

    entries.forEach(entry => {
      const entryDate = new Date(entry.started_at || entry.created_at);
      if (entryDate >= monday) {
        const dayIndex = (entryDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
        dailyTotals[dayIndex] += entry.duration_minutes || 0;
      }
    });

    const totalMinutes = dailyTotals.reduce((a, b) => a + b, 0);
    const maxMinutes = Math.max(...dailyTotals, 1);

    return { dailyTotals, totalMinutes, maxMinutes };
  }, [entries]);

  const summary = weeklySummary();
  const todayIndex = (new Date().getDay() + 6) % 7;

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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t.timeTracking.description}
                className="kodo-input flex-1 text-[14px]"
                disabled={isRunning}
              />

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

          {/* Entries List */}
          <div className="kodo-card p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-indigo-400" />
              <span className="text-[14px] font-semibold text-white">{t.timeTracking.entries}</span>
              <span className="text-[12px] text-kodo-text-muted ml-auto">{entries.length}</span>
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-10 text-kodo-text-muted text-[13px]">
                {t.timeTracking.noEntries}
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
                    className="grid grid-cols-1 sm:grid-cols-[1fr_100px_120px_40px] gap-1 sm:gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors items-center"
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
                    <span className="text-[13px] text-kodo-text-muted font-mono tabular-nums">
                      {formatDuration(entry.duration_minutes)}
                    </span>
                    <span className="text-[12px] text-kodo-text-muted">
                      {formatDate(entry.started_at || entry.created_at)}
                    </span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/15 transition-colors cursor-pointer border-none bg-transparent text-kodo-text-dim hover:text-red-400 justify-self-end sm:justify-self-auto"
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
