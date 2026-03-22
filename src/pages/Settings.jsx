import { useState, useEffect } from 'react';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { users as usersApi, settings as settingsApi, auth as authApi } from '@/services/api';
import { useToast } from '@/components/Toast';
import { Loader2 } from 'lucide-react';

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-[42px] h-[24px] rounded-full p-0.5 cursor-pointer transition-colors border-none flex items-center"
      style={{ backgroundColor: value ? '#6366f1' : 'rgba(var(--kodo-text-dim-rgb), 0.3)' }}
    >
      <div
        className="w-5 h-5 rounded-full bg-white transition-transform duration-200"
        style={{ transform: value ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </button>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const { currentUser, refreshUser } = useAuth();
  const { theme, setTheme, language, setLanguage, t } = useTheme();
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [dnd, setDnd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile form state (controlled inputs)
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    username: '',
    job_title: '',
    department: '',
  });

  // Password change form
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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await usersApi.updateProfile(profileForm);
      if (refreshUser) await refreshUser();
      toast.success(s.profileSaved || 'Profile saved!');
    } catch (err) {
      toast.error(err.message || 'Failed to save profile');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPasswordSaving(true);
    try {
      await authApi.changePassword(
        passwordForm.current_password,
        passwordForm.password,
        passwordForm.password_confirmation
      );
      toast.success('Password changed!');
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    }
    setPasswordSaving(false);
  };

  const handleNotifChange = async (key, value) => {
    const setters = { pushNotif: setPushNotif, emailNotif: setEmailNotif, dnd: setDnd };
    setters[key]?.(value);
    try {
      const body = {};
      if (key === 'pushNotif') body.push_notifications = value;
      if (key === 'emailNotif') body.email_notifications = value;
      if (key === 'dnd') body.do_not_disturb = value;
      await settingsApi.update(body);
    } catch {
      // revert on failure
      setters[key]?.(!value);
      toast.error('Failed to save setting');
    }
  };

  const s = t.settings;

  return (
    <div className="pb-10 max-w-[900px] mx-auto">
      <div className="mb-7">
        <h1 className="text-[22px] md:text-[28px] font-bold text-white/95 font-display m-0">{s.title}</h1>
        <p className="text-kodo-text-muted mt-1 text-[13px]">{s.subtitle}</p>
      </div>

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
            <label className="text-[12px] text-kodo-text-muted block mb-1.5">{s.displayName}</label>
            <input
              value={profileForm.display_name}
              onChange={e => setProfileForm(p => ({ ...p, display_name: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <div>
            <label className="text-[12px] text-kodo-text-muted block mb-1.5">{s.username}</label>
            <input
              value={profileForm.username}
              onChange={e => setProfileForm(p => ({ ...p, username: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <div>
            <label className="text-[12px] text-kodo-text-muted block mb-1.5">{s.position}</label>
            <input
              value={profileForm.job_title}
              onChange={e => setProfileForm(p => ({ ...p, job_title: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <div>
            <label className="text-[12px] text-kodo-text-muted block mb-1.5">{s.department}</label>
            <input
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

      <div className="kodo-card p-4 md:p-6 mb-4">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.appearance}</h3>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-medium text-kodo-text">{s.theme}</div>
              <div className="text-[12px] text-kodo-text-muted mt-0.5">{s.themeDesc}</div>
            </div>
            <div className="flex gap-1">
              {[
                { key: 'dark', label: s.dark },
                { key: 'light', label: s.light },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setTheme(opt.key);
                    settingsApi.update({ theme: opt.key }).catch(() => {});
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all border ${
                    theme === opt.key
                      ? 'bg-kodo-accent/10 border-kodo-accent/30 text-indigo-400'
                      : 'bg-transparent border-white/[0.08] text-kodo-text-dim hover:text-kodo-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-medium text-kodo-text">{s.language}</div>
              <div className="text-[12px] text-kodo-text-muted mt-0.5">{s.languageDesc}</div>
            </div>
            <div className="flex gap-1">
              {[
                { key: 'hu', label: s.hungarian },
                { key: 'en', label: s.english },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setLanguage(opt.key);
                    settingsApi.update({ language: opt.key }).catch(() => {});
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all border ${
                    language === opt.key
                      ? 'bg-kodo-accent/10 border-kodo-accent/30 text-indigo-400'
                      : 'bg-transparent border-white/[0.08] text-kodo-text-dim hover:text-kodo-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="kodo-card p-4 md:p-6">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.notifications}</h3>
        <div className="flex flex-col gap-5">
          {[
            { label: s.pushNotif, desc: s.pushNotifDesc, value: pushNotif, key: 'pushNotif' },
            { label: s.emailNotif, desc: s.emailNotifDesc, value: emailNotif, key: 'emailNotif' },
            { label: s.dndMode, desc: s.dndModeDesc, value: dnd, key: 'dnd' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[13px] font-medium text-kodo-text">{item.label}</div>
                <div className="text-[12px] text-kodo-text-muted mt-0.5">{item.desc}</div>
              </div>
              <Toggle value={item.value} onChange={v => handleNotifChange(item.key, v)} />
            </div>
          ))}
        </div>
      </div>

      <div className="kodo-card p-4 md:p-6 mt-4">
        <h3 className="text-[14px] font-semibold text-white m-0 mb-5">{s.changePassword || 'Change Password'}</h3>
        <div className="flex flex-col gap-3 max-w-[400px]">
          <div>
            <label className="text-[12px] text-kodo-text-muted block mb-1.5">{s.currentPassword || 'Current Password'}</label>
            <input
              type="password"
              value={passwordForm.current_password}
              onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <div>
            <label className="text-[12px] text-kodo-text-muted block mb-1.5">{s.newPassword || 'New Password'}</label>
            <input
              type="password"
              value={passwordForm.password}
              onChange={e => setPasswordForm(p => ({ ...p, password: e.target.value }))}
              className="kodo-input w-full"
            />
          </div>
          <div>
            <label className="text-[12px] text-kodo-text-muted block mb-1.5">{s.confirmNewPassword || 'Confirm New Password'}</label>
            <input
              type="password"
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
