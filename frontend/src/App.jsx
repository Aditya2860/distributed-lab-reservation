import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute, RoleProtectedRoute } from './auth/ProtectedRoute';

import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';
import BrowseResources from './pages/student/BrowseResources';
import MyReservations from './pages/student/MyReservations';
import NodeMonitoring from './pages/admin/NodeMonitoring';
import UsersList from './pages/admin/UsersList';
import ResourcesList from './pages/admin/ResourcesList';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/nodes" element={<NodeMonitoring />} />
              <Route path="/admin/users" element={<UsersList />} />
              <Route path="/admin/resources" element={<ResourcesList />} />
            </Route>
          </Route>

          {/* Student Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['STUDENT']} />}>
            <Route element={<StudentLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/resources" element={<BrowseResources />} />
              <Route path="/student/reservations" element={<MyReservations />} />
            </Route>
          </Route>

          {/* Fallback routing */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
