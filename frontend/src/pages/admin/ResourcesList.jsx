import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';

const PlusIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{width:16,height:16}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const TrashIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{width:15,height:15}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
);
const CloseIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{width:20,height:20}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const TYPES = ['Computer Lab', 'Research Lab', 'Conference Room', 'Equipment Room', 'Studio', 'Other'];

const ResourcesList = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    type: 'Computer Lab',
    location: '',
    capacity: '',
  });

  const fetchResources = () => {
    setLoading(true);
    fetchWithAuth('/resources')
      .then(res => setResources(res))
      .catch(err => showAlert('danger', err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchResources(); }, []);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim() || !form.capacity) {
      showAlert('danger', 'Please fill in all fields.');
      return;
    }
    setSaving(true);
    try {
      await fetchWithAuth('/resources', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          location: form.location.trim(),
          capacity: parseInt(form.capacity, 10),
        }),
      });
      showAlert('success', `Resource "${form.name}" created successfully!`);
      setForm({ name: '', type: 'Computer Lab', location: '', capacity: '' });
      setShowModal(false);
      fetchResources();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to create resource');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resource) => {
    if (!window.confirm(`Deactivate "${resource.name}"? Students will no longer be able to book it.`)) return;
    setDeletingId(resource.id);
    try {
      await fetchWithAuth(`/resources/${resource.id}`, { method: 'DELETE' });
      showAlert('success', `"${resource.name}" deactivated.`);
      fetchResources();
    } catch (err) {
      showAlert('danger', err.message || 'Failed to deactivate resource');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Resources</h1>
          <p className="page-subtitle">Create and manage campus labs and rooms available for booking.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <PlusIcon /> Add Resource
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`}>
          {alert.type === 'success' ? '✅' : '⚠️'} {alert.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /> Loading resources...</div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-state-icon">🔬</div>
                      <div className="empty-state-title">No resources yet</div>
                      <div className="empty-state-desc">Click "Add Resource" to create the first lab or room.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                resources.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td><span className="badge badge-primary">{r.type}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.location}</td>
                    <td>{r.capacity}</td>
                    <td>
                      <span className={`badge badge-${r.active ? 'success' : 'danger'}`}>
                        {r.active ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td>
                      {r.active && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(r)}
                          disabled={deletingId === r.id}
                        >
                          <TrashIcon />
                          {deletingId === r.id ? 'Deactivating...' : 'Deactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Resource Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add New Resource</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><CloseIcon /></button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Resource Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Computer Lab A"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select
                    className="form-control"
                    value={form.type}
                    onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    style={{ cursor: 'pointer' }}
                  >
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Capacity *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    placeholder="e.g. 40"
                    value={form.capacity}
                    onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Block A, Floor 2"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <><div className="spinner" style={{width:14,height:14,borderWidth:2}} /> Creating...</>
                  ) : 'Create Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourcesList;
