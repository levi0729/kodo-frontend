import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { useProject } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';

export default function CreateProjectModal({ isOpen, onClose }) {
  const { addProject } = useProject();
  const { t } = useTheme();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const reset = () => {
    setName('');
    setPassword('');
    setShowPassword(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = () => {
    if (!name.trim() || !password.trim()) return;
    addProject(name.trim(), '', password.trim());
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#1a1a24] border border-white/[0.08] rounded-2xl w-full max-w-[380px] mx-4 p-5 md:p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-kodo-text">{t.sidebar.newProjectTitle}</h3>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer border-none"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
              {t.sidebar.projectName}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.sidebar.projectNamePlaceholder}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-kodo-text placeholder:text-kodo-text-dim/50 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
              {t.sidebar.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t.sidebar.projectPassword}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-kodo-text placeholder:text-kodo-text-dim/50 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <button
          disabled={!name.trim() || !password.trim()}
          onClick={handleCreate}
          className={clsx(
            'w-full mt-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all border-none cursor-pointer',
            name.trim() && password.trim()
              ? 'bg-kodo-accent text-white hover:bg-kodo-accent/90'
              : 'bg-white/[0.04] text-kodo-text-dim cursor-not-allowed'
          )}
        >
          {t.sidebar.createProject}
        </button>
      </div>
    </div>
  );
}
