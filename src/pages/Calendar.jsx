import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Search,
  Video, MapPin, X, Clock, Users, Loader2, Pencil, Trash2
} from 'lucide-react';
import Avatar, { AvatarStack } from '@/components/Avatar';
import { useProject } from '@/context/ProjectContext';
import { calendarEvents as calendarApi, users as usersApi, participants as participantsApi } from '@/services/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const TOTAL_SPAN = HOURS.length;
const EVENT_COLORS = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#ef4444','#22c55e','#818cf8','#a855f7'];
const TODAY = new Date();

function getMonday(d) {
  const r = new Date(d);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  r.setHours(0, 0, 0, 0);
  return r;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function evtCategory(e) {
  if (e.type) return e.type;
  if (e.is_online_meeting) return 'meetings';
  if (e.location) return 'events';
  return 'meetings';
}

function getEventPos(event) {
  const s = new Date(event.start_time);
  const e = new Date(event.end_time);
  const sh = s.getHours() + s.getMinutes() / 60;
  const eh = e.getHours() + e.getMinutes() / 60;
  const dur = eh - sh;
  return {
    top: `${Math.max(0, (sh - HOURS[0]) / TOTAL_SPAN * 100)}%`,
    height: `${Math.max(2, dur / TOTAL_SPAN * 100)}%`,
    duration: dur,
  };
}

function getMonthWeeks(year, month) {
  const start = getMonday(new Date(year, month, 1));
  const days = [];
  const d = new Date(start);
  for (let i = 0; i < 42; i++) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  const weeks = [];
  for (let i = 0; i < 42; i += 7) weeks.push(days.slice(i, i + 7));
  while (weeks.length > 5 && weeks[weeks.length - 1].every(w => w.getMonth() !== month)) weeks.pop();
  return weeks;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* EventCard */
function EventCard({ event, pos, onSelect, getUserById }) {
  const s = new Date(event.start_time);
  const e = new Date(event.end_time);
  const startStr = s.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  const endStr = e.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  const isShort = pos.duration < 0.75;

  return (
    <div
      onClick={(ev) => { ev.stopPropagation(); onSelect(event); }}
      className="absolute left-1 right-1 rounded-lg px-2 cursor-pointer transition-all hover:brightness-125 hover:z-20 overflow-hidden z-10"
      style={{
        top: pos.top,
        height: pos.height,
        backgroundColor: event.color + '22',
        borderLeft: `3px solid ${event.color}`,
        display: 'flex',
        flexDirection: isShort ? 'row' : 'column',
        alignItems: isShort ? 'center' : 'flex-start',
        gap: isShort ? 6 : 0,
        paddingTop: isShort ? 0 : 4,
        paddingBottom: isShort ? 0 : 2,
      }}
    >
      {isShort ? (
        <>
          <span className="text-[9px] font-bold whitespace-nowrap flex-shrink-0" style={{ color: event.color }}>{startStr}</span>
          <span className="text-[10px] font-semibold text-white truncate">{event.title}</span>
        </>
      ) : (
        <>
          <div className="text-[9px] font-bold truncate w-full" style={{ color: event.color }}>
            {startStr} – {endStr}
          </div>
          <div className="text-[11px] font-semibold text-white truncate w-full mt-0.5">{event.title}</div>
          {pos.duration >= 1.25 && (event.is_online_meeting || event.location) && (
            <div className="flex items-center gap-1 mt-0.5">
              {event.is_online_meeting ? (
                <Video size={9} className="flex-shrink-0" style={{ color: event.color }} />
              ) : (
                <MapPin size={9} className="flex-shrink-0" style={{ color: event.color }} />
              )}
              <span className="text-[9px] text-kodo-text-dim truncate">
                {event.is_online_meeting ? 'Online' : event.location}
              </span>
            </div>
          )}
          {pos.duration >= 1.75 && (event.attendees || []).length > 0 && (
            <div className="mt-1">
              <AvatarStack users={(event.attendees || []).map(id => getUserById(id)).filter(Boolean)} size={14} max={3} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* EventDetailPopup */
function EventDetailPopup({ event, onClose, onEdit, onDelete, getUserById, currentUserId }) {
  const { t } = useTheme();
  const cal = t.calendarPage;
  const isOrganizer = event.organizer_id === currentUserId;
  const ref = useRef(null);
  const s = new Date(event.start_time);
  const e = new Date(event.end_time);
  const organizer = getUserById(event.organizer_id);
  const attendees = (event.attendees || []).map(id => getUserById(id)).filter(Boolean);
  const dateStr = `${s.getFullYear()}. ${cal.monthNames[s.getMonth()]} ${s.getDate()}.`;
  const dayName = cal.dayNames[(s.getDay() + 6) % 7];
  const timeStr = `${s.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })} – ${e.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}`;

  useEffect(() => {
    const handler = (ev) => { if (ref.current && !ref.current.contains(ev.target)) onClose(); };
    const escHandler = (ev) => { if (ev.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', escHandler); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div ref={ref} className="bg-[#1c1c26] border border-white/[0.1] rounded-xl w-full max-w-[380px] animate-fade-in-up shadow-2xl">
        <div className="h-1.5 rounded-t-xl" style={{ backgroundColor: event.color }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="text-[17px] font-bold text-white leading-snug">{event.title}</h3>
            <button onClick={onClose} className="text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none p-0 flex-shrink-0 mt-0.5">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-2.5">
              <Clock size={14} className="flex-shrink-0" style={{ color: event.color }} />
              <span className="text-[13px] text-kodo-text-secondary">{dateStr} {dayName}, {timeStr}</span>
            </div>
            {(event.is_online_meeting || event.location) && (
              <div className="flex items-center gap-2.5">
                {event.is_online_meeting ? (
                  <Video size={14} className="flex-shrink-0" style={{ color: event.color }} />
                ) : (
                  <MapPin size={14} className="flex-shrink-0" style={{ color: event.color }} />
                )}
                <span className="text-[13px] text-kodo-text-secondary">
                  {event.is_online_meeting ? (event.meeting_url || 'Online meeting') : event.location}
                </span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-[12px] text-kodo-text-muted leading-relaxed mb-4 border-t border-white/[0.06] pt-3">
              {event.description}
            </p>
          )}

          {organizer && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-kodo-text-dim uppercase tracking-wider mb-2">{cal.organizer}</div>
              <div className="flex items-center gap-2">
                <Avatar user={organizer} size={22} showStatus />
                <span className="text-[12px] text-kodo-text">{organizer.display_name}</span>
              </div>
            </div>
          )}

          {attendees.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-kodo-text-dim uppercase tracking-wider mb-2">
                <span className="inline-flex items-center gap-1"><Users size={10} /> {cal.attendees} ({attendees.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {attendees.map(u => (
                  <div key={u.id} className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.04] rounded-lg">
                    <Avatar user={u} size={18} />
                    <span className="text-[11px] text-kodo-text-secondary">{u.display_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOrganizer && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => { onEdit(event); onClose(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-[12px] font-medium cursor-pointer border-none hover:bg-indigo-500/20 transition-colors"
              >
                <Pencil size={13} />
                {cal.editEvent}
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-red-400 text-[12px] font-medium cursor-pointer border-none hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={13} />
                {cal.deleteEvent}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* NewEventModal */
function NewEventModal({ isOpen, onClose, onCreate, onUpdate, editEvent, activeProject, defaultDate, members }) {
  const { currentUser } = useAuth();
  const { t } = useTheme();
  const cal = t.calendarPage.newEventModal;
  const dateStr = defaultDate ? toDateStr(defaultDate) : toDateStr(new Date());
  const blankForm = {
    title: '', description: '', date: dateStr, startTime: '09:00', endTime: '10:00',
    location: '', isOnline: true, meetingUrl: '', color: EVENT_COLORS[0], attendees: [], type: 'meetings',
  };
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    if (isOpen && editEvent) {
      const s = new Date(editEvent.start_time);
      const e = new Date(editEvent.end_time);
      setForm({
        title: editEvent.title || '',
        description: editEvent.description || '',
        date: toDateStr(s),
        startTime: `${String(s.getHours()).padStart(2,'0')}:${String(s.getMinutes()).padStart(2,'0')}`,
        endTime: `${String(e.getHours()).padStart(2,'0')}:${String(e.getMinutes()).padStart(2,'0')}`,
        location: editEvent.location || '',
        isOnline: !!editEvent.is_online_meeting,
        meetingUrl: editEvent.meeting_url || '',
        color: editEvent.color || EVENT_COLORS[0],
        attendees: editEvent.attendees || [],
        type: editEvent.type || 'meetings',
      });
    } else if (isOpen) {
      setForm(f => ({ ...f, date: dateStr }));
    }
  }, [isOpen, editEvent, dateStr]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', esc); };
  }, [isOpen, onClose]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = cal.required;
    if (!form.date) errs.date = cal.required;
    if (form.startTime && form.endTime && form.endTime <= form.startTime) errs.endTime = cal.endBeforeStart;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      team_id: null,
      title: form.title,
      description: form.description,
      location: form.isOnline ? '' : form.location,
      is_online_meeting: form.isOnline,
      meeting_url: form.isOnline ? form.meetingUrl : '',
      start_time: `${form.date}T${form.startTime}:00`,
      end_time: `${form.date}T${form.endTime}:00`,
      is_all_day: false,
      status: 'confirmed',
      reminder_minutes: 15,
      color: form.color,
      attendees: form.attendees.length ? form.attendees : [currentUser.id],
    };

    if (editEvent) {
      await onUpdate(editEvent.id, payload);
    } else {
      await onCreate(payload);
    }
    setForm(blankForm);
    onClose();
  };

  const toggle = (id) => setForm(p => ({
    ...p, attendees: p.attendees.includes(id) ? p.attendees.filter(a => a !== id) : [...p.attendees, id],
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div ref={ref} className="bg-[#1a1a24] border border-white/[0.1] rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-[18px] font-semibold text-white">{editEvent ? cal.editTitle : cal.title}</h2>
          <button onClick={onClose} className="text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none p-0">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-kodo-text mb-1.5">{cal.eventName}</label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className={`w-full px-3 py-2 bg-white/[0.04] border rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 ${errors.title ? 'border-red-500/50' : 'border-white/[0.08]'}`}
              placeholder={cal.eventNamePlaceholder} />
            {errors.title && <p className="text-[11px] text-red-400 mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-kodo-text mb-1.5">{cal.description}</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 resize-none"
              rows={2} placeholder={cal.descriptionPlaceholder} />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-kodo-text mb-1.5">{cal.type}</label>
            <div className="grid grid-cols-3 gap-2">
              {[{ key: 'meetings', label: cal.meeting }, { key: 'events', label: cal.event }, { key: 'reminders', label: cal.reminder }].map(tp => (
                <button key={tp.key} type="button" onClick={() => setForm(p => ({ ...p, type: tp.key }))}
                  className={`px-3 py-2 rounded-lg border text-[12px] font-medium transition-all cursor-pointer ${
                    form.type === tp.key ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 'border-white/[0.08] bg-white/[0.04] text-kodo-text-secondary hover:bg-white/[0.06]'
                  }`}>{tp.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-kodo-text mb-1.5">{cal.date}</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className={`w-full px-3 py-2 bg-white/[0.04] border rounded-lg text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 [color-scheme:dark] ${errors.date ? 'border-red-500/50' : 'border-white/[0.08]'}`} />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-kodo-text mb-1.5">{cal.startTime}</label>
              <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 [color-scheme:dark]" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-kodo-text mb-1.5">{cal.endTime}</label>
              <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                className={`w-full px-3 py-2 bg-white/[0.04] border rounded-lg text-[13px] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 [color-scheme:dark] ${errors.endTime ? 'border-red-500/50' : 'border-white/[0.08]'}`} />
              {errors.endTime && <p className="text-[11px] text-red-400 mt-1">{errors.endTime}</p>}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input type="checkbox" checked={form.isOnline} onChange={e => setForm(p => ({ ...p, isOnline: e.target.checked }))}
                className="w-4 h-4 text-indigo-500 bg-white/[0.04] border-white/[0.2] rounded" />
              <span className="text-[13px] text-kodo-text">{cal.onlineMeeting}</span>
            </label>
            {form.isOnline ? (
              <input type="text" value={form.meetingUrl} onChange={e => setForm(p => ({ ...p, meetingUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
                placeholder={cal.meetingLinkPlaceholder} />
            ) : (
              <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder:text-kodo-text-dim focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30"
                placeholder={cal.locationPlaceholder} />
            )}
          </div>

          <div>
            <label className="block text-[13px] font-medium text-kodo-text mb-1.5">{cal.color}</label>
            <div className="flex gap-2">
              {EVENT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all ${
                    form.color === c ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-kodo-text mb-1.5">{cal.attendees}</label>
            <div className="max-h-32 overflow-y-auto border border-white/[0.08] rounded-lg p-1.5 space-y-0.5">
              {members.map(user => (
                <div key={user.id} onClick={() => toggle(user.id)}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                    form.attendees.includes(user.id) ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/[0.04] border border-transparent'
                  }`}>
                  <input type="checkbox" checked={form.attendees.includes(user.id)} onChange={() => {}} className="w-4 h-4 text-indigo-500 bg-white/[0.04] border-white/[0.2] rounded" />
                  <Avatar user={user} size={24} showStatus />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-kodo-text truncate">{user.display_name}</div>
                    <div className="text-[10px] text-kodo-text-dim truncate">{user.job_title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setForm(blankForm); onClose(); }}
              className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] text-kodo-text rounded-lg hover:bg-white/[0.08] transition-colors cursor-pointer text-[13px] font-medium">
              {cal.cancel}
            </button>
            <button type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors cursor-pointer text-[13px] font-medium flex items-center justify-center gap-1.5">
              {!editEvent && <Plus size={14} />} {editEvent ? cal.save : cal.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* CalendarPage */
export default function CalendarPage() {
  const { activeProject } = useProject();
  const { t } = useTheme();
  const cal = t.calendarPage;
  const toast = useToast();

  const TABS = [
    { key: 'all', label: cal.tabs.all },
    { key: 'meetings', label: cal.tabs.meetings },
    { key: 'events', label: cal.tabs.events },
    { key: 'reminders', label: cal.tabs.reminders },
  ];

  const VIEW_MODES = [
    { key: 'day', label: cal.viewModes.day },
    { key: 'week', label: cal.viewModes.week },
    { key: 'month', label: cal.viewModes.month },
  ];

  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [calLoading, setCalLoading] = useState(true);

  useEffect(() => {
    if (!activeProject) return;
    setCalLoading(true);
    Promise.all([
      calendarApi.list().catch(() => ({ data: [] })),
      usersApi.list().catch(() => ({ data: [] })),
      participantsApi.list('project', activeProject.id).catch(() => ({ data: [] })),
    ]).then(([eventsRes, usersRes, membersRes]) => {
      setEvents(eventsRes.calendar_events || eventsRes.data || []);
      setAllUsers(usersRes.users || usersRes.data || []);
      setProjectMembers((membersRes.participants || membersRes.data || []).map(p => p.user || p));
      setCalLoading(false);
    });
  }, [activeProject]);

  const getUserById = (id) => allUsers.find(u => u.id === id) || null;

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (activeTab !== 'all' && evtCategory(e) !== activeTab) return false;
      if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [events, activeTab, search]);

  const weekDays = useMemo(() => {
    const mon = getMonday(currentDate);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const monthWeeks = useMemo(() => {
    if (viewMode !== 'month') return [];
    return getMonthWeeks(currentDate.getFullYear(), currentDate.getMonth());
  }, [viewMode, currentDate]);

  const eventsForDay = useCallback(
    (day) => filtered.filter(e => sameDay(new Date(e.start_time), day)),
    [filtered]
  );

  const nav = (dir) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === 'day') d.setDate(d.getDate() + dir);
      else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const goToday = () => setCurrentDate(new Date());
  const { currentUser } = useAuth();

  const handleCreate = async (eventData) => {
    try {
      const res = await calendarApi.create(eventData);
      setEvents(prev => [...prev, res.calendar_event || res.data]);
      toast.success('Event created!');
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    }
  };

  const handleUpdate = async (eventId, eventData) => {
    try {
      const res = await calendarApi.update(eventId, eventData);
      const updated = res.calendar_event || res.data;
      setEvents(prev => prev.map(e => e.id === eventId ? updated : e));
      toast.success(cal.eventUpdated);
    } catch (err) {
      toast.error(err.message || 'Failed to update event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm(cal.confirmDelete)) return;
    try {
      await calendarApi.destroy(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setSelectedEvent(null);
      toast.success(cal.eventDeleted);
    } catch (err) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  const handleEditStart = (event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  function fmtRange(mode, d) {
    const ms = (n) => cal.monthNames[n].substring(0, n === 8 ? 5 : 4) + '.';
    if (mode === 'day') {
      return `${d.getFullYear()}. ${cal.monthNames[d.getMonth()]} ${d.getDate()}. ${cal.dayNames[(d.getDay() + 6) % 7]}`;
    }
    if (mode === 'week') {
      const mon = getMonday(d);
      const fri = new Date(mon);
      fri.setDate(mon.getDate() + 4);
      return mon.getMonth() === fri.getMonth()
        ? `${mon.getFullYear()}. ${ms(mon.getMonth())} ${mon.getDate()} – ${fri.getDate()}.`
        : `${mon.getFullYear()}. ${ms(mon.getMonth())} ${mon.getDate()} – ${ms(fri.getMonth())} ${fri.getDate()}.`;
    }
    return `${d.getFullYear()}. ${cal.monthNames[d.getMonth()]}`;
  }

  if (calLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 flex-shrink-0 gap-2 sm:gap-3">
        <div>
          <h1 className="text-[20px] md:text-[28px] font-bold text-white/95 font-display m-0">{cal.title}</h1>
          <p className="text-kodo-text-muted mt-1 text-[13px]">
            {cal.subtitle} — <span className="text-indigo-400 font-medium">{activeProject?.name}</span>
          </p>
        </div>
        <button className="kodo-btn-primary flex-shrink-0" onClick={() => setShowModal(true)}>
          <Plus size={16} /> {cal.newEvent}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 flex-shrink-0 gap-2">
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-1 overflow-x-auto">
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setActiveTab(tb.key)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-[12px] font-medium transition-all cursor-pointer border-none whitespace-nowrap ${
                activeTab === tb.key
                  ? 'bg-kodo-accent/15 text-indigo-400'
                  : 'bg-transparent text-kodo-text-muted hover:text-kodo-text-secondary'
              }`}>
              {tb.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06] flex-1 sm:flex-initial">
            <Search size={13} className="text-kodo-text-dim" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.common.search}
              className="bg-transparent border-none outline-none text-[12px] text-kodo-text placeholder:text-kodo-text-dim w-full sm:w-24"
            />
          </div>
          <div className="flex items-center gap-0.5 bg-white/[0.03] rounded-lg p-0.5">
            {VIEW_MODES.map(m => (
              <button key={m.key} onClick={() => setViewMode(m.key)}
                className={`px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium transition-all cursor-pointer border-none whitespace-nowrap ${
                  viewMode === m.key
                    ? 'bg-white/[0.08] text-kodo-text'
                    : 'bg-transparent text-kodo-text-dim hover:text-kodo-text-secondary'
                }`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
        <button onClick={() => nav(-1)}
          className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer border-none bg-transparent text-kodo-text-muted">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => nav(1)}
          className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer border-none bg-transparent text-kodo-text-muted">
          <ChevronRight size={18} />
        </button>
        <button onClick={goToday}
          className="px-3 py-1.5 rounded-lg bg-kodo-accent/10 text-indigo-400 text-[12px] font-medium cursor-pointer border-none hover:bg-kodo-accent/15 transition-colors">
          {cal.today}
        </button>
        <span className="text-[14px] font-semibold text-white ml-1">
          {fmtRange(viewMode, currentDate)}
        </span>
      </div>

      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="h-[400px] sm:h-[500px] md:h-[700px] kodo-card overflow-hidden flex flex-col">
          <div className={`overflow-x-auto flex-1 min-h-0 flex flex-col ${viewMode === 'week' ? '[&>*]:min-w-[500px] sm:[&>*]:min-w-[600px]' : ''}`}>
          <div className={`grid ${viewMode === 'week' ? 'grid-cols-[40px_repeat(5,1fr)] sm:grid-cols-[50px_repeat(5,1fr)]' : 'grid-cols-[40px_1fr] sm:grid-cols-[50px_1fr]'} border-b border-white/[0.06] flex-shrink-0 ${viewMode === 'week' ? 'min-w-[500px] sm:min-w-[600px]' : ''}`}>
            <div className="p-2" />
            {(viewMode === 'week' ? weekDays : [currentDate]).map((d, i) => {
              const isToday = sameDay(d, TODAY);
              return (
                <div key={i} className={`text-center py-2.5 border-l border-white/[0.04] ${isToday ? 'bg-kodo-accent/[0.06]' : ''}`}>
                  <div className="text-[10px] font-semibold text-kodo-text-dim uppercase tracking-wider mb-0.5">
                    {viewMode === 'week' ? cal.dayAbbr[i] : cal.dayNames[(d.getDay() + 6) % 7]}
                  </div>
                  <div className={`text-[18px] font-bold font-display ${isToday ? 'text-indigo-400' : 'text-kodo-text-secondary'}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`flex-1 min-h-0 grid ${viewMode === 'week' ? 'grid-cols-[40px_repeat(5,1fr)] sm:grid-cols-[50px_repeat(5,1fr)] min-w-[500px] sm:min-w-[600px]' : 'grid-cols-[40px_1fr] sm:grid-cols-[50px_1fr]'}`}>
            <div className="relative">
              {HOURS.map((h, i) => (
                <div key={h} className="absolute right-2"
                  style={{ top: `${(i / TOTAL_SPAN) * 100}%`, transform: i === 0 ? 'none' : 'translateY(-50%)' }}>
                  <span className="text-[10px] font-medium text-kodo-text-dim whitespace-nowrap">{h}:00</span>
                </div>
              ))}
            </div>

            {(viewMode === 'week' ? weekDays : [currentDate]).map((d, idx) => {
              const dayEvts = eventsForDay(d);
              const isToday = sameDay(d, TODAY);
              return (
                <div key={idx} className={`relative border-l border-white/[0.04] ${isToday ? 'bg-kodo-accent/[0.03]' : ''}`}>
                  {HOURS.map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-b border-white/[0.03]"
                      style={{ top: `${(i / TOTAL_SPAN) * 100}%` }} />
                  ))}
                  {dayEvts.map(event => (
                    <EventCard key={event.id} event={event} pos={getEventPos(event)} onSelect={setSelectedEvent} getUserById={getUserById} />
                  ))}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {viewMode === 'month' && (
        <div className="h-[400px] sm:h-[500px] md:h-[700px] kodo-card overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b border-white/[0.06] flex-shrink-0">
            {cal.dayAbbr.map((n, i) => (
              <div key={`${n}-${i}`} className="text-center py-2 text-[10px] font-semibold text-kodo-text-dim uppercase tracking-wider">
                {n}
              </div>
            ))}
          </div>

          <div className="flex-1 min-h-0 grid" style={{ gridTemplateRows: `repeat(${monthWeeks.length}, 1fr)` }}>
            {monthWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-white/[0.03] last:border-b-0 min-h-0 overflow-hidden">
                {week.map((day, di) => {
                  const isCurMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = sameDay(day, TODAY);
                  const dayEvts = eventsForDay(day);
                  return (
                    <div key={di} className={`p-1.5 border-l border-white/[0.04] first:border-l-0 overflow-hidden ${
                      isToday ? 'bg-kodo-accent/[0.06]' : ''
                    } ${!isCurMonth ? 'opacity-30' : ''}`}>
                      <div className={`text-[12px] font-semibold mb-0.5 ${isToday ? 'text-indigo-400' : 'text-kodo-text-secondary'}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {dayEvts.slice(0, 3).map(ev => (
                          <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                            className="text-[9px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:brightness-125 transition-all"
                            style={{ backgroundColor: ev.color + '20', color: ev.color }}>
                            {ev.title}
                          </div>
                        ))}
                        {dayEvts.length > 3 && (
                          <div className="text-[8px] text-kodo-text-dim px-1.5">+{dayEvts.length - 3}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedEvent && (
        <EventDetailPopup
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={handleEditStart}
          onDelete={handleDelete}
          getUserById={getUserById}
          currentUserId={currentUser?.id}
        />
      )}

      <NewEventModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingEvent(null); }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        editEvent={editingEvent}
        activeProject={activeProject}
        defaultDate={currentDate}
        members={projectMembers}
      />
    </div>
  );
}
