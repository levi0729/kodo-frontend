import { useState, useRef, useEffect } from 'react';
import { Loader2, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/components/Toast';

export default function VerificationScreen() {
  const { verificationPending, sendVerificationCode, verifyCode, cancelVerification, loading } = useAuth();
  const { t } = useTheme();
  const toast = useToast();
  const a = t.auth;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState('');
  const [destination, setDestination] = useState('');
  const [devCode, setDevCode] = useState('');
  const [sent, setSent] = useState(false);
  const inputRefs = useRef([]);

  // Auto-send email verification code on mount
  useEffect(() => {
    if (!sent && verificationPending) {
      setSent(true);
      sendVerificationCode().then(result => {
        if (result.success) {
          setDestination(result.destination);
          setDevCode(result.devCode || '');
          toast.success(a.codeSent || 'Kód elküldve!');
        } else {
          setError(result.error);
        }
      });
    }
  }, [verificationPending]);

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
      toast.success(a.loginSuccess);
    } else {
      setError(result.error || a.invalidCode);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setCode(['', '', '', '', '', '']);
    setError('');
    const result = await sendVerificationCode();
    if (result.success) {
      setDestination(result.destination);
      setDevCode(result.devCode || '');
      toast.success(a.codeSent || 'Kód elküldve!');
    } else {
      setError(result.error);
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
            <ShieldCheck size={28} className="text-indigo-400 sm:hidden" />
            <ShieldCheck size={32} className="text-indigo-400 hidden sm:block" />
          </div>
          <h1 className="text-[22px] sm:text-[28px] font-bold text-white font-display tracking-tight">
            {a.verificationTitle}
          </h1>
          <p className="text-[14px] text-kodo-text-muted mt-1">
            {a.verificationSubtitle}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-5">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-[13px] text-kodo-text-muted mb-1">
                  <Mail size={14} className="text-indigo-400" />
                  {a.verifyByEmail}
                </div>
                <div className="text-[12px] text-kodo-text-dim">{destination || verificationPending?.email}</div>
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
                  onClick={cancelVerification}
                  className="text-[12px] text-kodo-text-dim cursor-pointer bg-transparent border-none hover:text-kodo-text transition-colors"
                >
                  <ArrowLeft size={12} className="inline mr-1" />
                  {a.back}
                </button>
              </div>
            </div>
        </div>

        <p className="text-center text-[11px] text-kodo-text-dim/50 mt-6">
          Kodo &mdash; Team Management
        </p>
      </div>
    </div>
  );
}
