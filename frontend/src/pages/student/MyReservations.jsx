import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';

const CalendarIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{width:15,height:15}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const TrashIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{width:14,height:14}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
);

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchData = async () => {
    try {
      const [resRes, resourcesRes] = await Promise.all([
        fetchWithAuth('/reservations'),
        fetchWithAuth('/resources'),
      ]);
      // Sort newest first
      setReservations(resRes.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
      setResources(resourcesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleCancel = async (res) => {
    if (!window.confirm(`Cancel reservation for "${getResourceName(res.resource_id)}"?`)) return;
    setCancellingId(res.id);
    try {
      await fetchWithAuth(`/reservations/${res.id}`, { method: 'DELETE' });
      showAlert('success', 'Reservation cancelled.');
      fetchData();
    } catch (err) {
      showAlert('danger', 'Failed to cancel reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  const getResourceName = (id) => {
    const r = resources.find(res => res.id === id);
    return r ? r.name : id;
  };

  const confirmed = reservations.filter(r => r.status === 'confirmed');
  const past = reservations.filter(r => r.status !== 'confirmed');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">My Reservations</h1>
          <p className="page-subtitle">View and manage your resource bookings.</p>
        </div>
        <div className="dashboard-grid" style={{ margin: 0, gap: 12 }}>
          <div className="metric-card" style={{ padding: '12px 20px', minWidth: 120 }}>
            <div className="metric-title">Active</div>
            <div className="metric-value" style={{ fontSize: 22, color: 'var(--success)' }}>{confirmed.length}</div>
          </div>
          <div className="metric-card" style={{ padding: '12px 20px', minWidth: 120 }}>
            <div className="metric-title">Total</div>
            <div className="metric-value" style={{ fontSize: 22 }}>{reservations.length}</div>
          </div>
        </div>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.text}</div>}

      {loading ? (
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      ) : reservations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No reservations yet</div>
          <div className="empty-state-desc">Browse available resources to make your first booking.</div>
        </div>
      ) : (
        <>
          {/* Active reservations */}
          {confirmed.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Active Bookings
              </h2>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Status</th>
                      <th>Node</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmed.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{getResourceName(r.resource_id)}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CalendarIcon />
                            {new Date(r.start_time).toLocaleString()}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(r.end_time).toLocaleString()}</td>
                        <td><span className="badge badge-success">● Confirmed</span></td>
                        <td><code style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-secondary)' }}>{r.created_by_node || '—'}</code></td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancel(r)}
                            disabled={cancellingId === r.id}
                          >
                            <TrashIcon />
                            {cancellingId === r.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Past / Cancelled */}
          {past.length > 0 && (
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                History
              </h2>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Start</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {past.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{getResourceName(r.resource_id)}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(r.start_time).toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${r.status === 'cancelled' ? 'danger' : 'warning'}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyReservations;
