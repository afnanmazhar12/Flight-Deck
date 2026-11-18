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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#101a25] border border-[#22344a] rounded-xl w-full max-w-xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8aa0b8] hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-[#52c7ff]/10 text-[#52c7ff]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-head text-2xl font-bold tracking-wide uppercase text-white">
              MongoDB Database Connection
            </h3>
            <p className="text-xs text-[#8aa0b8]">
              Connect your local or MongoDB Atlas Cloud database for flights and logbooks
            </p>
          </div>
        </div>

        {/* Current Status Pill */}
        <div className={`p-3 rounded-lg border mb-5 flex items-start gap-3 ${
          mongoStatus?.connected
            ? 'bg-[#43e0a0]/10 border-[#43e0a0]/30 text-[#43e0a0]'
            : 'bg-[#ffb340]/10 border-[#ffb340]/30 text-[#ffb340]'
        }`}>
          {mongoStatus?.connected ? (
            <CheckCircle2 className="w-5 h-5 flex-none mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-none mt-0.5" />
          )}
          <div className="text-xs font-mono leading-relaxed">
            <div className="font-semibold font-head uppercase tracking-wider text-sm">
              Status: {mongoStatus?.connected ? 'MongoDB Connected' : 'Local Storage Fallback Mode'}
            </div>
            <div className="text-[#8aa0b8] mt-1">
              {mongoStatus?.connected
                ? `Connected to database "${mongoStatus.database || 'flightdesk'}" on host: ${mongoStatus.host}`
                : `MongoDB daemon is offline or connection string is pending. ${mongoStatus?.lastError ? `[Error: ${mongoStatus.lastError}]` : ''} Flights, logbooks, and fleet records are safely persisted locally.`}
            </div>
          </div>
        </div>

        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-xs font-head font-bold uppercase tracking-wider text-[#8aa0b8] mb-1.5">
              MongoDB Connection URI
            </label>
            <input
              type="text"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              placeholder="mongodb+srv://user:pass@cluster0.mongodb.net/flightdesk"
              className="w-full bg-[#0a121b] border border-[#34506b] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#52c7ff]"
            />
            <p className="text-[11px] text-[#5f7791] mt-1.5">
              Supports local MongoDB (<code className="text-[#52c7ff]">mongodb://127.0.0.1:27017/flightdesk</code>) or MongoDB Atlas (<code className="text-[#52c7ff]">mongodb+srv://...</code>).
            </p>
          </div>

          {feedback && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${
              feedback.type === 'ok'
                ? 'bg-[#43e0a0]/10 border-[#43e0a0]/30 text-[#43e0a0]'
                : 'bg-[#ff6f7d]/10 border-[#ff6f7d]/30 text-[#ff6f7d]'
            }`}>
              {feedback.msg}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-[#22344a]">
            <span className="text-xs text-[#8aa0b8]">
              Automatic retry & data sync enabled
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-head font-bold tracking-wider uppercase text-[#8aa0b8] hover:text-white rounded-lg border border-[#22344a] hover:border-[#34506b] transition"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-head font-bold tracking-wider uppercase bg-[#52c7ff] text-[#031a28] hover:bg-[#68d1ff] rounded-lg flex items-center gap-1.5 transition font-semibold disabled:opacity-50"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {loading ? 'Connecting...' : 'Connect & Sync'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
