import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Dashboard from '@/pages/Dashboard';
import TeamsPage from '@/pages/Teams';
import TasksPage from '@/pages/Tasks';
import MessagesPage from '@/pages/Messages';
import CalendarPage from '@/pages/Calendar';
import SettingsPage from '@/pages/Settings';
import AuthPage from '@/pages/AuthPage';
import ServerStatusBanner from '@/components/ServerStatusBanner';
import { ProjectProvider } from '@/context/ProjectContext';
import { MessagesProvider } from '@/context/MessagesContext';
import { TasksProvider } from '@/context/TasksContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/Toast';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [navContext, setNavContext] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn } = useAuth();

  const handleNavigate = useCallback((page, context = null) => {
    setActivePage(page);
    setNavContext(context);
    setMobileMenuOpen(false);
  }, []);

  if (!isLoggedIn) {
    return <AuthPage />;
  }

  const pages = {
    dashboard: <Dashboard onNavigate={handleNavigate} />,
    teams: <TeamsPage onNavigate={handleNavigate} />,
    task: <TasksPage highlightTaskId={navContext?.highlightTaskId} />,
    messages: <MessagesPage key={`${navContext?.teamId || 'default'}-${navContext?.channelId || ''}-${navContext?.dmUserId || ''}`} dmUserId={navContext?.dmUserId} teamId={navContext?.teamId} channelId={navContext?.channelId} />,
    calendar: <CalendarPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className="flex h-screen bg-kodo-bg text-kodo-text overflow-hidden">
      <ServerStatusBanner />
      <Sidebar activePage={activePage} onNavigate={handleNavigate} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar activePage={activePage} onMenuToggle={() => setMobileMenuOpen(prev => !prev)} />

        <div className="flex-1 overflow-y-auto px-3 py-3 md:px-8 md:py-6">
          {pages[activePage] || pages.dashboard}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <TasksProvider>
              <MessagesProvider>
                <AppContent />
              </MessagesProvider>
            </TasksProvider>
          </ProjectProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
