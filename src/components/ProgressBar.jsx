export default function ProgressBar({ value, color = '#6366f1', height = 6, className = '' }) {
  return (
    <div className={`w-full rounded-full bg-white/[0.06] overflow-hidden ${className}`} style={{ height }}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
        }}
      />
    </div>
  );
}
