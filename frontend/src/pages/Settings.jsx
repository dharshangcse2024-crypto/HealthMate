import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Bell, Shield, LogOut, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import api from '../services/api';

const Settings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });
  
  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Delete Account State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const showFeedback = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 5000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords don't match.");
      return;
    }

    if (passwordData.new_password.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    setIsPasswordLoading(true);
    try {
      await api.patch('/auth/password', {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      setIsPasswordModalOpen(false);
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      showFeedback('Password changed successfully.');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password. Please try again.');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setIsDeleteLoading(true);

    try {
      await api.delete('/auth/account', {
        data: { password: deletePassword }
      });
      setIsDeleteModalOpen(false);
      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Failed to delete account. Please try again.');
      setIsDeleteLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ padding: '2rem' }}>
      <div style={{ margin: '0 auto', width: '100%', maxWidth: '800px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary-dark)' }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your application preferences.</p>
        </div>

      {feedbackMsg.text && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: feedbackMsg.type === 'error' ? 'var(--error-bg)' : 'var(--success-bg)', color: feedbackMsg.type === 'error' ? 'var(--error)' : 'var(--success)', borderRadius: '0.5rem' }}>
          {feedbackMsg.text}
        </div>
      )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--info-bg)', color: 'var(--info)', borderRadius: '0.5rem' }}>
              <Bell size={24} />
            </div>
            <h3 style={{ margin: 0 }}>Notifications</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <h4 style={{ margin: 0 }}>Medicine Reminders</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Receive alerts when it's time to take your medication.</p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: '1.25rem', height: '1.25rem' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
            <div>
              <h4 style={{ margin: 0 }}>Health Goal Updates</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Weekly summary of your health goals.</p>
            </div>
            <input type="checkbox" defaultChecked style={{ width: '1.25rem', height: '1.25rem' }} />
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-bg)', color: 'var(--success)', borderRadius: '0.5rem' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ margin: 0 }}>Privacy & Security</h3>
          </div>
          <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
            <Button onClick={() => setIsPasswordModalOpen(true)} variant="outline">Change Password</Button>
          </div>
          <div style={{ padding: '1rem 0' }}>
            <h4 style={{ margin: 0, marginBottom: '0.5rem', color: 'var(--error)' }}>Danger Zone</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
            <Button onClick={() => setIsDeleteModalOpen(true)} style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)' }}>Delete Account</Button>
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--secondary)', color: 'var(--primary-dark)', borderRadius: '0.5rem' }}>
              <SettingsIcon size={24} />
            </div>
            <h3 style={{ margin: 0 }}>Session</h3>
          </div>
          <Button onClick={handleLogout} variant="outline" icon={LogOut}>
            Logout
          </Button>
        </Card>

        </div>
      </div>

      {/* Change Password Modal */}
      <Modal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
        title="Change Password"
        icon={Key}
      >
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {passwordError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
              {passwordError}
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Current Password</label>
            <input 
              type="password" 
              required
              value={passwordData.old_password}
              onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>New Password</label>
            <input 
              type="password" 
              required
              value={passwordData.new_password}
              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Confirm New Password</label>
            <input 
              type="password" 
              required
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" onClick={() => setIsPasswordModalOpen(false)} variant="outline" style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" disabled={isPasswordLoading} style={{ flex: 1 }}>
              {isPasswordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Account"
        icon={AlertTriangle}
      >
        <form onSubmit={handleDeleteAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <strong>Warning:</strong> This action is permanent and cannot be undone. All your data, health history, and profile information will be permanently deleted.
          </div>
          {deleteError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--error-bg)', color: 'var(--error)', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
              {deleteError}
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>To confirm, please enter your password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showDeletePassword ? "text" : "password"} 
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowDeletePassword(!showDeletePassword)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showDeletePassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button type="button" onClick={() => setIsDeleteModalOpen(false)} variant="outline" style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" disabled={isDeleteLoading} style={{ flex: 1, backgroundColor: 'var(--error)', color: 'white', border: 'none' }}>
              {isDeleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
