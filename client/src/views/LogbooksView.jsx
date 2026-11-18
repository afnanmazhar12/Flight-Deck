import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
  return m ? `${+m[3]} ${MON[+m[2] - 1]} ${m[1]}` : (d || '');
}

function hm(m) {
  if (m == null || isNaN(m)) return '—';
  const mins = Math.round(m);
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
}

function f0(x) {
  const num = parseFloat(x);
  return isFinite(num) ? Math.round(num).toLocaleString('en-US') : '—';
}

function touchdownCls(rate) {
  const r = Math.abs(parseFloat(rate));
  if (isNaN(r) || !rate) return '';
  if (r <= 120) return 'ok'; // Butter
  if (r <= 240) return 'acc'; // Firm
  if (r <= 400) return 'warn'; // Hard
  return 'bad'; // Structural check
}

function touchdownLabel(rate) {
  const r = Math.abs(parseFloat(rate));
  if (isNaN(r) || !rate) return '';
  if (r <= 120) return '🧈 Butter';
  if (r <= 240) return 'Firm';
  if (r <= 400) return 'Hard';
  return 'High Impact';
}

export default function LogbooksView({ mongoStatus }) {
  const [logbooks, setLogbooks] = useState([]);
  const [stats, setStats] = useState({ totalFlights: 0, totalAirTime: 0, totalBlockTime: 0, avgLandingRate: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState(null);

  useEffect(() => {
    fetchLogbooks();
  }, []);

  const fetchLogbooks = async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.all([
        api.getLogbooks().catch(() => []),
        api.getLogbookStats().catch(() => ({ totalFlights: 0, totalAirTime: 0, totalBlockTime: 0, avgLandingRate: 0 }))
      ]);
      setLogbooks(list);
      setStats(st);
    } catch (err) {
      console.error('Failed to load logbooks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!logbooks.length) {
      alert('No logbook records to export');
      return;
    }
    const headers = ['Date', 'Callsign', 'FlightNo', 'Dep', 'Arr', 'AircraftReg', 'AircraftType', 'BlockTimeMins', 'AirTimeMins', 'FuelBurnKg', 'LandingRateFpm', 'Runway', 'Stand', 'PIC', 'Network'];
    const rows = logbooks.map(l => [
      l.date || '',
      l.callsign || '',
      l.flightNo || '',
      l.dep || '',
      l.arr || '',
      l.aircraft?.reg || '',
      l.aircraft?.typeLabel || '',
      l.blockTime || '',
      l.airTime || '',
      l.fuelBurned || '',
      l.landingRate || '',
      l.landingRunway || '',
      l.arrivalStand || '',
      `"${(l.pic || '').replace(/"/g, '""')}"`,
      l.network || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flightdesk-logbook-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="fhead">
        <div>
          <p className="eyebrow">Electronic Flight Bag · MongoDB Atlas</p>
          <h1>Logbooks</h1>
          <p className="lead">
            Permanent sector archive synced directly with your MongoDB database. {logbooks.length} flight sector{logbooks.length === 1 ? '' : 's'} recorded.
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={handleExportCSV}>Export CSV</button>
          <button className="btn ghost" onClick={fetchLogbooks}>Refresh</button>
        </div>
      </div>

      {/* Summary Sequence Grid */}
      <div className="seq">
        <div>
          <em>01</em>
          <b>{stats.totalFlights || logbooks.length}</b>
          <span>Completed sectors</span>
        </div>
        <div>
          <em>02</em>
          <b>{stats.totalAirTime ? (stats.totalAirTime / 60).toFixed(1) + ' hrs' : '0.0 hrs'}</b>
          <span>Total airborne time</span>
        </div>
        <div>
          <em>03</em>
          <b>{stats.totalBlockTime ? (stats.totalBlockTime / 60).toFixed(1) + ' hrs' : '0.0 hrs'}</b>
          <span>Total block time</span>
        </div>
        <div>
          <em>04</em>
          <b>{stats.avgLandingRate ? stats.avgLandingRate + ' FPM' : '—'}</b>
          <span>
            {stats.avgLandingRate ? (
              <span className={`pill ${touchdownCls(stats.avgLandingRate)}`} style={{ marginLeft: 4 }}>
                {touchdownLabel(stats.avgLandingRate)}
              </span>
            ) : 'Average touchdown'}
          </span>
        </div>
      </div>

      {/* Detail Modal / Sheet when sector selected */}
      {selectedSector && (
        <article className="sheet" id="sheet" style={{ marginTop: 22, marginBottom: 22 }}>
          <header className="dh">
            <div>
              <h2 className="dt">SECTOR ARCHIVE: {selectedSector.callsign || selectedSector.flightNo}</h2>
              <p className="ds">
                {selectedSector.dep} → {selectedSector.arr} · {selectedSector.aircraft?.reg} ({selectedSector.aircraft?.typeLabel})
              </p>
            </div>
            <button className="btn ghost sm" onClick={() => setSelectedSector(null)}>Close</button>
          </header>

          <div className="sh" style={{ marginTop: 0 }}>FLIGHT SUMMARY</div>
          <div className="g">
            <div className="cell"><span className="lab">DATE</span><span className="calc">{fmtDate(selectedSector.date)}</span></div>
            <div className="cell"><span className="lab">ROUTE</span><span className="calc">{selectedSector.dep} → {selectedSector.arr}</span></div>
            <div className="cell"><span className="lab">NETWORK</span><span className="calc">{selectedSector.network || 'VATSIM'}</span></div>
            <div className="cell"><span className="lab">AIRCRAFT</span><span className="calc">{selectedSector.aircraft?.reg} · {selectedSector.aircraft?.icao}</span></div>
          </div>

          <div className="sh">HOURS &amp; FUEL</div>
          <div className="g">
            <div className="cell"><span className="lab">BLOCK TIME</span><span className="calc big">{hm(selectedSector.blockTime)}</span></div>
            <div className="cell"><span className="lab">AIR TIME</span><span className="calc big">{hm(selectedSector.airTime)}</span></div>
            <div className="cell"><span className="lab">FUEL BURNED</span><span className="calc big">{f0(selectedSector.fuelBurned)} KG</span></div>
            <div className="cell"><span className="lab">TOUCHDOWN</span><span className={`pill ${touchdownCls(selectedSector.landingRate)}`}>{selectedSector.landingRate ? selectedSector.landingRate + ' FPM (' + touchdownLabel(selectedSector.landingRate) + ')' : '—'}</span></div>
            <div className="cell"><span className="lab">LANDING RUNWAY</span><span className="calc">{selectedSector.landingRunway || '—'}</span></div>
            <div className="cell"><span className="lab">ARRIVAL STAND</span><span className="calc">{selectedSector.arrivalStand || '—'}</span></div>
          </div>

          {selectedSector.notes && (
            <>
              <div className="sh">DEBRIEF &amp; CREW NOTES</div>
              <p className="note" style={{ color: 'var(--fg)', fontFamily: 'var(--f-mono)' }}>
                {selectedSector.notes}
              </p>
            </>
          )}

          <div className="foot">
            <span>MONGODB RECORD ID: {selectedSector._id || selectedSector.id}</span>
            <span>ARCHIVED SECTOR</span>
          </div>
        </article>
      )}

      <h2 className="sec">Archived flight sectors</h2>
      {loading ? (
        <div className="empty-state">Loading logbooks from MongoDB...</div>
      ) : logbooks.length ? (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table className="ftable" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Callsign / Flt</th>
                <th>Route</th>
                <th>Aircraft</th>
                <th>Block</th>
                <th>Air</th>
                <th>Fuel Burn</th>
                <th>Touchdown</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logbooks.map(L => (
                <tr key={L._id || L.id} className="hit" onClick={() => setSelectedSector(L)}>
                  <td>{fmtDate(L.date)}</td>
                  <td className="cs">{L.callsign || L.flightNo || '—'}</td>
                  <td><b>{L.dep || '----'}</b> → <b>{L.arr || '----'}</b></td>
                  <td>
                    {L.aircraft?.reg || '—'}
                    <br />
                    <span className="note" style={{ margin: 0 }}>{L.aircraft?.typeLabel || ''}</span>
                  </td>
                  <td><span className="calc">{hm(L.blockTime)}</span></td>
                  <td><span className="calc">{hm(L.airTime)}</span></td>
                  <td><span className="calc">{L.fuelBurned ? f0(L.fuelBurned) + ' kg' : '—'}</span></td>
                  <td>
                    {L.landingRate ? (
                      <span className={`pill ${touchdownCls(L.landingRate)}`}>
                        {L.landingRate} FPM
                      </span>
                    ) : '—'}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn sm ghost" onClick={() => setSelectedSector(L)}>
                      View Sheet
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          No archived sectors in MongoDB yet. Once you fly a sector and click "Complete flight &amp; archive" on Stage 8 (Postflight), it will appear here permanently.
        </div>
      )}
    </>
  );
}
