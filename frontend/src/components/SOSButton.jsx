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
    <Card className="p-6 md:p-8 flex flex-col items-center justify-center text-center w-full">
      <motion.div 
        animate={loading ? { scale: [1, 1.1, 1], boxShadow: ["0px 0px 0px rgba(220, 38, 38, 0)", "0px 0px 20px rgba(220, 38, 38, 0.4)", "0px 0px 0px rgba(220, 38, 38, 0)"] } : { scale: 1, boxShadow: "none" }}
        transition={{ duration: 1.5, repeat: loading ? Infinity : 0, ease: "easeInOut" }}
        className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4"
      >
        <AlertTriangle size={32} />
      </motion.div>
      <h3 className="text-red-600 text-lg md:text-xl font-semibold mb-2">Emergency / SOS</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        In case of a medical emergency, contact immediate help.
      </p>
      
      <Button 
        onClick={handleSOS} 
        loading={loading}
        icon={Mail}
        className={`w-full max-w-xs flex justify-center items-center gap-2 py-3 px-6 text-base font-semibold ${loading ? 'bg-muted-foreground' : 'bg-red-600 hover:bg-red-700'}`}
        style={{ color: 'white' }}
      >
        {loading ? 'Sending...' : 'SOS Message'}
      </Button>
      
      {status && (
        <div className={`mt-4 text-sm px-4 py-2 rounded-lg ${status.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {status}
        </div>
      )}
    </Card>
  );
};

export default SOSButton;
