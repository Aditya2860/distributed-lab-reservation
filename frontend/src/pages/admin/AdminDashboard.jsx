import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    resources: 0,
    students: 0,
    totalReservations: 0,
    nodes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resourcesRes, usersRes, resRes, nodesRes] = await Promise.all([
          fetchWithAuth('/resources'),
          fetchWithAuth('/users'),
          fetchWithAuth('/reservations'),
          fetchWithAuth('/cluster/nodes')
        ]);
        
        setStats({
          resources: resourcesRes.length,
          students: usersRes.filter(u => u.role === 'STUDENT').length,
          totalReservations: resRes.length,
          nodes: nodesRes.nodes.length
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage campus resources, monitor reservations, and oversee distributed coordination.</p>
      </div>

      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-title">Total Resources</div>
          <div className="metric-value">{stats.resources}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Active Students</div>
          <div className="metric-value">{stats.students}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Reservations</div>
          <div className="metric-value">{stats.totalReservations}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Active Nodes</div>
          <div className="metric-value">{stats.nodes}</div>
        </div>
      </div>
      
      <div className="table-container" style={{padding: '24px'}}>
        <h3 style={{marginBottom: '16px'}}>System Status</h3>
        <p>All nodes are currently participating in the cluster. See the "Node Monitoring" tab for details.</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
