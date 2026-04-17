import { useState, useEffect, useCallback, useRef } from 'react';
import { List as VirtualList } from 'react-window';
import { Loader2, Plus, RefreshCw, Pencil, Trash2, FileText, Users, FolderKanban, CalendarDays, Clock } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useProject } from '@/context/ProjectContext';
import { activityLogs as activityLogsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/context/ThemeContext';

const PAGE_SIZE = 20;

function relativeTime(dateStr, t) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t.activityLog.justNow;
  if (diffMin < 60) return t.activityLog.minutesAgo.replace('{n}', diffMin);
  if (diffHr < 24) return t.activityLog.hoursAgo.replace('{n}', diffHr);
  return t.activityLog.daysAgo.replace('{n}', diffDays);
}

function actionIcon(action) {
  switch (action) {
    case 'created':
      return <Plus size={14} className="text-emerald-400" />;
    case 'updated':
      return <Pencil size={14} className="text-blue-400" />;
    case 'deleted':
      return <Trash2 size={14} className="text-red-400" />;
    default:
      return <RefreshCw size={14} className="text-kodo-text-muted" />;
  }
}

function actionColor(action) {
  switch (action) {
    case 'created':
      return 'bg-emerald-500/15 border-emerald-500/25';
    case 'updated':
      return 'bg-blue-500/15 border-blue-500/25';
    case 'deleted':
      return 'bg-red-500/15 border-red-500/25';
    default:
      return 'bg-white/[0.06] border-white/[0.08]';
  }
}

function entityIcon(entityType) {
  switch (entityType) {
    case 'task':
      return <FileText size={13} className="text-kodo-text-dim" />;
    case 'team':
      return <Users size={13} className="text-kodo-text-dim" />;
    case 'project':
      return <FolderKanban size={13} className="text-kodo-text-dim" />;
    case 'calendar_event':
      return <CalendarDays size={13} className="text-kodo-text-dim" />;
    default:
      return <Clock size={13} className="text-kodo-text-dim" />;
  }
}

export default function ActivityLog() {
  const [activeTab, setActiveTab] = useState('my');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { currentUser } = useAuth();
  const { activeProject } = useProject();
  const toast = useToast();
  const { t } = useTheme();

  const fetchLogs = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      let res;
      if (activeTab === 'my') {
        res = await activityLogsApi.feed({ page: pageNum, per_page: PAGE_SIZE });
      } else {
        if (!activeProject?.id) {
          setEntries([]);
          setLoading(false);
          return;
        }
        res = await activityLogsApi.forProject(activeProject.id);
      }

      const logs = res.activity_logs || res.data || [];
      const total = res.total || res.meta?.total;

      if (append) {
        setEntries(prev => [...prev, ...logs]);
      } else {
        setEntries(logs);
      }

      if (total != null) {
        setHasMore(pageNum * PAGE_SIZE < total);
      } else {
        setHasMore(logs.length >= PAGE_SIZE);
      }

      setPage(pageNum);
    } catch (err) {
      toast.error(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, activeProject?.id, toast]);

  useEffect(() => {
    setEntries([]);
    setPage(1);
    setHasMore(false);
    fetchLogs(1, false);
  }, [fetchLogs]);

  const handleLoadMore = () => {
    fetchLogs(page + 1, true);
  };

  const getActionLabel = (action) => {
    return t.activityLog[action] || action;
  };

  const ITEM_HEIGHT = 72;
  const containerRef = useRef(null);
  const [listHeight, setListHeight] = useState(400);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const top = containerRef.current.getBoundingClientRect().top;
        setListHeight(Math.max(200, window.innerHeight - top - 24));
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [loading]);

  const itemCount = entries.length + (hasMore ? 1 : 0);

  const ActivityRow = useCallback(({ index, style }) => {
    if (index === entries.length) {
      return (
        <div style={style} className="flex justify-center items-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="kodo-btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loadingMore ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            {t.activityLog.loadMore}
          </button>
        </div>
      );
    }

    const entry = entries[index];
    const user = entry.user || entry.causer || null;
    const userName = user?.display_name || user?.name || 'Unknown';
    const action = entry.action || 'updated';
    const entityType = entry.entity_type || entry.subject_type || '';
    const entityName = entry.entity_name || entry.description || entry.subject?.name || entityType;

    return (
      <div style={style} className="pr-1">
        <div className="flex items-start gap-3 sm:gap-4 group h-full pb-2">
          <div className="relative flex-shrink-0 z-10">
            {user ? (
              <Avatar user={user} size={38} />
            ) : (
              <div className="w-[38px] h-[38px] rounded-full bg-white/[0.06] flex items-center justify-center">
                {actionIcon(action)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 kodo-card p-3 md:p-4 group-hover:bg-white/[0.06] transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] md:text-[14px] text-white leading-relaxed m-0">
                  <span className="font-semibold">{userName}</span>{' '}
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${actionColor(action)}`}>
                    {actionIcon(action)}
                    {getActionLabel(action)}
                  </span>{' '}
                  <span className="inline-flex items-center gap-1 text-kodo-text-muted">
                    {entityIcon(entityType)}
                    <span className="font-medium text-white/80">{entityName}</span>
                  </span>
                </p>
              </div>
              <span className="text-[11px] text-kodo-text-dim whitespace-nowrap flex-shrink-0 mt-0.5">
                {relativeTime(entry.created_at, t)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }, [entries, hasMore, loadingMore, handleLoadMore, t]);

  const tabs = [
    { key: 'my', label: t.activityLog.tabs.my },
    { key: 'project', label: t.activityLog.tabs.project },
  ];

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
            {t.activityLog.title}
          </h1>
          <p className="text-kodo-text-muted mt-1 text-[13px]">
            {t.activityLog.subtitle}
            {activeProject && (
              <> — <span className="text-indigo-400 font-medium">{activeProject.name}</span></>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white/[0.04] rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer border-none transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-transparent text-kodo-text-muted hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <div className="kodo-card p-8 md:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
            <Clock size={22} className="text-kodo-text-dim" />
          </div>
          <p className="text-kodo-text-muted text-[14px]">{t.activityLog.noActivity}</p>
        </div>
      ) : (
        <div className="relative" ref={containerRef}>
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-white/[0.06] hidden sm:block" />

          <VirtualList
            height={listHeight}
            itemCount={itemCount}
            itemSize={ITEM_HEIGHT}
            width="100%"
            overscanCount={5}
          >
            {ActivityRow}
          </VirtualList>
        </div>
      )}
    </div>
  );
}
