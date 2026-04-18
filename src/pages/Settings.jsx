import { useState, useEffect } from 'react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { users as usersApi, settings as settingsApi, auth as authApi } from '@/services/api';
import { useToast } from '@/components/Toast';
import { Loader2 } from 'lucide-react';

function Toggle({ value, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      aria-pressed={value}
      className="w-[42px] h-[24px] rounded-full p-0.5 cursor-pointer transition-colors border-none flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ backgroundColor: value ? '#6366f1' : 'rgba(var(--kodo-text-dim-rgb), 0.3)' }}
    >
      <div
        className="w-5 h-5 rounded-full bg-white transition-transform duration-200"
        style={{ transform: value ? 'translateX(18px)' : 'translateX(0)' }}
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

const DEFAULT_SETTINGS = {
  push_notifications: true,
  email_notifications: true,
  desktop_notifications: false,
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
  const { theme, setTheme, language, setLanguage, t } = useTheme();
  const s = t.settings;

  const [settingsState, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [profileForm, setProfileForm] = useState({
    display_name: '',
    username: '',
    job_title: '',
    department: '',
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
        department: currentUser.department || '',
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
              {currentUser.job_title} · {currentUser.department}
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
          <div>
            <label htmlFor="set-department" className="text-[12px] text-kodo-text-muted block mb-1.5">{s.department}</label>
            <input
              id="set-department"
              value={profileForm.department}
              onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))}
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
              value={settingsState.font_size}
              options={[
                { key: 'small', label: s.fontSmall },
                { key: 'medium', label: s.fontMedium },
                { key: 'large', label: s.fontLarge },
                { key: 'xlarge', label: s.fontXlarge },
              ]}
              onChange={k => updateSetting('font_size', k)}
            />
          </div>
        </div>
      </div>

      {/* ── Notifications ──────────────────────────── */}
      <div className="kodo-card p-4 md:p-6 mb-4">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.notifications}</h3>
        <div className="flex flex-col gap-5">
          {[
            { label: s.pushNotif, desc: s.pushNotifDesc, key: 'push_notifications' },
            { label: s.emailNotif, desc: s.emailNotifDesc, key: 'email_notifications' },
            { label: s.desktopNotif, desc: s.desktopNotifDesc, key: 'desktop_notifications' },
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
                <input
                  type="time"
                  aria-label={s.dndStart}
                  value={settingsState.dnd_start_time || ''}
                  onChange={e => updateSetting('dnd_start_time', e.target.value || null)}
                  className="kodo-input text-[12px] w-[80px] sm:w-[100px]"
                />
                <span className="text-kodo-text-dim text-[12px]">–</span>
                <input
                  type="time"
                  aria-label={s.dndEnd}
                  value={settingsState.dnd_end_time || ''}
                  onChange={e => updateSetting('dnd_end_time', e.target.value || null)}
                  className="kodo-input text-[12px] w-[80px] sm:w-[100px]"
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
          {[
            { label: s.enterToSend, desc: s.enterToSendDesc, key: 'enter_to_send' },
            { label: s.typingIndicator, desc: s.typingIndicatorDesc, key: 'show_typing_indicator' },
            { label: s.readReceipts, desc: s.readReceiptsDesc, key: 'show_read_receipts' },
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
        </div>
      </div>

      {/* ── Privacy ────────────────────────────────── */}
      <div className="kodo-card p-4 md:p-6 mb-4">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.privacy}</h3>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-medium text-kodo-text">{s.showOnlineStatus}</div>
              <div className="text-[12px] text-kodo-text-muted mt-0.5">{s.showOnlineStatusDesc}</div>
            </div>
            <Toggle
              value={!!settingsState.show_online_status}
              disabled={!settingsLoaded}
              onChange={v => updateSetting('show_online_status', v)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-medium text-kodo-text">{s.allowDM}</div>
              <div className="text-[12px] text-kodo-text-muted mt-0.5">{s.allowDMDesc}</div>
            </div>
            <SegmentedControl
              value={settingsState.allow_direct_messages}
              options={[
                { key: 'everyone', label: s.allowDMEveryone },
                { key: 'team_members', label: s.allowDMTeam },
                { key: 'nobody', label: s.allowDMNobody },
              ]}
              onChange={k => updateSetting('allow_direct_messages', k)}
            />
          </div>
        </div>
      </div>

      {/* ── Accessibility ──────────────────────────── */}
      <div className="kodo-card p-4 md:p-6 mb-4">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.accessibility}</h3>
        <div className="flex flex-col gap-5">
          {[
            { label: s.reduceMotion, desc: s.reduceMotionDesc, key: 'reduce_motion' },
            { label: s.highContrast, desc: s.highContrastDesc, key: 'high_contrast' },
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
