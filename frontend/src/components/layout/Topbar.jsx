import { Search, Menu } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from 'react-router-dom';

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const query = e.target.value.toLowerCase();
      if (!query.trim()) return;

      if (query.includes('medicine') || query.includes('pill') || query.includes('drug')) {
        navigate('/medicines');
      } else if (query.includes('symptom') || query.includes('fever') || query.includes('pain') || query.includes('headache') || query.includes('sick')) {
        navigate('/symptom-checker');
      } else if (query.includes('interact')) {
        navigate('/drug-interaction');
      } else if (query.includes('hospital') || query.includes('doctor') || query.includes('clinic')) {
        navigate('/hospitals');
      } else if (query.includes('history') || query.includes('record')) {
        navigate('/history');
      } else if (query.includes('profile') || query.includes('setting') || query.includes('account')) {
        navigate('/profile');
      } else {
        // Default to chatbot to answer any health query
        navigate('/chat');
      }
      e.target.value = '';
    }
  };

  return (
    <header className="flex items-center justify-between px-6 h-[80px] bg-transparent z-10 w-full">
      <div className="flex items-center gap-6 flex-1">
        <button onClick={toggleSidebar} className="lg:hidden bg-white/20 p-2 rounded-lg text-white hover:bg-white/30 transition-colors border border-white/30 backdrop-blur-sm">
          <Menu size={24} />
        </button>
        
        <div className="flex items-center bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-2.5 w-full max-w-md shadow-sm transition-all focus-within:bg-white/30 focus-within:shadow-md">
          <Search size={20} className="text-white/80" />
          <input 
            type="text" 
            className="bg-transparent border-none outline-none text-white placeholder-white/70 ml-3 w-full font-medium"
            placeholder="Search for symptoms, medicines..." 
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm cursor-pointer overflow-hidden transition-transform hover:scale-105"
          >
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name ? user.name.charAt(0) : 'U'
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
