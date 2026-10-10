import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [resRes, resourcesRes] = await Promise.all([
        fetchWithAuth('/reservations'),
        fetchWithAuth('/resources')
      ]);
      setReservations(resRes);
      setResources(resourcesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      await fetchWithAuth(`/reservations/${id}`, { method: 'DELETE' });
      fetchData(); // refresh list
    } catch (err) {
      alert("Failed to cancel reservation");
    }
  };

  if (loading) return <div>Loading reservations...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Reservations</h1>
        <p className="page-subtitle">View and manage your resource bookings.</p>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Resource</th>
              <th>Date/Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr><td colSpan="5">No reservations found.</td></tr>
            ) : (
              reservations.map(r => {
                const resource = resources.find(res => res.id === r.resource_id);
                return (
                  <tr key={r.id}>
                    <td><span style={{fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)'}}>{r.id.substring(0,8)}...</span></td>
                    <td>{resource?.name || r.resource_id}</td>
                    <td>{new Date(r.start_time).toLocaleString()}</td>
                    <td><span className={`badge badge-${r.status === 'confirmed' ? 'success' : (r.status === 'cancelled' ? 'danger' : 'warning')}`}>{r.status}</span></td>
                    <td>
                      {r.status === 'confirmed' && (
                        <button className="btn btn-primary" style={{backgroundColor: 'var(--danger)', padding: '6px 12px', fontSize: '12px'}} onClick={() => handleCancel(r.id)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyReservations;
