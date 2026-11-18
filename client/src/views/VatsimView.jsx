import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import VatsimRadarMap from '../components/VatsimRadarMap';

export default function VatsimView({ activeCallsign }) {
  const [callsign, setCallsign] = useState(activeCallsign || 'SVA123');
  const [pilotData, setPilotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copiedRoute, setCopiedRoute] = useState(false);
  const [viewMode, setViewMode] = useState('radar'); // 'radar' | 'embed'

  useEffect(() => {
    if (activeCallsign) {
      setCallsign(activeCallsign);
      lookupPilot(activeCallsign);
    } else {
      lookupPilot(callsign);
    }
  }, [activeCallsign]);

  // Auto-refresh timer every 15s
  useEffect(() => {
    if (!autoRefresh || !callsign) return;
    const interval = setInterval(() => {
      lookupPilot(callsign, true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, callsign]);

  const lookupPilot = async (cs, silent = false) => {
    const target = cs || callsign;
    if (!target.trim()) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await api.getVatsimPilot(target.trim());
      setPilotData(data);
    } catch (err) {
      setPilotData(null);
      setError(err.message || `No online pilot currently flying with callsign ${target} on VATSIM.`);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    lookupPilot(callsign);
  };

  const handleCopyRoute = () => {
    if (pilotData?.flight_plan?.route) {
      navigator.clipboard.writeText(pilotData.flight_plan.route);
      setCopiedRoute(true);
      setTimeout(() => setCopiedRoute(false), 2000);
    }
  };

  const vatradarUrl = `https://vatsim-radar.com/?callsign=${encodeURIComponent(callsign || pilotData?.callsign || '')}`;

  return (
    <>
      <div className="fhead">
        <div>
          <p className="eyebrow">VATSIM Live Network · Live Telemetry</p>
          <h1>VATSIM Radar</h1>
          <p className="lead">
            Real-time flight coordinates, filed flight plans, radar altitude, ground speed, squawk codes, and online ATC controllers.
          </p>
        </div>
        <div className="row">
          <button 
            className={`btn ${viewMode === 'radar' ? '' : 'ghost'}`} 
            onClick={() => setViewMode('radar')}
          >
            Radar Telemetry
          </button>
          <button 
            className={`btn ${viewMode === 'embed' ? '' : 'ghost'}`} 
            onClick={() => setViewMode('embed')}
          >
            vatsim-radar.com ↗
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="panel" style={{ marginBottom: 18 }}>
        <form onSubmit={handleSearch} className="form-grid" style={{ alignItems: 'flex-end' }}>
          <label className="fld">
            <span>Callsign to Track</span>
            <input 
              value={callsign}
              onChange={e => setCallsign(e.target.value.toUpperCase())}
              placeholder="SVA123" 
              style={{ textTransform: 'uppercase' }}
            />
          </label>
          <div className="row" style={{ height: 38, alignItems: 'center' }}>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Searching...' : 'Track Flight'}
            </button>
            <button 
              type="button" 
              className={`btn ${autoRefresh ? 'ghost' : 'ghost'}`} 
              onClick={() => setAutoRefresh(!autoRefresh)}
              title="Toggle automatic 15-second refresh"
            >
              {autoRefresh ? 'Auto 15s: ON' : 'Auto 15s: OFF'}
            </button>
          </div>
        </form>

        <div className="row" style={{ marginTop: 10, gap: 6 }}>
          <span className="lab" style={{ alignSelf: 'center' }}>Quick lookup:</span>
          {['SVA123', 'DLH1283', 'BAW117', 'UAE201', 'AAL100'].map(cs => (
            <button 
              key={cs} 
              type="button" 
              className="btn sm ghost" 
              onClick={() => {
                setCallsign(cs);
                lookupPilot(cs);
              }}
            >
              {cs}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'embed' ? (
        <div className="panel">
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="lab">Direct VATSIM Radar Embed</span>
            <a 
              className="btn sm ghost" 
              href={vatradarUrl} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Open in new tab ↗
            </a>
          </div>
          <iframe 
            src={vatradarUrl} 
            title="vatsim-radar.com" 
            style={{
              width: '100%',
              height: '75vh',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              background: '#0a1119'
            }} 
          />
        </div>
      ) : (
        <>
          {error && (
            <div className="empty-state" style={{ marginBottom: 18 }}>
              {error}
              <p className="note" style={{ marginTop: 8 }}>
                Check that the pilot is connected to the VATSIM network and squawking on their assigned transponder.
              </p>
            </div>
          )}

          {pilotData && (
            <article className="sheet" id="sheet" style={{ marginBottom: 20 }}>
              <header className="dh">
                <div>
                  <h2 className="dt">{pilotData.callsign} · LIVE TELEMETRY</h2>
                  <p className="ds">
                    {pilotData.flight_plan?.departure || '----'} → {pilotData.flight_plan?.arrival || '----'} · {pilotData.flight_plan?.aircraft_short || 'ACFT'} ({pilotData.flight_plan?.flight_rules || 'IFR'})
                  </p>
                </div>
                <span className="dbadge">
                  {pilotData.name || 'PILOT'} (CID: {pilotData.cid})
                </span>
              </header>

              <div className="sh" style={{ marginTop: 0 }}>LIVE TELEMETRY &amp; POSITION</div>
              <div className="g">
                <div className="cell">
                  <span className="lab">CURRENT ALTITUDE</span>
                  <span className="calc big">
                    {pilotData.telemetry?.altitude != null ? pilotData.telemetry.altitude.toLocaleString() + ' FT' : '—'}
                  </span>
                </div>
                <div className="cell">
                  <span className="lab">GROUND SPEED</span>
                  <span className="calc big">
                    {pilotData.telemetry?.groundspeed != null ? pilotData.telemetry.groundspeed + ' KTS' : '—'}
                  </span>
                </div>
                <div className="cell">
                  <span className="lab">HEADING</span>
                  <span className="calc big">
                    {pilotData.telemetry?.heading != null ? String(pilotData.telemetry.heading).padStart(3, '0') + '°' : '—'}
                  </span>
                </div>
                <div className="cell">
                  <span className="lab">SQUAWK</span>
                  <span className="calc big">
                    {pilotData.telemetry?.transponder || '2000'}
                  </span>
                </div>
                <div className="cell">
                  <span className="lab">COORDINATES</span>
                  <span className="calc">
                    {pilotData.telemetry?.latitude?.toFixed(4)}°, {pilotData.telemetry?.longitude?.toFixed(4)}°
                  </span>
                </div>
                <div className="cell">
                  <span className="lab">FILED CRUISE</span>
                  <span className="calc">
                    FL{pilotData.flight_plan?.altitude || '---'} ({pilotData.flight_plan?.tas || '---'} KT)
                  </span>
                </div>
              </div>

              {pilotData.flight_plan?.route && (
                <>
                  <div className="sh">
                    FILED FLIGHT PLAN &amp; ROUTE
                    <button 
                      type="button" 
                      className="btn sm ghost" 
                      onClick={handleCopyRoute}
                      style={{ textTransform: 'none' }}
                    >
                      {copiedRoute ? '✓ Copied' : 'Copy Route'}
                    </button>
                  </div>
                  <p className="calc" style={{ margin: '12px 0', wordBreak: 'break-word', fontSize: 13 }}>
                    {pilotData.flight_plan.route}
                  </p>
                </>
              )}

              {/* Online ATC Controllers covering sector */}
              {pilotData.atcCoverage && pilotData.atcCoverage.length > 0 && (
                <>
                  <div className="sh">
                    ONLINE ATC STATIONS COVERING SECTOR
                    <small>{pilotData.atcCoverage.length} stations</small>
                  </div>
                  <div className="tw">
                    <table className="t" style={{ minWidth: 640 }}>
                      <thead>
                        <tr>
                          <th>FACILITY / STATION</th>
                          <th>CALLSIGN</th>
                          <th>FREQUENCY</th>
                          <th>CONTROLLER NAME</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pilotData.atcCoverage.map((c, i) => (
                          <tr key={i}>
                            <td className="lbl"><b>{c.type || 'CONTROL'}</b></td>
                            <td className="cs">{c.callsign}</td>
                            <td><b className="calc" style={{ fontSize: 14 }}>{c.frequency}</b></td>
                            <td>{c.name || 'Controller'} (CID: {c.cid})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Leaflet CartoDB Dark Matter Radar Map */}
              <div className="sh">LIVE RADAR MAP</div>
              <div style={{ marginTop: 10 }}>
                <VatsimRadarMap pilotData={pilotData} callsign={callsign} />
              </div>

              <div className="foot">
                <span>DATA SOURCE: DATA.VATSIM.NET V3</span>
                <span>VATSIM LIVE RADAR TELEMETRY</span>
              </div>
            </article>
          )}
        </>
      )}
    </>
  );
}
