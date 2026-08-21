import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', { 
        token, 
        new_password: password 
      });
      setSuccess(response.data.message);
      // Wait a bit before redirecting, or just let them click the link
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, var(--secondary-light) 0%, var(--secondary) 100%)',
      padding: '2rem'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '3rem 2.5rem',
        boxShadow: '0 10px 25px -5px rgba(22, 120, 114, 0.1), 0 8px 10px -6px rgba(22, 120, 114, 0.1)',
        border: 'none',
        borderRadius: '1.5rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
            boxShadow: '0 4px 6px -1px rgba(22, 120, 114, 0.2)'
          }}>
            <Lock size={32} />
          </div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-muted)' }}>Enter your new password below</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '0.875rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Error:</span> {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.875rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Success:</span> {success} (Redirecting to login...)
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} autoComplete="off">
            <Input 
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              containerStyle={{ marginBottom: '1.5rem' }}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />

            <Input 
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              containerStyle={{ marginBottom: '2rem' }}
            />

            <Button type="submit" loading={loading} disabled={!token} style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
              Reset Password
            </Button>
          </form>
        )}

        {(!token || success) && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <Link to="/login" style={{ color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '500' }}>
              Back to Login
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
