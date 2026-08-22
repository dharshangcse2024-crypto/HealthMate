import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { Activity, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
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
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        await userInfoRes.json();
        
        const response = await api.post('/auth/google', {
          token: tokenResponse.access_token
        });
        localStorage.setItem('token', response.data.access_token);
        // Force reload to update context
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
    <>
      <div className="login-container" style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        {/* Left Side (Purple Theme) */}
        <div className="login-left" style={{ 
          flex: 1, 
          backgroundColor: '#9333ea', 
          background: 'radial-gradient(circle at 30% 20%, #6b21a8 0%, #9333ea 50%, #c084fc 100%)',
          color: 'white',
          padding: '3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', fontWeight: '800', zIndex: 10 }}>
            <Activity size={24} />
            HEALTHMATE
          </div>

          {/* Big Text */}
          <div style={{ zIndex: 10, maxWidth: '600px', margin: 'auto 0' }}>
            <h1 style={{ 
              fontSize: '4.5rem', 
              fontWeight: '600', 
              lineHeight: '1.1', 
              marginBottom: '1.5rem',
              fontFamily: 'Georgia, serif'
            }}>
              Track what<br />truly matters.
            </h1>
            <p style={{ 
              fontSize: '1.25rem', 
              lineHeight: '1.6', 
              opacity: 0.9,
              maxWidth: '450px'
            }}>
              A secure space to log symptoms, organize medications, and stay on top of your health journey.
            </p>
          </div>

          {/* Footer Text */}
          <div style={{ fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.1em', opacity: 0.7, zIndex: 10, textTransform: 'uppercase' }}>
            HEALTHMATE FOR YOUR WELL-BEING.<br />
            EST. 2026
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="login-right" style={{ 
          flex: 1.1, 
          backgroundColor: '#fdfcf8',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem 4rem',
          color: '#1a1a1a'
        }}>
          <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
            
            <div style={{ marginBottom: '2.5rem' }}>
              <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                MEMBER ACCESS
              </span>
              <h2 style={{ fontSize: '3rem', fontWeight: '600', fontFamily: 'Georgia, serif', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                Sign in to continue
              </h2>
              <p style={{ color: '#6b7280', fontSize: '1rem' }}>
                Use your account details to enter your workspace.
              </p>
            </div>

            {error && (
              <div style={{ backgroundColor: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: '600' }}>Error:</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off">
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>Email address</label>
                <input 
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#d97706'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#374151' }}>Password</label>
                  <Link to="/forgot-password" style={{ color: '#d97706', fontSize: '0.85rem', textDecoration: 'none', fontWeight: '500' }}>
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: 'white'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#d97706'}
                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Remember Me Checkbox placeholder (matching image) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input type="checkbox" id="remember" style={{ width: '16px', height: '16px', accentColor: '#d97706' }} />
                  <label htmlFor="remember" style={{ fontSize: '0.85rem', color: '#6b7280' }}>Remember me</label>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '0.875rem', 
                  borderRadius: '6px', 
                  backgroundColor: '#d97706',
                  color: 'white',
                  fontSize: '0.95rem', 
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s ease',
                  boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.2)'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b45309'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In →'}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              <span style={{ color: '#9ca3af', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.1em' }}>OR CONTINUE WITH</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={googleLoading}
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                color: '#374151',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
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

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#9ca3af', fontSize: '0.75rem', lineHeight: '1.5' }}>
              By continuing, you agree to HealthMate's Terms and Privacy Policy.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#6b7280' }}>
                Don't have an account? <Link to="/register" style={{ color: '#d97706', fontWeight: '600', textDecoration: 'none' }}>Register here</Link>
              </span>
              <span style={{ color: '#9ca3af', cursor: 'pointer' }}>Need help? Contact support</span>
            </div>

          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 900px) {
          .login-container { flex-direction: column !important; }
          .login-left { display: none !important; }
          .login-right { padding: 3rem 2rem !important; }
        }
      `}</style>
    </>
  );
};

export default Login;
