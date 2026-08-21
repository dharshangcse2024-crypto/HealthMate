import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Activity, Loader2, AlertTriangle, CheckCircle, Plus, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Fatigue", "Headache", "Nausea",
  "Shortness of breath", "Muscle ache", "Sore throat",
  "Loss of taste/smell", "Chills"
];

const SymptomChecker = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleAddCustom = (e) => {
    e?.preventDefault();
    const trimmed = customSymptom.trim();
    if (!trimmed) return;
    
    // Check for duplicates (case insensitive)
    const isDuplicate = selectedSymptoms.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setCustomSymptom('');
      return;
    }
    
    setSelectedSymptoms(prev => [...prev, trimmed]);
    setCustomSymptom('');
  };

  const removeSymptom = (symptomToRemove) => {
    setSelectedSymptoms(prev => prev.filter(s => s !== symptomToRemove));
  };

  const togglePresetSymptom = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      removeSymptom(symptom);
    } else {
      setSelectedSymptoms(prev => [...prev, symptom]);
    }
  };

  const handleCheck = async () => {
    if (selectedSymptoms.length === 0) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await api.post('/chat/symptom-check', {
        symptoms: selectedSymptoms
      });
      const aiResult = response.data;
      
      await api.post('/health-history', {
        record_type: 'symptom_check',
        symptoms: JSON.stringify(selectedSymptoms),
        prediction: aiResult.prediction,
        prediction_score: aiResult.prediction_score,
        recommendations: aiResult.recommendations
      });
      setResult(aiResult);
    } catch (err) {
      console.error("Failed to check symptoms", err);
      setError("Failed to analyze symptoms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-dark)' }}>Symptom Checker</h1>
        <p style={{ color: 'var(--text-muted)' }}>Select your symptoms below to receive preliminary insights.</p>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add Symptoms</h3>
        
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', maxWidth: '400px' }}>
          <Input 
            type="text" 
            placeholder="Type a symptom (e.g. Dizziness)" 
            value={customSymptom}
            onChange={(e) => setCustomSymptom(e.target.value)}
            containerStyle={{ flex: 1, margin: 0 }}
            style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
          />
          <Button type="submit" icon={Plus}>
            Add
          </Button>
        </form>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Common Symptoms:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {COMMON_SYMPTOMS.map(symptom => {
              const isSelected = selectedSymptoms.includes(symptom);
              return (
                <Button
                  key={symptom}
                  onClick={() => togglePresetSymptom(symptom)}
                  variant={isSelected ? 'primary' : 'outline'}
                  style={{ borderRadius: '2rem', padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                  type="button"
                >
                  {isSelected ? <CheckCircle size={14} /> : <span style={{ width: '14px', display: 'inline-block' }}></span>}
                  {symptom}
                </Button>
              );
            })}
          </div>
        </div>

        {selectedSymptoms.length > 0 && (
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--secondary-light)', borderRadius: '0.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>Selected Symptoms:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {selectedSymptoms.map(symptom => (
                <div key={symptom} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.25rem 0.5rem 0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.875rem' }}>
                  {symptom}
                  <button 
                    onClick={() => removeSymptom(symptom)}
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

        {error && (
          <div style={{ backgroundColor: 'var(--error-bg)', color: 'var(--error)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <Button 
          onClick={handleCheck} 
          loading={loading}
          disabled={selectedSymptoms.length === 0}
          style={{ width: '100%', maxWidth: '300px' }}
          type="button"
          icon={Activity}
        >
          Analyze Symptoms
        </Button>
      </Card>

      {result && (
        <Card style={{ borderLeft: '4px solid var(--primary)', animation: 'fadeIn 0.5s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ color: 'var(--primary)', marginTop: '0.25rem' }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Preliminary Analysis</h2>
              <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <p><strong>Possible Condition:</strong> {result.prediction}</p>
                <p><strong>Confidence Score:</strong> {result.prediction_score}</p>
              </div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary-dark)' }}>General Recommendations:</h4>
              <p style={{ color: 'var(--text-muted)' }}>{result.recommendations}</p>
              
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                <strong>Disclaimer:</strong> This is an AI-generated preliminary analysis and NOT a medical diagnosis. Please consult a qualified doctor for any serious health concerns.
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SymptomChecker;
