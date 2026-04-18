import { useState, useEffect, useRef } from 'react';
import {
  X, Clock, Video, MapPin, Users, Loader2, Pencil, Trash2, Check, HelpCircle
} from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useTheme } from '@/context/ThemeContext';

export default function EventDetailPopup({ event, onClose, onEdit, onDelete, onRsvp, getUserById, currentUserId }) {
  const { t } = useTheme();
  const cal = t.calendarPage;
  const isOrganizer = event.organizer_id === currentUserId;
  const ref = useRef(null);
  const s = new Date(event.start_time);
  const e = new Date(event.end_time);
  const organizer = getUserById(event.organizer_id);
  const attendees = (event.attendees || []).map(id => getUserById(id)).filter(Boolean);
  const isAttendee = (event.attendees || []).includes(currentUserId);
  const myResponse = (event.attendee_responses || []).find(r => r.user_id === currentUserId)?.response_status || 'pending';
  const [rsvpSaving, setRsvpSaving] = useState(null);

  const handleRsvpClick = async (status) => {
    if (!onRsvp) return;
    setRsvpSaving(status);
    try {
      await onRsvp(event.id, status);
    } finally {
      setRsvpSaving(null);
    }
  };
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div ref={ref} className="bg-[#1c1c26] border border-white/[0.1] rounded-xl w-full max-w-[380px] max-h-[85vh] overflow-y-auto animate-fade-in-up shadow-2xl mx-2 sm:mx-0">
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

          {!isOrganizer && isAttendee && (
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <div className="text-[10px] font-semibold text-kodo-text-dim uppercase tracking-wider mb-2">
                {cal.rsvpPrompt}
              </div>
              <div className="flex gap-2">
                {[
                  {
                    key: 'accepted', label: cal.rsvpAccept, icon: Check,
                    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    idle: 'bg-white/[0.03] text-kodo-text-secondary border-white/[0.08] hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/30',
                  },
                  {
                    key: 'tentative', label: cal.rsvpMaybe, icon: HelpCircle,
                    active: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    idle: 'bg-white/[0.03] text-kodo-text-secondary border-white/[0.08] hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/30',
                  },
                  {
                    key: 'declined', label: cal.rsvpDecline, icon: X,
                    active: 'bg-red-500/20 text-red-300 border-red-500/40',
                    idle: 'bg-white/[0.03] text-kodo-text-secondary border-white/[0.08] hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30',
                  },
                ].map(opt => {
                  const Icon = opt.icon;
                  const active = myResponse === opt.key;
                  const saving = rsvpSaving === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleRsvpClick(opt.key)}
                      disabled={rsvpSaving !== null}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium cursor-pointer border transition-colors disabled:opacity-60 disabled:cursor-wait ${active ? opt.active : opt.idle}`}
                      aria-pressed={active}
                      aria-label={opt.label}
                    >
                      {saving ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
                      {opt.label}
                    </button>
                  );
                })}
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
