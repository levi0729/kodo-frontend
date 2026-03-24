import { useState, useRef } from 'react';
import { Eye, EyeOff, LogIn, UserPlus, Loader2, Mail, Smartphone, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/Toast';

function VerificationScreen() {
  const { verificationPending, sendVerificationCode, verifyCode, cancelVerification, loading } = useAuth();
  const { t } = useTheme();
  const toast = useToast();
  const a = t.auth;

  const [step, setStep] = useState('choose'); // 'choose' | 'code'
  const [method, setMethod] = useState(null);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState('');
  const [destination, setDestination] = useState('');
  const [devCode, setDevCode] = useState('');
  const inputRefs = useRef([]);

  const handleSendCode = async (selectedMethod) => {
    setMethod(selectedMethod);
    setError('');
    const result = await sendVerificationCode(selectedMethod);
    if (result.success) {
      setDestination(result.destination);
      setDevCode(result.devCode || '');
      setStep('code');
      toast.success(a.codeSent || 'Kód elküldve!');
    } else {
      setError(result.error);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (value && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < 6; i++) {
        newCode[i] = pasted[i] || '';
      }
      setCode(newCode);
      if (pasted.length === 6) {
        handleVerify(pasted);
      } else {
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
      e.preventDefault();
    }
  };

  const handleVerify = async (fullCode) => {
    setError('');
    const result = await verifyCode(fullCode || code.join(''), rememberDevice);
    if (result.success) {
      toast.success('Sikeres bejelentkezés!');
    } else {
      setError(result.error || a.invalidCode);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    handleSendCode(method);
  };

  return (
    <div className="min-h-screen bg-kodo-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.04] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
            <ShieldCheck size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-[28px] font-bold text-white font-display tracking-tight">
            {a.verificationTitle}
          </h1>
          <p className="text-[14px] text-kodo-text-muted mt-1">
            {a.verificationSubtitle}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
          {step === 'choose' ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleSendCode('email')}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-kodo-accent/40 hover:bg-white/[0.06] transition-all cursor-pointer text-left"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Mail size={22} className="text-indigo-400" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">{a.verifyByEmail}</div>
                  <div className="text-[12px] text-kodo-text-muted mt-0.5">{verificationPending?.email}</div>
                </div>
              </button>

              {verificationPending?.hasPhone && (
                <button
                  onClick={() => handleSendCode('sms')}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-kodo-accent/40 hover:bg-white/[0.06] transition-all cursor-pointer text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Smartphone size={22} className="text-purple-400" />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-white">{a.verifyBySms}</div>
                    <div className="text-[12px] text-kodo-text-muted mt-0.5">{verificationPending?.phone}</div>
                  </div>
                </button>
              )}

              {error && (
                <div className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                onClick={cancelVerification}
                className="flex items-center justify-center gap-2 mt-2 text-[13px] text-kodo-text-dim hover:text-kodo-text transition-colors cursor-pointer bg-transparent border-none"
              >
                <ArrowLeft size={14} /> {a.loginLink || 'Vissza'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <div className="text-center">
                <div className="text-[13px] text-kodo-text-muted mb-1">
                  {method === 'email' ? a.verifyByEmail : a.verifyBySms}
                </div>
                <div className="text-[12px] text-kodo-text-dim">{destination}</div>
              </div>

              {/* Dev code hint */}
              {devCode && (
                <div className="text-[11px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-1.5 text-center w-full">
                  DEV: {devCode}
                </div>
              )}

              {/* 6-digit code input */}
              <div className="flex gap-2" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-[20px] font-bold text-white rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-kodo-accent/50 focus:ring-1 focus:ring-kodo-accent/20 outline-none transition-all"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="text-[12px] text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 w-full text-center">
                  {error}
                </div>
              )}

              {/* Remember device */}
              <label className="flex items-center gap-2.5 cursor-pointer self-start">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={e => setRememberDevice(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/[0.04] text-kodo-accent focus:ring-kodo-accent/20 cursor-pointer"
                />
                <span className="text-[13px] text-kodo-text-muted">{a.rememberDevice}</span>
              </label>

              <button
                onClick={() => handleVerify()}
                disabled={loading || code.join('').length !== 6}
                className="w-full py-3 rounded-xl bg-kodo-accent text-white text-[14px] font-semibold cursor-pointer border-none hover:bg-kodo-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {a.verify}
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleResend}
                  className="text-[12px] text-indigo-400 font-medium cursor-pointer bg-transparent border-none hover:text-indigo-300 transition-colors"
                >
                  {a.resendCode}
                </button>
                <button
                  onClick={() => { setStep('choose'); setCode(['', '', '', '', '', '']); setError(''); }}
                  className="text-[12px] text-kodo-text-dim cursor-pointer bg-transparent border-none hover:text-kodo-text transition-colors"
                >
                  <ArrowLeft size={12} className="inline mr-1" />
                  {a.loginLink || 'Vissza'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-kodo-text-dim/50 mt-6">
          Kodo &mdash; Team Management
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, register, loading, verificationPending } = useAuth();
  const { t } = useTheme();
  const toast = useToast();
  const a = t.auth;

  // Show verification screen if 2FA is pending
  if (verificationPending) {
    return <VerificationScreen />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      const result = await login(email, password);
      if (result.success) {
        toast.success(a.loginSuccess || 'Sikeres bejelentkezés!');
      } else if (result.verificationRequired) {
        // Verification screen will render automatically
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } else {
      if (!displayName.trim()) { setError(a.errors.nameRequired); return; }
      if (!email.trim()) { setError(a.errors.emailRequired); return; }
      if (!phoneNumber.trim()) { setError(a.errors?.phoneRequired || 'Add meg a telefonszámod'); return; }
      if (password.length < 8) { setError(a.errors?.passwordTooShort || 'A jelszónak legalább 8 karakter hosszúnak kell lennie'); return; }
      if (password !== passwordConfirm) { setError('A jelszavak nem egyeznek'); return; }

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
        toast.success('Sikeres regisztráció!');
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-kodo-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.04] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.04] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[420px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-[64px] h-[64px] rounded-2xl flex items-center justify-center mb-4">
            <img src="/kodo.png" alt="Kodo" className="w-[72px] h-[72px] object-contain" />
          </div>
          <h1 className="text-[28px] font-bold text-white font-display tracking-tight">
            {mode === 'login' ? a.welcomeTitle : a.joinTitle}
          </h1>
          <p className="text-[14px] text-kodo-text-muted mt-1">
            {mode === 'login' ? a.loginSubtitle : a.registerSubtitle}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
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
                placeholder="nev@kodo.io"
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
              {loading ? (a.loading || 'Loading...') : mode === 'login' ? a.login : a.register}
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
