import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { 
  Stethoscope, 
  Bot, 
  Heart, 
  Activity,
  Phone,
  MapPin,
  ChevronRight,
  AlertTriangle,
  FileText,
  Loader2,
  Pill,
  ClipboardList,
  MessageSquareHeart,
  Clock,
  RefreshCw,
  User as UserIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StatusBadge from '../components/ui/StatusBadge';
import BmiGauge from '../components/ui/BmiGauge';
import SOSButton from '../components/SOSButton';


const Dashboard = () => {
  const { user } = useAuth();
  const [showConsent, setShowConsent] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState({ label: '', color: '' });
  const [recalculating, setRecalculating] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    if (user && !localStorage.getItem(`consent_${user.id || user.user_id}`)) {
      setShowConsent(true);
    }
  }, [user]);

  // Fetch profile data for BMI
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setProfile(res.data);
        calculateBmi(res.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch recent activity
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get('/health-history');
        setRecentActivity(res.data.slice(0, 5)); // Latest 5
      } catch (err) {
        console.error('Failed to load activity', err);
      } finally {
        setActivityLoading(false);
      }
    };
    fetchActivity();
  }, []);

  const calculateBmi = (profileData) => {
    if (profileData?.height && profileData?.weight) {
      const h = parseFloat(profileData.height) / 100;
      const w = parseFloat(profileData.weight);
      if (h > 0 && w > 0) {
        const bmiValue = w / (h * h);
        setBmi(bmiValue.toFixed(1));
        if (bmiValue < 18.5) {
          setBmiCategory({ label: 'Underweight', color: 'var(--info)' });
        } else if (bmiValue < 25) {
          setBmiCategory({ label: 'Normal', color: 'var(--success)' });
        } else if (bmiValue < 30) {
          setBmiCategory({ label: 'Overweight', color: 'var(--warning)' });
        } else {
          setBmiCategory({ label: 'Obese', color: 'var(--error)' });
        }
        return;
      }
    }
    setBmi(null);
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await api.get('/profile');
      setProfile(res.data);
      calculateBmi(res.data);
    } catch (err) {
      console.error('Failed to refresh profile', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleConsent = () => {
    localStorage.setItem(`consent_${user?.id || user?.user_id}`, 'true');
    setShowConsent(false);
  };

  const handleSOS = async () => {
    setSosLoading(true);
    setSosMessage('');
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          try {
            await api.post(`/extended/sos/notify?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`);
            setSosMessage("SOS sent to emergency contact.");
          } catch (err) {
            setSosMessage(err.response?.data?.detail || "SOS failed. Set your emergency contact in Profile.");
          } finally {
            setSosLoading(false);
          }
        }, async () => {
          try {
            await api.post('/extended/sos/notify');
            setSosMessage("SOS sent (without location).");
          } catch (err) {
            setSosMessage(err.response?.data?.detail || "SOS failed. Set your emergency contact in Profile.");
          } finally {
            setSosLoading(false);
          }
        });
      } else {
        await api.post('/extended/sos/notify');
        setSosMessage("SOS sent (without location).");
        setSosLoading(false);
      }
    } catch (err) {
      setSosMessage("SOS failed. Please try again.");
      setSosLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
    >
      {/* Consent Modal */}
      <Modal 
        isOpen={showConsent} 
        onClose={handleConsent}
        title="Terms & Medical Disclaimer"
        icon={FileText}
      >
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, paddingRight: '1rem' }}>
          <p>Welcome to HealthMate. Before you proceed, please read and agree to our terms:</p>
          <p><strong>1. Not a Substitute for Professional Medical Advice:</strong> The content provided by HealthMate, including AI chatbot responses and symptom checking, is for informational purposes only.</p>
          <p><strong>2. Emergency Situations:</strong> Do not use this application for medical emergencies. Call your local emergency services immediately.</p>
          <p><strong>3. Data Privacy:</strong> We prioritize your data security. Your health information is stored securely.</p>
        </div>
        <Button onClick={handleConsent} style={{ width: '100%' }}>I Agree and Understand</Button>
      </Modal>

      <div className="mb-6 md:mb-8 w-full text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
        <p className="text-white/90 text-sm md:text-base">Here's your health overview for today.</p>
      </div>

      {/* Top Cards Row */}
      <div className="flex flex-row overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 gap-4 md:gap-6 w-full mb-8 pb-4 md:pb-0 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        
        {/* BMI Health Status Card */}
        <Card className="min-w-[85vw] sm:min-w-[400px] md:min-w-0 snap-center shrink-0 p-4 md:p-8 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--secondary)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                <Heart size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.125rem' }}>BMI Health Status</h3>
            </div>
            <Button
              onClick={handleRecalculate}
              loading={recalculating}
              variant="outline"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <motion.div
                animate={{ rotate: recalculating ? 360 : 0 }}
                transition={{ duration: 1, ease: "linear", repeat: recalculating ? Infinity : 0 }}
                style={{ display: 'inline-flex', marginRight: '0.5rem' }}
              >
                <RefreshCw size={14} />
              </motion.div>
              Recalculate
            </Button>
          </div>

          {profileLoading ? (
            <div className="flex justify-center p-8 w-full">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : bmi ? (
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 w-full justify-around">
              <div className="text-center w-full md:w-auto flex flex-col items-center">
                <BmiGauge bmi={parseFloat(bmi)} category={bmiCategory.label} color={bmiCategory.color} />
                <div className="mt-4">
                  <StatusBadge label={bmiCategory.label} color={bmiCategory.color} />
                </div>
              </div>
              <div className="flex-1 w-full">
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-2 gap-4 w-full"
                >
                  <motion.div variants={itemVariants} className="p-3 md:p-4 bg-background rounded-lg text-center">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Height</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>{profile?.height || '—'} cm</div>
                  </motion.div>
                  <motion.div variants={itemVariants} className="p-3 md:p-4 bg-background rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Weight</div>
                    <div className="font-bold text-foreground">{profile?.weight || '—'} kg</div>
                  </motion.div>
                </motion.div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.5 }}>
                  BMI is a screening indicator, not a medical diagnosis. Consult a doctor for personalized health advice.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground w-full flex flex-col items-center">
              <UserIcon size={40} className="opacity-40 mb-4" />
              <p className="mb-4">Complete your profile to calculate BMI.</p>
              <Link to="/profile" className="btn btn-primary px-6 py-2">
                Go to Profile
              </Link>
            </div>
          )}
        </Card>

        {/* SOS Emergency Card */}
        <div className="min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center shrink-0">
          <SOSButton />
        </div>
      </div>

      {/* Main Bottom Section Wrapper */}
      <div className="bg-[#FFFBEB] dark:bg-background rounded-t-3xl pt-6 px-4 md:px-0 -mx-4 md:mx-0 md:w-full flex-1 min-h-screen">
        
        {/* Quick Actions */}
        <h3 className="text-lg md:text-xl mb-4 text-foreground font-semibold px-2 md:px-0">Quick Actions</h3>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-8 w-full px-2 md:px-0"
        >
        {[
          { to: '/symptom-checker', icon: Stethoscope, label: 'Symptom Checker', desc: 'Check your symptoms', bg: 'var(--secondary-light)', color: 'var(--primary)' },
          { to: '/chat', icon: Bot, label: 'AI Chatbot', desc: 'Ask health questions', bg: '#f0f9ff', color: 'var(--primary-dark)' },
          { to: '/drug-interaction', icon: Pill, label: 'Drug Interactions', desc: 'Check medicine safety', bg: '#fef3c7', color: '#d97706' },
          { to: '/hospitals', icon: MapPin, label: 'Nearby Hospitals', desc: 'Find healthcare', bg: '#dcfce7', color: '#15803d' },
          { to: '/medicines', icon: Activity, label: 'Medicine Info', desc: 'Look up medicines', bg: '#e0e7ff', color: '#4338ca' },
          { to: '/history', icon: ClipboardList, label: 'Health History', desc: 'View past records', bg: '#fce7f3', color: '#be185d' },
        ].map(action => (
          <motion.div key={action.to} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="h-full">
            <Link to={action.to} className="block h-full no-underline hover:no-underline">
              <Card className="p-3 md:p-5 cursor-pointer border-none h-full w-full transition-all duration-200 hover:shadow-md" style={{ backgroundColor: action.bg }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', backgroundColor: 'white', color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <action.icon size={20} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.25rem' }}>{action.label}</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{action.desc}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity — Real Data */}
      <div className="flex justify-between items-center mb-4 w-full px-2 md:px-0 mt-4">
        <h3 className="text-lg md:text-xl m-0 font-semibold text-foreground">Recent Activity</h3>
        <Link to="/history" className="text-sm font-medium flex items-center text-primary">View All <ChevronRight size={14} /></Link>
      </div>

      <div className="px-2 md:px-0 mb-8">
        {activityLoading ? (
          <Card style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
          </Card>
        ) : recentActivity.length === 0 ? (
          <Card className="animate-fadeIn" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
            <Clock size={40} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
            <h4 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '0.5rem' }}>No activity yet</h4>
            <p style={{ fontSize: '0.95rem' }}>Your symptom checks and AI consultations will securely appear here.</p>
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            <AnimatePresence initial={false}>
              {recentActivity.map((record, idx) => (
                <motion.div 
                  key={record.id} 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: idx < recentActivity.length - 1 ? '1px solid var(--border)' : 'none', overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '0.5rem',
                    backgroundColor: record.record_type === 'ai_chat' ? '#fef3c7' : 'var(--secondary)',
                    color: record.record_type === 'ai_chat' ? '#d97706' : 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {record.record_type === 'ai_chat' ? <MessageSquareHeart size={20} /> : <Activity size={20} />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', margin: 0 }}>
                      {record.record_type === 'ai_chat' ? 'AI Consultation' : 'Symptom Check'}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      {record.record_type === 'ai_chat'
                        ? (record.description?.substring(0, 50) || 'Health query') + (record.description?.length > 50 ? '...' : '')
                        : record.symptoms
                          ? JSON.parse(record.symptoms).slice(0, 3).join(', ')
                          : record.prediction || 'Analysis'}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(record.created_at)}
                </span>
              </motion.div>
            ))}
            </AnimatePresence>
          </Card>
        )}
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
