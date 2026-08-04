import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pencil,
  UserCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/userApi';
import './profile-layout.css';

export default function Profile() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setJobTitle(user.jobTitle ?? '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      
      // Backend UpdateProfileDto whitelists only name + phone (forbidNonWhitelisted
      // rejects anything else). jobTitle is not persisted server-side yet.
      await updateProfile({
        name: name.trim() || null,
        phone: phone.trim(),
      });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRole = (role) => {
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
   
    <div className="account-page">
      {/* Header */}
      <div className="account-header">
        <h1 className="account-title">{t('account.profile.title')}</h1>
        <p className="account-description">
          {t('account.profile.subtitle')}
        </p>
      </div>

      {error && (
        <div className="account-message account-message-error" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="account-message account-message-success" role="status">
          {t('account.profile.changesSaved')}
        </div>
      )}

      {/* Layout Content */}
      <div className="profile-container">
        
        <div className="profile-sidebar">
          <div className="avatar-section">
            <div className="profile-avatar">
              {getInitials(name)}
              
              <button type="button" className="edit-avatar-btn" title={t('account.profile.editAvatar')}>
                <Pencil size={14} /> 
              </button>
            </div>
            <h2 className="profile-display-name">{name}</h2>
            <span className="profile-badge-admin">{formatRole(user?.role) || t('account.profile.member')}</span>
            <p className="profile-display-email">{user?.email || 'admin@cortexaaicrm.com'}</p>
          </div>

          <div className="profile-meta-list">
            <div className="meta-item">
              <div className="meta-icon-wrapper">
                <UserCircle2 size={16} />
              </div>
              <div className="meta-content">
                <label>{t('account.profile.role')}</label>
                <p>{formatRole(user?.role) || t('account.profile.member')}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="profile-main-form">
          <div className="form-header-row">
            <h3 className="form-section-title">{t('account.profile.personalInformation')}</h3>
          </div>
          
          <div className="form-grid">
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label">{t('account.profile.fullName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder={t('account.profile.enterFullName')}
              />
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label className="form-label">{t('account.profile.emailAddress')}</label>
              <div className="input-with-badge">
                <input
                  type="email"
                  value={user?.email || 'admin@cortexaaicrm.com'}
                  className="form-input read-only-input"
                  readOnly
                  disabled
                />
                <span className="verified-badge">
                  {t('account.profile.verified')} <span className="checkmark">✓</span>
                </span>
              </div>
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label">{t('account.profile.phoneNumber')}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                placeholder={t('account.profile.enterPhoneNumber')}
              />
            </div>

            {/* Job Title */}
            <div className="form-group">
              <label className="form-label">{t('account.profile.jobTitle')}</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="form-input"
                placeholder={t('account.profile.enterJobTitle')}
              />
            </div>

          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className={`btn-save-changes ${name && phone ? 'active' : ''}`}
              disabled={isSaving}
            >
              {isSaving ? t('account.profile.saving') : t('account.profile.saveChanges')}
            </button>
          </div>
        </form>
      </div>

      <div className="profile-footer-hint">
        <Info size={16} className="hint-icon" /> 
        <p>{t('account.profile.footerHint')}</p>
      </div>
    </div>
  );
}