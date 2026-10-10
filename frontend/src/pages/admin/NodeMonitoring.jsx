import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';
import { Server, Activity, Clock } from 'lucide-react';

const NodeMonitoring = () => {
  const [nodes, setNodes] = useState([]);
  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNodes = async () => {
    try {
      const info = await fetchWithAuth('/cluster/info');
      setNodes(info.cluster || []);
      
      const leaderInfo = info.cluster.find(n => n.is_coordinator);
      if (leaderInfo) {
        setLeader(leaderInfo);
      } else {
        setLeader(null);
      }
    } catch (err) {
      console.error("Failed to fetch node info", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading cluster info...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Distributed System Node Monitoring</h1>
        <p className="page-subtitle">Real-time status of backend nodes and leader election.</p>
      </div>

      <div className="dashboard-grid">
        {nodes.map(node => (
          <div key={node.node_url} className="metric-card" style={{border: node.is_coordinator ? '2px solid var(--primary)' : '1px solid var(--border)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <div style={{fontWeight: 'bold', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Server size={20} color={node.status === 'down' ? 'var(--danger)' : 'var(--primary)'} />
                {node.node_id}
              </div>
              <span className={`badge badge-${node.status === 'down' ? 'danger' : 'success'}`}>
                {node.status === 'down' ? 'Offline' : 'Online'}
              </span>
            </div>
            
            <div style={{color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}>
              <Activity size={16} /> URL: {node.node_url}
            </div>
            
            {node.status !== 'down' && (
              <div style={{color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Clock size={16} /> Lamport Time: {node.logical_time}
              </div>
            )}
            
            {node.is_coordinator && (
              <div style={{marginTop: '16px', padding: '8px', backgroundColor: 'var(--primary-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontWeight: 'bold', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase'}}>
                ★ Current Coordinator
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodeMonitoring;
