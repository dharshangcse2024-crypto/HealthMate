import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <HeartPulse size={32} />
        HealthMate
      </Link>
      
      <div className="navbar-links">
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/symptom-checker" className="nav-link">Symptom Checker</Link>
            <Link to="/medicine-reminders" className="nav-link">Medicines</Link>
            <Link to="/history" className="nav-link">History</Link>
            <Link to="/chat" className="nav-link">AI Assistant</Link>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
              <User size={18} /> Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
