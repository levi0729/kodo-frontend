import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import Dashboard from '@/pages/Dashboard';
import TeamsPage from '@/pages/Teams';
import TasksPage from '@/pages/Tasks';
import MessagesPage from '@/pages/Messages';
import CalendarPage from '@/pages/Calendar';
import SettingsPage from '@/pages/Settings';
import TimeTrackingPage from '@/pages/TimeTracking';
import FriendsPage from '@/pages/Friends';
import ActivityLogPage from '@/pages/ActivityLog';
import AuthPage from '@/pages/AuthPage';
import ServerStatusBanner from '@/components/ServerStatusBanner';
import { ProjectProvider } from '@/context/ProjectContext';
import { MessagesProvider } from '@/context/MessagesContext';
import { TasksProvider } from '@/context/TasksContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/Toast';

const PAGE_ROUTES = {
  dashboard: '/',
  teams: '/teams',
  task: '/tasks',
  messages: '/messages',
  calendar: '/calendar',
  settings: '/settings',
  'time-tracking': '/time-tracking',
  friends: '/friends',
  activity: '/activity',
};

const ROUTE_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_ROUTES).map(([k, v]) => [v, k])
);

function useAppNavigate() {
  const navigate = useNavigate();

  return useCallback((page, context = null) => {
    const base = PAGE_ROUTES[page] || '/';
    const params = new URLSearchParams();
    if (context?.teamId) params.set('teamId', context.teamId);
    if (context?.dmUserId) params.set('dmUserId', context.dmUserId);
    if (context?.channelId) params.set('channelId', context.channelId);
    if (context?.highlightTaskId) params.set('highlight', context.highlightTaskId);
    const qs = params.toString();
    navigate(qs ? `${base}?${qs}` : base);
  }, [navigate]);
}

function useActivePage() {
  const { pathname } = useLocation();
  return ROUTE_TO_PAGE[pathname] || 'dashboard';
}

function MessagesWrapper() {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('teamId');
  const dmUserId = searchParams.get('dmUserId');
  const channelId = searchParams.get('channelId');
  return (
    <MessagesPage
      key={`${teamId || 'default'}-${channelId || ''}-${dmUserId || ''}`}
      dmUserId={dmUserId ? Number(dmUserId) : undefined}
      teamId={teamId ? Number(teamId) : undefined}
      channelId={channelId || undefined}
    />
  );
}

function TasksWrapper() {
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('highlight');
  return <TasksPage highlightTaskId={highlight ? Number(highlight) : undefined} />;
}

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn } = useAuth();
  const handleNavigate = useAppNavigate();
  const activePage = useActivePage();

  if (!isLoggedIn) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-kodo-bg text-kodo-text overflow-hidden">
      <ServerStatusBanner />
      <Sidebar activePage={activePage} onNavigate={handleNavigate} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar activePage={activePage} onMenuToggle={() => setMobileMenuOpen(prev => !prev)} />

        <div className="flex-1 overflow-y-auto px-3 py-3 md:px-8 md:py-6">
          <Routes>
            <Route path="/" element={<Dashboard onNavigate={handleNavigate} />} />
            <Route path="/teams" element={<TeamsPage onNavigate={handleNavigate} />} />
            <Route path="/tasks" element={<TasksWrapper />} />
            <Route path="/messages" element={<MessagesWrapper />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/time-tracking" element={<TimeTrackingPage />} />
            <Route path="/friends" element={<FriendsPage onNavigate={handleNavigate} />} />
            <Route path="/activity" element={<ActivityLogPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
