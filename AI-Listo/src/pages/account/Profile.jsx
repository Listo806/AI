import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './account.css';

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Placeholder - will be connected to backend in future phase
    setTimeout(() => {
      setIsSaving(false);
      alert('Profile updated successfully!');
    }, 500);
  };

  return (
    <div className="account-page">
      <div className="account-header">
        <h1 className="account-title">Profile</h1>
        <p className="account-description">
          Manage your personal information and account details.
        </p>
      </div>

      <form onSubmit={handleSave} className="account-form">
        <div className="account-form-section">
          <label className="account-label">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="account-input"
              placeholder="Enter your name"
            />
          </label>

          <label className="account-label">
            Email
            <input
              type="email"
              value={user?.email || ''}
              className="account-input"
              readOnly
              disabled
            />
            <span className="account-help-text">Email cannot be changed at this time.</span>
          </label>
        </div>

        <div className="account-form-actions">
          <button 
            type="submit" 
            className="account-btn-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
