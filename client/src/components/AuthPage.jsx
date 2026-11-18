import React, { useState } from 'react';
import { Lock, Mail, User, Shield, AlertCircle, ArrowRight, LogIn, UserPlus, Radio, Plane } from 'lucide-react';
import { api } from '../services/api';

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    login: '',
    username: '',
    email: '',
    password: '',
    callsign: '',
    simbriefUser: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login({
          login: formData.login,
          password: formData.password
        });
        if (res.success && res.user) {
          onAuthSuccess(res.user);
        }
      } else {
        const res = await api.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          callsign: formData.callsign,
          simbriefUser: formData.simbriefUser
        });
        if (res.success && res.user) {
          onAuthSuccess(res.user);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-portal-wrap">
      <div className="auth-ambient-grid" />

      <div className="auth-glass-panel">
        {/* Header Ribbon */}
        <div className="auth-panel-header">
          <div className="auth-logo-badge">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M3 21 12 2l9 19-9-5z" />
            </svg>
          </div>

          <h1 className="auth-title">Flight Desk</h1>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Flight Crew Dispatch & Cockpit Access' : 'Register New Flight Deck Crew'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="auth-mode-tabs">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`auth-mode-tab ${mode === 'login' ? 'active' : ''}`}
            >
              <LogIn size={15} /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`auth-mode-tab ${mode === 'register' ? 'active' : ''}`}
            >
              <UserPlus size={15} /> Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error-box">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <div className="auth-field">
                <label className="auth-label">Username or Email</label>
                <div className="auth-input-container">
                  <User />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formData.login}
                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    placeholder="e.g. captain_ali or pilot@airline.com"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-container">
                  <Lock />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="auth-input"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="auth-field">
                <label className="auth-label">Pilot Username</label>
                <div className="auth-input-container">
                  <User />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. captain_ali"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-container">
                  <Mail />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="pilot@airline.com"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-container">
                  <Lock />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 4 characters"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-grid-2">
                <div className="auth-field">
                  <label className="auth-label">Callsign (Opt)</label>
                  <div className="auth-input-container">
                    <Plane />
                    <input
                      type="text"
                      value={formData.callsign}
                      onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                      placeholder="e.g. SVA101"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">SimBrief (Opt)</label>
                  <div className="auth-input-container">
                    <Radio />
                    <input
                      type="text"
                      value={formData.simbriefUser}
                      onChange={(e) => setFormData({ ...formData, simbriefUser: e.target.value })}
                      placeholder="e.g. 123456"
                      className="auth-input"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <span className="clk" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                AUTHENTICATING...
              </span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Enter Flight Deck' : 'Create Private Hangar'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security / Privacy Footnote */}
        <div className="auth-footer">
          <div className="auth-guarantee">
            <Shield size={14} style={{ color: 'var(--ok)' }} />
            <span>Isolated Private Database</span>
          </div>
          <div className="auth-guarantee">
            <Radio size={14} style={{ color: 'var(--accent)' }} />
            <span>VATSIM & SimBrief Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
