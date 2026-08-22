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
    <div className="main-content w-full">
      <div className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-primary-dark text-3xl md:text-4xl mb-2">Drug Interaction Checker</h1>
        <p className="text-muted-foreground">Enter two or more medicines to check for known interactions.</p>
      </div>

      <Card className="mb-6 md:mb-8 p-4 md:p-6 w-full max-w-3xl mx-auto md:mx-0">
        <h3 className="mb-4 text-xl font-semibold">Add Medicines (Max 5)</h3>
        
        <form onSubmit={handleAddMed} className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 w-full max-w-md">
          <Input 
            type="text" 
            placeholder="Type a medicine (e.g. Aspirin)" 
            value={customMed}
            onChange={(e) => setCustomMed(e.target.value)}
            disabled={selected.length >= 5}
            className="flex-1 m-0"
            style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
          />
          <Button type="submit" disabled={selected.length >= 5} icon={Plus} className="w-full sm:w-auto flex justify-center py-3 sm:py-0">
            Add
          </Button>
        </form>

        {selected.length > 0 && (
          <div className="mb-6 p-4 bg-secondary-light rounded-lg">
            <h4 className="text-sm font-semibold text-primary-dark mb-3">Selected Medicines:</h4>
            <div className="flex flex-wrap gap-2">
              {selected.map(med => (
                <div key={med} className="flex items-center gap-1 bg-primary text-white py-1 pl-3 pr-2 rounded-full text-sm">
                  {med}
                  <button 
                    onClick={() => removeMed(med)}
                    type="button"
                    className="bg-transparent border-none text-white flex items-center justify-center p-0.5 rounded-full cursor-pointer ml-1 hover:bg-white/20 transition-colors"
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
          className="w-full sm:w-auto flex justify-center"
        >
          Check Interactions
        </Button>
      </Card>

      {result && result.checked && (
        <Card className={`p-4 md:p-6 w-full max-w-3xl mx-auto md:mx-0 border-l-4 ${result.interactions.length > 0 ? 'border-red-500' : 'border-green-500'} animate-fadeIn`}>
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
