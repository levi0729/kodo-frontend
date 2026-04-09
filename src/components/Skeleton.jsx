import clsx from 'clsx';

export function Skeleton({ className = '', width, height }) {
  return (
    <div
      className={clsx('animate-pulse rounded-lg bg-white/[0.06]', className)}
      style={{ width, height }}
    />
  );
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="kodo-card p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="rounded-full" width={40} height={40} />
        <div className="flex-1">
          <Skeleton className="mb-2" width="60%" height={14} />
          <Skeleton width="40%" height={10} />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="mb-2" width={`${90 - i * 15}%`} height={10} />
      ))}
    </div>
  );
}

export function PageSkeleton({ cards = 4 }) {
  return (
    <div className="pb-6 md:pb-10">
      <div className="mb-4 md:mb-7">
        <Skeleton className="mb-2" width={200} height={28} />
        <Skeleton width={300} height={13} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} lines={2 + (i % 2)} />
        ))}
      </div>
    </div>
  );
}
