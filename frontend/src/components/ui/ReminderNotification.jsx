import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Check, X } from 'lucide-react';
import api from '../../services/api';

const ReminderNotification = () => {
  const [reminders, setReminders] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [lastCheckedMinute, setLastCheckedMinute] = useState('');

  const fetchReminders = async () => {
    try {
      const response = await api.get('/extended/reminders');
      // Filter only active reminders
      setReminders(response.data.filter(r => r.status === 'active'));
    } catch (err) {
      console.error("Failed to fetch reminders for notifications", err);
    }
  };

  useEffect(() => {
    fetchReminders();
    // Poll for new reminders every 5 minutes
    const fetchInterval = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(fetchInterval);
  }, []);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const currentMinute = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      
      if (currentMinute !== lastCheckedMinute) {
        setLastCheckedMinute(currentMinute);
        console.log(`[ReminderNotification] Checking reminders for ${currentMinute}. Total active reminders: ${reminders.length}`);
        
        // Find reminders that match this time
        const dueReminders = reminders.filter(r => {
          if (r.reminder_time !== currentMinute) return false;
          
          // Check specific days if applicable
          if (r.frequency === 'specific_days' && r.days_of_week) {
            const daysMap = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
            const currentDay = daysMap[now.getDay()];
            if (!r.days_of_week.includes(currentDay)) return false;
          }
          return true;
        });

        if (dueReminders.length > 0) {
          console.log(`[ReminderNotification] Found ${dueReminders.length} due reminders!`);
          // Add them to active notifications
          setActiveNotifications(prev => {
            const newNotifs = [...prev];
            dueReminders.forEach(due => {
              if (!newNotifs.find(n => n.id === due.id)) {
                newNotifs.push({ ...due, timestamp: Date.now() });
              }
            });
            return newNotifs;
          });
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [reminders, lastCheckedMinute]);

  const handleDismiss = (id) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkTaken = async (id) => {
    try {
      await api.post(`/extended/reminders/${id}/log`, { action: 'taken' });
      handleDismiss(id);
    } catch (err) {
      console.error("Failed to mark reminder as taken", err);
    }
  };

  const getFoodInstructionLabel = (instruction) => {
    if (instruction === 'before_food') return 'Before Food';
    if (instruction === 'after_food') return 'After Food';
    if (instruction === 'with_food') return 'With Food';
    return '';
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AnimatePresence>
        {activeNotifications.map(notif => (
          <motion.div
            key={notif.timestamp + notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              padding: '1.25rem',
              width: '320px',
              borderLeft: '4px solid var(--primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '0.5rem', backgroundColor: 'var(--secondary)', color: 'var(--primary)', flexShrink: 0 }}>
                <Pill size={20} />
              </div>
              
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--text)' }}>Time for Medication</h4>
                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-dark)' }}>{notif.medicine_name}</p>
                {notif.food_instruction && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {getFoodInstructionLabel(notif.food_instruction)}
                  </p>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                onClick={() => handleMarkTaken(notif.id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              >
                <Check size={16} /> Taken
              </button>
              <button 
                onClick={() => handleDismiss(notif.id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              >
                <X size={16} /> Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ReminderNotification;
