import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  HeartPulse, 
  Activity, 
  MessageSquareHeart, 
  Pill, 
  Stethoscope, 
  ClipboardList, 
  MapPin, 
  User as UserIcon, 
  Settings,
  LogOut,
  AlarmClock
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link 
      to={to} 
      onClick={() => setIsOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-300 font-medium ${
        isActive(to) 
          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      <Icon size={20} className={isActive(to) ? 'text-white' : 'text-slate-400'} />
      <span>{label}</span>
    </Link>
  );

  return (
    <>
      {/* Overlay backdrop for mobile */}
      <div 
        className={`fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />
      <aside 
        className={`fixed lg:static top-0 left-0 h-[calc(100vh-2rem)] w-[280px] bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:m-4 lg:mr-0'}`}
        style={window.innerWidth >= 1024 ? { margin: '1rem', marginRight: '0' } : {}}
      >
        {/* Brand */}
      <div className="p-8 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl shadow-sm">
          <HeartPulse size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0 leading-none">HealthMate</h2>
          <span className="text-xs text-slate-500 font-medium tracking-wide">AI Assistant</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar">
        <NavItem to="/dashboard" icon={Activity} label="Dashboard" />
        
        <div className="mt-6 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider pl-4">
          Health
        </div>
        <NavItem to="/symptom-checker" icon={Stethoscope} label="Symptom Checker" />
        <NavItem to="/chat" icon={MessageSquareHeart} label="AI Health Assistant" />
        <NavItem to="/medicines" icon={Pill} label="Medicines" />
        <NavItem to="/medicine-reminders" icon={AlarmClock} label="Medicine Reminders" />
        <NavItem to="/drug-interaction" icon={Activity} label="Drug Interaction" />
        <NavItem to="/history" icon={ClipboardList} label="Health History" />

        <div className="mt-6 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider pl-4">
          Care
        </div>
        <NavItem to="/hospitals" icon={MapPin} label="Nearby Hospitals" />

        <div className="mt-6 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider pl-4">
          Account
        </div>
        <NavItem to="/profile" icon={UserIcon} label="Profile" />
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </div>

      {/* User Profile Footer */}
      {user && (
        <div className="p-6">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full p-3 rounded-xl bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      )}
    </aside>
    </>
  );
};

export default Sidebar;
