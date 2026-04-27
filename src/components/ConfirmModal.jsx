import { Check, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel, confirmVariant = 'danger' }) {
  if (!isOpen) return null;

  const confirmColors = confirmVariant === 'danger'
    ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
    : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#1a1a24] border border-white/[0.08] rounded-2xl w-full max-w-[380px] p-6 shadow-2xl animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-[14px] text-kodo-text text-center mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onConfirm}
            className={`flex items-center justify-center w-11 h-11 rounded-xl cursor-pointer border-none transition-colors ${confirmColors}`}
          >
            <Check size={20} />
          </button>
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/[0.06] text-kodo-text-dim hover:bg-white/[0.1] hover:text-kodo-text cursor-pointer border-none transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
