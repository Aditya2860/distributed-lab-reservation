import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';

const LocationIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const UsersIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
);
const CloseIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{width:20,height:20}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const TagIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
);

// Returns ISO string in local time (no timezone offset) for datetime-local input
function toLocalDatetimeStr(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Minimum booking: now + 5 min rounded to next 5
function getMinDatetime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 10);
  return toLocalDatetimeStr(d);
}

const BrowseResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Reservation modal state
  const [bookingResource, setBookingResource] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWithAuth('/resources')
      .then(res => setResources(res.filter(r => r.active)))
      .catch(err => showAlert('danger', err.message))
      .finally(() => setLoading(false));
  }, []);

  const showAlert = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const openBooking = (resource) => {
    const now = new Date();
    const start = new Date(now.getTime() + 15 * 60000);
    const end = new Date(start.getTime() + 60 * 60000);
    setStartTime(toLocalDatetimeStr(start));
    setEndTime(toLocalDatetimeStr(end));
    setBookingResource(resource);
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) return;
    const s = new Date(startTime);
    const en = new Date(endTime);
    if (en <= s) {
      showAlert('danger', 'End time must be after start time.');
      return;
    }
    const durationHrs = (en - s) / 3600000;
    if (durationHrs > 8) {
      showAlert('danger', 'Maximum booking duration is 8 hours.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await fetchWithAuth('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          resource_id: bookingResource.id,
          start_time: s.toISOString(),
          end_time: en.toISOString(),
          request_id: `req-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        }),
      });

      if (result.status === 'rejected') {
        showAlert('danger', `Booking rejected: ${result.reason}`);
      } else {
        showAlert('success', `✅ "${bookingResource.name}" booked successfully via distributed consensus!`);
        setBookingResource(null);
      }
    } catch (err) {
      showAlert('danger', err.message || 'Failed to make reservation');
    } finally {
      setSubmitting(false);
    }
  };

  // Derived lists
  const types = ['All', ...Array.from(new Set(resources.map(r => r.type)))];
  const filtered = resources.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                        r.location.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'All' || r.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Browse Resources</h1>
          <p className="page-subtitle">Find and book labs, rooms, and equipment.</p>
        </div>
      </div>

      {/* Alert */}
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <input
          className="form-control"
          style={{ maxWidth: 300, marginBottom: 0 }}
          placeholder="Search by name or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {types.map(t => (
            <button
              key={t}
              className={`btn ${filterType === t ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 14px', fontSize: 13 }}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="loading-container"><div className="spinner" /> Loading resources...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No resources found</div>
          <div className="empty-state-desc">Try a different search term or filter.</div>
        </div>
      ) : (
        <div className="resources-grid">
          {filtered.map(resource => (
            <div key={resource.id} className="resource-card">
              <div className="resource-card-header">
                <div>
                  <div className="resource-card-name">{resource.name}</div>
                  <div className="resource-card-type">{resource.type}</div>
                </div>
                <span className="badge badge-success" style={{ flexShrink: 0 }}>Available</span>
              </div>

              <div className="resource-card-meta">
                <div className="resource-meta-item">
                  <LocationIcon /> {resource.location}
                </div>
                <div className="resource-meta-item">
                  <UsersIcon /> Capacity: {resource.capacity}
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ marginTop: 'auto' }}
                onClick={() => openBooking(resource)}
              >
                Book This Resource
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingResource && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setBookingResource(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Reserve {bookingResource.name}</h2>
              <button className="modal-close" onClick={() => setBookingResource(null)}><CloseIcon /></button>
            </div>

            <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Location</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{bookingResource.location}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Capacity</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{bookingResource.capacity} people</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Type</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{bookingResource.type}</div>
              </div>
            </div>

            <div className="alert alert-info" style={{ fontSize: 13 }}>
              🔒 Your request will go through <strong>distributed mutual exclusion</strong> (Lamport's algorithm) — only one student can book this slot.
            </div>

            <form onSubmit={handleReserve}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={startTime}
                    min={getMinDatetime()}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={endTime}
                    min={startTime || getMinDatetime()}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setBookingResource(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><div className="spinner" style={{width:14,height:14,borderWidth:2}} /> Acquiring lock...</>
                  ) : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseResources;
