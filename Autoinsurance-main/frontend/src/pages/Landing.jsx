import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HeartPulse, FileText, Shield } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const handleSelectRole = (role) => {
    navigate(`/auth/${role}`);
  };

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Select Your Portal</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>Welcome to the offline-first explainable claims engine.</p>
      </motion.div>

      <motion.div variants={containerVars} initial="hidden" animate="show" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        <motion.div variants={itemVars} className="glass-card" onClick={() => handleSelectRole('patient')} style={{ cursor: 'pointer', maxWidth: '320px', flex: '1', borderTop: '4px solid var(--neon-cyan)' }}>
          <div style={{ padding: '1rem 0' }}>
            <HeartPulse size={48} className="text-cyan" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Patient Console</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>Access deterministic breakdown of your medical bills and coverage logic.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="glass-card" onClick={() => handleSelectRole('hospital')} style={{ cursor: 'pointer', maxWidth: '320px', flex: '1', borderTop: '4px solid var(--neon-pink)' }}>
          <div style={{ padding: '1rem 0' }}>
            <FileText size={48} className="text-pink" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Hospital Biller</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>Upload medical invoices via Computer Vision extraction.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="glass-card" onClick={() => handleSelectRole('insurance')} style={{ cursor: 'pointer', maxWidth: '320px', flex: '1', borderTop: '4px solid var(--neon-emerald)' }}>
          <div style={{ padding: '1rem 0' }}>
            <Shield size={48} className="text-emerald" style={{ margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>Underwriter</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '1rem' }}>Manage NLP insurance rules and review historical adjudications.</p>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
