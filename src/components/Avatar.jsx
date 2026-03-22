import clsx from 'clsx';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e', '#0ea5e9'];
const STATUS_COLORS = { online: '#22c55e', away: '#f59e0b', dnd: '#ef4444', offline: '#52525b' };

export default function Avatar({ user, size = 36, showStatus = false, className = '' }) {
  if (!user) return null;
  const bg = COLORS[user.id % COLORS.length];
  const initials = user.display_name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className={clsx('relative flex-shrink-0', className)} style={{ width: size, height: size }}>
      <div
        className="rounded-full flex items-center justify-center text-white font-semibold"
        style={{
          width: size,
          height: size,
          backgroundColor: bg,
          fontSize: size * 0.38,
          letterSpacing: '0.02em',
        }}
      >
        {initials}
      </div>
      {showStatus && (
        <div
          className="absolute -bottom-px -right-px rounded-full border-2 border-kodo-bg"
          style={{
            width: size * 0.32,
            height: size * 0.32,
            backgroundColor: STATUS_COLORS[user.presence_status] || STATUS_COLORS.offline,
          }}
        />
      )}
    </div>
  );
}

export function AvatarStack({ users, size = 26, max = 4 }) {
  const shown = users.slice(0, max);
  const extra = users.length - max;

  return (
    <div className="flex items-center">
      {shown.map((user, i) => (
        <div key={user.id} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: max - i }}>
          <Avatar user={user} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="rounded-full bg-white/[0.08] flex items-center justify-center text-kodo-text-secondary font-semibold"
          style={{ width: size, height: size, marginLeft: -8, zIndex: 0, fontSize: size * 0.38 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
