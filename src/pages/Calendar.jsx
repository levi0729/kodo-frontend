import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Search,
  Video, MapPin, Loader2
} from 'lucide-react';
import Avatar, { AvatarStack } from '@/components/Avatar';
import EventDetailPopup from '@/components/calendar/EventDetailPopup';
import NewEventModal from '@/components/calendar/NewEventModal';
import { useProject } from '@/context/ProjectContext';
import { calendarEvents as calendarApi, participants as participantsApi } from '@/services/api';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAppData } from '@/context/AppDataContext';

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const TOTAL_SPAN = HOURS.length;
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

/* EventCard — memoized: re-renders only when event/pos identity changes */
const EventCard = memo(function EventCard({ event, pos, onSelect, getUserById }) {
  const { t } = useTheme();
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
                {event.is_online_meeting ? t.calendarPage.online : event.location}
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
});


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
  const [projectMembers, setProjectMembers] = useState([]);
  const [calLoading, setCalLoading] = useState(true);
  const { allUsers } = useAppData();

  useEffect(() => {
    if (!activeProject) {
      setCalLoading(false);
      return;
    }
    setCalLoading(true);
    Promise.all([
      calendarApi.list().catch(() => ({ data: [] })),
      participantsApi.list('project', activeProject.id).catch(() => ({ data: [] })),
    ]).then(([eventsRes, membersRes]) => {
      setEvents(eventsRes.calendar_events || eventsRes.data || []);
      setProjectMembers((membersRes.participants || membersRes.data || []).map(p => p.user || p));
      setCalLoading(false);
    });
  }, [activeProject]);

  // Memoize as a Map for O(1) lookup instead of O(n) find on every EventCard render
  const userMap = useMemo(() => new Map(allUsers.map(u => [u.id, u])), [allUsers]);
  const getUserById = useCallback((id) => userMap.get(id) || null, [userMap]);

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

  const handleRsvp = async (eventId, responseStatus) => {
    try {
      const res = await calendarApi.rsvp(eventId, responseStatus);
      const updated = res.calendar_event || res.data;
      if (updated) {
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updated } : e));
        setSelectedEvent(prev => prev && prev.id === eventId ? { ...prev, ...updated } : prev);
      }
      toast.success(cal.rsvpUpdated);
    } catch (err) {
      toast.error(err.message || 'Failed to RSVP');
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
        <button onClick={() => nav(-1)} aria-label={cal.previous || 'Previous'}
          className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer border-none bg-transparent text-kodo-text-muted">
          <ChevronLeft size={18} />
        </button>
        <button onClick={() => nav(1)} aria-label={cal.next || 'Next'}
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
        <div className="h-[350px] sm:h-[450px] md:h-[700px] kodo-card overflow-hidden flex flex-col">
          <div className={`overflow-x-auto flex-1 min-h-0 flex flex-col ${viewMode === 'week' ? '[&>*]:min-w-[500px] sm:[&>*]:min-w-[600px]' : ''}`}>
          <div className={`grid ${viewMode === 'week' ? 'grid-cols-[40px_repeat(5,1fr)] sm:grid-cols-[50px_repeat(5,1fr)]' : 'grid-cols-[40px_1fr] sm:grid-cols-[50px_1fr]'} border-b border-white/[0.06] flex-shrink-0 ${viewMode === 'week' ? 'min-w-[420px] sm:min-w-[560px]' : ''}`}>
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

          <div className={`flex-1 min-h-0 grid ${viewMode === 'week' ? 'grid-cols-[40px_repeat(5,1fr)] sm:grid-cols-[50px_repeat(5,1fr)] min-w-[420px] sm:min-w-[560px]' : 'grid-cols-[40px_1fr] sm:grid-cols-[50px_1fr]'}`}>
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
        <div className="h-[350px] sm:h-[450px] md:h-[700px] kodo-card overflow-hidden flex flex-col">
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
          onRsvp={handleRsvp}
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
