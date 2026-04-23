import { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/Toast';
import ForgotPasswordScreen from './ForgotPasswordScreen';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [error, setError] = useState('');
  const { login, register, loading } = useAuth();
  const { t } = useTheme();
  const toast = useToast();
  const a = t.auth;

  if (showForgot) {
    return <ForgotPasswordScreen onBack={() => setShowForgot(false)} />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const result = await login(email, password);
      if (result.success) {
        toast.success(a.loginSuccess);
      } else {
        setError(result.error);
      }
    } else {
      if (!displayName.trim()) { setError(a.errors.nameRequired); return; }
      if (!email.trim()) { setError(a.errors.emailRequired); return; }
      if (!phoneNumber.trim()) { setError(a.errors?.phoneRequired); return; }
      if (password.length < 8) { setError(a.errors?.passwordTooShort); return; }
      if (password !== passwordConfirm) { setError(a.errors?.passwordMismatch); return; }

      const result = await register({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        passwordConfirmation: passwordConfirm,
        jobTitle: jobTitle.trim(),
        phoneNumber: phoneNumber.trim(),
        username: email.split('@')[0],
      });
      if (result.success) {
        toast.success(a.registerSuccess);
      } else {
        // Inline error box below the form already shows this — no toast needed.
        setError(result.error);
      }
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-kodo-bg flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.04] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px] my-auto py-6">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-[48px] h-[48px] sm:w-[64px] sm:h-[64px] rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
            <img src="/kodo.png" alt="Kodo" className="w-[56px] h-[56px] sm:w-[72px] sm:h-[72px] object-contain" />
          </div>
          <h1 className="text-[22px] sm:text-[28px] font-bold text-white font-display tracking-tight">
            {mode === 'login' ? a.welcomeTitle : a.joinTitle}
          </h1>
          <p className="text-[14px] text-kodo-text-muted mt-1">
            {mode === 'login' ? a.loginSubtitle : a.registerSubtitle}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 sm:p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                    {a.fullName}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder={a.fullNamePlaceholder}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-kodo-text placeholder:text-kodo-text-dim/40 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                    {a.position}
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder={a.positionPlaceholder}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-kodo-text placeholder:text-kodo-text-dim/40 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                    {a.phoneNumber}
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder={a.phoneNumberPlaceholder}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-kodo-text placeholder:text-kodo-text-dim/40 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all"
                  />
                </div>
              </>
            )}

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
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                {a.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-kodo-text placeholder:text-kodo-text-dim/40 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-[11px] text-kodo-text-dim mt-1 mb-0">{a.passwordHint}</p>
              )}
              {mode === 'login' && (
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[12px] text-indigo-400 font-medium cursor-pointer bg-transparent border-none hover:text-indigo-300 transition-colors"
                  >
                    {a.forgotPassword}
                  </button>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-medium text-kodo-text-dim uppercase tracking-[0.05em] mb-1.5">
                  {a.confirmPassword}
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-kodo-text placeholder:text-kodo-text-dim/40 focus:outline-none focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 transition-all"
                />
              </div>
            )}

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
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === 'login' ? (
                <LogIn size={16} />
              ) : (
                <UserPlus size={16} />
              )}
              {loading ? a.loading : mode === 'login' ? a.login : a.register}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/[0.06] text-center">
            <span className="text-[13px] text-kodo-text-dim">
              {mode === 'login' ? a.noAccount : a.hasAccount}
            </span>
            <button
              onClick={switchMode}
              className="text-[13px] text-indigo-400 font-medium cursor-pointer bg-transparent border-none hover:text-indigo-300 transition-colors"
            >
              {mode === 'login' ? a.registerLink : a.loginLink}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-kodo-text-dim/50 mt-6">
          Kodo &mdash; Team Management
        </p>
      </div>
    </div>
  );
}
