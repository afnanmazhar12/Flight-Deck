import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

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

function statusOf(F) {
  if (F.post && F.post.completed) return 'Completed';
  const d = F.done || {};
  if (d.comms) return 'Postflight';
  if (d.load || d.fuel || d.tech) return 'Ground';
  if (d.pre) return 'Briefed';
  return 'Planning';
}

function statusCls(s) {
  return s === 'Completed' ? 'ok' : s === 'Planning' ? '' : 'acc';
}

export default function FlightsView({ flights, fleet, onOpenFlight, onRefreshFlights }) {
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

  // Auto-fetch callsign suggestion when opening the new flight form
  const handleToggleNewFlight = async () => {
    if (!showNewFlight) {
      // open
      try {
        const suggestion = await api.suggestCallsign();
        const defaultAc = fleet.find(a => a.id === suggestion.suggestedAcId)?.id || fleet.find(a => a.reg === 'D-ABNL')?.id || (fleet[0]?.id || '');
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
        setDraft(prev => ({
          ...prev,
          ac: prev.ac || (fleet[0]?.id || '')
        }));
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
      setTimeout(() => {
        setDeleteArm(null);
      }, 4000);
    }
  };

  const selectedAc = fleet.find(a => a.id === draft.ac);

  return (
    <>
      <div className="fhead">
        <div>
          <p className="eyebrow">Logbook</p>
          <h1>Flights</h1>
        </div>
        <button className="btn" onClick={handleToggleNewFlight}>
          NEW FLIGHT
        </button>
      </div>

      {showNewFlight && (
        <div className="panel" style={{ marginBottom: 18 }}>
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
              <span>FROM</span>
              <input 
                value={draft.dep}
                onChange={e => setDraft({ ...draft, dep: e.target.value.toUpperCase() })}
                placeholder="OEJN" 
                maxLength={4} 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label className="fld">
              <span>TO</span>
              <input 
                value={draft.arr}
                onChange={e => setDraft({ ...draft, arr: e.target.value.toUpperCase() })}
                placeholder="OPKC" 
                maxLength={4} 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label className="fld">
              <span>ALTERNATE</span>
              <input 
                value={draft.alt}
                onChange={e => setDraft({ ...draft, alt: e.target.value.toUpperCase() })}
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

          {/* Star Alliance Virtual Recent Flights Preview for selected aircraft */}
          {selectedAc && selectedAc.history && selectedAc.history.length > 0 && (
            <div className="hist" style={{ marginTop: 16 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b className="lab" style={{ fontSize: 13 }}>
                  LAST 7 FLIGHTS · {selectedAc.reg}
                </b>
                <span className="note" style={{ margin: 0 }}>
                  as of 17 Nov 2026
                </span>
              </div>

              <div className="tw" style={{ marginTop: 8 }}>
                <table className="t" style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th>FLT #</th>
                      <th>PILOT</th>
                      <th>DEP</th>
                      <th>ARR</th>
                      <th>WHEN</th>
                      <th>TIME</th>
                      <th>REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAc.history.slice(0, 7).map((r, i) => (
                      <tr key={i}>
                        <td><b>{r.flt}</b></td>
                        <td>{r.pilot}</td>
                        <td>{r.dep}</td>
                        <td>{r.arr}</td>
                        <td>{r.when}</td>
                        <td>{r.dur}</td>
                        <td>{r.remarks || 'Nil defects. Aircraft serviceable.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 8 }}>
                <span className="note" style={{ cursor: 'pointer', margin: 0 }}>▶ Update from Star Alliance Virtual</span>
              </div>
            </div>
          )}

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
                      <span className={`pill ${statusCls(s)}`}>{s}</span>
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
        <div className="empty-state">No flights yet.</div>
      )}
    </>
  );
}
