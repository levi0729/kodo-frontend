import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, FileText, Users, FolderKanban, Calendar, ArrowRight, Command } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { PriorityBadge } from '@/components/Badges';
import { useProject } from '@/context/ProjectContext';
import { useTasks } from '@/context/TasksContext';
import { useTheme } from '@/context/ThemeContext';

export default function SearchModal({ isOpen, onClose, onNavigate, teamMembers }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const { t } = useTheme();
  const { tasks } = useTasks();
  const { userProjects, activeProject } = useProject();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else if (!isOpen) onClose(); // trigger toggle from parent
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const items = [];

    // Search tasks
    const projectId = activeProject?.id;
    const matchedTasks = tasks
      .filter(t => t.project_id === projectId)
      .filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        (t.labels || []).some(l => l.toLowerCase().includes(q))
      )
      .slice(0, 5);
    matchedTasks.forEach(t => items.push({ type: 'task', data: t }));

    // Search projects
    const matchedProjects = userProjects
      .filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
      .slice(0, 3);
    matchedProjects.forEach(p => items.push({ type: 'project', data: p }));

    // Search team members
    const matchedMembers = (teamMembers || [])
      .filter(u =>
        u.display_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.job_title?.toLowerCase().includes(q)
      )
      .slice(0, 4);
    matchedMembers.forEach(u => items.push({ type: 'member', data: u }));

    return items;
  }, [query, tasks, userProjects, teamMembers, activeProject]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = (item) => {
    onClose();
    switch (item.type) {
      case 'task':
        onNavigate('task', { highlightTaskId: item.data.id });
        break;
      case 'project':
        onNavigate('dashboard');
        break;
      case 'member':
        onNavigate('messages', { dmUserId: item.data.id });
        break;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]');
      active?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  const typeIcon = (type) => {
    switch (type) {
      case 'task': return <FileText size={14} className="text-indigo-400" />;
      case 'project': return <FolderKanban size={14} className="text-emerald-400" />;
      case 'member': return <Users size={14} className="text-pink-400" />;
      default: return null;
    }
  };

  const typeLabel = (type) => {
    switch (type) {
      case 'task': return t.nav.tasks;
      case 'project': return t.sidebar.projects;
      case 'member': return t.common.members;
      default: return '';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a24] border border-white/[0.1] rounded-2xl w-full max-w-[520px] shadow-2xl animate-fade-in-up mx-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search size={18} className="text-kodo-text-dim flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.common.search}
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-white placeholder:text-kodo-text-dim"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-kodo-text-dim bg-white/[0.06] px-1.5 py-0.5 rounded border border-white/[0.08] font-mono">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
          {query.trim() === '' && (
            <div className="px-4 py-8 text-center">
              <Search size={32} className="text-kodo-text-dim/40 mx-auto mb-3" />
              <p className="text-[13px] text-kodo-text-dim">
                {t.nav.tasks}, {t.sidebar.projects}, {t.common.members}...
              </p>
            </div>
          )}

          {query.trim() !== '' && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-kodo-text-dim">
                {t.language === 'hu' ? 'Nincs találat' : 'No results found'}
              </p>
            </div>
          )}

          {results.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={`${item.type}-${item.data.id}`}
                data-active={isActive}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                  isActive ? 'bg-indigo-500/10' : 'hover:bg-white/[0.04]'
                }`}
              >
                {item.type === 'member' ? (
                  <Avatar user={item.data} size={28} />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    {typeIcon(item.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-kodo-text truncate">
                    {item.type === 'member' ? item.data.display_name : (item.data.title || item.data.name)}
                  </div>
                  <div className="text-[11px] text-kodo-text-dim truncate">
                    {item.type === 'task' && item.data.description}
                    {item.type === 'project' && item.data.description}
                    {item.type === 'member' && (item.data.job_title || item.data.email)}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.type === 'task' && <PriorityBadge priority={item.data.priority} />}
                  <span className="text-[10px] text-kodo-text-dim bg-white/[0.04] px-1.5 py-0.5 rounded font-medium">
                    {typeLabel(item.type)}
                  </span>
                  {isActive && <ArrowRight size={12} className="text-indigo-400" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-white/[0.06] text-[10px] text-kodo-text-dim">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="bg-white/[0.06] px-1 py-0.5 rounded font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-white/[0.06] px-1 py-0.5 rounded font-mono">↵</kbd> select</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="bg-white/[0.06] px-1 py-0.5 rounded font-mono">esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
