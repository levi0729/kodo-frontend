import { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { users as usersApi, settings as settingsApi, auth as authApi } from '@/services/api';
import { useToast } from '@/components/Toast';
import { Loader2, Clock, ChevronUp, ChevronDown } from 'lucide-react';

function Toggle({ value, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      aria-pressed={value}
      className="w-[42px] h-[24px] rounded-full p-0.5 cursor-pointer transition-colors border-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed border border-solid"
      style={{ backgroundColor: value ? '#6366f1' : 'rgba(var(--kodo-text-dim-rgb), 0.5)', borderColor: value ? '#6366f1' : 'rgba(var(--kodo-text-dim-rgb), 0.25)' }}
    >
      <div
        className="w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md"
        style={{ transform: value ? 'translateX(18px)' : 'translateX(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      />
    </button>
  );
}

function SegmentedControl({ value, options, onChange }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all border ${
            value === opt.key
              ? 'bg-kodo-accent/10 border-kodo-accent/30 text-indigo-400'
              : 'bg-transparent border-white/[0.08] text-kodo-text-dim hover:text-kodo-text-secondary'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hours = value ? value.split(':')[0] : '';
  const minutes = value ? value.split(':')[1] : '';

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const setTime = (h, m) => {
    onChange(`${h}:${m}`);
  };

  const pad = (n) => String(n).padStart(2, '0');

  const nudge = (part, dir) => {
    let h = parseInt(hours || '0', 10);
    let m = parseInt(minutes || '0', 10);
    if (part === 'h') h = (h + dir + 24) % 24;
    else m = (m + dir * 5 + 60) % 60;
    setTime(pad(h), pad(m));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-all border bg-white/[0.04] border-white/[0.08] text-kodo-text hover:bg-white/[0.06] min-w-[100px] justify-center"
      >
        <Clock size={13} className="text-kodo-text-dim" />
        {value || '--:--'}
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-[#1a1a24] border border-white/[0.08] rounded-xl p-3 shadow-2xl animate-fade-in-up min-w-[160px]">
          {label && <div className="text-[10px] text-kodo-text-dim font-medium uppercase tracking-wider mb-2 text-center">{label}</div>}
          <div className="flex items-center justify-center gap-2">
            {/* Hours */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => nudge('h', 1)}
                className="p-1 rounded-md text-kodo-text-dim hover:text-indigo-400 hover:bg-white/[0.06] cursor-pointer bg-transparent border-none transition-colors"
              >
                <ChevronUp size={14} />
              </button>
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[16px] font-semibold text-white tabular-nums">
                {hours || '00'}
              </div>
              <button
                onClick={() => nudge('h', -1)}
                className="p-1 rounded-md text-kodo-text-dim hover:text-indigo-400 hover:bg-white/[0.06] cursor-pointer bg-transparent border-none transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            <span className="text-[18px] font-bold text-kodo-text-dim mt-[-2px]">:</span>
            {/* Minutes */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => nudge('m', 1)}
                className="p-1 rounded-md text-kodo-text-dim hover:text-indigo-400 hover:bg-white/[0.06] cursor-pointer bg-transparent border-none transition-colors"
              >
                <ChevronUp size={14} />
              </button>
              <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[16px] font-semibold text-white tabular-nums">
                {minutes || '00'}
              </div>
              <button
                onClick={() => nudge('m', -1)}
                className="p-1 rounded-md text-kodo-text-dim hover:text-indigo-400 hover:bg-white/[0.06] cursor-pointer bg-transparent border-none transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_SETTINGS = {
  notification_sound: true,
  dnd_enabled: false,
  dnd_start_time: '',
  dnd_end_time: '',
  enter_to_send: true,
  show_typing_indicator: true,
  show_read_receipts: true,
  show_online_status: true,
  allow_direct_messages: 'everyone',
  reduce_motion: false,
  high_contrast: false,
  font_size: 'medium',
};

export default function SettingsPage() {
  const toast = useToast();
  const { currentUser, refreshUser } = useAuth();
  const { theme, setTheme, language, setLanguage, fontSize, setFontSize, t } = useTheme();
  const s = t.settings;

  const [settingsState, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [profileForm, setProfileForm] = useState({
    display_name: '',
    username: '',
    job_title: '',
  });
  const [saving, setSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        display_name: currentUser.display_name || '',
        username: currentUser.username || '',
        job_title: currentUser.job_title || '',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    settingsApi.get().then(res => {
      const loaded = res.settings || res.data || {};
      setSettingsState(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.keys(prev).map(k => [k, loaded[k] !== undefined && loaded[k] !== null ? loaded[k] : prev[k]])
        ),
      }));
      if (loaded.font_size) setFontSize(loaded.font_size);
      setSettingsLoaded(true);
    }).catch(() => setSettingsLoaded(true));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await usersApi.updateProfile(profileForm);
      if (refreshUser) await refreshUser();
      toast.success(s.profileSaved);
    } catch (err) {
      toast.error(err.message || s.profileSaveFailed);
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error(s.passwordsMismatch);
      return;
    }
    if (passwordForm.password.length < 8) {
      toast.error(s.passwordTooShort);
      return;
    }
    setPasswordSaving(true);
    try {
      await authApi.changePassword(
        passwordForm.current_password,
        passwordForm.password,
        passwordForm.password_confirmation
      );
      toast.success(s.passwordChanged);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      toast.error(err.message || s.passwordChangeFailed);
    }
    setPasswordSaving(false);
  };

  // Optimistic update + rollback on failure
  const updateSetting = async (key, value) => {
    const previous = settingsState[key];
    setSettingsState(prev => ({ ...prev, [key]: value }));
    try {
      await settingsApi.update({ [key]: value });
    } catch {
      setSettingsState(prev => ({ ...prev, [key]: previous }));
      toast.error(s.settingSaveFailed);
    }
  };

  return (
    <div className="pb-10 max-w-[900px] mx-auto">
      <div className="mb-7">
        <h1 className="text-[22px] md:text-[28px] font-bold text-white/95 font-display m-0">{s.title}</h1>
        <p className="text-kodo-text-muted mt-1 text-[13px]">{s.subtitle}</p>
      </div>

      {/* ── Profile ───────────────────────────────── */}
      <div className="kodo-card p-4 md:p-6 mb-4">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.profile}</h3>
        <div className="flex items-center gap-4 mb-5">
          <Avatar user={currentUser} size={56} showStatus />
          <div>
            <div className="text-[16px] font-semibold text-white">{currentUser.display_name}</div>
            <div className="text-[13px] text-kodo-text-muted mt-0.5">
              {currentUser.job_title}
            </div>
            <div className="text-[12px] text-kodo-text-dim mt-0.5">{currentUser.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="set-display-name" className="text-[12px] text-kodo-text-muted block mb-1.5">{s.displayName}</label>
            <input
              id="set-display-name"
              value={profileForm.display_name}
              onChange={e => setProfileForm(p => ({ ...p, display_name: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <div>
            <label htmlFor="set-username" className="text-[12px] text-kodo-text-muted block mb-1.5">{s.username}</label>
            <input
              id="set-username"
              value={profileForm.username}
              onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <div>
            <label htmlFor="set-job-title" className="text-[12px] text-kodo-text-muted block mb-1.5">{s.position}</label>
            <input
              id="set-job-title"
              value={profileForm.job_title}
              onChange={e => setProfileForm(p => ({ ...p, job_title: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="kodo-btn-primary mt-4 text-[12px] flex items-center gap-2"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {s.save}
        </button>
      </div>

      {/* ── Appearance ─────────────────────────────── */}
      <div className="kodo-card p-4 md:p-6 mb-4">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.appearance}</h3>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-medium text-kodo-text">{s.theme}</div>
              <div className="text-[12px] text-kodo-text-muted mt-0.5">{s.themeDesc}</div>
            </div>
            <SegmentedControl
              value={theme}
              options={[{ key: 'dark', label: s.dark }, { key: 'light', label: s.light }]}
              onChange={k => { setTheme(k); settingsApi.update({ theme: k }).catch(() => {}); }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-medium text-kodo-text">{s.language}</div>
              <div className="text-[12px] text-kodo-text-muted mt-0.5">{s.languageDesc}</div>
            </div>
            <SegmentedControl
              value={language}
              options={[{ key: 'hu', label: s.hungarian }, { key: 'en', label: s.english }]}
              onChange={k => { setLanguage(k); settingsApi.update({ language: k }).catch(() => {}); }}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-medium text-kodo-text">{s.fontSize}</div>
              <div className="text-[12px] text-kodo-text-muted mt-0.5">{s.fontSizeDesc}</div>
            </div>
            <SegmentedControl
              value={fontSize}
              options={[
                { key: 'small', label: s.fontSmall },
                { key: 'medium', label: s.fontMedium },
                { key: 'large', label: s.fontLarge },
                { key: 'xlarge', label: s.fontXlarge },
              ]}
              onChange={k => { setFontSize(k); updateSetting('font_size', k); }}
            />
          </div>
        </div>
      </div>

      {/* ── Notifications ──────────────────────────── */}
      <div className="kodo-card p-4 md:p-6 mb-4">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.notifications}</h3>
        <div className="flex flex-col gap-5">
          {[
            { label: s.notifSound, desc: s.notifSoundDesc, key: 'notification_sound' },
            { label: s.dndMode, desc: s.dndModeDesc, key: 'dnd_enabled' },
          ].map(item => (
            <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[13px] font-medium text-kodo-text">{item.label}</div>
                <div className="text-[12px] text-kodo-text-muted mt-0.5">{item.desc}</div>
              </div>
              <Toggle
                value={!!settingsState[item.key]}
                disabled={!settingsLoaded}
                onChange={v => updateSetting(item.key, v)}
              />
            </div>
          ))}

          {settingsState.dnd_enabled && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pl-4 border-l-2 border-indigo-500/30">
              <div>
                <div className="text-[13px] font-medium text-kodo-text">{s.dndStart} – {s.dndEnd}</div>
                <div className="text-[12px] text-kodo-text-muted mt-0.5">{s.dndModeDesc}</div>
              </div>
              <div className="flex gap-2 items-center">
                <TimePicker
                  value={settingsState.dnd_start_time || ''}
                  onChange={v => updateSetting('dnd_start_time', v)}
                  label={s.dndStart}
                />
                <span className="text-kodo-text-dim text-[12px] font-medium">–</span>
                <TimePicker
                  value={settingsState.dnd_end_time || ''}
                  onChange={v => updateSetting('dnd_end_time', v)}
                  label={s.dndEnd}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat ───────────────────────────────────── */}
      <div className="kodo-card p-4 md:p-6 mb-4">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.chat}</h3>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-medium text-kodo-text">{s.typingIndicator}</div>
              <div className="text-[12px] text-kodo-text-muted mt-0.5">{s.typingIndicatorDesc}</div>
            </div>
            <Toggle
              value={!!settingsState.show_typing_indicator}
              disabled={!settingsLoaded}
              onChange={v => updateSetting('show_typing_indicator', v)}
            />
          </div>
        </div>
      </div>

      {/* ── Change password ───────────────────────── */}
      <div className="kodo-card p-4 md:p-6">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.changePassword || 'Change Password'}</h3>
        <div className="flex flex-col gap-3 max-w-[400px]">
          <div>
            <label htmlFor="set-curr-pw" className="text-[12px] text-kodo-text-muted block mb-1.5">{s.currentPassword || 'Current Password'}</label>
            <input
              id="set-curr-pw"
              type="password"
              autoComplete="current-password"
              value={passwordForm.current_password}
              onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <div>
            <label htmlFor="set-new-pw" className="text-[12px] text-kodo-text-muted block mb-1.5">{s.newPassword || 'New Password'}</label>
            <input
              id="set-new-pw"
              type="password"
              autoComplete="new-password"
              value={passwordForm.password}
              onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <div>
            <label htmlFor="set-new-pw2" className="text-[12px] text-kodo-text-muted block mb-1.5">{s.confirmNewPassword || 'Confirm New Password'}</label>
            <input
              id="set-new-pw2"
              type="password"
              autoComplete="new-password"
              value={passwordForm.password_confirmation}
              onChange={e => setPasswordForm(p => ({ ...p, password_confirmation: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={passwordSaving}
            className="kodo-btn-primary text-[12px] flex items-center gap-2 w-fit"
          >
            {passwordSaving && <Loader2 size={14} className="animate-spin" />}
            {s.changePasswordBtn || 'Change Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
