import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name}</h1>
        <p className="page-subtitle">Discover campus resources and manage your reservations.</p>
      </div>

      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-title">My Reservations</div>
          <div className="metric-value">{reservations.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Available Resources</div>
          <div className="metric-value">{resources.length}</div>
        </div>
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Date/Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr><td colSpan="3">No reservations yet.</td></tr>
            ) : (
              reservations.map(r => {
                const resource = resources.find(res => res.id === r.resource_id);
                return (
                  <tr key={r.id}>
                    <td>{resource?.name || r.resource_id}</td>
                    <td>{new Date(r.start_time).toLocaleString()}</td>
                    <td><span className={`badge badge-${r.status === 'confirmed' ? 'success' : 'warning'}`}>{r.status}</span></td>
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

export default StudentDashboard;
