import React, { useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Shield, ArrowRight, UserPlus, LogIn, ArrowLeft } from 'lucide-react';

export default function Auth() {
  const { role } = useParams();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Validate role parameter to prevent arbitrary paths
  const validRoles = ['patient', 'hospital', 'insurance'];
  if (!validRoles.includes(role)) {
    return <div style={{textAlign: 'center', marginTop: '5rem'}}><h2>Invalid Role Specification</h2></div>;
  }

  const roleNameDisplay = role.charAt(0).toUpperCase() + role.slice(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString()
        });
        
        const data = await res.json();
        if (res.ok) {
          // Verify that logged-in users are logging into the portal matching their role
          if (data.role !== role) {
             setError(`Access Denied! You are registered as ${data.role.toUpperCase()}, but tried to access the ${role.toUpperCase()} portal.`);
             return;
          }
          login(data);
          navigate(`/${data.role}`);
        } else {
          setError(data.detail);
        }
      } else {
        const res = await fetch("http://127.0.0.1:8000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, role })
        });
        const data = await res.json();
        if (res.ok) {
          login(data);
          navigate(`/${data.role}`);
        } else {
          setError(data.detail);
        }
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      
      <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
         <ArrowLeft size={16} /> Back to Portals
      </Link>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Shield size={48} color="var(--neon-cyan)" style={{ marginBottom: '1rem' }} />
        <div className="status-badge" style={{ marginBottom: '1rem', borderColor: 'var(--border-glow)', color: 'var(--neon-cyan)' }}>
           {roleNameDisplay} Portal
        </div>
        <h2>{isLogin ? 'Access Account' : 'Initialize Account'}</h2>
      </div>

      {error && <div style={{ color: 'var(--neon-pink)', marginBottom: '1rem', border: '1px solid var(--neon-pink)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input 
            type="text" 
            className="form-input" 
            required 
            value={username} 
            onChange={e => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input 
            type="password" 
            className="form-input" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
          {isLogin ? `Authenticate as ${roleNameDisplay}` : `Register as ${roleNameDisplay}`}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button className="btn" onClick={() => setIsLogin(!isLogin)} style={{ border: 'none', color: 'var(--text-muted)' }}>
          {isLogin ? 'Need an account? Register' : 'Have an account? Login'} <ArrowRight size={14} style={{ marginLeft: '4px' }}/>
        </button>
      </div>
    </div>
  );
}
