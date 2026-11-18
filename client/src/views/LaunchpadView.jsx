import React from 'react';

const LINKS = [
  { code: 'SB', phase: 'Plan', name: 'SimBrief Dispatch', desc: 'Your latest briefing and flight plan.', url: 'https://dispatch.simbrief.com/briefing/latest' },
  { code: 'SN', phase: 'Plan', name: 'SkyNexus', desc: 'CPL, departure planning and NOTAMs.', url: 'https://app.skynexus.nl/dashboard/dep' },
  { code: 'VD', phase: 'Ground', name: 'VDGS Spain', desc: 'Docking guidance lookup by callsign.', url: 'https://vdgs.vatsimspain.es/vdgs/getCallsignResult.php' },
  { code: 'VR', phase: 'Fly', name: 'VATSIM Radar', desc: 'Live traffic and ATC coverage.', url: 'https://vatsim-radar.com/' },
  { code: 'CP', phase: 'Fly', name: 'FSM CPDLC', desc: 'Datalink logon and controller messages.', url: 'https://fsm.vsrsoftware.com/#' },
  { code: 'SA', phase: 'Airline', name: 'Star Alliance Virtual', desc: 'Your virtual airline.', url: 'https://staralliancevirtual.org/' }
];

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

const STAGE_NOTE = {
  pre: 'Brief, plan and check',
  sb: 'OFP data and PDF',
  tech: 'Release the aircraft',
  fuel: 'Record the uplift',
  load: 'Weights and trim',
  comms: 'Log every handoff',
  times: 'Planned vs actual, delay',
  post: 'Close out the sector'
};

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

export default function LaunchpadView({ flights, fleet, onNewFlight, onOpenFlight, setView, onExportBackup, onImportBackup }) {
  const open = (flights || []).filter(F => !(F.post && F.post.completed)).slice(0, 5);
  const na = (fleet || []).length;
  const nf = (flights || []).length;

  const handleExport = () => {
    const data = JSON.stringify({
      app: 'flight-desk',
      version: 1,
      exported: new Date().toISOString(),
      fleet,
      flights
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flight-desk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (onImportBackup) onImportBackup(file);
    e.target.value = '';
  };

  return (
    <>
      <div className="fhead">
        <div>
          <p className="eyebrow">Flight Desk</p>
          <h1>Next sector</h1>
          <p className="lead">
            Your planning sites, then your flight documents in the order you fly them. {na} aircraft registered, {nf} flight{nf === 1 ? '' : 's'} on file.
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => onNewFlight(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span>⚡ Uplink SimBrief Flight</span>
          </button>
          <button className="btn ghost" onClick={() => onNewFlight(false)}>Manual Flight</button>
          <button className="btn ghost" onClick={() => setView('fleet')}>Fleet</button>
        </div>
      </div>

      <h2 className="sec">Launchpad</h2>
      <div className="tiles">
        {LINKS.map(l => {
          let host = '';
          try { host = new URL(l.url).host; } catch (e) {}
          return (
            <a 
              key={l.code} 
              className="tile" 
              href={l.url} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <span className="gate" aria-hidden="true">{l.code}</span>
              <span className="tbody">
                <span className="phase">{l.phase}</span>
                <strong>{l.name}</strong>
                <span className="tdesc">{l.desc}</span>
              </span>
              <span className="thost">
                <span>{host}</span>
                <i aria-hidden="true">↗</i>
              </span>
            </a>
          );
        })}
      </div>
      <p className="note">These sites open in a new tab. They block embedding, so they cannot sit inside this page.</p>

      <h2 className="sec">Open flights</h2>
      {open.length ? (
        <div className="panel">
          <table className="ftable">
            <thead>
              <tr>
                <th>Callsign</th>
                <th>Route</th>
                <th>Aircraft</th>
                <th>Status</th>
                <th>Documents</th>
              </tr>
            </thead>
            <tbody>
              {open.map(F => {
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          {na ? 'No open flights. Start one and the documents are ready in order.' : 'Register an aircraft first, then start a flight.'}
          <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
            {na ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn" onClick={() => onNewFlight(true)}>⚡ Uplink From SimBrief</button>
                <button className="btn ghost" onClick={() => onNewFlight(false)}>Manual Flight</button>
              </div>
            ) : (
              <button className="btn" onClick={() => setView('fleet')}>Register aircraft</button>
            )}
          </div>
        </div>
      )}

      <h2 className="sec">Document sequence</h2>
      <div className="seq">
        {STAGES.map(([k, l], i) => (
          <div key={k}>
            <em>{i + 1}</em>
            <b>{l}</b>
            <span>{STAGE_NOTE[k]}</span>
          </div>
        ))}
      </div>

      <h2 className="sec">Backup</h2>
      <div className="row">
        <button className="btn ghost" onClick={handleExport}>Export backup</button>
        <label className="btn ghost" style={{ cursor: 'pointer' }}>
          Import backup
          <input type="file" id="imp" accept=".json,application/json" hidden onChange={handleImportFile} />
        </label>
        <span className="note" style={{ margin: 0 }}>Everything is saved automatically to MongoDB Atlas. A backup file is optional.</span>
      </div>
    </>
  );
}
