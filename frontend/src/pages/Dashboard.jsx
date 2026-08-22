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

      {/* Welcome Header */}
      <div className="animate-fadeIn mb-10 mt-4">
        <div>
          <h1 className="text-4xl text-white font-bold mb-2 tracking-wide">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-white/80 text-lg font-medium">Here's your health overview for today.</p>
        </div>
      </div>

      {/* Top Row: BMI Card + SOS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* BMI Health Status Card */}
        <Card style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)' }} />
            </div>
          ) : bmi ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <BmiGauge bmi={parseFloat(bmi)} category={bmiCategory.label} color={bmiCategory.color} />
                <div style={{ marginTop: '0.5rem' }}>
                  <StatusBadge label={bmiCategory.label} color={bmiCategory.color} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                >
                  <motion.div variants={itemVariants} style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Height</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>{profile?.height || '—'} cm</div>
                  </motion.div>
                  <motion.div variants={itemVariants} style={{ padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Weight</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>{profile?.weight || '—'} kg</div>
                  </motion.div>
                </motion.div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', lineHeight: 1.5 }}>
                  BMI is a screening indicator, not a medical diagnosis. Consult a doctor for personalized health advice.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <UserIcon size={40} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
              <p style={{ marginBottom: '1rem' }}>Complete your profile to calculate BMI.</p>
              <Link to="/profile" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>
                Go to Profile
              </Link>
            </div>
          )}
        </Card>

        {/* SOS Emergency Card */}
        <SOSButton />
      </div>

      {/* Quick Actions */}
      <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }} className="text-foreground font-semibold">Quick Actions</h3>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8 w-full"
      >
        {[
          { to: '/symptom-checker', icon: Stethoscope, label: 'Symptom Checker', desc: 'Check your symptoms', bg: 'var(--secondary-light)', color: 'var(--primary)' },
          { to: '/chat', icon: Bot, label: 'AI Chatbot', desc: 'Ask health questions', bg: '#f0f9ff', color: 'var(--primary-dark)' },
          { to: '/drug-interaction', icon: Pill, label: 'Drug Interactions', desc: 'Check medicine safety', bg: '#fef3c7', color: '#d97706' },
          { to: '/hospitals', icon: MapPin, label: 'Nearby Hospitals', desc: 'Find healthcare', bg: '#dcfce7', color: '#15803d' },
          { to: '/medicines', icon: Activity, label: 'Medicine Info', desc: 'Look up medicines', bg: '#e0e7ff', color: '#4338ca' },
          { to: '/history', icon: ClipboardList, label: 'Health History', desc: 'View past records', bg: '#fce7f3', color: '#be185d' },
        ].map(action => (
          <motion.div key={action.to} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <Link to={action.to} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
              <Card style={{ padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s ease', border: 'none', backgroundColor: action.bg, height: '100%', boxSizing: 'border-box' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Recent Activity</h3>
        <Link to="/history" style={{ fontSize: '0.875rem', fontWeight: 500 }}>View All <ChevronRight size={14} style={{ verticalAlign: 'middle' }} /></Link>
      </div>

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
    </motion.div>
  );
};

export default Dashboard;
