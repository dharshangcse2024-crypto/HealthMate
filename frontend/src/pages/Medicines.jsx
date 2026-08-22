import { useState, useEffect, useCallback, useRef } from 'react';
import { Pill, Search, Info, Loader, AlertCircle, X } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import api from '../services/api';

const Medicines = () => {
  const [search, setSearch] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const debounceTimer = useRef(null);

  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [medicineDetails, setMedicineDetails] = useState(null);

  // Fetch default medicines on mount
  useEffect(() => {
    const fetchDefaults = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/medicines/defaults');
        setMedicines(res.data);
      } catch (err) {
        console.error('Failed to load default medicines:', err);
        setError('Unable to load medicine information. Please try searching manually.');
      } finally {
        setLoading(false);
      }
    };
    fetchDefaults();
  }, []);

  // Debounced search
  const searchMedicines = useCallback(async (query) => {
    if (!query.trim()) {
      // Reset to defaults when search is cleared
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/medicines/defaults');
        setMedicines(res.data);
      } catch (err) {
        console.error('Failed to load default medicines:', err);
        setError('Unable to load medicine information.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.get('/medicines/search', { params: { name: query.trim() } });
      setMedicines(res.data);
    } catch (err) {
      console.error('Medicine search error:', err);
      if (err.response?.status === 502) {
        setError('External drug database is temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to search medicines. Please try again.');
      }
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Debounce: wait 500ms after user stops typing
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      searchMedicines(value);
    }, 500);
  };

  const handleCardClick = async (med) => {
    setSelectedMedicine(med);
    setMedicineDetails(null);
    setDetailsLoading(true);
    try {
      const res = await api.get(`/medicines/${med.id}/details`);
      setMedicineDetails(res.data);
    } catch (err) {
      console.error(err);
      // Fallback
      setMedicineDetails(med);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedMedicine(null);
    setMedicineDetails(null);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div className="main-content w-full">
      <div className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl text-primary-dark mb-2">Medicine Information</h1>
        <p className="text-muted-foreground">Search for general uses, categories, and precautions of common medicines.</p>
        <p className="text-muted-foreground text-xs italic mt-2">
          This information is for general reference only and does not constitute medical advice. Always consult a healthcare professional.
        </p>
      </div>

      <Card className="mb-6 md:mb-8 p-4 w-full">
        <div className="w-full max-w-2xl mx-auto md:mx-0">
          <Input 
            type="text" 
            placeholder="Search by medicine name or use..." 
            value={search}
            onChange={handleSearchChange}
            icon={Search}
            containerStyle={{ margin: 0 }}
          />
        </div>
      </Card>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem' }}>Loading medicine information...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger, #ef4444)' }}>
          <Info size={32} style={{ marginBottom: '0.5rem' }} />
          <p>{error}</p>
        </div>
      )}

      {/* Results grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
          {medicines.map(med => (
            <Card 
              key={med.id} 
              className="flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg p-4 h-full"
              onClick={() => handleCardClick(med)}
            >
              <div className="flex items-start gap-3 md:gap-4 mb-4">
                <div className="p-3 bg-secondary text-primary rounded-lg flex-shrink-0">
                  <Pill size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {med.name}
                    {med.is_discontinued && (
                      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', backgroundColor: 'var(--danger)', color: 'white', borderRadius: '0.25rem' }}>Discontinued</span>
                    )}
                  </h3>
                  <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <StatusBadge label={med.dosage_form || med.type || med.generic_name || 'Medicine'} color="var(--info)" />
                    {med.price_inr && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                        ₹{med.price_inr} {med.pack_size_label && `/ ${med.pack_size_label}`}
                      </span>
                    )}
                  </div>
                  {med.purpose && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0.75rem 0 0 0' }}>
                      <strong>Purpose:</strong> {med.purpose}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {medicines.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No medicines found{search ? ` matching "${search}"` : ''}. Try a different search term.
            </div>
          )}
        </div>
      )}

      {/* Modal for Medicine Details */}
      <Modal isOpen={!!selectedMedicine} onClose={closeModal} title={selectedMedicine?.name} icon={Pill}>
        <div style={{ paddingBottom: '1rem' }}>
          {detailsLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <p>Fetching clinical details from FDA...</p>
            </div>
          ) : medicineDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {medicineDetails.fetched_from_fda && (
                <div style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary-dark)', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={16} /> Details loaded securely from OpenFDA.
                </div>
              )}
              
              {(selectedMedicine?.manufacturer_name) && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.25rem' }}>Manufacturer</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{selectedMedicine.manufacturer_name}</p>
                </div>
              )}
              
              {(selectedMedicine?.composition_primary || selectedMedicine?.active_ingredients) && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.25rem' }}>Composition / Active Ingredients</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    {selectedMedicine.composition_primary || selectedMedicine.active_ingredients}
                    {selectedMedicine.composition_secondary && `, ${selectedMedicine.composition_secondary}`}
                  </p>
                </div>
              )}
              
              {(medicineDetails.purpose || selectedMedicine?.purpose) && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.25rem' }}>Common Uses & Purpose</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-line' }}>{medicineDetails.purpose || selectedMedicine.purpose}</p>
                </div>
              )}
              
              {(medicineDetails.side_effects || selectedMedicine?.side_effects) && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.25rem' }}>Possible Side Effects</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-line' }}>{medicineDetails.side_effects || selectedMedicine.side_effects}</p>
                </div>
              )}
              
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  Disclaimer: This information is for general reference only and does not constitute medical advice. Always consult a healthcare professional before starting or stopping any medication.
                </p>
              </div>
            </div>
          ) : (
            <p>Could not load details.</p>
          )}
          
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={closeModal}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Medicines;
