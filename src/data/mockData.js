export const USERS = [
  { id: 1, email: 'anna@kodo.io', username: 'anna.kovacs', display_name: 'Kovács Anna', job_title: 'Lead Designer', department: 'Design', avatar_url: null, presence_status: 'online', presence_message: 'Designing the future ✨', is_active: true },
  { id: 2, email: 'marton@kodo.io', username: 'marton.szabo', display_name: 'Szabó Márton', job_title: 'Frontend Developer', department: 'Engineering', avatar_url: null, presence_status: 'online', presence_message: '', is_active: true },
  { id: 3, email: 'eszter@kodo.io', username: 'eszter.toth', display_name: 'Tóth Eszter', job_title: 'Product Manager', department: 'Product', avatar_url: null, presence_status: 'away', presence_message: 'In a meeting', is_active: true },
  { id: 4, email: 'bence@kodo.io', username: 'bence.nagy', display_name: 'Nagy Bence', job_title: 'Backend Developer', department: 'Engineering', avatar_url: null, presence_status: 'offline', presence_message: '', is_active: true },
  { id: 5, email: 'lilla@kodo.io', username: 'lilla.varga', display_name: 'Varga Lilla', job_title: 'QA Engineer', department: 'Engineering', avatar_url: null, presence_status: 'dnd', presence_message: 'Deep work', is_active: true },
  { id: 6, email: 'daniel@kodo.io', username: 'daniel.kiss', display_name: 'Kiss Dániel', job_title: 'DevOps Engineer', department: 'Infrastructure', avatar_url: null, presence_status: 'online', presence_message: '', is_active: true },
];

export const CURRENT_USER = USERS[0];

export const ORGANIZATION = {
  id: 1,
  name: 'Kodo Labs',
  slug: 'kodo-labs',
  logo_url: null,
  domain: 'kodo.io',
  plan_type: 'business',
  max_members: 50,
};

export const TEAMS = [
  { id: 1, organization_id: 1, name: 'Product Team', slug: 'product', description: 'Core product development', color: '#6366f1', visibility: 'public', members: [1, 2, 3, 4], is_archived: false, created_by: 3 },
  { id: 2, organization_id: 1, name: 'Design Studio', slug: 'design', description: 'UI/UX design & branding', color: '#ec4899', visibility: 'public', members: [1, 3, 5], is_archived: false, created_by: 1 },
  { id: 3, organization_id: 1, name: 'Infrastructure', slug: 'infra', description: 'DevOps & cloud infra', color: '#14b8a6', visibility: 'private', members: [4, 6], is_archived: false, created_by: 6 },
  { id: 4, organization_id: 1, name: 'Marketing', slug: 'marketing', description: 'Growth & marketing', color: '#f59e0b', visibility: 'public', members: [3, 5], is_archived: false, created_by: 3 },
];

export const PROJECTS = [
  { id: 1, team_id: 1, name: 'Kodo v2.0 Redesign', slug: 'kodo-v2', description: 'Complete platform redesign with new features', color: '#6366f1', project_type: 'kanban', status: 'active', start_date: '2026-01-15', target_end_date: '2026-04-30', created_by: 3, progress: 68 },
  { id: 2, team_id: 1, name: 'API Gateway', slug: 'api-gateway', description: 'New API gateway with rate limiting and caching', color: '#14b8a6', project_type: 'kanban', status: 'active', start_date: '2026-02-01', target_end_date: '2026-05-15', created_by: 4, progress: 42 },
  { id: 3, team_id: 2, name: 'Brand Refresh', slug: 'brand-refresh', description: 'Complete brand identity overhaul', color: '#ec4899', project_type: 'kanban', status: 'active', start_date: '2026-01-01', target_end_date: '2026-03-31', created_by: 1, progress: 85 },
  { id: 4, team_id: 3, name: 'K8s Migration', slug: 'k8s-migration', description: 'Migrate services to Kubernetes', color: '#f59e0b', project_type: 'kanban', status: 'planning', start_date: '2026-03-01', target_end_date: '2026-06-30', created_by: 6, progress: 15 },
];

