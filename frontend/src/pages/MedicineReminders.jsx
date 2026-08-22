import { useState, useEffect } from 'react';
import api from '../services/api';
import { Pill, Trash2, Plus, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const MedicineReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  
  const [medicineName, setMedicineName] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [selectedDays, setSelectedDays] = useState([]);
  const [foodInstruction, setFoodInstruction] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchReminders = async () => {
    try {
      const response = await api.get('/extended/reminders');
      setReminders(response.data);
    } catch (err) {
      console.error("Failed to fetch reminders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!medicineName || !reminderTime) return;
    if (frequency === 'specific_days' && selectedDays.length === 0) {
      setErrorMsg('Please select at least one day for the reminder.');
      return;
    }
    
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        medicine_name: medicineName,
        reminder_time: reminderTime,
        frequency: frequency,
        food_instruction: foodInstruction || null,
        days_of_week: frequency === 'specific_days' ? selectedDays.join(',') : null
      };
      
      const response = await api.post('/extended/reminders', payload);
      setReminders([...reminders, response.data]);
      setFormOpen(false);
      
      // Reset form
      setMedicineName('');
      setReminderTime('');
      setFrequency('daily');
      setSelectedDays([]);
      setFoodInstruction('');
    } catch (err) {
      console.error("Failed to add reminder", err);
      setErrorMsg(err.response?.data?.detail || "Failed to save reminder. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReminder = async (id) => {
    try {
      await api.delete(`/extended/reminders/${id}`);
      setReminders(reminders.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.post(`/extended/reminders/${id}/log`, { action });
      setReminders(reminders.map(r => r.id === id ? { ...r, status: 'completed' } : r));
    } catch (err) {
      console.error(`Failed to mark as ${action}`, err);
    }
  };

  const getFoodInstructionLabel = (instruction) => {
    if (instruction === 'before_food') return 'Before Food';
    if (instruction === 'after_food') return 'After Food';
    if (instruction === 'with_food') return 'With Food';
    return '';
  };

  return (
    <div className="main-content w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 sm:gap-0">
        <div>
          <h1 className="text-primary-dark text-3xl md:text-4xl mb-2">Medicine Reminders</h1>
          <p className="text-muted-foreground">Keep track of your medication schedule.</p>
        </div>
        <Button onClick={() => setFormOpen(!formOpen)} icon={Plus} className="w-full sm:w-auto flex justify-center">
          Add Reminder
        </Button>
      </div>

      {formOpen && (
        <Card className="mb-8 bg-amber-50 border border-amber-200 p-4 md:p-6 w-full">
          <h3 className="mb-4 text-xl font-semibold">New Reminder</h3>
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start w-full">
            
            <Input 
              label="Medicine Name"
              type="text" 
              required 
              value={medicineName} 
              onChange={e => setMedicineName(e.target.value)} 
              placeholder="e.g. Paracetamol" 
            />
            
            <Input 
              label="Time (HH:MM)"
              type="time" 
              required 
              value={reminderTime} 
              onChange={e => setReminderTime(e.target.value)} 
            />

            <div className="input-group">
              <label className="input-label">Frequency</label>
              <select 
                value={frequency} 
                onChange={(e) => setFrequency(e.target.value)} 
                className="input-field"
              >
                <option value="daily">Daily</option>
                <option value="specific_days">Specific Days</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Food Instructions</label>
              <select 
                value={foodInstruction} 
                onChange={(e) => setFoodInstruction(e.target.value)} 
                className="input-field"
              >
                <option value="">No specific instruction</option>
                <option value="before_food">Before Food</option>
                <option value="with_food">With Food</option>
                <option value="after_food">After Food</option>
              </select>
            </div>

            {frequency === 'specific_days' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Select Days</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        border: '1px solid var(--primary)',
                        background: selectedDays.includes(day) ? 'var(--primary)' : 'transparent',
                        color: selectedDays.includes(day) ? 'white' : 'var(--primary)',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} loading={submitting}>
                Save Reminder
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" size={32} /></div>
      ) : reminders.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Pill size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No Reminders Setup</h3>
          <p>Click the add button above to schedule your first medicine reminder.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
          {reminders.filter(r => r.status === 'active').map(reminder => (
            <Card key={reminder.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--secondary)', color: 'var(--primary)', borderRadius: '50%' }}>
                <Pill size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>{reminder.medicine_name}</h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ backgroundColor: 'var(--secondary-light)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                    ⏰ {reminder.reminder_time}
                  </span>
                  
                  {reminder.frequency === 'daily' ? (
                    <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                      Daily
                    </span>
                  ) : (
                    <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                      {reminder.days_of_week}
                    </span>
                  )}
                  
                  {reminder.food_instruction && (
                    <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '500' }}>
                      🍽️ {getFoodInstructionLabel(reminder.food_instruction)}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <Button size="small" onClick={() => handleAction(reminder.id, 'taken')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>Taken</Button>
                  <Button size="small" onClick={() => handleAction(reminder.id, 'skipped')} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--warning)', borderColor: 'var(--warning)' }}>Skip</Button>
                </div>
              </div>
              <button onClick={() => deleteReminder(reminder.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }} aria-label="Delete">
                <Trash2 size={20} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicineReminders;
