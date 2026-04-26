import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import SearchModal from '@/components/SearchModal';
import AuthPage from '@/pages/AuthPage';
import ErrorBoundary from '@/components/ErrorBoundary';
import ServerStatusBanner from '@/components/ServerStatusBanner';

// Lazy-loaded pages for code-splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const TeamsPage = lazy(() => import('@/pages/Teams'));
const TasksPage = lazy(() => import('@/pages/Tasks'));
const MessagesPage = lazy(() => import('@/pages/Messages'));
const CalendarPage = lazy(() => import('@/pages/Calendar'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const TimeTrackingPage = lazy(() => import('@/pages/TimeTracking'));
const FriendsPage = lazy(() => import('@/pages/Friends'));
const OrganizationsPage = lazy(() => import('@/pages/Organizations'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
import { ProjectProvider, useProject } from '@/context/ProjectContext';
import { MessagesProvider } from '@/context/MessagesContext';
import { AppDataProvider } from '@/context/AppDataContext';
import { TasksProvider } from '@/context/TasksContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import { participants as participantsApi } from '@/services/api';

const PAGE_ROUTES = {
  dashboard: '/',
  teams: '/teams',
  task: '/tasks',
  messages: '/messages',
  calendar: '/calendar',
  settings: '/settings',
  'time-tracking': '/time-tracking',
  friends: '/friends',
  organizations: '/organizations',
  profile: '/profile',
};

const ROUTE_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_ROUTES).map(([k, v]) => [v, k])
);

function useAppNavigate() {
  const navigate = useNavigate();

  return useCallback((page, context = null) => {
    // Special case: navigate to another user's profile
    if (page === 'profile-view' && context?.userId) {
      navigate(`/profile/${context.userId}`);
      return;
    }
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const { isLoggedIn } = useAuth();
  const handleNavigate = useAppNavigate();
  const activePage = useActivePage();

  useEffect(() => {
    if (!isLoggedIn) return;
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isLoggedIn]);

  const { activeProject } = useProject();
  useEffect(() => {
    if (!isLoggedIn || !activeProject?.id) return;
    participantsApi.list('project', activeProject.id)
      .then(data => setTeamMembers((data.participants || data.data || []).map(p => p.user || p)))
      .catch(() => {});
  }, [isLoggedIn, activeProject?.id]);

  if (!isLoggedIn) {
    return <AuthPage />;
  }

  return (
    <div className="flex h-screen bg-kodo-bg text-kodo-text overflow-hidden">
      <ServerStatusBanner />
      <Sidebar activePage={activePage} onNavigate={handleNavigate} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNavigate}
        teamMembers={teamMembers}
      />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar activePage={activePage} onMenuToggle={() => setMobileMenuOpen(prev => !prev)} onSearchOpen={() => setSearchOpen(true)} onNavigate={handleNavigate} />

        <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4 md:px-8 md:py-6" style={{ overscrollBehaviorY: 'contain' }}>
          <ErrorBoundary>
            <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>}>
              <Routes>
                <Route path="/" element={<Dashboard onNavigate={handleNavigate} />} />
                <Route path="/teams" element={<TeamsPage onNavigate={handleNavigate} />} />
                <Route path="/tasks" element={<TasksWrapper />} />
                <Route path="/messages" element={<MessagesWrapper />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/time-tracking" element={<TimeTrackingPage />} />
                <Route path="/friends" element={<FriendsPage onNavigate={handleNavigate} />} />
                <Route path="/organizations" element={<OrganizationsPage />} />
                <Route path="/profile" element={<ProfilePage onNavigate={handleNavigate} />} />
                <Route path="/profile/:userId" element={<ProfilePage onNavigate={handleNavigate} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
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
            <AppDataProvider>
              <ProjectProvider>
                <TasksProvider>
                  <MessagesProvider>
                    <AppContent />
                  </MessagesProvider>
                </TasksProvider>
              </ProjectProvider>
            </AppDataProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