export const TASK_BUCKETS = [
  { id: 1, project_id: 1, name: 'Teendő', color: '#94a3b8', position: 0, wip_limit: 10, key: 'todo' },
  { id: 2, project_id: 1, name: 'Folyamatban', color: '#818cf8', position: 1, wip_limit: 5, key: 'in_progress' },
  { id: 3, project_id: 1, name: 'Review', color: '#fbbf24', position: 2, wip_limit: 3, key: 'in_review' },
  { id: 4, project_id: 1, name: 'Kész', color: '#4ade80', position: 3, wip_limit: null, key: 'done' },
];

export const TASKS = [
  { id: 1, project_id: 1, bucket_id: 2, title: 'Design System Update', description: 'Update all design tokens and component library', status: 'in_progress', priority: 'high', due_date: '2026-03-20', estimated_hours: 24, actual_hours: 14, progress: 60, labels: ['design', 'urgent'], created_by: 3, assignees: [1, 2] },
  { id: 2, project_id: 1, bucket_id: 2, title: 'Dashboard Components', description: 'Build dashboard widget components', status: 'in_progress', priority: 'medium', due_date: '2026-03-25', estimated_hours: 32, actual_hours: 11, progress: 35, labels: ['frontend'], created_by: 3, assignees: [2] },
  { id: 3, project_id: 1, bucket_id: 4, title: 'User Auth Flow', description: 'Implement authentication with OAuth', status: 'done', priority: 'high', due_date: '2026-03-10', estimated_hours: 16, actual_hours: 14, progress: 100, labels: ['backend', 'security'], created_by: 3, assignees: [4] },
  { id: 9, project_id: 1, bucket_id: 1, title: 'Notification System', description: 'Real-time notification engine', status: 'todo', priority: 'medium', due_date: '2026-04-10', estimated_hours: 20, actual_hours: 0, progress: 0, labels: ['fullstack'], created_by: 3, assignees: [2, 4] },
  { id: 10, project_id: 1, bucket_id: 3, title: 'Mobile Responsive', description: 'Make all pages responsive for mobile', status: 'in_review', priority: 'high', due_date: '2026-03-22', estimated_hours: 18, actual_hours: 16, progress: 90, labels: ['frontend'], created_by: 3, assignees: [2] },
  { id: 11, project_id: 1, bucket_id: 2, title: 'Sidebar Navigation', description: 'Collapsible sidebar with project switching', status: 'in_progress', priority: 'medium', due_date: '2026-03-18', estimated_hours: 8, actual_hours: 5, progress: 65, labels: ['frontend', 'ux'], created_by: 1, assignees: [1] },
  { id: 12, project_id: 1, bucket_id: 1, title: 'Dark Mode Toggle', description: 'Add theme switching functionality', status: 'todo', priority: 'low', due_date: '2026-04-15', estimated_hours: 6, actual_hours: 0, progress: 0, labels: ['frontend'], created_by: 2, assignees: [2] },
  { id: 4, project_id: 2, bucket_id: 1, title: 'Rate Limiting', description: 'Implement token bucket rate limiter', status: 'todo', priority: 'medium', due_date: '2026-03-28', estimated_hours: 14, actual_hours: 0, progress: 0, labels: ['backend'], created_by: 4, assignees: [4, 6] },
  { id: 5, project_id: 2, bucket_id: 2, title: 'API Documentation', description: 'OpenAPI 3.0 spec and interactive docs', status: 'in_progress', priority: 'low', due_date: '2026-04-05', estimated_hours: 12, actual_hours: 2, progress: 20, labels: ['docs'], created_by: 3, assignees: [3] },
  { id: 13, project_id: 2, bucket_id: 2, title: 'Request Validation', description: 'Schema-based request validation middleware', status: 'in_progress', priority: 'high', due_date: '2026-03-22', estimated_hours: 10, actual_hours: 6, progress: 55, labels: ['backend'], created_by: 4, assignees: [4] },
  { id: 6, project_id: 3, bucket_id: 4, title: 'Logo Variations', description: 'Create logo in all required formats', status: 'done', priority: 'high', due_date: '2026-03-05', estimated_hours: 20, actual_hours: 18, progress: 100, labels: ['design'], created_by: 1, assignees: [1] },
  { id: 7, project_id: 3, bucket_id: 2, title: 'Style Guide PDF', description: 'Comprehensive brand style guide document', status: 'in_progress', priority: 'medium', due_date: '2026-03-18', estimated_hours: 16, actual_hours: 11, progress: 70, labels: ['design', 'docs'], created_by: 1, assignees: [1, 5] },
  { id: 14, project_id: 3, bucket_id: 3, title: 'Social Media Kit', description: 'Templates for all social platforms', status: 'in_review', priority: 'medium', due_date: '2026-03-20', estimated_hours: 12, actual_hours: 10, progress: 85, labels: ['design'], created_by: 1, assignees: [1] },
  { id: 8, project_id: 4, bucket_id: 1, title: 'Cluster Setup', description: 'Provision production K8s cluster', status: 'todo', priority: 'high', due_date: '2026-04-01', estimated_hours: 30, actual_hours: 0, progress: 0, labels: ['infra'], created_by: 6, assignees: [6] },
];

