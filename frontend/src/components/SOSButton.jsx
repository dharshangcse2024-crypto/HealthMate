import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { AlertTriangle, Loader2, Mail } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';

const SOSButton = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSOS = async () => {
    if (!window.confirm("Are you sure you want to trigger an SOS alert? This will notify your emergency contact.")) return;
    
    setLoading(true);
    setStatus('');
    
    try {
      // For simplicity, we trigger without location first. 
      // If geolocation is available, we could fetch it before the API call.
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          await sendSOS(position.coords.latitude, position.coords.longitude);
        }, async () => {
          // Fallback if user denies location
          await sendSOS();
        });
      } else {
        await sendSOS();
      }
    } catch (err) {
      console.error(err);
      setStatus('Failed to send SOS. Check emergency contact settings.');
      setLoading(false);
    }
  };

  const sendSOS = async (lat = null, lng = null) => {
    try {
      let url = '/extended/sos/notify';
      if (lat && lng) url += `?latitude=${lat}&longitude=${lng}`;
      
      await api.post(url);
      setStatus('SOS Sent Successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to send SOS.';
      if (errorMsg.toLowerCase().includes('email') || errorMsg.toLowerCase().includes('contact')) {
        setStatus('No emergency contact email configured. Please add one in your Profile.');
      } else {
        setStatus(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <motion.div 
        animate={loading ? { scale: [1, 1.1, 1], boxShadow: ["0px 0px 0px rgba(220, 38, 38, 0)", "0px 0px 20px rgba(220, 38, 38, 0.4)", "0px 0px 0px rgba(220, 38, 38, 0)"] } : { scale: 1, boxShadow: "none" }}
        transition={{ duration: 1.5, repeat: loading ? Infinity : 0, ease: "easeInOut" }}
        style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fee2e2', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}
      >
        <AlertTriangle size={32} />
      </motion.div>
      <h3 style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>Emergency / SOS</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        In case of a medical emergency, contact immediate help.
      </p>
      
      <Button 
        onClick={handleSOS} 
        loading={loading}
        icon={Mail}
        style={{ 
          backgroundColor: loading ? 'var(--text-muted)' : 'var(--error)', 
          color: 'white', 
          width: '100%', 
          maxWidth: '250px',
          display: 'flex', 
          justifyContent: 'center', 
          gap: '0.5rem'
        }}
      >
        {loading ? 'Sending...' : 'SOS Message'}
      </Button>
      
      {status && (
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: status.includes('Success') ? 'var(--success-bg)' : 'var(--error-bg)', color: status.includes('Success') ? 'var(--success)' : 'var(--error)' }}>
          {status}
        </div>
      )}
    </Card>
  );
};

export default SOSButton;
