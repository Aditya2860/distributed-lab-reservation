import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { LayoutDashboard, Calendar, History, LogOut } from 'lucide-react';

const StudentLayout = () => {
  const { logout, user } = useAuth();

  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="sidebar-logo">LabReserve</div>
        
        <div className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-group-title">Main</div>
            <NavLink to="/student/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
              <LayoutDashboard /> Dashboard
            </NavLink>
            <NavLink to="/student/resources" className="nav-link"><Calendar /> Browse Resources</NavLink>
            <NavLink to="/student/reservations" className="nav-link"><History /> My Reservations</NavLink>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <div style={{marginBottom: '12px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500'}}>
            {user?.name}
          </div>
          <button className="btn btn-full" onClick={logout} style={{textAlign: 'left', display: 'flex', alignItems: 'center', backgroundColor: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '8px 0'}}>
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

export default StudentLayout;
