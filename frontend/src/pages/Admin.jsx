import { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Pill, Users, AlertTriangle, Edit2, Trash2, Power, Search, Loader2 } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('medicines');

  return (
    <div className="main-content" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-dark)' }}>Admin Panel</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage medicines, users, and review SOS alerts.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setActiveTab('medicines')}
          style={{
            padding: '1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'medicines' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'medicines' ? 'var(--primary-dark)' : 'var(--text-muted)',
            fontWeight: activeTab === 'medicines' ? 'bold' : 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Pill size={18} /> Medicines
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'users' ? 'var(--primary-dark)' : 'var(--text-muted)',
            fontWeight: activeTab === 'users' ? 'bold' : 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Users size={18} /> Users
        </button>
        <button
          onClick={() => setActiveTab('sos')}
          style={{
            padding: '1rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'sos' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'sos' ? 'var(--primary-dark)' : 'var(--text-muted)',
            fontWeight: activeTab === 'sos' ? 'bold' : 'normal',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertTriangle size={18} /> SOS Logs
        </button>
      </div>

      <div>
        {activeTab === 'medicines' && <AdminMedicines />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'sos' && <AdminSOS />}
      </div>
    </div>
  );
};

const AdminMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  const fetchMedicines = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/medicines?search=${q}&limit=20`);
      setMedicines(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMedicines(search);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    try {
      await api.delete(`/admin/medicines/${id}`);
      fetchMedicines(search);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingMed.id) {
        await api.put(`/admin/medicines/${editingMed.id}`, editingMed);
      } else {
        await api.post('/admin/medicines', editingMed);
      }
      setEditingMed(null);
      fetchMedicines(search);
    } catch (err) {
      console.error(err);
    }
  };

  if (editingMed) {
    return (
      <Card>
        <h3>{editingMed.id ? 'Edit Medicine' : 'Add Medicine'}</h3>
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          <Input label="Name" value={editingMed.name || ''} onChange={(e) => setEditingMed({...editingMed, name: e.target.value})} required />
          <Input label="Manufacturer" value={editingMed.manufacturer_name || ''} onChange={(e) => setEditingMed({...editingMed, manufacturer_name: e.target.value})} />
          <Input label="Price (INR)" type="number" step="0.01" value={editingMed.price_inr || ''} onChange={(e) => setEditingMed({...editingMed, price_inr: parseFloat(e.target.value)})} />
          <Input label="Type" value={editingMed.type || ''} onChange={(e) => setEditingMed({...editingMed, type: e.target.value})} />
          <Input label="Pack Size" value={editingMed.pack_size_label || ''} onChange={(e) => setEditingMed({...editingMed, pack_size_label: e.target.value})} />
          <div className="input-group">
            <label className="input-label">Discontinued</label>
            <select value={editingMed.is_discontinued ? 'true' : 'false'} onChange={(e) => setEditingMed({...editingMed, is_discontinued: e.target.value === 'true'})} className="input-field">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input label="Primary Composition" value={editingMed.composition_primary || ''} onChange={(e) => setEditingMed({...editingMed, composition_primary: e.target.value})} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button type="submit">Save</Button>
            <Button variant="outline" type="button" onClick={() => setEditingMed(null)}>Cancel</Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <Input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} containerStyle={{ margin: 0, width: '300px' }} />
          <Button type="submit" icon={Search}>Search</Button>
        </form>
        <Button onClick={() => setEditingMed({ name: '', is_discontinued: false })}>Add Medicine</Button>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div> : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--secondary-light)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Manufacturer</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Price (INR)</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{m.name}</td>
                  <td style={{ padding: '1rem' }}>{m.manufacturer_name}</td>
                  <td style={{ padding: '1rem' }}>₹{m.price_inr}</td>
                  <td style={{ padding: '1rem' }}>
                    <StatusBadge label={m.is_discontinued ? 'Discontinued' : 'Active'} color={m.is_discontinued ? 'var(--error)' : 'var(--success)'} />
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button onClick={() => setEditingMed(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', marginRight: '0.5rem' }}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeactivate = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/deactivate`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to toggle user status.");
    }
  };

  return (
    <div>
      {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div> : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--secondary-light)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Joined</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{u.name}</td>
                  <td style={{ padding: '1rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <StatusBadge label={u.is_admin ? 'Admin' : 'User'} color={u.is_admin ? 'var(--primary)' : 'var(--text-muted)'} />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <StatusBadge label={u.is_active ? 'Active' : 'Deactivated'} color={u.is_active ? 'var(--success)' : 'var(--error)'} />
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDeactivate(u.id)} 
                      title={u.is_active ? "Deactivate" : "Activate"}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: u.is_active ? 'var(--error)' : 'var(--success)' }}
                    >
                      <Power size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

const AdminSOS = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/sos-logs');
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div>
      {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div> : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--secondary-light)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Time</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>{new Date(log.sent_at).toLocaleString()}</td>
                  <td style={{ padding: '1rem' }}>{log.user_name}</td>
                  <td style={{ padding: '1rem' }}>{log.user_email}</td>
                  <td style={{ padding: '1rem' }}>
                    <StatusBadge label={log.status} color={log.status === 'success' ? 'var(--success)' : 'var(--error)'} />
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No SOS logs found.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

export default Admin;
