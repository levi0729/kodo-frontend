import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projects as projectsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/context/ThemeContext';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { currentUser, isLoggedIn } = useAuth();
  const toast = useToast();
  const { t } = useTheme();
  const tt = t.taskToasts;
  const [userProjects, setUserProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);
    try {
      const data = await projectsApi.list({ per_page: 50 });
      const projectsList = data.projects || [];
      setUserProjects(projectsList);
      if (!activeProjectId && projectsList.length > 0) {
        setActiveProjectId(projectsList[0].id);
      }
    } catch (err) {
      setError(err.message);
      toast.error(tt.projectLoadFailed + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, activeProjectId]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProjects();
    } else {
      setUserProjects([]);
      setActiveProjectId(null);
    }
  }, [isLoggedIn]);

  const activeProject = userProjects.find(p => p.id === activeProjectId) || userProjects[0] || null;

  const addProject = useCallback(async (name, description = '', password = '') => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const payload = {
        name,
        description,
        color: ['#6366f1','#14b8a6','#ec4899','#f59e0b','#ef4444','#22c55e','#a855f7','#3b82f6'][Math.floor(Math.random() * 8)],
        status: 'active',
        project_type: 'kanban',
      };
      if (password) payload.password = password;
      const data = await projectsApi.create(payload);
      const newProject = data.project;
      setUserProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      toast.success(tt.projectCreateSuccess);
      return newProject;
    } catch (err) {
      toast.error(tt.projectCreateFailed + ': ' + err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      await projectsApi.destroy(projectId);
      setUserProjects(prev => prev.filter(p => p.id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }
      toast.success(tt.projectDeleteSuccess || (t.sidebar ? 'Project deleted' : 'Project deleted'));
      await fetchProjects();
    } catch (err) {
      toast.error(err.message || 'Failed to delete project');
      throw err;
    }
  }, [activeProjectId, toast, fetchProjects]);

  return (
    <ProjectContext.Provider value={{
      activeProject,
      activeProjectId,
      setActiveProjectId,
      userProjects,
      addProject,
      deleteProject,
      fetchProjects,
      loading,
      error,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
