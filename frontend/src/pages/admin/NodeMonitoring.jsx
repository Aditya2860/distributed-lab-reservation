import React, { useEffect, useState, useCallback } from 'react';
import { fetchWithAuth } from '../../api/client';

const RefreshIcon = () => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{width:15,height:15}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
);

const NodeMonitoring = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchNodes = useCallback(async () => {
    try {
      const info = await fetchWithAuth('/cluster/info');
      setNodes(info.cluster || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch node info', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 3000);
    return () => clearInterval(interval);
  }, [fetchNodes]);

  const onlineCount = nodes.filter(n => n.status !== 'down').length;
  const leader = nodes.find(n => n.is_coordinator);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Node Monitoring</h1>
          <p className="page-subtitle">
            Real-time distributed system status — auto-refreshes every 3s.
            {lastUpdated && <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 12 }}>Last updated: {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchNodes}>
          <RefreshIcon /> Refresh
        </button>
      </div>

      {/* Summary row */}
      <div className="dashboard-grid" style={{ marginBottom: 24 }}>
        <div className="metric-card">
          <div className="metric-title">Total Nodes</div>
          <div className="metric-value">{nodes.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Online</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>{onlineCount}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Offline</div>
          <div className="metric-value" style={{ color: nodes.length - onlineCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
            {nodes.length - onlineCount}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Coordinator</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginTop: 6, fontFamily: 'monospace' }}>
            {leader ? leader.node_id : '—'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /> Loading cluster info...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nodes.map(node => {
            const isOnline = node.status !== 'down';
            const isLeader = node.is_coordinator;
            return (
              <div key={node.node_url} className={`node-card${isLeader ? ' leader' : ''}`}>
                <div className={`node-status-dot ${isOnline ? 'up' : 'down'}`} />
                <div className="node-info">
                  <div className="node-id">{node.node_id}</div>
                  <div className="node-meta">{node.node_url}</div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  {isOnline && (
                    <>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Lamport Time</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                          {node.logical_time ?? '—'}
                        </div>
                      </div>
                      {node.coordinator_id && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Sees Coordinator</div>
                          <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                            {node.coordinator_id}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isLeader && <span className="badge badge-primary">★ Coordinator</span>}
                    <span className={`badge badge-${isOnline ? 'success' : 'danger'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="alert alert-info" style={{ marginTop: 24 }}>
        🔧 Leader election uses the <strong>Bully Algorithm</strong>. If the coordinator goes down, the highest-ID online node automatically takes over.
      </div>
    </div>
  );
};

export default NodeMonitoring;
