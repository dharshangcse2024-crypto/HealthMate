import { useState } from 'react';
import api from '../services/api';
import { Activity, AlertTriangle, CheckCircle, Plus, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';

// Drug interactions are now handled by the AI backend

const DrugInteraction = () => {
  const [selected, setSelected] = useState([]);
  const [customMed, setCustomMed] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddMed = (e) => {
    e?.preventDefault();
    const trimmed = customMed.trim();
    if (!trimmed) return;
    
    // Check for duplicates (case insensitive)
    const isDuplicate = selected.some(m => m.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setCustomMed('');
      return;
    }
    
    if (selected.length < 5) {
      setSelected(prev => [...prev, trimmed]);
    }
    setCustomMed('');
    // Clear previous results when a new med is added
    setResult(null);
  };

  const removeMed = (medToRemove) => {
    setSelected(prev => prev.filter(m => m !== medToRemove));
    setResult(null);
  };

  const checkInteractions = async () => {
    if (selected.length < 2) return;
    
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post('/chat/drug-interaction', {
        medicines: selected
      });
      
      setResult({ checked: true, interactions: response.data.interactions || [] });
    } catch (err) {
      console.error("Failed to check interactions", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-dark)' }}>Drug Interaction Checker</h1>
        <p style={{ color: 'var(--text-muted)' }}>Enter two or more medicines to check for known interactions.</p>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add Medicines (Max 5)</h3>
        
        <form onSubmit={handleAddMed} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
          <Input 
            type="text" 
            placeholder="Type a medicine (e.g. Aspirin)" 
            value={customMed}
            onChange={(e) => setCustomMed(e.target.value)}
            disabled={selected.length >= 5}
            containerStyle={{ flex: 1, margin: 0 }}
            style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
          />
          <Button type="submit" disabled={selected.length >= 5} icon={Plus}>
            Add
          </Button>
        </form>

        {selected.length > 0 && (
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--secondary-light)', borderRadius: '0.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>Selected Medicines:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selected.map(med => (
                <div key={med} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.25rem 0.5rem 0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.875rem' }}>
                  {med}
                  <button 
                    onClick={() => removeMed(med)}
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.1rem', borderRadius: '50%', cursor: 'pointer', marginLeft: '0.25rem' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={checkInteractions} 
          disabled={selected.length < 2 || loading}
          loading={loading}
          type="button"
          icon={Activity}
        >
          Check Interactions
        </Button>
      </Card>

      {result && result.checked && (
        <Card style={{ borderLeft: result.interactions.length > 0 ? '4px solid var(--error)' : '4px solid var(--success)', animation: 'fadeIn 0.5s ease-out' }}>
          {result.interactions.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', marginBottom: '1rem' }}>
                <AlertTriangle size={24} />
                <h2 style={{ margin: 0 }}>Interactions Found</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.interactions.map((int, idx) => (
                  <div key={idx} style={{ padding: '1rem', backgroundColor: 'var(--error-bg)', borderRadius: '0.5rem' }}>
                    <h4 style={{ color: 'var(--error)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {int.pair} <StatusBadge label={`${int.severity} Risk`} color="var(--error)" />
                    </h4>
                    <p style={{ color: '#991b1b', margin: 0, fontSize: '0.875rem' }}>{int.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem' }}>
                <CheckCircle size={24} />
                <h2 style={{ margin: 0 }}>No Interactions Found</h2>
              </div>
              <p style={{ color: 'var(--text-muted)' }}>No known interactions were found between the selected medicines in our curated dataset. However, always consult your doctor or pharmacist.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default DrugInteraction;
