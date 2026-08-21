import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Activity, Loader2, Save, Camera } from 'lucide-react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import BmiGauge from '../components/ui/BmiGauge';

const Profile = () => {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    age: '',
    gender: '',
    blood_group: '',
    height: '',
    weight: '',
    emergency_contact: '',
    emergency_contact_email: '',
    profile_picture: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState({ label: '', color: '' });

  useEffect(() => {
    if (profile.height && profile.weight) {
      const h = parseFloat(profile.height) / 100; // convert cm to m
      const w = parseFloat(profile.weight);
      if (h > 0 && w > 0) {
        const bmiValue = w / (h * h);
        setBmi(bmiValue.toFixed(1));

        if (bmiValue < 18.5) {
          setBmiCategory({ label: 'Underweight', color: 'var(--info)' });
        } else if (bmiValue >= 18.5 && bmiValue <= 24.9) {
          setBmiCategory({ label: 'Normal', color: 'var(--success)' });
        } else if (bmiValue >= 25 && bmiValue <= 29.9) {
          setBmiCategory({ label: 'Overweight', color: 'var(--warning)' });
        } else {
          setBmiCategory({ label: 'Obese', color: 'var(--error)' });
        }
      } else {
        setBmi(null);
      }
    } else {
      setBmi(null);
    }
  }, [profile.height, profile.weight]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        if (res.data) {
          setProfile({
            name: user?.name || '',
            age: res.data.age || '',
            gender: res.data.gender || '',
            blood_group: res.data.blood_group || '',
            height: res.data.height || '',
            weight: res.data.weight || '',
            emergency_contact: res.data.emergency_contact || '',
            emergency_contact_email: res.data.emergency_contact_email || '',
            profile_picture: res.data.profile_picture || ''
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profile_picture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/profile', profile);
      if (refreshProfile) await refreshProfile();
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="main-content" style={{ padding: '2rem' }}>
      <div style={{ margin: '0 auto', width: '100%', maxWidth: '800px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary-dark)' }}>My Profile</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your personal and health information.</p>
        </div>

        <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
              )}
              <label htmlFor="profile-upload" style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <Camera size={16} />
              </label>
              <input type="file" id="profile-upload" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{user?.name}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>
          <img 
            src="https://media.tenor.com/FwIe1_iF0tQAAAAC/3d-heart.gif" 
            alt="3D Animated Heart" 
            style={{ width: '80px', height: '80px', objectFit: 'contain' }} 
          />
        </div>

        {message && (
          <div style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem', backgroundColor: message.includes('success') ? 'var(--success-bg)' : 'var(--error-bg)', color: message.includes('success') ? 'var(--success)' : 'var(--error)' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-dark)' }}>
            <Activity size={20} /> Health Details
            <img src="https://media.tenor.com/aC-aMv7vTfcAAAAi/dna-strand.gif" alt="3D DNA" style={{ width: '30px', height: '30px', marginLeft: 'auto' }} />
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <Input 
              label="Name"
              type="text" 
              name="name" 
              value={profile.name} 
              onChange={handleChange} 
              placeholder="Your Name" 
            />
            <Input 
              label="Age"
              type="number" 
              name="age" 
              value={profile.age} 
              onChange={handleChange} 
              placeholder="e.g. 25" 
            />
            
            <div className="input-group">
              <label className="input-label">Gender</label>
              <select name="gender" value={profile.gender} onChange={handleChange} className="input-field">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Blood Group</label>
              <select name="blood_group" value={profile.blood_group} onChange={handleChange} className="input-field">
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            
            <Input 
              label="Height (cm)"
              type="number" 
              name="height" 
              value={profile.height} 
              onChange={handleChange} 
              placeholder="e.g. 175" 
            />
            
            <Input 
              label="Weight (kg)"
              type="number" 
              name="weight" 
              value={profile.weight} 
              onChange={handleChange} 
              placeholder="e.g. 70" 
            />
            
            <div style={{ gridColumn: '1 / -1', padding: '2rem', backgroundColor: 'var(--secondary-light)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
              {bmi ? (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <BmiGauge bmi={parseFloat(bmi)} category={bmiCategory.label} color={bmiCategory.color} />
                    <div style={{ marginTop: '0.5rem' }}>
                      <StatusBadge label={bmiCategory.label} color={bmiCategory.color} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>Body Mass Index (BMI)</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>{bmi}</span>
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                  <p>Enter height and weight to calculate BMI</p>
                </div>
              )}
            </div>
          </div>

          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
            <User size={20} /> Emergency Contact
            <img src="https://media.tenor.com/s6pB3vBpeG8AAAAi/siren-alert.gif" alt="3D Siren" style={{ width: '30px', height: '30px', marginLeft: 'auto' }} />
          </h3>
          
          <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <Input 
              label="Emergency Contact Name/Phone"
              type="text" 
              name="emergency_contact" 
              value={profile.emergency_contact} 
              onChange={handleChange} 
              placeholder="e.g. John Doe (555-1234)" 
            />
            <Input 
              label="Emergency Contact Email"
              type="email" 
              name="emergency_contact_email" 
              value={profile.emergency_contact_email} 
              onChange={handleChange} 
              placeholder="For SOS alerts (Required)" 
            />
            <p style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>This email will be notified if you trigger an SOS alert.</p>
          </div>

          <Button type="submit" loading={saving} icon={Save}>
            Save Changes
          </Button>
        </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
