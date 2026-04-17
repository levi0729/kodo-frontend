import { useTheme } from '@/context/ThemeContext';

export default function MiniCalendar({ calendarEvents }) {
  const { t } = useTheme();
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const dayHeaders = t.dashboard.calendarDays;
  const monthName = t.calendar?.monthNames?.[currentMonth] || t.dashboard.march;

  // Calculate the week containing today (Mon-Sun)
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = currentDay + mondayOffset;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[14px] font-semibold text-white">{monthName}</span>
        <span className="text-[11px] text-kodo-text-dim">{currentYear}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayHeaders.map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[10px] font-semibold text-kodo-text-dim uppercase py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const day = weekStart + i;
          const isToday = day === currentDay;
          const hasEvent = calendarEvents.some(e => {
            const d = new Date(e.start_time);
            return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          });
          return (
            <div
              key={day}
              className={`text-center py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all ${
                isToday
                  ? 'bg-kodo-accent text-white font-bold'
                  : hasEvent
                    ? 'bg-white/[0.04] text-kodo-text-secondary'
                    : 'text-kodo-text-dim hover:bg-white/[0.04]'
              }`}
            >
              {day > 0 ? day : ''}
              {hasEvent && !isToday && (
                <div className="w-1 h-1 rounded-full bg-indigo-400 mx-auto mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
