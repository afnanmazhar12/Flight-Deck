import React, { useState } from 'react';
import { Plane, Lock, Mail, User, Shield, AlertCircle, ArrowRight, X, LogIn, UserPlus } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login', canClose = true }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
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

  if (!isOpen) return null;

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
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0b141e] border border-[#22394f] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0c2238] via-[#102e4c] to-[#0c2238] p-6 border-b border-[#22394f] text-center relative">
          {canClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#8aa0b8] hover:text-white transition p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#52c7ff]/10 border border-[#52c7ff]/30 text-[#52c7ff] mb-3">
            <Plane className="w-6 h-6 rotate-[-45deg]" />
          </div>

          <h2 className="font-head text-2xl font-bold tracking-wider text-white uppercase">
            Flight Desk Dispatch
          </h2>
          <p className="text-xs text-[#8aa0b8] mt-1 font-mono">
            {mode === 'login' ? 'Pilot Authentication & Cloud Hangar' : 'Register New Flight Desk Crew'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex bg-[#070e17] p-1 rounded-xl mt-5 border border-[#1b2b3d]">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-head font-bold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-[#52c7ff] text-[#031a28] shadow'
                  : 'text-[#8aa0b8] hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-xs font-head font-bold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-[#52c7ff] text-[#031a28] shadow'
                  : 'text-[#8aa0b8] hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff7070] px-3.5 py-2.5 rounded-lg text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <>
              <div>
                <label className="block text-xs font-head font-bold uppercase tracking-wider text-[#8aa0b8] mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#4a6b8a] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={formData.login}
                    onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                    placeholder="e.g. afnan12 or pilot@airline.com"
                    className="w-full bg-[#070e17] border border-[#22394f] rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-[#38536e] focus:outline-none focus:border-[#52c7ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-head font-bold uppercase tracking-wider text-[#8aa0b8] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#4a6b8a] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#070e17] border border-[#22394f] rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-[#38536e] focus:outline-none focus:border-[#52c7ff]"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-head font-bold uppercase tracking-wider text-[#8aa0b8] mb-1.5">
                  Pilot Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#4a6b8a] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. afnan12"
                    className="w-full bg-[#070e17] border border-[#22394f] rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-[#38536e] focus:outline-none focus:border-[#52c7ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-head font-bold uppercase tracking-wider text-[#8aa0b8] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#4a6b8a] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="pilot@airline.com"
                    className="w-full bg-[#070e17] border border-[#22394f] rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-[#38536e] focus:outline-none focus:border-[#52c7ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-head font-bold uppercase tracking-wider text-[#8aa0b8] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#4a6b8a] absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 4 characters"
                    className="w-full bg-[#070e17] border border-[#22394f] rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-white placeholder-[#38536e] focus:outline-none focus:border-[#52c7ff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-head font-bold uppercase tracking-wider text-[#8aa0b8] mb-1.5">
                    Callsign (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.callsign}
                    onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                    placeholder="e.g. SVA123"
                    className="w-full bg-[#070e17] border border-[#22394f] rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-[#38536e] focus:outline-none focus:border-[#52c7ff]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-head font-bold uppercase tracking-wider text-[#8aa0b8] mb-1.5">
                    SimBrief User (Opt)
                  </label>
                  <input
                    type="text"
                    value={formData.simbriefUser}
                    onChange={(e) => setFormData({ ...formData, simbriefUser: e.target.value })}
                    placeholder="e.g. 123456"
                    className="w-full bg-[#070e17] border border-[#22394f] rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-[#38536e] focus:outline-none focus:border-[#52c7ff]"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#52c7ff] hover:bg-[#68d1ff] text-[#031a28] font-head font-bold tracking-wider uppercase rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#52c7ff]/10 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#031a28] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to My Cockpit' : 'Register Private Database'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-[#557391] font-mono flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#43e0a0]" />
              Isolated MongoDB Atlas collection — private to your account
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
