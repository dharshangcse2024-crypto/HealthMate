import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset.');
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
            <Mail size={32} />
          </div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Forgot Password</h2>
          <p style={{ color: 'var(--text-muted)' }}>Enter your email to receive a password reset link</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '0.875rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Error:</span> {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '0.875rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Success:</span> {success}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} autoComplete="off">
            <Input 
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              containerStyle={{ marginBottom: '2rem' }}
            />

            <Button type="submit" loading={loading} style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
              Send Reset Link
            </Button>
          </form>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '500' }}>
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
