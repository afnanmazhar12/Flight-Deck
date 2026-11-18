import React, { useState } from 'react';
import { CATALOG } from '../data/catalog';
import { PRESETS } from '../data/presets';
import { api } from '../services/api';

export default function FleetView({ fleet, onOpenAircraft, onRefreshFleet }) {
  const [showNewAc, setShowNewAc] = useState(false);
  const [draft, setDraft] = useState({
    reg: '',
    ti: '0', // Boeing 777
    vi: '4', // 777-300ER
    operator: 'Saudia',
    serial: '',
    engine: 'GE90-115B',
    base: 'OEJN'
  });
  const [creating, setCreating] = useState(false);

  const selectedCat = CATALOG[+draft.ti] || CATALOG[0];
  const selectedVar = selectedCat.vars[+draft.vi] || selectedCat.vars[0];

  const handleRegister = async () => {
    if (!draft.reg.trim()) {
      alert('Enter a registration');
      return;
    }
    const cleanReg = draft.reg.trim().toUpperCase();
    if (fleet.some(a => a.reg === cleanReg)) {
      alert('That registration is already in the fleet');
      return;
    }

    setCreating(true);
    try {
      const tpl = selectedCat.tpl;
      const P = PRESETS[tpl];
      const isExact = selectedVar.l === P.exact;

      const newAircraftData = {
        reg: cleanReg,
        make: selectedCat.make,
        group: selectedCat.g,
        variant: selectedVar.l,
        typeLabel: `${selectedCat.make} ${selectedVar.l}`,
        icao: selectedVar.i,
        tpl,
        exact: isExact,
        operator: draft.operator || '',
        serial: draft.serial || '',
        engine: draft.engine || '',
        base: draft.base.toUpperCase() || '',
        config: isExact ? P.config : '',
        bew: '',
        taxiFuel: String(P.taxi),
        fuelCap: isExact ? String(P.fuelCap) : '',
        limits: isExact ? {
          mrw: String(P.limits.mrw),
          mtow: String(P.limits.mtow),
          mlw: String(P.limits.mlw),
          mzfw: String(P.limits.mzfw)
        } : { mrw: '', mtow: '', mlw: '', mzfw: '' },
        tanks: (P.tanks || []).map(t => ({ name: t.name, max: isExact ? String(t.max || '') : '' })),
        holds: (P.holds || []).map(h => ({ name: h.name, limit: isExact ? String(h.limit || '') : '', group: h.group })),
        zones: (P.zones || []).map(z => ({ name: z.name })),
        history: [
          { flt: 'EWG6892', pilot: 'Francesco', dep: 'LEPA', arr: 'EDDM', when: '3 days ago', dur: '1:48', remarks: 'Lav 2 smoke detector fault at boarding. Reset, did not recur.' },
          { flt: 'EWG6839', pilot: 'Karl S.', dep: 'EDLP', arr: 'LEPA', when: '9 days ago', dur: '1:57', remarks: 'Cabin reading light row 14 inop. Cabin log entry made.' },
          { flt: 'EWG9823', pilot: 'Max', dep: 'LIMC', arr: 'EDDL', when: '26 days ago', dur: '1:19', remarks: 'IRS 2 alignment slow at start-up. Cleared after re-align.' },
          { flt: 'EWG9822', pilot: 'Christian', dep: 'EDDL', arr: 'LIMC', when: '2 months ago', dur: '1:13', remarks: 'Nil defects. Aircraft serviceable.' },
          { flt: 'EWG9845', pilot: 'Tobias K.', dep: 'LIEO', arr: 'EDDL', when: '4 months ago', dur: '1:42', remarks: 'Brake temps high after taxi-in. Cooled normally, no further action.' },
          { flt: 'EWG9844', pilot: 'Matteo', dep: 'EDDL', arr: 'LIEO', when: '5 months ago', dur: '1:41', remarks: 'Nose wheel steering caution at pushback. Cleared after reset.' },
          { flt: 'EWG9009', pilot: 'Matteo', dep: 'EDXW', arr: 'EDDL', when: '6 months ago', dur: '0:50', remarks: 'IRS 2 alignment slow at start-up. Cleared after re-align.' }
        ],
        historyAt: Date.now(),
        airframeHrs: '0',
        landings: '0',
        eng1Hrs: '0',
        eng2Hrs: '0',
        apuHrs: '0',
        notes: '',
        insp: [
          { check: 'A-Check', interval: '500 HRS', last: '', next: '', rem: '', status: 'Active' },
          { check: 'C-Check', interval: '6000 HRS', last: '', next: '', rem: '', status: 'Active' },
          { check: 'Daily / Transit Check', interval: '48 HRS', last: '', next: '', rem: '', status: 'Active' }
        ],
        ads: [],
        life: [],
        audit: { sig: '', qa: '', cert: '' }
      };

      const created = await api.createAircraft(newAircraftData);
      setShowNewAc(false);
      if (onRefreshFleet) await onRefreshFleet();
      onOpenAircraft(created.id);
    } catch (err) {
      alert('Failed to register aircraft: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // Group fleet by make or group
  const groups = {};
  (fleet || []).forEach(a => {
    const g = a.group || a.make || 'Other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(a);
  });

  return (
    <>
      <div className="fhead">
        <div>
          <p className="eyebrow">Registry</p>
          <h1>Fleet</h1>
        </div>
        <button 
          className="btn" 
          onClick={() => setShowNewAc(!showNewAc)}
        >
          {showNewAc ? 'Close' : 'Register aircraft'}
        </button>
      </div>

      {showNewAc && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <div className="form-grid">
            <label className="fld">
              <span>Registration</span>
              <input 
                value={draft.reg}
                onChange={e => setDraft({ ...draft, reg: e.target.value.toUpperCase() })}
                placeholder="HZ-AK11" 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label className="fld">
              <span>Aircraft type</span>
              <select 
                value={draft.ti}
                onChange={e => setDraft({ ...draft, ti: e.target.value, vi: '0' })}
              >
                {CATALOG.map((c, i) => (
                  <option key={i} value={i}>{c.g}</option>
                ))}
              </select>
            </label>
            <label className="fld">
              <span>Variant</span>
              <select 
                value={draft.vi}
                onChange={e => setDraft({ ...draft, vi: e.target.value })}
              >
                {selectedCat.vars.map((v, i) => (
                  <option key={i} value={i}>{v.l} ({v.i})</option>
                ))}
              </select>
            </label>
            <label className="fld">
              <span>Operator</span>
              <input 
                value={draft.operator}
                onChange={e => setDraft({ ...draft, operator: e.target.value })}
                placeholder="Airline or VA"
              />
            </label>
            <label className="fld">
              <span>Serial number (MSN)</span>
              <input 
                value={draft.serial}
                onChange={e => setDraft({ ...draft, serial: e.target.value })}
                placeholder="41523"
              />
            </label>
            <label className="fld">
              <span>Engine type</span>
              <input 
                value={draft.engine}
                onChange={e => setDraft({ ...draft, engine: e.target.value })}
                placeholder="GE90 / CFM56 / Trent"
              />
            </label>
            <label className="fld">
              <span>Home base</span>
              <input 
                value={draft.base}
                onChange={e => setDraft({ ...draft, base: e.target.value.toUpperCase() })}
                maxLength={4} 
                style={{ textTransform: 'uppercase' }}
                placeholder="OEJN"
              />
            </label>
          </div>

          <p className="note" style={{ marginTop: 12 }}>
            Weight limits, fuel tanks and cargo holds are filled in automatically for the 777-300ER, 737-800 and A320-200. Every other variant starts with the matching form layout and standard presets. You can customize limits on the aircraft page.
          </p>

          <div className="row" style={{ marginTop: 14 }}>
            <button 
              className="btn" 
              onClick={handleRegister}
              disabled={creating}
            >
              {creating ? 'Registering...' : 'Register aircraft'}
            </button>
            <button className="btn ghost" onClick={() => setShowNewAc(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {fleet && fleet.length ? (
        Object.keys(groups).sort().map(g => (
          <React.Fragment key={g}>
            <h2 className="sec">{g}</h2>
            <div className="cards">
              {groups[g].map(a => (
                <button 
                  key={a.id} 
                  className="card" 
                  onClick={() => onOpenAircraft(a.id)}
                >
                  <span className="reg">{a.reg}</span>
                  <span>{a.typeLabel}</span>
                  <span className="meta">
                    {a.operator || 'No operator set'}{a.base ? ` · ${a.base}` : ''}
                  </span>
                  <span className="meta">
                    {a.airframeHrs || '0'} airframe hrs · {a.landings || '0'} landings
                  </span>
                </button>
              ))}
            </div>
          </React.Fragment>
        ))
      ) : (
        <div className="empty-state">
          No aircraft registered yet. Click "Register aircraft" above to add your first plane to the hangar.
        </div>
      )}
    </>
  );
}