export const TASK_CHECKLISTS = [
  { id: 1, task_id: 1, title: 'Design System Checklist', items: [
    { id: 1, title: 'Update color tokens', is_completed: true },
    { id: 2, title: 'Typography scale', is_completed: true },
    { id: 3, title: 'Component inventory', is_completed: false },
    { id: 4, title: 'Icon set update', is_completed: false },
  ]},
];

export const CHANNELS = [
  { id: 1, team_id: 1, name: 'general', slug: 'general', description: 'General discussion', channel_type: 'public', is_default: true, allow_threads: true, allow_reactions: true },
  { id: 2, team_id: 1, name: 'design', slug: 'design', description: 'Design discussions', channel_type: 'public', is_default: false, allow_threads: true, allow_reactions: true },
  { id: 3, team_id: 1, name: 'engineering', slug: 'engineering', description: 'Engineering updates', channel_type: 'public', is_default: false, allow_threads: true, allow_reactions: true },
  { id: 4, team_id: 1, name: 'random', slug: 'random', description: 'Off-topic fun', channel_type: 'public', is_default: false, allow_threads: true, allow_reactions: true },
  { id: 5, team_id: 2, name: 'general', slug: 'design-general', description: 'Design team general', channel_type: 'public', is_default: true, allow_threads: true, allow_reactions: true },
];

