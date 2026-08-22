import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Activity, MessageSquareHeart, Trash2, Loader2, Pill } from 'lucide-react';
import Card from '../components/ui/Card';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHistory = async () => {
    try {
      const response = await api.get('/health-history');
      setHistory(response.data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`/health-history/${id}`);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to delete record", err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="main-content w-full">
      <div className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-primary-dark text-3xl md:text-4xl mb-2">Health History</h1>
        <p className="text-muted-foreground">Review your past symptom checks, AI consultations, and medicine logs.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
        </div>
      ) : history.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No History Yet</h3>
          <p>You haven't made any symptom checks, chatted with the AI assistant, or logged any medicine yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          {history.map(record => (
            <Card key={record.id} className="p-4 md:p-6 flex flex-col sm:flex-row gap-4 md:gap-6 items-start w-full relative group">
              <div style={{ 
                padding: '1rem', 
                backgroundColor: record.record_type === 'ai_chat' ? '#fef3c7' : (record.record_type === 'medicine_reminder' ? '#dcfce7' : 'var(--secondary)'), 
                borderRadius: '0.5rem', 
                color: record.record_type === 'ai_chat' ? '#d97706' : (record.record_type === 'medicine_reminder' ? '#15803d' : 'var(--primary)') 
              }}>
                {record.record_type === 'ai_chat' ? <MessageSquareHeart size={24} /> : (record.record_type === 'medicine_reminder' ? <Pill size={24} /> : <Activity size={24} />)}
              </div>
              
              <div className="flex-1 w-full min-w-0 pr-8 sm:pr-10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-0">
                  <h3 className="m-0 text-lg md:text-xl font-semibold text-foreground">
                    {record.record_type === 'ai_chat' ? 'AI Consultation' : (record.record_type === 'medicine_reminder' ? 'Medicine Reminder' : 'Symptom Check')}
                  </h3>
                  <span className="text-xs md:text-sm text-muted-foreground">
                    {formatDate(record.created_at)}
                  </span>
                </div>
                
                {record.record_type === 'ai_chat' ? (
                  <>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>You asked:</p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>"{record.description}"</p>
                  </>
                ) : record.record_type === 'medicine_reminder' ? (
                  <>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>Action:</p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{record.description}</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>Symptoms:</p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {record.symptoms ? JSON.parse(record.symptoms).join(', ') : 'None'}
                    </p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>Analysis:</p>
                    <p className="text-sm font-semibold text-primary mb-1">Analysis:</p>
                    <p className="text-foreground mb-4">{record.prediction} ({record.prediction_score})</p>
                  </>
                )}
              </div>
              
              <button 
                onClick={() => deleteRecord(record.id)} 
                className="absolute top-4 right-4 text-red-500 opacity-50 sm:opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                aria-label="Delete"
              >
                <Trash2 size={20} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
