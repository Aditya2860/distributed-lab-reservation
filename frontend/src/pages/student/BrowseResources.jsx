import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';

const BrowseResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchWithAuth('/resources')
      .then(res => setResources(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleReserve = async (resource) => {
    setReserving(resource.id);
    setMessage(null);
    try {
      const now = new Date();
      const start = new Date(now.getTime() + 60*60*1000); // 1 hour from now
      const end = new Date(start.getTime() + 60*60*1000); // 1 hour duration
      
      await fetchWithAuth('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          resource_id: resource.id,
          start_time: start.toISOString(),
          end_time: end.toISOString()
        })
      });
      setMessage({ type: 'success', text: `Successfully reserved ${resource.name}!` });
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to reserve resource' });
    } finally {
      setReserving(null);
    }
  };

  if (loading) return <div>Loading resources...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Browse Campus Resources</h1>
        <p className="page-subtitle">Find the right lab, room, or equipment for your next activity.</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="dashboard-grid">
        {resources.map(resource => (
          <div key={resource.id} className="metric-card">
            <div style={{fontWeight: 'bold', fontSize: '18px', marginBottom: '8px'}}>{resource.name}</div>
            <div style={{color: 'var(--text-secondary)', marginBottom: '4px'}}>{resource.type}</div>
            <div style={{color: 'var(--text-secondary)', marginBottom: '16px'}}>{resource.location} (Cap: {resource.capacity})</div>
            <button 
              className="btn btn-primary" 
              onClick={() => handleReserve(resource)}
              disabled={reserving === resource.id || !resource.active}
            >
              {reserving === resource.id ? 'Reserving...' : 'Reserve (Next Hour)'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrowseResources;
