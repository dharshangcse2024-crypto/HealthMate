import { useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import SymptomChecker from './pages/SymptomChecker';
import History from './pages/History';
import MedicineReminders from './pages/MedicineReminders';
import Medicines from './pages/Medicines';
import DrugInteraction from './pages/DrugInteraction';
import Hospitals from './pages/Hospitals';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import ReminderNotification from './components/ui/ReminderNotification';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  
  const isAuthRoute = ['/', '/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);

  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    );
  }

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const AdminRoute = ({ children }) => {
    if (!user.is_admin) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  };

  return (
    <div className="app-layout relative min-h-screen">
      {/* Global Theme Gradient Background */}
      <div className="fixed top-0 left-0 w-full min-h-screen z-0 pointer-events-none" style={{ backgroundColor: '#f0a146' }}></div>
      
      {/* Global Medicine Reminder Notification */}
      <ReminderNotification />
      
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="main-wrapper relative z-10 flex-1 flex flex-col">
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="content-area flex-1">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/symptom-checker" element={<SymptomChecker />} />
            <Route path="/history" element={<History />} />
            <Route path="/medicine-reminders" element={<MedicineReminders />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/drug-interaction" element={<DrugInteraction />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
