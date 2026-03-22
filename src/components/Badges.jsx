import clsx from 'clsx';
import { useTheme } from '@/context/ThemeContext';

const PRIORITY_STYLES = {
  high: { bg: 'bg-red-500/10', text: 'text-red-400' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  low: { bg: 'bg-green-500/10', text: 'text-green-400' },
};

const STATUS_STYLES = {
  todo: { bg: 'bg-slate-400/10', text: 'text-slate-400' },
  in_progress: { bg: 'bg-indigo-400/10', text: 'text-indigo-400' },
  in_review: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
  done: { bg: 'bg-green-400/10', text: 'text-green-400' },
  active: { bg: 'bg-indigo-400/10', text: 'text-indigo-400' },
  planning: { bg: 'bg-amber-400/10', text: 'text-amber-400' },
};

export function PriorityBadge({ priority }) {
  const { t } = useTheme();
  const c = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  const label = t.badges.priority[priority] || t.badges.priority.medium;
  return (
    <span className={clsx('inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase', c.bg, c.text)}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const { t } = useTheme();
  const c = STATUS_STYLES[status] || STATUS_STYLES.todo;
  const label = t.badges.status[status] || t.badges.status.todo;
  return (
    <span className={clsx('inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase', c.bg, c.text)}>
      {label}
    </span>
  );
}
