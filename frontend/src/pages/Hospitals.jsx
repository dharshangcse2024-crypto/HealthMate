import { useState } from 'react';
import { MapPin, Phone, Navigation, Loader2, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';

import api from '../services/api';

const Hospitals = () => {
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [locationError, setLocationError] = useState('');
  const [manualLocation, setManualLocation] = useState('');

  const findHospitalsByAddress = async () => {
    if (!manualLocation.trim()) return;
    setLoading(true);
    setLocationError('');
    setHospitals([]);

    try {
      const res = await api.get(`/extended/hospitals/geocode?query=${encodeURIComponent(manualLocation.trim())}`);
      setHospitals(res.data);
    } catch (err) {
      console.error("Failed to fetch hospitals by address:", err);
      const detail = err.response?.data?.detail || 'Failed to find hospitals for the given location. Try a more specific address.';
      setLocationError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-dark)' }}>Nearby Hospitals</h1>
        <p style={{ color: 'var(--text-muted)' }}>Find healthcare facilities near your current location.</p>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Enter city, address, or landmark..."
            value={manualLocation}
            onChange={(e) => setManualLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && findHospitalsByAddress()}
            style={{
              flex: 1,
              padding: '0.625rem 0.875rem',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              background: 'var(--bg-secondary, #f9fafb)',
            }}
          />
          <Button onClick={findHospitalsByAddress} loading={loading} icon={Search}>
            Search
          </Button>
        </div>
        {locationError && <div style={{ color: 'var(--error)', fontSize: '0.875rem', marginTop: '1rem' }}>{locationError}</div>}
      </Card>

      {hospitals.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {hospitals.map(hospital => (
            <Card key={hospital.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{hospital.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>{hospital.address}</p>
                  <StatusBadge 
                    label={hospital.status} 
                    color={hospital.status.includes('24/7') ? 'var(--success)' : 'var(--info)'} 
                  />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{hospital.distance}</div>
                  {hospital.emergency && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <StatusBadge label="ER Available" color="var(--error)" />
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <Button onClick={() => {
                  alert(`Calling ${hospital.name} at ${hospital.phone}...`);
                  window.location.href = `tel:${hospital.phone.replace(/[^0-9+]/g, '')}`;
                }} variant="outline" style={{ flex: 1 }} icon={Phone}>
                  Call
                </Button>
                <Button onClick={() => {
                  alert(`Opening maps for directions to ${hospital.name}...`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`, '_blank');
                }} style={{ flex: 1 }} icon={Navigation}>
                  Directions
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {hospitals.length === 0 && !loading && (
        <Card style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>Enter a Location</h3>
          <p>Search for a city, address, or landmark above to find nearby healthcare facilities.</p>
        </Card>
      )}
    </div>
  );
};

export default Hospitals;
