import { useState } from 'react';
import { MapPin, Phone, Navigation, Loader2, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';

import api from '../services/api';

const Hospitals = () => {
  const [loading, setLoading] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
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

  const findHospitalsByGPS = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLoadingGPS(true);
    setLocationError('');
    setHospitals([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await api.get(`/extended/hospitals/nearby?lat=${latitude}&lng=${longitude}`);
          setHospitals(res.data);
          setManualLocation('');
        } catch (err) {
          console.error("Failed to fetch hospitals by GPS:", err);
          const detail = err.response?.data?.detail || 'Failed to find hospitals for your location.';
          setLocationError(detail);
        } finally {
          setLoadingGPS(false);
        }
      },
      (error) => {
        setLoadingGPS(false);
        console.error("Geolocation error:", error);
        let errorMsg = 'Failed to get your location.';
        if (error.code === 1) errorMsg = 'Location permission denied. Please enable it in your browser.';
        else if (error.code === 2) errorMsg = 'Location information is unavailable.';
        else if (error.code === 3) errorMsg = 'Location request timed out.';
        setLocationError(errorMsg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="main-content w-full">
      <div className="mb-6 md:mb-8 text-center md:text-left">
        <h1 className="text-primary-dark text-3xl md:text-4xl mb-2">Nearby Hospitals</h1>
        <p className="text-muted-foreground">Find healthcare facilities near your current location.</p>
      </div>

      <Card className="mb-6 md:mb-8 p-4 w-full max-w-3xl mx-auto md:mx-0">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full">
          <input
            type="text"
            placeholder="Enter city, address, or landmark..."
            value={manualLocation}
            onChange={(e) => setManualLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && findHospitalsByAddress()}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm outline-none bg-secondary/30 focus:bg-background focus:ring-2 focus:ring-primary/20 w-full transition-all"
          />
          <Button onClick={findHospitalsByAddress} loading={loading} icon={Search} className="w-full sm:w-auto flex justify-center py-2.5">
            Search
          </Button>
          <Button onClick={findHospitalsByGPS} loading={loadingGPS} variant="outline" icon={MapPin} className="w-full sm:w-auto flex justify-center py-2.5 whitespace-nowrap">
            Use My Location
          </Button>
        </div>
        {locationError && <div className="text-red-600 text-sm mt-4 p-3 bg-red-50 rounded-lg">{locationError}</div>}
      </Card>

      {hospitals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
          {hospitals.map(hospital => (
            <Card key={hospital.id} className="flex flex-col h-full p-4 md:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg w-full">
              <div className="flex justify-between items-start mb-4 gap-4">
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
              
              <div className="flex flex-col sm:flex-row gap-2 mt-auto border-t border-border pt-4">
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

      {hospitals.length === 0 && !loading && !loadingGPS && (
        <Card style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>Find Nearby Hospitals</h3>
          <p>Search for a city or use your GPS location above to find nearby healthcare facilities.</p>
        </Card>
      )}
    </div>
  );
};

export default Hospitals;
