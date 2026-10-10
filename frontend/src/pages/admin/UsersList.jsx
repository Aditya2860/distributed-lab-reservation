import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/users')
      .then(res => setUsers(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Students & Users</h1>
        <p className="page-subtitle">View all registered accounts in the system.</p>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="4">No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight: '500'}}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${u.role === 'ADMIN' ? 'info' : 'success'}`}>{u.role}</span></td>
                  <td><span className="badge badge-success">Active</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersList;
