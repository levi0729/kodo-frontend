import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const EVENT_COLORS = ['#6366f1','#ec4899','#14b8a6','#f59e0b','#ef4444','#22c55e','#818cf8','#a855f7'];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function NewEventModal({ isOpen, onClose, onCreate, onUpdate, editEvent, activeProject, defaultDate, members }) {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div ref={ref} className="bg-[#1a1a24] border border-white/[0.1] rounded-2xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto animate-fade-in-up mx-2 sm:mx-0">
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
