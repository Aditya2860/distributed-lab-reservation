import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Link } from 'react-router-dom';

const ArrowIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{width:14,height:14}}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ resources: 0, students: 0, totalReservations: 0, confirmedReservations: 0, nodes: 0 });
  const [recentReservations, setRecentReservations] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourcesRes, usersRes, resRes, nodesRes] = await Promise.all([
          fetchWithAuth('/resources'),
          fetchWithAuth('/users'),
          fetchWithAuth('/reservations'),
          fetchWithAuth('/cluster/nodes'),
        ]);

        setResources(resourcesRes);
        setStats({
          resources: resourcesRes.filter(r => r.active).length,
          students: usersRes.filter(u => u.role === 'STUDENT').length,
          totalReservations: resRes.length,
          confirmedReservations: resRes.filter(r => r.status === 'confirmed').length,
          nodes: nodesRes.nodes.length,
        });
        setRecentReservations(
          resRes
            .filter(r => r.status === 'confirmed')
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
            .slice(0, 6)
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getResourceName = (id) => resources.find(r => r.id === id)?.name || id;

  const metricCards = [
    { label: 'Active Resources', value: stats.resources, color: 'var(--primary)', bg: 'var(--primary-subtle)', emoji: '🔬' },
    { label: 'Students', value: stats.students, color: 'var(--success)', bg: 'var(--success-bg)', emoji: '🎓' },
    { label: 'Active Bookings', value: stats.confirmedReservations, color: 'var(--warning)', bg: 'var(--warning-bg)', emoji: '📅' },
    { label: 'Cluster Nodes', value: stats.nodes, color: 'var(--info)', bg: 'var(--info-bg)', emoji: '🖥️' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Monitor the distributed lab reservation system.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /> Loading...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="dashboard-grid">
            {metricCards.map(card => (
              <div key={card.label} className="metric-card">
                <div className="metric-icon" style={{ background: card.bg, fontSize: 18 }}>
                  {card.emoji}
                </div>
                <div className="metric-title">{card.label}</div>
                <div className="metric-value" style={{ color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Active Reservations */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title">Active Reservations</div>
              <Link to="/admin/resources" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Manage Resources <ArrowIcon />
              </Link>
            </div>
            {recentReservations.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 0' }}>
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-title">No active reservations</div>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Student ID</th>
                    <th>Start Time</th>
                    <th>Status</th>
                    <th>Node</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReservations.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{getResourceName(r.resource_id)}</td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{r.student_id}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(r.start_time).toLocaleString()}</td>
                      <td><span className="badge badge-success">● Confirmed</span></td>
                      <td><code style={{ fontSize: 11, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>{r.created_by_node || '—'}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* System tip */}
          <div className="alert alert-info">
            💡 Resources are managed with <strong>Lamport Logical Clocks</strong> and <strong>Ricart–Agrawala mutual exclusion</strong> — ensuring only one student can book a resource at any given time.
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