export const MESSAGES = [
  { id: 1, channel_id: 1, sender_id: 2, content: 'A dashboard komponensek majdnem készen vannak! 🎉', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-14T09:30:00', reactions: [{ emoji: '🔥', users: [1, 3] }] },
  { id: 2, channel_id: 1, sender_id: 3, content: 'Szuper! A sprintet pénteken zárjuk, ugye?', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-14T09:32:00', reactions: [] },
  { id: 3, channel_id: 1, sender_id: 1, content: 'Igen, pénteken demo is lesz a stakeholdereknek. Készítsük elő a prezentációt.', content_type: 'text', is_pinned: true, is_edited: false, created_at: '2026-03-14T09:35:00', reactions: [{ emoji: '👍', users: [2, 3, 4] }] },
  { id: 4, channel_id: 1, sender_id: 4, content: 'Az API endpointokat ma pusholom stagingre. A rate limiter teszteket holnap futtatom.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-14T10:15:00', reactions: [] },
  { id: 5, channel_id: 1, sender_id: 6, content: 'A staging environment frissítve, nyugodtan deployolhattok. Monitoring dashboardot is beállítottam.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-14T10:45:00', reactions: [{ emoji: '🚀', users: [2, 4] }] },
  { id: 6, channel_id: 1, sender_id: 5, content: 'A QA teszteket futtatom a friss builden, eredmények 2 órán belül lesznek.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-14T11:00:00', reactions: [{ emoji: '💪', users: [3] }] },
  { id: 7, channel_id: 1, sender_id: 1, content: 'Köszi mindenkinek a munkát! Ha valaki ráér, nézze meg a Figma-ban az új sidebar mockupokat.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-14T11:20:00', reactions: [{ emoji: '👀', users: [2] }, { emoji: '✨', users: [3, 5] }] },
  { id: 8, channel_id: 1, sender_id: 2, content: 'Épp nézem a mockupokat, nagyon jól néznek ki! A színek passzolnak a brandhez.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-13T16:45:00', reactions: [{ emoji: '🎨', users: [1] }] },
  { id: 9, channel_id: 1, sender_id: 3, content: 'Köszönöm! A hétvégén dolgoztam rajta egy kicsit. Mit gondoltok a új ikonokról?', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-13T17:00:00', reactions: [{ emoji: '👍', users: [2, 4] }] },
  { id: 10, channel_id: 1, sender_id: 4, content: 'Az ikonok szuperül illeszkednek. A backend API-k készen vannak a következő sprinthez.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-13T17:15:00', reactions: [] },
  { id: 11, channel_id: 1, sender_id: 5, content: 'Tesztelési tervet készítettem az új funkciókra. Holnap megbeszéljük?', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-13T17:30:00', reactions: [{ emoji: '✅', users: [3] }] },
  { id: 12, channel_id: 1, sender_id: 6, content: 'A deployment scriptet frissítettem, most már automatikusan skálázódik.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-12T14:20:00', reactions: [{ emoji: '⚙️', users: [4] }] },
  { id: 13, channel_id: 1, sender_id: 1, content: 'Nagyszerű munka mindenki! A projekt jól halad, büszke vagyok a csapatra.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-12T14:45:00', reactions: [{ emoji: '🙌', users: [2, 3, 5] }] },
  { id: 14, channel_id: 1, sender_id: 2, content: 'A mobil responsive design majdnem kész, csak pár breakpointet kell finomítani.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-12T15:00:00', reactions: [] },
  { id: 15, channel_id: 1, sender_id: 3, content: 'A stakeholder meeting jól sikerült, pozitív visszajelzéseket kaptunk.', content_type: 'text', is_pinned: false, is_edited: false, created_at: '2026-03-11T11:30:00', reactions: [{ emoji: '🎯', users: [1, 4] }] },
];

export const CALENDAR_EVENTS = [
  { id: 1, team_id: 1, organizer_id: 3, title: 'Sprint Planning', description: 'Plan sprint 12 tasks', location: '', is_online_meeting: true, meeting_url: 'https://meet.kodo.io/sprint', start_time: '2026-03-16T09:00:00', end_time: '2026-03-16T10:30:00', is_all_day: false, status: 'confirmed', reminder_minutes: 15, color: '#6366f1', attendees: [1, 2, 3, 4] },
  { id: 2, team_id: 1, organizer_id: 1, title: 'Design Review', description: 'Review new component designs', location: '', is_online_meeting: true, meeting_url: 'https://meet.kodo.io/design', start_time: '2026-03-17T14:00:00', end_time: '2026-03-17T15:00:00', is_all_day: false, status: 'confirmed', reminder_minutes: 10, color: '#ec4899', attendees: [1, 2, 3] },
  { id: 3, team_id: 1, organizer_id: 4, title: 'API Architecture Discussion', description: 'Discuss API gateway patterns', location: 'Meeting Room B', is_online_meeting: false, meeting_url: '', start_time: '2026-03-16T13:00:00', end_time: '2026-03-16T14:00:00', is_all_day: false, status: 'confirmed', reminder_minutes: 15, color: '#14b8a6', attendees: [4, 6, 3] },
  { id: 4, team_id: 1, organizer_id: 3, title: '1:1 Anna & Eszter', description: 'Weekly sync', location: '', is_online_meeting: true, meeting_url: 'https://meet.kodo.io/1on1', start_time: '2026-03-18T10:00:00', end_time: '2026-03-18T10:30:00', is_all_day: false, status: 'confirmed', reminder_minutes: 5, color: '#f59e0b', attendees: [1, 3] },
  { id: 5, team_id: 1, organizer_id: 2, title: 'Frontend Standup', description: 'Daily standup', location: '', is_online_meeting: true, meeting_url: 'https://meet.kodo.io/standup', start_time: '2026-03-17T09:00:00', end_time: '2026-03-17T09:30:00', is_all_day: false, status: 'confirmed', reminder_minutes: 5, color: '#818cf8', attendees: [1, 2, 5] },
  { id: 6, team_id: 1, organizer_id: 3, title: 'Stakeholder Demo', description: 'Sprint demo to stakeholders', location: 'Conference Room A', is_online_meeting: false, meeting_url: '', start_time: '2026-03-21T11:00:00', end_time: '2026-03-21T12:00:00', is_all_day: false, status: 'confirmed', reminder_minutes: 30, color: '#ef4444', attendees: [1, 2, 3, 4, 5, 6] },
  { id: 7, team_id: 1, organizer_id: 5, title: 'QA Review Session', description: 'Review test results', location: '', is_online_meeting: true, meeting_url: 'https://meet.kodo.io/qa', start_time: '2026-03-19T15:00:00', end_time: '2026-03-19T16:00:00', is_all_day: false, status: 'confirmed', reminder_minutes: 10, color: '#22c55e', attendees: [2, 4, 5] },
  { id: 8, team_id: 1, organizer_id: 6, title: 'DevOps Planning', description: 'K8s migration planning', location: '', is_online_meeting: true, meeting_url: 'https://meet.kodo.io/devops', start_time: '2026-03-20T09:00:00', end_time: '2026-03-20T10:00:00', is_all_day: false, status: 'confirmed', reminder_minutes: 15, color: '#f59e0b', attendees: [4, 6] },
  { id: 9, team_id: 1, organizer_id: 1, title: 'Brand Sync', description: 'Brand refresh progress sync', location: '', is_online_meeting: true, meeting_url: '', start_time: '2026-03-18T14:00:00', end_time: '2026-03-18T15:00:00', is_all_day: false, status: 'confirmed', reminder_minutes: 10, color: '#ec4899', attendees: [1, 3, 5] },
  { id: 10, team_id: 1, organizer_id: 2, title: 'Code Review', description: 'Review dashboard PRs', location: '', is_online_meeting: true, meeting_url: '', start_time: '2026-03-19T10:00:00', end_time: '2026-03-19T11:00:00', is_all_day: false, status: 'confirmed', reminder_minutes: 10, color: '#6366f1', attendees: [1, 2, 4] },
  { id: 11, team_id: 1, organizer_id: 3, title: 'Retro', description: 'Sprint retrospective', location: 'Conference Room A', is_online_meeting: false, meeting_url: '', start_time: '2026-03-21T14:00:00', end_time: '2026-03-21T15:30:00', is_all_day: false, status: 'confirmed', reminder_minutes: 15, color: '#a855f7', attendees: [1, 2, 3, 4, 5] },
  { id: 12, team_id: 1, organizer_id: 2, title: 'Frontend Standup', description: 'Daily standup', location: '', is_online_meeting: true, meeting_url: '', start_time: '2026-03-18T09:00:00', end_time: '2026-03-18T09:30:00', is_all_day: false, status: 'confirmed', reminder_minutes: 5, color: '#818cf8', attendees: [1, 2, 5] },
  { id: 13, team_id: 1, organizer_id: 2, title: 'Frontend Standup', description: 'Daily standup', location: '', is_online_meeting: true, meeting_url: '', start_time: '2026-03-19T09:00:00', end_time: '2026-03-19T09:30:00', is_all_day: false, status: 'confirmed', reminder_minutes: 5, color: '#818cf8', attendees: [1, 2, 5] },
  { id: 14, team_id: 1, organizer_id: 2, title: 'Frontend Standup', description: 'Daily standup', location: '', is_online_meeting: true, meeting_url: '', start_time: '2026-03-20T09:30:00', end_time: '2026-03-20T10:00:00', is_all_day: false, status: 'confirmed', reminder_minutes: 5, color: '#818cf8', attendees: [1, 2, 5] },
];

export const FILES = [
  { id: 1, team_id: 1, name: 'Brand Guidelines v3.pdf', file_type: 'pdf', mime_type: 'application/pdf', size_bytes: 4404019, uploaded_by: 1, created_at: '2026-03-12', version: 3 },
  { id: 2, team_id: 1, name: 'API Specification.md', file_type: 'md', mime_type: 'text/markdown', size_bytes: 131072, uploaded_by: 4, created_at: '2026-03-13', version: 2 },
  { id: 3, team_id: 1, name: 'Sprint Retrospective.docx', file_type: 'docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size_bytes: 57344, uploaded_by: 3, created_at: '2026-03-11', version: 1 },
  { id: 4, team_id: 1, name: 'Dashboard Mockup.fig', file_type: 'fig', mime_type: 'application/octet-stream', size_bytes: 19398656, uploaded_by: 1, created_at: '2026-03-14', version: 5 },
  { id: 5, team_id: 1, name: 'Deployment Script.sh', file_type: 'sh', mime_type: 'text/x-shellscript', size_bytes: 2150, uploaded_by: 6, created_at: '2026-03-10', version: 1 },
  { id: 6, team_id: 1, name: 'Q1 Report.xlsx', file_type: 'xlsx', mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size_bytes: 911360, uploaded_by: 3, created_at: '2026-03-09', version: 1 },
  { id: 7, team_id: 1, name: 'Logo Pack.zip', file_type: 'zip', mime_type: 'application/zip', size_bytes: 33554432, uploaded_by: 1, created_at: '2026-03-08', version: 1 },
  { id: 8, team_id: 1, name: 'Architecture Diagram.png', file_type: 'png', mime_type: 'image/png', size_bytes: 1468006, uploaded_by: 4, created_at: '2026-03-07', version: 2 },
  { id: 9, team_id: 2, name: 'Color Palette.sketch', file_type: 'sketch', mime_type: 'application/octet-stream', size_bytes: 8388608, uploaded_by: 1, created_at: '2026-03-06', version: 3 },
  { id: 10, team_id: 1, name: 'Onboarding Deck.pptx', file_type: 'pptx', mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size_bytes: 5242880, uploaded_by: 3, created_at: '2026-03-05', version: 1 },
];

export const NOTIFICATIONS = [
  { id: 1, user_id: 1, notification_type: 'task_assigned', actor_id: 3, team_id: 1, task_id: 1, title: 'Új feladat hozzárendelve', body: 'Design System Update — határidő: márc. 20.', is_read: false },
  { id: 2, user_id: 1, notification_type: 'mention', actor_id: 2, team_id: 1, message_id: 1, title: 'Megemlítettek a #general csatornán', body: '@Anna kérlek nézd meg a mockupokat', is_read: false },
  { id: 3, user_id: 1, notification_type: 'event_reminder', actor_id: 3, team_id: 1, title: 'Sprint Planning holnap', body: 'Hétfő 9:00 - 10:30', is_read: true },
  { id: 4, user_id: 1, notification_type: 'task_completed', actor_id: 4, team_id: 1, task_id: 3, title: 'Feladat befejezve', body: 'User Auth Flow — lezárva', is_read: true },
  { id: 5, user_id: 1, notification_type: 'file_shared', actor_id: 6, team_id: 1, title: 'Fájl megosztva', body: 'Deployment Script.sh — megosztva veled', is_read: false },
];

export const TIME_ENTRIES = [
  { id: 1, user_id: 1, task_id: 1, project_id: 1, start_time: '2026-03-09T09:00:00', duration_minutes: 180, day: 'H' },
  { id: 2, user_id: 2, task_id: 2, project_id: 1, start_time: '2026-03-09T09:00:00', duration_minutes: 300, day: 'H' },
  { id: 3, user_id: 4, task_id: 3, project_id: 1, start_time: '2026-03-09T10:00:00', duration_minutes: 240, day: 'H' },
  { id: 4, user_id: 3, task_id: 9, project_id: 1, start_time: '2026-03-09T14:00:00', duration_minutes: 120, day: 'H' },
  { id: 5, user_id: 1, task_id: 1, project_id: 1, start_time: '2026-03-10T09:00:00', duration_minutes: 240, day: 'K' },
  { id: 6, user_id: 2, task_id: 2, project_id: 1, start_time: '2026-03-10T09:00:00', duration_minutes: 360, day: 'K' },
  { id: 7, user_id: 4, task_id: 3, project_id: 1, start_time: '2026-03-10T10:00:00', duration_minutes: 300, day: 'K' },
  { id: 8, user_id: 1, task_id: 11, project_id: 1, start_time: '2026-03-11T09:00:00', duration_minutes: 300, day: 'Sze' },
  { id: 9, user_id: 2, task_id: 10, project_id: 1, start_time: '2026-03-11T09:00:00', duration_minutes: 420, day: 'Sze' },
  { id: 10, user_id: 4, task_id: 3, project_id: 1, start_time: '2026-03-11T10:00:00', duration_minutes: 180, day: 'Sze' },
  { id: 11, user_id: 3, task_id: 9, project_id: 1, start_time: '2026-03-11T13:00:00', duration_minutes: 180, day: 'Sze' },
  { id: 12, user_id: 1, task_id: 1, project_id: 1, start_time: '2026-03-12T09:00:00', duration_minutes: 360, day: 'Cs' },
  { id: 13, user_id: 2, task_id: 10, project_id: 1, start_time: '2026-03-12T09:00:00', duration_minutes: 480, day: 'Cs' },
  { id: 14, user_id: 1, task_id: 11, project_id: 1, start_time: '2026-03-13T09:00:00', duration_minutes: 240, day: 'P' },
  { id: 15, user_id: 2, task_id: 2, project_id: 1, start_time: '2026-03-13T09:00:00', duration_minutes: 300, day: 'P' },
  { id: 16, user_id: 4, task_id: 9, project_id: 1, start_time: '2026-03-13T10:00:00', duration_minutes: 180, day: 'P' },
  { id: 17, user_id: 4, task_id: 13, project_id: 2, start_time: '2026-03-09T09:00:00', duration_minutes: 300, day: 'H' },
  { id: 18, user_id: 6, task_id: 4, project_id: 2, start_time: '2026-03-10T09:00:00', duration_minutes: 360, day: 'K' },
  { id: 19, user_id: 4, task_id: 13, project_id: 2, start_time: '2026-03-11T09:00:00', duration_minutes: 240, day: 'Sze' },
  { id: 20, user_id: 3, task_id: 5, project_id: 2, start_time: '2026-03-12T09:00:00', duration_minutes: 180, day: 'Cs' },
  { id: 21, user_id: 6, task_id: 4, project_id: 2, start_time: '2026-03-13T09:00:00', duration_minutes: 420, day: 'P' },
  { id: 22, user_id: 1, task_id: 7, project_id: 3, start_time: '2026-03-09T14:00:00', duration_minutes: 180, day: 'H' },
  { id: 23, user_id: 5, task_id: 7, project_id: 3, start_time: '2026-03-10T09:00:00', duration_minutes: 300, day: 'K' },
  { id: 24, user_id: 1, task_id: 14, project_id: 3, start_time: '2026-03-11T14:00:00', duration_minutes: 240, day: 'Sze' },
  { id: 25, user_id: 1, task_id: 14, project_id: 3, start_time: '2026-03-12T14:00:00', duration_minutes: 180, day: 'Cs' },
  { id: 26, user_id: 5, task_id: 7, project_id: 3, start_time: '2026-03-13T09:00:00', duration_minutes: 360, day: 'P' },
];

export const FRIENDSHIPS = [
  { id: 1, requester_id: 1, addressee_id: 2, status: 'accepted' },
  { id: 2, requester_id: 1, addressee_id: 3, status: 'accepted' },
  { id: 3, requester_id: 2, addressee_id: 4, status: 'accepted' },
  { id: 4, requester_id: 5, addressee_id: 1, status: 'pending' },
];

/* Helpers */

export function getUserById(id) {
  return USERS.find(u => u.id === id);
}

export function getTeamById(id) {
  return TEAMS.find(t => t.id === id);
}

export function getProjectById(id) {
  return PROJECTS.find(p => p.id === id);
}

export function getProjectsByUser(userId) {
  return PROJECTS.filter(p => {
    const team = TEAMS.find(t => t.id === p.team_id);
    return team && team.members.includes(userId);
  });
}

export function getTasksByProject(projectId) {
  return TASKS.filter(t => t.project_id === projectId);
}

export function getTasksByUser(userId, projectId = null) {
  let tasks = TASKS.filter(t => t.assignees.includes(userId));
  if (projectId) tasks = tasks.filter(t => t.project_id === projectId);
  return tasks;
}

export function getTeamMembersByProject(projectId) {
  const project = getProjectById(projectId);
  if (!project) return [];
  const team = getTeamById(project.team_id);
  if (!team) return [];
  return team.members.map(id => getUserById(id)).filter(Boolean);
}

export function getTimeEntriesByProject(projectId) {
  return TIME_ENTRIES.filter(e => e.project_id === projectId);
}

export function getEventsByProject(projectId) {
  const project = getProjectById(projectId);
  if (!project) return CALENDAR_EVENTS;
  return CALENDAR_EVENTS.filter(e => e.team_id === project.team_id);
}

export function getChannelsByTeam(teamId) {
  return CHANNELS.filter(c => c.team_id === teamId);
}

export function getTeamsByUser(userId) {
  return TEAMS.filter(t => t.members.includes(userId));
}

export function getFilesByTeam(teamId) {
  return FILES.filter(f => f.team_id === teamId);
}

export function formatFileSize(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return bytes + ' B';
}

export function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date(2026, 2, 14);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}
