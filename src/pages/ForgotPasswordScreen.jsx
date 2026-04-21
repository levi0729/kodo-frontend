import { useState } from 'react';
import { Loader2, Mail, ArrowLeft, KeyRound } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/Toast';
import { auth as authApi } from '@/services/api';

export default function ForgotPasswordScreen({ onBack }) {
  const { t } = useTheme();
  const toast = useToast();
  const a = t.auth;
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(a.errors?.emailRequired || 'Email is required'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
      toast.success(a.resetEmailSent || 'Reset link sent!');
    } catch (err) {
      setError(err.message || a.resetSendFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kodo-bg flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.04] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] my-auto py-6">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3 sm:mb-4">
            <KeyRound size={28} className="text-indigo-400 sm:hidden" />
            <KeyRound size={32} className="text-indigo-400 hidden sm:block" />
          </div>
          <h1 className="text-[22px] sm:text-[28px] font-bold text-white font-display tracking-tight">
            {a.forgotPasswordTitle}
          </h1>
          <p className="text-[14px] text-kodo-text-muted mt-1">
            {a.forgotPasswordSubtitle}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Mail size={24} className="text-green-400" />
              </div>
              <p className="text-[14px] text-kodo-text">
                {a.resetEmailSentDesc}
              </p>
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-[13px] text-indigo-400 font-medium cursor-pointer bg-transparent border-none hover:text-indigo-300 transition-colors"
              >
                <ArrowLeft size={14} />
                {a.backToLogin}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                  {a.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={a.emailPlaceholder}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-kodo-text placeholder:text-kodo-text-dim/40 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-1 rounded-xl bg-kodo-accent text-white text-[14px] font-semibold cursor-pointer border-none hover:bg-kodo-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {a.sendResetLink}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="flex items-center justify-center gap-2 text-[13px] text-kodo-text-dim cursor-pointer bg-transparent border-none hover:text-kodo-text transition-colors"
              >
                <ArrowLeft size={14} />
                {a.back}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-kodo-text-dim/50 mt-6">
          Kodo &mdash; Team Management
        </p>
      </div>
    </div>
  );
}
