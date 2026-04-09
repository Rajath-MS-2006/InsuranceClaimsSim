import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle } from 'lucide-react';

export default function HospitalDashboard() {
  const [billFile, setBillFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [synced, setSynced] = useState(false);

  const extractBill = async () => {
    if (!billFile) return;
    setIsProcessing(true);
    setSynced(false);

    const formData = new FormData();
    formData.append("file", billFile);
    try {
      const response = await fetch("http://127.0.0.1:8000/api/extract_bill", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('insure_bill_json', JSON.stringify(data));
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <FileText size={32} className="text-cyan" />
        <h2>Hospital Biller Workspace</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem' }}>
        <div>
          <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Document Ingestion</h4>
          <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Upload medical invoices (JPG, PNG, PDF). Our EasyOCR Computer Vision engine will semantically extract line items.
          </p>
          
          <div className="form-group">
            <input 
              type="file" 
              accept="image/*,.pdf" 
              className="form-input" 
              onChange={e => setBillFile(e.target.files[0])}
              style={{ background: 'rgba(0, 243, 255, 0.05)', borderColor: 'rgba(0, 243, 255, 0.2)' }}
            />
          </div>

          <button className="btn btn-primary" onClick={extractBill} disabled={isProcessing || !billFile}>
            {isProcessing ? 'Extracting via Computer Vision...' : <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UploadCloud size={18}/> Process & Sync to Ledger</span>}
          </button>
        </div>

        <div style={{ paddingLeft: '2rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
          <h4 style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sync Status</h4>
          
          {synced ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="trace-item approved" style={{ marginTop: '1rem' }}>
              <CheckCircle size={24} className="text-emerald" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600 }}>Ledger Synchronized</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                The semantic structure of the bill has been securely transmitted to the Patient Adjudication engine via local storage protocol.
              </p>
            </motion.div>
          ) : (
            <div style={{ marginTop: '1rem', padding: '1.5rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Awaiting document extraction. Upload a bill to verify and publish the structured deterministic graph to the patient ledger.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
