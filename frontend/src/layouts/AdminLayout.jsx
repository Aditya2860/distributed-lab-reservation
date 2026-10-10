import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { LayoutDashboard, Users, Server, FileText, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const { logout } = useAuth();

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="sidebar-logo">LabReserve Admin</div>
        
        <div className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-group-title">Overview</div>
            <NavLink to="/admin/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <LayoutDashboard /> Dashboard
            </NavLink>
          </div>
          
          <div className="nav-group">
            <div className="nav-group-title">Management</div>
            {/* Add these routes later */}
            <NavLink to="/admin/resources" className="nav-link"><FileText /> Resources</NavLink>
            <NavLink to="/admin/users" className="nav-link"><Users /> Users</NavLink>
          </div>
          
          <div className="nav-group">
            <div className="nav-group-title">Distributed System</div>
            <NavLink to="/admin/nodes" className="nav-link"><Server /> Node Monitoring</NavLink>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button className="btn btn-full" onClick={logout} style={{textAlign: 'left', display: 'flex', alignItems: 'center', backgroundColor: 'transparent', border: 'none', color: 'var(--text-secondary)'}}>
            <LogOut size={18} style={{marginRight: '12px'}} /> Logout
          </button>
        </div>
      </div>
      
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
