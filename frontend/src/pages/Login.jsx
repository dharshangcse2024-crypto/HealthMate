import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { User, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      try {
        // Exchange the access token for user info, then send ID token to backend
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        
        // For the backend, we send user info directly since we used implicit flow
        const response = await api.post('/auth/google', {
          token: tokenResponse.access_token
        });
        localStorage.setItem('token', response.data.access_token);
        const profileRes = await api.get('/profile');
        // We need to reload to set user context
        window.location.href = '/dashboard';
      } catch (err) {
        setError(err.response?.data?.detail || 'Google login failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google login was cancelled or failed.');
    }
  });

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
            <User size={32} />
          </div>
          <h2 style={{ color: 'var(--text)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)' }}>Enter your credentials to access your account</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '0.875rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: '600' }}>Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <Input 
            label="Email Address"
            type="email"
            icon={User}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="off"
            containerStyle={{ marginBottom: '1.5rem' }}
          />

          <Input 
            label="Password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            containerStyle={{ marginBottom: '2rem' }}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', marginTop: '-1rem' }}>
            <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.875rem', textDecoration: 'none', fontWeight: '500' }}>
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" loading={loading} style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
            Login to HealthMate
          </Button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={googleLoading}
          style={{
            width: '100%',
            padding: '0.875rem',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: '500',
            color: 'var(--text)',
            transition: 'all 0.2s ease'
          }}
        >
          {googleLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          )}
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Register here</Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
