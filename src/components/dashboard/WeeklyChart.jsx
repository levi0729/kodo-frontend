import { memo, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';

const WeeklyChart = memo(function WeeklyChart({ projectId, teamMembers, timeEntries }) {
  const { t } = useTheme();
  const days = t.dashboard.days;

  const { dailyTotals, maxTotal } = useMemo(() => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday=0
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const totals = days.map((_, di) => {
      const dayEntries = timeEntries.filter(e => {
        const d = new Date(e.date);
        return d >= monday && d <= sunday && (d.getDay() + 6) % 7 === di;
      });
      return Math.round(dayEntries.reduce((sum, e) => sum + (e.hours || 0), 0) * 10) / 10;
    });

    return { dailyTotals: totals, maxTotal: Math.max(...totals, 1) };
  }, [timeEntries, days]);

  return (
    <div>
      <div className="flex items-end gap-1 xs:gap-2 md:gap-3 h-[120px] xs:h-[150px] md:h-[190px] px-1 md:px-2">
        {days.map((day, di) => {
          const dayTotal = dailyTotals[di];
          const pct = (dayTotal / maxTotal) * 100;
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-2 h-full">
              <span className="text-[11px] font-semibold text-kodo-text-secondary flex-shrink-0">
                {dayTotal > 0 ? `${Math.round(dayTotal)}h` : ''}
              </span>
              <div className="w-full flex-1 flex items-end min-h-0">
                <div
                  className="w-full rounded-md overflow-hidden border border-white/[0.08] transition-all duration-500"
                  style={{
                    height: dayTotal > 0 ? `${Math.max(pct, 6)}%` : '0%',
                    background: 'linear-gradient(to top, #6366f1, #818cf8)',
                    opacity: dayTotal > 0 ? 0.85 : 0,
                  }}
                  title={`${dayTotal}h`}
                />
              </div>
              <span className="text-[11px] font-medium text-kodo-text-dim flex-shrink-0">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default WeeklyChart;
