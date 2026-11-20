import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { applyOFPToFlight } from '../services/simbriefService';
import { Radio, RefreshCw, Zap, Plus, X, AlertCircle } from 'lucide-react';

const STAGES = [
  ['pre', 'Preflight'],
  ['sb', 'SimBrief OFP'],
  ['tech', 'Tech Log'],
  ['fuel', 'Fuel Voucher'],
  ['load', 'Loadsheet & Trim'],
  ['comms', 'ATC Log'],
  ['times', 'Times & Delay'],
  ['post', 'Postflight']
];

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
  return m ? `${+m[3]} ${MON[+m[2] - 1]} ${m[1]}` : (d || '');
}

export function statusOf(F) {
  if (!F) return 'Planning';
  if (F.post && F.post.completed) return 'Completed';
  if (F.vatsimPhase) return F.vatsimPhase;
  if (F.vatsimLive?.online && F.vatsimLive?.phase) return F.vatsimLive.phase;
  const d = F.done || {};
  if (d.post) return 'Completed';
  if (F.times?.actual?.in) return 'Arrived / Gate';
  if (F.times?.actual?.on) return 'Landed';
  if (F.times?.actual?.off) return 'Airborne';
  if (F.times?.actual?.out) return 'Departed / Taxi';
  if (d.times && d.comms) return 'Postflight';
  if (d.comms) return 'Enroute';
  if (d.load || d.fuel || d.tech) return 'Ready for Push';
  if (d.pre || d.sb) return 'Briefed';
  return 'Planning';
}

export function statusCls(s) {
  if (!s || s === 'Planning') return '';
  if (s === 'Completed') return 'ok';
  if (s.includes('Cruising') || s.includes('Airborne') || s.includes('Enroute') || s.includes('Online')) return 'acc';
  if (s.includes('Taxi') || s.includes('Boarding') || s.includes('Ready') || s.includes('Departure') || s.includes('Approach')) return 'warn';
  return 'acc';
}

