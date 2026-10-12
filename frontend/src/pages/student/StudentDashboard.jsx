import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Link } from 'react-router-dom';

const BookIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const ResourceIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><path d="M3 16a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1z"/></svg>
);
const ArrowIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{width:14,height:14}}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);

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
          fetchWithAuth('/resources'),
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

  const confirmed = reservations.filter(r => r.status === 'confirmed');
  const getResourceName = (id) => resources.find(r => r.id === id)?.name || id;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Greeting */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's an overview of your reservations and available resources.</p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'var(--primary-subtle)' }}>
                <BookIcon />
              </div>
              <div className="metric-title">Active Bookings</div>
              <div className="metric-value" style={{ color: 'var(--primary)' }}>{confirmed.length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'var(--success-bg)' }}>
                <ResourceIcon />
              </div>
              <div className="metric-title">Available Labs</div>
              <div className="metric-value" style={{ color: 'var(--success)' }}>{resources.filter(r => r.active).length}</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon" style={{ background: 'var(--warning-bg)' }}>
                <BookIcon />
              </div>
              <div className="metric-title">Total Reservations</div>
              <div className="metric-value">{reservations.length}</div>
            </div>
          </div>

          {/* Upcoming bookings */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title">Upcoming Bookings</div>
              <Link to="/student/reservations" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowIcon />
              </Link>
            </div>
            {confirmed.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-title">No upcoming bookings</div>
                <div className="empty-state-desc">
                  <Link to="/student/resources" style={{ color: 'var(--primary)' }}>Browse resources</Link> to make your first reservation.
                </div>
              </div>
            ) : (
              <table className="table" style={{ marginTop: -1 }}>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmed.slice(0, 5).map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{getResourceName(r.resource_id)}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(r.start_time).toLocaleString()}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(r.end_time).toLocaleString()}</td>
                      <td><span className="badge badge-success">● Confirmed</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick browse */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Available Resources</div>
              <Link to="/student/resources" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Browse all <ArrowIcon />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 4 }}>
              {resources.filter(r => r.active).slice(0, 4).map(r => (
                <div key={r.id} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.location}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
