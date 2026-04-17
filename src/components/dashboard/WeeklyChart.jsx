import { memo, useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';

/* WeeklyChart — memoized: only recomputes when team/entries change */
const WeeklyChart = memo(function WeeklyChart({ projectId, teamMembers, timeEntries }) {
  const { t } = useTheme();
  const days = t.dashboard.days;
  const memberColors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#22c55e'];

  const { memberData, dailyTotals, maxTotal } = useMemo(() => {
    const data = teamMembers.slice(0, 6).map((member, idx) => {
      const entries = timeEntries.filter(e => e.user_id === member.id);
      const dailyHours = days.map((_, di) => {
        const dayEntries = entries.filter(e => {
          const d = new Date(e.date);
          return (d.getDay() + 6) % 7 === di; // Monday=0
        });
        return Math.round(dayEntries.reduce((sum, e) => sum + (e.hours || 0), 0) * 10) / 10;
      });
      const totalHours = dailyHours.reduce((s, h) => s + h, 0);
      return {
        ...member,
        color: memberColors[idx % memberColors.length],
        dailyHours,
        totalHours,
      };
    });
    const totals = days.map((_, di) => data.reduce((sum, m) => sum + m.dailyHours[di], 0));
    return { memberData: data, dailyTotals: totals, maxTotal: Math.max(...totals, 1) };
  }, [teamMembers, timeEntries, days]);

  return (
    <div>
      <div className="flex items-end gap-1 xs:gap-2 md:gap-3 h-[120px] xs:h-[150px] md:h-[190px] px-1 md:px-2">
        {days.map((day, di) => {
          const dayTotal = dailyTotals[di];
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[11px] font-semibold text-kodo-text-secondary">
                {dayTotal > 0 ? `${Math.round(dayTotal)}h` : ''}
              </span>
              <div className="w-full flex-1 flex items-end">
                <div className="w-full h-full relative bg-white/[0.04] rounded-md overflow-hidden border border-white/[0.08] flex flex-col-reverse">
                  {memberData.map((member) => {
                    const hours = member.dailyHours[di];
                    if (hours <= 0) return null;
                    const pct = (hours / maxTotal) * 100;
                    return (
                      <div
                        key={member.id}
                        className="w-full transition-all duration-500"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: member.color,
                          opacity: 0.85,
                        }}
                        title={`${member.display_name}: ${hours}h`}
                      />
                    );
                  })}
                </div>
              </div>
              <span className="text-[11px] font-medium text-kodo-text-dim">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default WeeklyChart;
