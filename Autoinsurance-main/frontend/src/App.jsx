import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { ShieldCheck, LogOut } from 'lucide-react';

import Auth from './pages/Auth';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import InsuranceDashboard from './pages/InsuranceDashboard';

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}`} />;
  }
  
  return children;
}

export default function App() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="app-container">
      <nav className="navbar">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }} className="nav-logo">
          <ShieldCheck size={28} />
          <span>Explainable Claims</span> Engine
        </Link>
        
        {user && (
          <div className="auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Logged in as <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{user.username}</span> 
              <span className="status-badge status-ready" style={{ marginLeft: '10px', fontSize: '0.7rem' }}>{user.role}</span>
            </span>
            <button className="btn" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={16} /> Disconnect
            </button>
          </div>
        )}
      </nav>

      <main>
        <Routes>
          <Route path="/" element={user ? <Navigate to={`/${user.role}`} /> : <Landing />} />
          <Route path="/auth/:role" element={user ? <Navigate to={`/${user.role}`} /> : <Auth />} />
          
          <Route path="/patient" element={
            <ProtectedRoute allowedRole="patient"><PatientDashboard /></ProtectedRoute>
          } />
          <Route path="/hospital" element={
            <ProtectedRoute allowedRole="hospital"><HospitalDashboard /></ProtectedRoute>
          } />
          <Route path="/insurance" element={
            <ProtectedRoute allowedRole="insurance"><InsuranceDashboard /></ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