export default function FlightsView({
  flights,
  fleet,
  onOpenFlight,
  onRefreshFlights,
  autoUplinkOnMount = false,
  onClearAutoUplink,
  currentUser
}) {
  const [showNewFlight, setShowNewFlight] = useState(false);
  const [draft, setDraft] = useState({
    callsign: '',
    flightNo: '',
    date: new Date().toISOString().slice(0, 10),
    dep: '',
    arr: '',
    alt: '',
    network: 'VATSIM',
    ac: ''
  });
  const [creating, setCreating] = useState(false);
  const [deleteArm, setDeleteArm] = useState(null);

  // SimBrief Auto-Uplink States
  const [uplinking, setUplinking] = useState(false);
  const [uplinkStatus, setUplinkStatus] = useState('');
  const [uplinkError, setUplinkError] = useState('');
  const [showSbPrompt, setShowSbPrompt] = useState(false);
  const [sbPromptUser, setSbPromptUser] = useState('');

  // Trigger auto-uplink if user came from Launchpad "⚡ Uplink SimBrief Flight"
  useEffect(() => {
    if (autoUplinkOnMount) {
      if (onClearAutoUplink) onClearAutoUplink();
      handleAutoUplinkSimbrief();
    }
  }, [autoUplinkOnMount]);

  // Main 1-Click Automated SimBrief Uplink Handler
  const handleAutoUplinkSimbrief = async (providedUser = null) => {
    setUplinkError('');
    const targetUser = (
      providedUser ||
      currentUser?.simbriefUser ||
      localStorage.getItem('flightdesk-sbuser') ||
      currentUser?.username ||
      ''
    ).trim();

    if (!targetUser) {
      setShowSbPrompt(true);
      return;
    }

    setUplinking(true);
    setUplinkStatus(`Connecting to SimBrief for pilot "${targetUser}"...`);

    try {
      localStorage.setItem('flightdesk-sbuser', targetUser);
      const ofpRes = await api.getSimbriefOFP(targetUser);

      if (!ofpRes || !ofpRes.d) {
        throw new Error('SimBrief returned no flight plan. Please generate an OFP on SimBrief first.');
      }

      const D = ofpRes.d;
      setUplinkStatus(`Uplinked: ${D.org} → ${D.dst} (${D.cs || D.fn}) · Matching aircraft...`);

      // Match aircraft in fleet by registration first, then ICAO
      const targetIcao = (D.acft || '').toUpperCase();
      const targetReg = (D.reg || '').toUpperCase();
      const matchedAc = fleet.find(a => 
        (targetReg && a.reg && a.reg.toUpperCase() === targetReg)
      ) || fleet.find(a =>
        (targetIcao && a.icao && a.icao.toUpperCase() === targetIcao) ||
        (targetIcao && a.tpl && a.tpl.toUpperCase() === targetIcao) ||
        (targetIcao && (a.variant || '').toUpperCase().includes(targetIcao))
      ) || fleet[0];

      const basePayload = {
        callsign: (D.cs || D.fn || 'SVA123').toUpperCase(),
        flightNo: (D.fn || D.cs || 'SV123').toUpperCase(),
        dep: (D.org || '').toUpperCase(),
        arr: (D.dst || '').toUpperCase(),
        alt: (D.alt || '').toUpperCase(),
        aircraft: matchedAc?.typeLabel || matchedAc?.variant || D.acft_name || D.acft,
        aircraftType: matchedAc?.icao || D.acft,
        date: new Date().toISOString().slice(0, 10),
        network: 'VATSIM',
        ac: matchedAc ? {
          ...matchedAc,
          reg: targetReg || matchedAc.reg
        } : null,
        aircraftId: matchedAc?.id
      };

      // Fully uplink and compute all section UTC times via applyOFPToFlight
      const flightPayload = applyOFPToFlight(basePayload, ofpRes, true);
      if (flightPayload.sb) flightPayload.sb.user = targetUser;

      setUplinkStatus(`Creating sector ${flightPayload.callsign} (${flightPayload.dep} → ${flightPayload.arr})...`);
      const created = await api.createFlight(flightPayload);
      if (onRefreshFlights) await onRefreshFlights();
      setShowNewFlight(false);
      setShowSbPrompt(false);
      onOpenFlight(created.id);
    } catch (err) {
      console.error('SimBrief Uplink Error:', err);
      setUplinkError(err.message || 'Failed to uplink flight from SimBrief');
    } finally {
      setUplinking(false);
    }
  };

  // Auto-Fill Form from SimBrief (for manual inspector)
  const handleAutoFillDraftFromSimbrief = async () => {
    const sbUser = (
      currentUser?.simbriefUser ||
      localStorage.getItem('flightdesk-sbuser') ||
      currentUser?.username ||
      ''
    ).trim();

    if (!sbUser) {
      setShowSbPrompt(true);
      return;
    }

    setUplinking(true);
    setUplinkError('');
    try {
      const ofpRes = await api.getSimbriefOFP(sbUser);
      if (ofpRes && ofpRes.d) {
        const D = ofpRes.d;
        const targetIcao = (D.acft || '').toUpperCase();
        const targetReg = (D.reg || '').toUpperCase();
        const matchedAc = fleet.find(a => 
          (a.icao && a.icao.toUpperCase() === targetIcao) ||
          (a.tpl && a.tpl.toUpperCase() === targetIcao) ||
          (a.reg && a.reg.toUpperCase() === targetReg)
        ) || fleet[0];

        setDraft(prev => ({
          ...prev,
          callsign: (D.cs || D.fn || prev.callsign).toUpperCase(),
          flightNo: (D.fn || D.cs || prev.flightNo).toUpperCase(),
          dep: (D.org || prev.dep).toUpperCase(),
          arr: (D.dst || prev.arr).toUpperCase(),
          alt: (D.alt || prev.alt).toUpperCase(),
          ac: matchedAc?.id || prev.ac
        }));
      }
    } catch (err) {
      setUplinkError('SimBrief Auto-Fill Error: ' + err.message);
    } finally {
      setUplinking(false);
    }
  };

  const handleToggleNewFlight = async () => {
    if (!showNewFlight) {
      try {
        const suggestion = await api.getSuggestedCallsign().catch(() => ({}));
        const defaultAc = fleet.find(a => a.id === suggestion.suggestedAcId)?.id || (fleet[0]?.id || '');
        setDraft({
          callsign: suggestion.suggestedCallsign || 'SVA123',
          flightNo: suggestion.suggestedFlightNo || 'SV123',
          date: new Date().toISOString().slice(0, 10),
          dep: suggestion.suggestedDep || 'OEJN',
          arr: suggestion.suggestedArr || 'OPKC',
          alt: '',
          network: 'VATSIM',
          ac: defaultAc
        });
      } catch (err) {
        setDraft(prev => ({ ...prev, ac: prev.ac || (fleet[0]?.id || '') }));
      }
      setShowNewFlight(true);
    } else {
      setShowNewFlight(false);
    }
  };

  const handleCreate = async () => {
    if (!draft.callsign.trim()) {
      alert('Please enter a callsign');
      return;
    }
    const selectedAc = fleet.find(a => a.id === draft.ac);
    if (!selectedAc) {
      alert('Please select an aircraft from the fleet');
      return;
    }

    setCreating(true);
    try {
      const newF = await api.createFlight({
        ...draft,
        callsign: draft.callsign.toUpperCase(),
        flightNo: draft.flightNo.toUpperCase(),
        dep: draft.dep.toUpperCase(),
        arr: draft.arr.toUpperCase(),
        alt: draft.alt.toUpperCase(),
        ac: selectedAc,
        aircraftId: selectedAc.id
      });
      setShowNewFlight(false);
      if (onRefreshFlights) await onRefreshFlights();
      onOpenFlight(newF.id);
    } catch (err) {
      alert('Failed to create flight: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (deleteArm === id) {
      try {
        await api.deleteFlight(id);
        setDeleteArm(null);
        if (onRefreshFlights) await onRefreshFlights();
      } catch (err) {
        alert('Could not delete flight');
      }
    } else {
      setDeleteArm(id);
      setTimeout(() => setDeleteArm(null), 4000);
    }
  };

  const selectedAc = fleet.find(a => a.id === draft.ac);

  return (
    <>
      <div className="fhead">
        <div>
          <p className="eyebrow">Flight Operations</p>
          <h1>Flights</h1>
        </div>
        <div className="row">
          <button 
            className="btn" 
            onClick={() => handleAutoUplinkSimbrief()}
            disabled={uplinking}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--accent)', color: 'var(--accent-ink)' }}
          >
            {uplinking ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Uplinking SimBrief...</span>
              </>
            ) : (
              <>
                <Zap size={15} />
                <span>Uplink From SimBrief</span>
              </>
            )}
          </button>
          <button className="btn ghost" onClick={handleToggleNewFlight}>
            {showNewFlight ? 'Close Form' : 'Manual Entry'}
          </button>
        </div>
      </div>

      {/* Live Uplink Status Ribbon */}
      {uplinking && (
        <div 
          className="banner" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            borderColor: 'var(--accent)', 
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            font: '600 13px var(--f-mono)' 
          }}
        >
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <span>{uplinkStatus || 'Uplinking latest flight plan from SimBrief...'}</span>
        </div>
      )}

      {/* Uplink Error Notification */}
      {uplinkError && (
        <div 
          className="banner" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            borderColor: 'var(--bad)', 
            background: 'var(--bad-soft)',
            color: 'var(--bad)',
            font: '500 13px var(--f-mono)' 
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{uplinkError}</span>
          <button 
            onClick={() => setUplinkError('')}
            style={{ background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SimBrief Username Prompt Modal if not yet known */}
      {showSbPrompt && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div 
            style={{
              background: 'rgba(14, 24, 38, 0.95)',
              backdropFilter: 'blur(28px)',
              border: '1px solid rgba(82, 199, 255, 0.3)',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: 24,
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setShowSbPrompt(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 0, color: 'var(--mute)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: 8, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Radio size={20} />
              </div>
              <div>
                <h3 style={{ font: '700 20px/1.1 var(--f-head)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--fg)' }}>
                  SimBrief Dispatch Uplink
                </h3>
                <p style={{ font: '500 11.5px var(--f-mono)', color: 'var(--mute)', marginTop: 2 }}>
                  Enter your SimBrief Username or Pilot ID to auto-import your latest OFP
                </p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (sbPromptUser.trim()) handleAutoUplinkSimbrief(sbPromptUser.trim()); }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', font: '700 11px var(--f-head)', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: 6 }}>
                  SimBrief Username or Pilot ID
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={sbPromptUser}
                  onChange={(e) => setSbPromptUser(e.target.value)}
                  placeholder="e.g. afnanmazhar12 or 341061"
                  style={{
                    width: '100%',
                    background: 'rgba(6, 12, 20, 0.7)',
                    border: '1px solid var(--line2)',
                    borderRadius: 8,
                    padding: '9px 12px',
                    font: '500 13px var(--f-mono)',
                    color: 'var(--fg)',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowSbPrompt(false)}
                  className="btn ghost sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!sbPromptUser.trim()}
                  className="btn sm"
                >
                  <Zap size={14} /> Uplink & Create Flight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual / Semi-Automated Flight Form */}
      {showNewFlight && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--line)' }}>
            <div>
              <b style={{ font: '700 16px var(--f-head)', letterSpacing: '.06em', textTransform: 'uppercase' }}>New Sector Creation</b>
              <p style={{ font: '500 11.5px var(--f-mono)', color: 'var(--mute)', margin: 0 }}>
                Prefill manually or click Auto-Fill from SimBrief to populate DEP, ARR, Route and Aircraft
              </p>
            </div>
            <button
              type="button"
              className="btn sm"
              onClick={handleAutoFillDraftFromSimbrief}
              disabled={uplinking}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0 }}
            >
              <Zap size={13} /> Auto-Fill From SimBrief
            </button>
          </div>

          <div className="form-grid">
            <label className="fld">
              <span>CALLSIGN</span>
              <input 
                value={draft.callsign}
                onChange={e => setDraft({ ...draft, callsign: e.target.value.toUpperCase() })}
                placeholder="SVA123" 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label className="fld">
              <span>FLIGHT NUMBER</span>
              <input 
                value={draft.flightNo}
                onChange={e => setDraft({ ...draft, flightNo: e.target.value.toUpperCase() })}
                placeholder="SV123" 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label className="fld">
              <span>DATE (UTC)</span>
              <input 
                type="date" 
                value={draft.date}
                onChange={e => setDraft({ ...draft, date: e.target.value })}
              />
            </label>
            <label className="fld">
              <span>FROM (DEP)</span>
              <input 
                value={draft.dep}
                onChange={e => setDraft({ ...draft, dep: e.target.value.toUpperCase() })}
                placeholder="OERK" 
                maxLength={4} 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label className="fld">
              <span>TO (ARR)</span>
              <input 
                value={draft.arr}
                onChange={e => setDraft({ ...draft, arr: e.target.value.toUpperCase() })}
                placeholder="OEMA" 
                maxLength={4} 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label className="fld">
              <span>ALTERNATE</span>
              <input 
                value={draft.alt}
                onChange={e => setDraft({ ...draft, alt: e.target.value.toUpperCase() })}
                placeholder="OEJN"
                maxLength={4} 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label className="fld">
              <span>NETWORK</span>
              <select 
                value={draft.network}
                onChange={e => setDraft({ ...draft, network: e.target.value })}
              >
                {['VATSIM', 'IVAO', 'Offline'].map(x => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="fld">
              <span>AIRCRAFT</span>
              {fleet.length ? (
                <select 
                  value={draft.ac}
                  onChange={e => setDraft({ ...draft, ac: e.target.value })}
                >
                  {fleet.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.reg} · {a.typeLabel}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="note" style={{ margin: 0 }}>No aircraft registered yet.</span>
              )}
            </label>
          </div>

          <div className="row" style={{ marginTop: 16 }}>
            {fleet.length ? (
              <button 
                className="btn" 
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'CREATE FLIGHT'}
              </button>
            ) : null}
            <button className="btn ghost" onClick={() => setShowNewFlight(false)}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Flights Table */}
      {flights && flights.length ? (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table className="ftable" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Callsign</th>
                <th>Route</th>
                <th>Aircraft</th>
                <th>Status</th>
                <th>Documents</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {flights.map(F => {
                const s = statusOf(F);
                return (
                  <tr 
                    key={F.id} 
                    className="hit" 
                    onClick={() => onOpenFlight(F.id)}
                  >
                    <td className="cs">{F.callsign || '—'}</td>
                    <td>
                      {F.dep || '----'} → {F.arr || '----'}
                      <br />
                      <span className="note" style={{ margin: 0 }}>{fmtDate(F.date)}</span>
                    </td>
                    <td>
                      {F.ac?.reg}
                      <br />
                      <span className="note" style={{ margin: 0 }}>{F.ac?.typeLabel}</span>
                    </td>
                    <td>
                      <span className={`pill ${statusCls(s)}`}>
                        {F.vatsimLive?.online ? '✈️ ' : ''}{s}
                      </span>
                      {F.vatsimLive?.online && F.vatsimLive?.gs != null && (
                        <span className="note" style={{ margin: '2px 0 0 0', display: 'block', fontSize: '11px', color: 'var(--accent)' }}>
                          {F.vatsimLive.gs} kt · {F.vatsimLive.alt} ft
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="dots" aria-label="Stages done">
                        {STAGES.map(([k]) => (
                          <i key={k} className={F.done && F.done[k] ? 'on' : ''}></i>
                        ))}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button 
                        className="btn sm danger" 
                        onClick={e => handleDelete(F.id, e)}
                      >
                        {deleteArm === F.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <Radio size={36} style={{ color: 'var(--accent)', marginBottom: 12 }} />
          <h3 style={{ font: '700 20px var(--f-head)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            No Flights Logged Yet
          </h3>
          <p style={{ font: '500 13px var(--f-mono)', color: 'var(--mute)', marginBottom: 16 }}>
            Ready for departure? Uplink your latest SimBrief flight plan in 1 click without typing DEP or ARR.
          </p>
          <button 
            className="btn" 
            onClick={() => handleAutoUplinkSimbrief()}
            disabled={uplinking}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Zap size={15} /> Uplink Flight From SimBrief
          </button>
        </div>
      )}
    </>
  );
}
