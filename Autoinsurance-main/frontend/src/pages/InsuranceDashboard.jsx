import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, BookOpen, Database } from 'lucide-react';

export default function InsuranceDashboard() {
  const [policyFile, setPolicyFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [claimsHistory, setClaimsHistory] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/claims")
      .then(res => res.json())
      .then(data => setClaimsHistory(data))
      .catch(err => console.error(err));
  }, []);

  const extractPolicy = async () => {
    if (!policyFile) return;
    setIsProcessing(true);
    setSynced(false);

    const formData = new FormData();
    formData.append("file", policyFile);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/extract_policy_pdf", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('insure_policy_text', data.policy_text);
        setSynced(true);
      } else {
        alert("Extraction Error: " + data.detail);
      }
    } catch (err) {
      alert("System Error: " + err);
    }
    setIsProcessing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Shield size={32} className="text-emerald" />
          <h2>Underwriter Policy Engine</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem' }}>
          <div>
            <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Knowledge Base Upload</h4>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Upload Insurance Policy PDFs. PyPDF2 will parse the document and the NLP model will build deterministic adjudication rules.
            </p>
            
            <div className="form-group">
              <input 
                type="file" 
                accept=".pdf" 
                className="form-input" 
                onChange={e => setPolicyFile(e.target.files[0])}
                style={{ background: 'rgba(0, 255, 157, 0.05)', borderColor: 'rgba(0, 255, 157, 0.2)' }}
              />
            </div>

            <button className="btn btn-emerald" onClick={extractPolicy} disabled={isProcessing || !policyFile}>
              {isProcessing ? 'Generating NLP Rules...' : <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={18}/> Parse Policy & Sync</span>}
            </button>
          </div>

          <div style={{ paddingLeft: '2rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Engine Status</h4>
            
            {synced ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="trace-item approved" style={{ marginTop: '1rem' }}>
                <div style={{ fontWeight: 600 }}>Rules Synchronized</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  The active policy graph has been injected into the Adjudication Engine. Patients will now be evaluated against these deterministic parameters.
                </p>
              </motion.div>
            ) : (
              <div style={{ marginTop: '1rem', padding: '1.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Awaiting policy document. Upload a PDF to generate the deterministic coverage logic.
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <Database className="text-pink" /> Historical Claims Ledger (TinyDB)
        </h3>
        {claimsHistory.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No historical adjudications found in the local database.</p>
        ) : (
          <div className="trace-grid">
            {claimsHistory.map(claim => (
              <div key={claim._id} className="trace-item" style={{ borderLeftColor: 'var(--neon-emerald)' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Claim #{claim._id} - {claim.bill?.patient_name || 'Unknown'}</div>
                <div className="mono" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Billed: ₹{claim.result?.total_billed}</div>
                <div style={{ fontSize: '0.85rem' }}>
                  <span className="text-emerald">Approved: ₹{claim.result?.total_covered}</span> | <span className="text-pink">Rejected: ₹{claim.result?.total_rejected}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
