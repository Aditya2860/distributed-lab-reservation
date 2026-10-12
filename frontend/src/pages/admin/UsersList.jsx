import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchWithAuth('/users')
      .then(res => setUsers(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const students = users.filter(u => u.role === 'STUDENT').length;
  const admins = users.filter(u => u.role === 'ADMIN').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">All registered accounts in the system.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card">
          <div className="metric-title">Total Users</div>
          <div className="metric-value">{users.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Students</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>{students}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Admins</div>
          <div className="metric-value" style={{ color: 'var(--primary)' }}>{admins}</div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="form-control"
          style={{ maxWidth: 340 }}
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /> Loading users...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="empty-state" style={{ padding: '32px 0' }}>
                      <div className="empty-state-title">No users found</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const initials = u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: u.role === 'ADMIN' ? 'var(--primary-subtle)' : 'var(--success-bg)',
                            color: u.role === 'ADMIN' ? 'var(--primary)' : 'var(--success)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                      <td>
                        <span className={`badge badge-${u.role === 'ADMIN' ? 'primary' : 'success'}`}>
                          {u.role === 'ADMIN' ? '🛡 Admin' : '🎓 Student'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersList;
