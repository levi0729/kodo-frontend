import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { tasks as tasksApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { useToast } from '@/components/Toast';

const TasksContext = createContext(null);

const STATUS_ORDER = ['todo', 'in_progress', 'in_review', 'done'];

export function TasksProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const { activeProjectId } = useProject();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!isLoggedIn || !activeProjectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await tasksApi.list({ project_id: activeProjectId, per_page: 100 });
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load tasks: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, activeProjectId]);

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

    // Optimistic update
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: nextStatus, progress: nextStatus === 'done' ? 100 : t.progress }
          : t
      )
    );

    try {
      await tasksApi.update(taskId, { status: nextStatus });
      toast.success(`Task moved to ${nextStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to update task: ' + err.message);
      fetchTasks(); // Revert on error
    }
  }, [fetchTasks, toast]);

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
      toast.success('Task created successfully!');
      return data.task;
    } catch (err) {
      toast.error('Failed to create task: ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, toast]);

  const updateTask = useCallback(async (taskId, updates) => {
    try {
      const data = await tasksApi.update(taskId, updates);
      setTasks(prev => prev.map(t => t.id === taskId ? data.task : t));
      toast.success('Task updated');
      return data.task;
    } catch (err) {
      toast.error('Failed to update task: ' + err.message);
      throw err;
    }
  }, [toast]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      await tasksApi.destroy(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task: ' + err.message);
    }
  }, [toast]);

  const value = useMemo(() => ({
    tasks,
    advanceTask,
    createTask,
    updateTask,
    deleteTask,
    fetchTasks,
    loading,
    error,
  }), [tasks, advanceTask, createTask, updateTask, deleteTask, fetchTasks, loading, error]);

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
