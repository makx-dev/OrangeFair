import { useState, useEffect } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Globe, 
  Lock, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Eye 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/TranslationProvider';
import { getMe, updateProfile, changePassword } from '../api/endpoints';

export default function SettingsPage() {
  const { user: authUser, logout, login, token } = useAuth();
  const { language, setLanguage, t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: authUser?.name || '',
    email: authUser?.email || '',
    role: authUser?.role || 'rider',
    isGoogleOnly: false,
    preferences: {
      language: language || 'en',
      notifications: {
        reportUpdates: true,
        communityActivity: true,
        accountNotifications: true,
      },
      profileVisibility: 'community',
      communityActivityVisibility: true,
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const { data } = await getMe();
        if (data?.user) {
          setProfileData({
            name: data.user.name || '',
            email: data.user.email || '',
            role: data.user.role || 'rider',
            isGoogleOnly: Boolean(data.user.isGoogleOnly),
            preferences: {
              language: data.user.preferences?.language || language || 'en',
              notifications: {
                reportUpdates: data.user.preferences?.notifications?.reportUpdates ?? true,
                communityActivity: data.user.preferences?.notifications?.communityActivity ?? true,
                accountNotifications: data.user.preferences?.notifications?.accountNotifications ?? true,
              },
              profileVisibility: data.user.preferences?.profileVisibility || 'community',
              communityActivityVisibility: data.user.preferences?.communityActivityVisibility ?? true,
            },
          });
          if (data.user.preferences?.language) {
            setLanguage(data.user.preferences.language);
          }
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [setLanguage, language]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (key) => {
    setProfileData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        notifications: {
          ...prev.preferences.notifications,
          [key]: !prev.preferences.notifications[key],
        },
      },
    }));
  };

  const handlePrivacyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfileData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setProfileData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        language: newLang,
      },
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileStatus({ type: '', message: '' });
    setIsSavingProfile(true);

    try {
      const payload = {
        name: profileData.name,
        preferences: profileData.preferences,
      };
      const { data } = await updateProfile(payload);
      
      // Update local storage user context
      if (data?.user && token) {
        login(token, { ...authUser, ...data.user });
      }

      setProfileStatus({ type: 'success', message: 'Settings and profile updated successfully.' });
      setTimeout(() => setProfileStatus({ type: '', message: '' }), 4000);
    } catch (err) {
      setProfileStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update profile settings.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', message: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordStatus({ type: 'success', message: 'Password changed successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordStatus({ type: '', message: '' }), 4000);
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to change password. Check your current password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-text-secondary">Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
          <SettingsIcon className="text-primary" size={32} />
          Settings & Account
        </h1>
        <p className="text-text-secondary">
          Manage your OrangeFair profile, notification preferences, language, and security.
        </p>
      </div>

      {profileStatus.message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            profileStatus.type === 'success'
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-error/10 border-error/20 text-error'
          }`}
        >
          {profileStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          <span className="font-medium text-sm">{profileStatus.message}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        
        {/* Section 1: Account Information */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Account</h2>
              <p className="text-xs text-text-secondary">Basic account credentials and verified role</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Email Address</label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full px-4 py-2.5 bg-background/50 border border-border rounded-xl text-text-secondary cursor-not-allowed text-sm font-medium"
              />
              <span className="text-xs text-text-secondary mt-1 block">Email is permanently associated with this account.</span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Account Role</label>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-3 py-1.5 bg-primary/10 text-primary-dark font-bold text-sm rounded-lg uppercase tracking-wider border border-primary/20">
                  {profileData.role}
                </span>
                <span className="text-xs text-text-secondary">Community Member</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Profile Settings */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center text-info">
              <Eye size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Profile</h2>
              <p className="text-xs text-text-secondary">Personal public representation across OrangeFair</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">Display Name</label>
            <input
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              required
              placeholder="Your full name"
              className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-text-primary font-medium text-sm"
            />
          </div>
        </section>

        {/* Section 3: Preferences & Language */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Preferences & Language</h2>
              <p className="text-xs text-text-secondary">Localized interface and alert preferences</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">Preferred Language</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { code: 'en', label: 'English', sub: 'English (EN)' },
                { code: 'mr', label: 'मराठी', sub: 'Marathi (MR)' },
                { code: 'hi', label: 'हिंदी', sub: 'Hindi (HI)' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    profileData.preferences.language === lang.code
                      ? 'bg-primary/10 border-primary text-primary-dark font-bold ring-1 ring-primary'
                      : 'bg-background border-border text-text-primary hover:border-primary/50'
                  }`}
                >
                  <p className="text-base font-bold">{lang.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{lang.sub}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-text-primary">Notification Settings</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Report Updates</p>
                  <p className="text-xs text-text-secondary">Receive alerts when status of filed reports progresses</p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.preferences.notifications.reportUpdates}
                  onChange={() => handleNotificationToggle('reportUpdates')}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Community Activity</p>
                  <p className="text-xs text-text-secondary">Notifications when drivers reply to your experiences</p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.preferences.notifications.communityActivity}
                  onChange={() => handleNotificationToggle('communityActivity')}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-text-primary">Account Notifications</p>
                  <p className="text-xs text-text-secondary">Important safety alerts and platform announcements</p>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.preferences.notifications.accountNotifications}
                  onChange={() => handleNotificationToggle('accountNotifications')}
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </section>

        {/* Section 4: Privacy Settings */}
        <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">Privacy</h2>
              <p className="text-xs text-text-secondary">Control visibility of your profile and contributions</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Profile Visibility</label>
              <select
                name="profileVisibility"
                value={profileData.preferences.profileVisibility}
                onChange={handlePrivacyChange}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-text-primary font-medium text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="community">Community (Visible to verified riders & drivers)</option>
                <option value="public">Public (Visible to all commuters)</option>
                <option value="private">Private (Only visible to you and moderators)</option>
              </select>
            </div>

            <label className="flex items-center justify-between p-3.5 bg-background border border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
              <div>
                <p className="text-sm font-semibold text-text-primary">Community Activity Visibility</p>
                <p className="text-xs text-text-secondary">Show your verified ride count on public reviews</p>
              </div>
              <input
                type="checkbox"
                name="communityActivityVisibility"
                checked={profileData.preferences.communityActivityVisibility}
                onChange={handlePrivacyChange}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </label>
          </div>
        </section>

        {/* Save Profile Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {isSavingProfile ? 'Saving Changes...' : 'Save Profile & Preferences'}
          </button>
        </div>
      </form>

      {/* Section 5: Security & Password */}
      <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Security</h2>
            <p className="text-xs text-text-secondary">Password management and session termination</p>
          </div>
        </div>

        {profileData.isGoogleOnly ? (
          <div className="p-4 bg-info/10 border border-info/20 rounded-xl text-sm text-text-primary">
            <p className="font-semibold text-info mb-1">Google Account Linked</p>
            This account signs in securely with Google. Password changes are handled through your Google Account settings.
          </div>
        ) : (
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 max-w-md">
            {passwordStatus.message && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 border text-sm font-medium ${
                  passwordStatus.type === 'success'
                    ? 'bg-success/10 border-success/20 text-success'
                    : 'bg-error/10 border-error/20 text-error'
                }`}
              >
                {passwordStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-text-primary text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-text-primary text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-text-primary text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-2.5 bg-surface border border-border text-text-primary font-semibold rounded-xl hover:bg-background hover:border-primary/50 transition-colors disabled:opacity-50 text-sm"
            >
              {isChangingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        )}

        <div className="pt-6 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-text-primary">Sign Out</p>
            <p className="text-xs text-text-secondary">Safely log out from this browser session</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 bg-error/10 hover:bg-error text-error hover:text-white border border-error/20 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </section>
    </div>
  );
}
