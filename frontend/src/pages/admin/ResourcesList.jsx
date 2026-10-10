import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';

const ResourcesList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/resources')
      .then(res => setResources(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading resources...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Manage Resources</h1>
        <p className="page-subtitle">View campus resources available for reservation.</p>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 ? (
              <tr><td colSpan="5">No resources found.</td></tr>
            ) : (
              resources.map(r => (
                <tr key={r.id}>
                  <td style={{fontWeight: '500'}}>{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.location}</td>
                  <td>{r.capacity}</td>
                  <td><span className={`badge badge-${r.active ? 'success' : 'danger'}`}>{r.active ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourcesList;
