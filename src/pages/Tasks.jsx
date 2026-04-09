import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Clock, Plus, Check, Filter, X, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Avatar from '@/components/Avatar';
import ProgressBar from '@/components/ProgressBar';
import { PriorityBadge } from '@/components/Badges';
import { useProject } from '@/context/ProjectContext';
import { useTasks } from '@/context/TasksContext';
import NewTaskModal from '@/components/NewTaskModal';
import { useTheme } from '@/context/ThemeContext';

export default function TasksPage({ highlightTaskId }) {
  const { activeProject } = useProject();
  const { tasks, advanceTask, updateTask, createTask, loading, hasMore, loadMoreTasks } = useTasks();
  const { t, language } = useTheme();
  const locale = language === 'en' ? 'en-US' : 'hu-HU';
  const projectId = activeProject?.id || 1;
  const highlightRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState(null);
  const [filterLabel, setFilterLabel] = useState(null);

  const hasFilters = filterPriority || filterLabel;

  const COLUMNS = [
    { key: 'todo', label: t.tasksPage.columns.todo, color: '#94a3b8' },
    { key: 'in_progress', label: t.tasksPage.columns.in_progress, color: '#818cf8' },
    { key: 'in_review', label: t.tasksPage.columns.in_review, color: '#fbbf24' },
    { key: 'done', label: t.tasksPage.columns.done, color: '#4ade80' },
  ];

  const PRIORITY_FILTERS = [
    { value: 'high', label: t.tasksPage.priority.high, color: '#ef4444' },
    { value: 'medium', label: t.tasksPage.priority.medium, color: '#fbbf24' },
    { value: 'low', label: t.tasksPage.priority.low, color: '#94a3b8' },
  ];

  const projectTasks = useMemo(() => {
    let filtered = tasks.filter(t => t.project_id === projectId);
    if (filterPriority) filtered = filtered.filter(t => t.priority === filterPriority);
    if (filterLabel) filtered = filtered.filter(t => (t.labels || []).includes(filterLabel));
    return filtered;
  }, [tasks, projectId, filterPriority, filterLabel]);

  const projectLabels = useMemo(() => {
    const all = tasks.filter(t => t.project_id === projectId).flatMap(t => t.labels || []);
    return [...new Set(all)].sort();
  }, [tasks, projectId]);

  useEffect(() => {
    if (highlightTaskId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightRef.current.classList.add('kodo-task-flash');
      const timer = setTimeout(() => {
        highlightRef.current?.classList.remove('kodo-task-flash');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightTaskId]);

  const handleCreateTask = (taskData) => {
    createTask(taskData);
  };

  const onDragEnd = useCallback((result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const taskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;
    if (source.droppableId !== newStatus) {
      updateTask(taskId, {
        status: newStatus,
        progress: newStatus === 'done' ? 100 : undefined,
      });
    }
  }, [updateTask]);

  const projectLoading = useProject().loading;

  if ((loading || projectLoading) && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="pb-6 md:pb-10 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-6 gap-2 sm:gap-3">
        <div>
          <h1 className="text-[20px] md:text-[28px] font-bold text-white/95 font-display m-0">{t.tasksPage.title}</h1>
          <p className="text-kodo-text-muted mt-1 text-[13px]">
            {t.tasksPage.kanbanBoard} — <span className="text-indigo-400 font-medium">{activeProject?.name}</span>
          </p>
        </div>
        <button className="kodo-btn-primary flex-shrink-0" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          {t.tasksPage.newTask}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap">
        <div className="flex items-center gap-1.5 text-[11px] text-kodo-text-dim font-medium uppercase tracking-wider">
          <Filter size={12} />
          {t.tasksPage.filters}
        </div>

        <div className="flex items-center gap-1.5">
          {PRIORITY_FILTERS.map(p => (
            <button
              key={p.value}
              onClick={() => setFilterPriority(prev => prev === p.value ? null : p.value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                filterPriority === p.value
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-kodo-text-dim hover:bg-white/[0.06] hover:text-kodo-text-secondary'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-white/[0.08]" />

        <div className="flex items-center gap-1.5 flex-wrap">
          {projectLabels.map(l => (
            <button
              key={l}
              onClick={() => setFilterLabel(prev => prev === l ? null : l)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                filterLabel === l
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                  : 'bg-white/[0.03] border-white/[0.06] text-kodo-text-dim hover:bg-white/[0.06] hover:text-kodo-text-secondary'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={() => { setFilterPriority(null); setFilterLabel(null); }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border-none bg-transparent"
          >
            <X size={12} />
            {t.tasksPage.clearFilters}
          </button>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 md:gap-4 flex-1 overflow-x-auto pb-4 lg:grid lg:grid-cols-4 lg:overflow-x-visible lg:pb-0">
          {COLUMNS.map(col => {
            const colTasks = projectTasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="flex flex-col bg-white/[0.02] rounded-2xl border border-white/[0.04] p-2.5 md:p-3 min-w-[220px] lg:min-w-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-[11px] font-semibold text-kodo-text-secondary uppercase tracking-[0.06em]">
                    {col.label}
                  </span>
                  <span className="ml-auto text-[10px] font-semibold text-kodo-text-dim bg-white/[0.04] px-1.5 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col gap-2 flex-1 min-h-[60px] rounded-xl transition-colors ${
                        snapshot.isDraggingOver ? 'bg-indigo-500/[0.06]' : ''
                      }`}
                    >
                      {colTasks.map((task, index) => {
                        const taskLabels = task.labels || [];
                        const creator = task.creator || null;
                        const isHighlighted = task.id === highlightTaskId;
                        const isDone = col.key === 'done';
                        return (
                          <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={(el) => {
                                  provided.innerRef(el);
                                  if (isHighlighted) highlightRef.current = el;
                                }}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`kodo-card p-3.5 cursor-grab active:cursor-grabbing relative ${
                                  isHighlighted ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-transparent' : ''
                                } ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500/30 rotate-[2deg]' : ''}`}
                                style={provided.draggableProps.style}
                              >
                                {!isDone && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      advanceTask(task.id, task.status);
                                    }}
                                    className="absolute top-3 right-3 w-5 h-5 rounded-full border-2 border-white/20 bg-transparent hover:border-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer flex items-center justify-center group"
                                    title={t.tasksPage.advance}
                                  >
                                    <Check size={10} className="text-transparent group-hover:text-indigo-400 transition-colors" />
                                  </button>
                                )}
                                {isDone && (
                                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center">
                                    <Check size={10} className="text-green-400" />
                                  </div>
                                )}

                                <div className="text-[13px] font-medium text-kodo-text mb-2 pr-7">{task.title}</div>

                                <div className="flex flex-wrap gap-1 mb-3">
                                  {taskLabels.map(l => (
                                    <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-kodo-text-dim font-medium">
                                      {l}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <PriorityBadge priority={task.priority} />
                                    {task.due_date && (
                                      <span className="text-[11px] text-kodo-text-dim flex items-center gap-1">
                                        <Clock size={11} />
                                        {new Date(task.due_date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex">
                                    {creator && (
                                      <Avatar user={creator} size={22} />
                                    )}
                                  </div>
                                </div>

                                {task.progress > 0 && task.progress < 100 && (
                                  <div className="mt-2.5">
                                    <ProgressBar value={task.progress} color={col.color} height={4} />
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={loadMoreTasks}
            className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-kodo-text-muted text-[12px] font-medium cursor-pointer hover:bg-white/[0.08] transition-colors"
          >
            {t.common?.loadMore || 'Load more'}
          </button>
        </div>
      )}

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreate={handleCreateTask}
        projectId={projectId}
      />
    </div>
  );
}
