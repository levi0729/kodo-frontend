import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { tasks as tasksApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/context/ThemeContext';

const TasksContext = createContext(null);

const STATUS_ORDER = ['todo', 'in_progress', 'in_review', 'done'];

export function TasksProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const { activeProjectId } = useProject();
  const toast = useToast();
  const { t } = useTheme();
  const tt = t.taskToasts;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PER_PAGE = 100;

  const fetchTasks = useCallback(async () => {
    if (!isLoggedIn || !activeProjectId) return;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    try {
      const data = await tasksApi.list({ project_id: activeProjectId, per_page: PER_PAGE, page: 1 });
      const list = data.tasks || [];
      setTasks(list);
      setHasMore(list.length >= PER_PAGE);
    } catch (err) {
      setError(err.message);
      toast.error(tt.loadFailed + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, activeProjectId]);

  const loadMoreTasks = useCallback(async () => {
    if (!isLoggedIn || !activeProjectId || !hasMore) return;
    const nextPage = currentPage + 1;
    try {
      const data = await tasksApi.list({ project_id: activeProjectId, per_page: PER_PAGE, page: nextPage });
      const list = data.tasks || [];
      setTasks(prev => [...prev, ...list]);
      setCurrentPage(nextPage);
      setHasMore(list.length >= PER_PAGE);
    } catch (err) {
      toast.error(tt.loadMoreFailed);
    }
  }, [isLoggedIn, activeProjectId, hasMore, currentPage]);

  useEffect(() => {
    if (isLoggedIn && activeProjectId) {
      fetchTasks();
    } else {
      setTasks([]);
    }
  }, [isLoggedIn, activeProjectId]);

  const advanceTask = useCallback(async (taskId, currentStatus) => {
    const currentIndex = STATUS_ORDER.indexOf(currentStatus);
    if (currentIndex >= STATUS_ORDER.length - 1) return;
    const nextStatus = STATUS_ORDER[currentIndex + 1];

    // Optimistic update — capture previous state for rollback
    let previous;
    setTasks(prev => {
      previous = prev;
      return prev.map(t =>
        t.id === taskId
          ? { ...t, status: nextStatus, progress: nextStatus === 'done' ? 100 : t.progress }
          : t
      );
    });

    try {
      await tasksApi.update(taskId, { status: nextStatus });
      toast.success(tt.movedTo.replace('{status}', (t.tasksPage.columns[nextStatus] || nextStatus)));
    } catch (err) {
      toast.error(tt.updateFailed + ': ' + err.message);
      if (previous) setTasks(previous); // instant revert, no refetch needed
    }
  }, [toast]);

  const createTask = useCallback(async (taskData) => {
    setLoading(true);
    try {
      const data = await tasksApi.create({
        project_id: activeProjectId,
        title: taskData.title,
        description: taskData.description || '',
        status: 'todo',
        priority: taskData.priority || 'medium',
        due_date: taskData.due_date || null,
        estimated_hours: taskData.estimated_hours || null,
        labels: taskData.labels || [],
        assignees: taskData.assignees || [],
      });
      setTasks(prev => [data.task, ...prev]);
      toast.success(tt.createSuccess);
      return data.task;
    } catch (err) {
      toast.error(tt.createFailed + ': ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, toast]);

  const updateTask = useCallback(async (taskId, updates) => {
    // Optimistic update for instant DnD feedback — capture previous for rollback
    let previous;
    setTasks(prev => {
      previous = prev;
      return prev.map(t => t.id === taskId ? { ...t, ...updates } : t);
    });
    try {
      const data = await tasksApi.update(taskId, updates);
      setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
      return data.task;
    } catch (err) {
      toast.error(tt.updateFailed + ': ' + err.message);
      if (previous) setTasks(previous); // instant revert, no refetch needed
    }
  }, [toast, tt]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      await tasksApi.destroy(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success(tt.deleteSuccess);
    } catch (err) {
      toast.error(tt.deleteFailed + ': ' + err.message);
    }
  }, [toast]);

  const value = useMemo(() => ({
    tasks,
    advanceTask,
    createTask,
    updateTask,
    deleteTask,
    fetchTasks,
    loadMoreTasks,
    hasMore,
    loading,
    error,
  }), [tasks, advanceTask, createTask, updateTask, deleteTask, fetchTasks, loadMoreTasks, hasMore, loading, error]);

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
}
