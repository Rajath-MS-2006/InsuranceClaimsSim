import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, FileText, Settings, HeartPulse } from 'lucide-react';

export default function PatientDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [billJson, setBillJson] = useState(null);
  const [policyText, setPolicyText] = useState(null);

  useEffect(() => {
    // Pull synced data from other portals via local storage
    setBillJson(localStorage.getItem('insure_bill_json'));
    setPolicyText(localStorage.getItem('insure_policy_text'));
  }, []);

  const isBillLoaded = billJson && billJson !== 'undefined';
  const isPolicyLoaded = policyText && policyText !== 'undefined';

  const simulateAdjudication = async () => {
    if (!isBillLoaded || !isPolicyLoaded) return;
    setIsProcessing(true);
    setResults(null);
    try {
      let parsedBill;
      try {
        parsedBill = JSON.parse(billJson);
      } catch (e) {
        throw new Error("Invalid bill format stored in local storage.");
      }

      const response = await fetch("http://127.0.0.1:8000/api/adjudicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bill: parsedBill,
          policy_text: policyText
        })
      });
      const data = await response.json();
      if (response.ok) {
        setResults({
          totalBilled: data.result.total_billed,
          totalCovered: data.result.total_covered,
          totalPatientPayable: data.result.total_rejected,
          traces: data.result.traces.map(t => ({
             desc: t.item_description,
             amount: t.original_amount,
             category: t.ontology_category,
             covered: t.amount_covered,
             rejected: t.amount_rejected,
             reason: t.rejection_reason
          }))
        });
        // Clear local storage pending items optionally
      } else {
        alert("Error: " + JSON.stringify(data.detail));
      }
    } catch (err) {
      alert("Failed to connect to backend: " + err.message);
    }
    setIsProcessing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel patient-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <HeartPulse size={32} className="text-cyan" />
        <h2>Patient Claims Console</h2>
      </div>
      
      <div className="status-indicators" style={{ display: 'flex', gap: '20px', justifyContent: 'center', margin: '2rem 0' }}>
          <div className={`status-badge ${isBillLoaded ? 'status-ready' : 'status-waiting'}`}>
              <FileText size={18} />
              {isBillLoaded ? 'Hospital Bill Loaded' : 'Waiting for Hospital Bill'}
          </div>
          <div className={`status-badge ${isPolicyLoaded ? 'status-ready' : 'status-waiting'}`}>
              <ShieldCheck size={18} />
              {isPolicyLoaded ? 'Insurance Policy Loaded' : 'Waiting for Insurance Policy'}
          </div>
      </div>

      {isBillLoaded && isPolicyLoaded ? (
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <button className="btn btn-primary" onClick={simulateAdjudication}>
                  {isProcessing ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Settings className="spin"/> Analyzing Deterministic Graph...</span>
                  ) : "Calculate Financial Predictor"}
              </button>
          </div>
      ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Documents must be synchronized from Hospital & Insurance portals before calculation.</p>
      )}

      {results && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="results-container">
          <div className="trace-grid" style={{ marginBottom: '3rem' }}>
            <div className="glass-card" style={{ borderLeft: '4px solid var(--neon-emerald)' }}>
              <div className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>Insurance Covered</div>
              <div className="trace-amount text-emerald">₹{results.totalCovered.toFixed(2)}</div>
            </div>
            <div className="glass-card" style={{ borderLeft: '4px solid var(--neon-pink)' }}>
              <div className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>Patient Out of Pocket</div>
              <div className="trace-amount text-pink">₹{results.totalPatientPayable.toFixed(2)}</div>
            </div>
            <div className="glass-card" style={{ borderLeft: '4px solid var(--neon-cyan)' }}>
              <div className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>Total Invoice Size</div>
              <div className="trace-amount text-cyan">₹{results.totalBilled.toFixed(2)}</div>
            </div>
          </div>

          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <Activity className="text-cyan" /> Itemized Explanability Model
          </h3>
          <div className="trace-grid">
            {results.traces.map((trace, idx) => (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.1 }} key={idx} className={`trace-item ${trace.rejected === 0 ? 'approved' : ''}`}>
                <div className="trace-header">
                  <span>{trace.desc}</span>
                  <span className="mono">₹{trace.amount.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>[{trace.category}]</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.9rem' }}>
                  <div className="text-emerald">Covered: ₹{trace.covered.toFixed(2)}</div>
                  {trace.rejected > 0 && (
                    <div className="text-pink" style={{ textAlign: 'right' }}>
                      Rejected: ₹{trace.rejected.toFixed(2)} <br/>
                      <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{trace.reason}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
