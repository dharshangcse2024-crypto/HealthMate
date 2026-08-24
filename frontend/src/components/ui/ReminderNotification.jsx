import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Check, X } from 'lucide-react';
import api from '../../services/api';

const getFoodInstructionLabel = (instruction) => {
  if (instruction === 'before_food') return 'Before Food';
  if (instruction === 'after_food') return 'After Food';
  if (instruction === 'with_food') return 'With Food';
  return '';
};

const ReminderNotification = () => {
  const [reminders, setReminders] = useState([]);
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [notifiedMap, setNotifiedMap] = useState({});

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
    // Poll for new reminders frequently so we catch newly added ones quickly
    const fetchInterval = setInterval(fetchReminders, 20 * 1000);
    
    // Request notification permissions for native device alerts
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    return () => clearInterval(fetchInterval);
  }, []);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const currentMinute = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      
      console.log(`[ReminderNotification] Checking reminders for ${currentMinute}. Total active reminders: ${reminders.length}`);
      
      // Find reminders that match this time (allow a 2-minute grace period for background throttling)
      const dueReminders = reminders.filter(r => {
        if (!r.reminder_time) return false;
        
        const [remHour, remMin] = r.reminder_time.split(':');
        const reminderDate = new Date(now);
        reminderDate.setHours(parseInt(remHour, 10), parseInt(remMin, 10), 0, 0);
        
        const diffMs = now.getTime() - reminderDate.getTime();
        const diffMinutes = diffMs / 60000;
        
        // Check if the reminder is within the last 60 minutes
        // This ensures that if the device goes to sleep and wakes up, we still show the notification
        if (diffMinutes < 0 || diffMinutes > 60) return false;
        
        // Skip if we already notified for this exact reminder and minute (using the reminder's exact time as the key)
        if (notifiedMap[`${r.id}-${r.reminder_time}`]) return false;
        
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
        
        // Mark as notified so it doesn't trigger again for this reminder time
        setNotifiedMap(prev => {
          const next = { ...prev };
          dueReminders.forEach(d => {
            next[`${d.id}-${d.reminder_time}`] = true;
          });
          return next;
        });

          setActiveNotifications(prev => {
            const newNotifs = [...prev];
            dueReminders.forEach(due => {
              if (!newNotifs.find(n => n.id === due.id)) {
                newNotifs.push({ ...due, timestamp: Date.now() });
                
                // Trigger native device notification if allowed
                if ("Notification" in window && Notification.permission === "granted") {
                  const foodInstruction = due.food_instruction ? ` (${getFoodInstructionLabel(due.food_instruction)})` : '';
                  new Notification(`Time for Medication: ${due.medicine_name}`, {
                    body: `It's time to take your ${due.medicine_name}${foodInstruction}.`,
                    icon: '/favicon.ico'
                  });
                }
              }
            });
            return newNotifs;
          });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [reminders, notifiedMap]);

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
