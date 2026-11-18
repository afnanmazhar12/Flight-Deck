import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function MongoStatusModal({ isOpen, onClose, mongoStatus, onStatusChange }) {
  const [uri, setUri] = useState(mongoStatus?.uri || '');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!uri.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.updateMongoUri(uri.trim());
      if (res.success) {
        setFeedback({ type: 'ok', msg: `Successfully connected to MongoDB (${res.host})!` });
        if (onStatusChange) onStatusChange(res.mongoStatus);
      } else {
        setFeedback({ type: 'err', msg: `Could not connect: ${res.message}. App is using safe local persistence mode.` });
        if (onStatusChange) onStatusChange(res.mongoStatus);
      }
    } catch (err) {
      setFeedback({ type: 'err', msg: err.message || 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      <div 
        style={{
          background: 'rgba(14, 24, 38, 0.92)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(82, 199, 255, 0.25)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          padding: '24px',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 0,
            color: 'var(--mute)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--fg)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mute)'}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div 
            style={{
              padding: '10px',
              borderRadius: '10px',
              background: 'rgba(82, 199, 255, 0.12)',
              border: '1px solid rgba(82, 199, 255, 0.3)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Database size={24} />
          </div>
          <div>
            <h3 style={{ font: '700 22px/1.1 var(--f-head)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--fg)' }}>
              MongoDB Cloud Database
            </h3>
            <p style={{ font: '500 12px var(--f-mono)', color: 'var(--mute)', marginTop: '4px' }}>
              Connect your MongoDB Atlas cluster for multi-pilot persistence
            </p>
          </div>
        </div>

        {/* Current Status Pill */}
        <div 
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            background: mongoStatus?.connected ? 'rgba(67, 224, 160, 0.12)' : 'rgba(255, 179, 64, 0.12)',
            border: `1px solid ${mongoStatus?.connected ? 'rgba(67, 224, 160, 0.35)' : 'rgba(255, 179, 64, 0.35)'}`,
            color: mongoStatus?.connected ? 'var(--ok)' : 'var(--amber-t)'
          }}
        >
          {mongoStatus?.connected ? (
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          ) : (
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          )}
          <div style={{ font: '500 12px/1.4 var(--f-mono)' }}>
            <div style={{ font: '700 13px var(--f-head)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>
              Status: {mongoStatus?.connected ? 'MongoDB Atlas Connected' : 'Local Storage Fallback Mode'}
            </div>
            <div style={{ color: 'var(--mute)', fontSize: '11.5px' }}>
              {mongoStatus?.connected
                ? `Connected to database "${mongoStatus.database || 'flightdesk'}" on host: ${mongoStatus.host}`
                : `MongoDB Atlas is pending or whitelist entry required. Flights, logbooks, and fleet records are safely persisted locally.`}
            </div>
          </div>
        </div>

        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', font: '700 11.5px var(--f-head)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: '6px' }}>
              MongoDB Connection URI
            </label>
            <input
              type="text"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="mongodb+srv://user:pass@cluster0.mongodb.net/flightdesk"
              style={{
                width: '100%',
                background: 'rgba(6, 12, 20, 0.6)',
                border: '1px solid var(--line2)',
                borderRadius: '8px',
                padding: '9px 12px',
                font: '500 13px var(--f-mono)',
                color: 'var(--fg)',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--line2)'}
            />
            <p style={{ font: '500 11px var(--f-mono)', color: 'var(--faint)', marginTop: '6px' }}>
              Supports MongoDB Atlas (<span style={{ color: 'var(--accent)' }}>mongodb+srv://...</span>) with IP whitelist set to <span style={{ color: 'var(--ok)' }}>0.0.0.0/0</span>.
            </p>
          </div>

          {feedback && (
            <div 
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                font: '500 12px var(--f-mono)',
                background: feedback.type === 'ok' ? 'rgba(67, 224, 160, 0.12)' : 'rgba(255, 111, 125, 0.12)',
                border: `1px solid ${feedback.type === 'ok' ? 'var(--ok)' : 'var(--bad)'}`,
                color: feedback.type === 'ok' ? 'var(--ok)' : 'var(--bad)'
              }}
            >
              {feedback.msg}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--line)', marginTop: '4px' }}>
            <span style={{ font: '500 11.5px var(--f-mono)', color: 'var(--faint)' }}>
              Auto-retry & sync enabled
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn ghost sm"
                style={{ marginTop: 0 }}
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn sm"
                style={{ marginTop: 0 }}
              >
                {loading && <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Connecting...' : 'Connect & Sync'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
