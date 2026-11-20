import React, { useState } from 'react';
import { CATALOG } from '../data/catalog';
import { PRESETS, getAircraftSpec } from '../data/presets';
import { api } from '../services/api';
import { generateAirframeHistory, detectAirlineInfo } from '../services/airframeTechService';

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
  const currentSpec = getAircraftSpec(selectedCat, selectedVar);

  const handleTypeChange = (newTi) => {
    const cat = CATALOG[+newTi] || CATALOG[0];
    const v = cat.vars[0];
    const spec = getAircraftSpec(cat, v);
    setDraft(prev => ({
      ...prev,
      ti: newTi,
      vi: '0',
      engine: spec.defaultEngine || prev.engine
    }));
  };

  const handleVariantChange = (newVi) => {
    const v = selectedCat.vars[+newVi] || selectedCat.vars[0];
    const spec = getAircraftSpec(selectedCat, v);
    setDraft(prev => ({
      ...prev,
      vi: newVi,
      engine: spec.defaultEngine || prev.engine
    }));
  };

  const handleRegChange = (val) => {
    const cleanReg = val.toUpperCase();
    const carrier = detectAirlineInfo({ reg: cleanReg }, {});
    setDraft(prev => ({
      ...prev,
      reg: cleanReg,
      operator: prev.operator === 'Saudia' || !prev.operator ? carrier.name : prev.operator,
      base: prev.base === 'OEJN' || !prev.base ? carrier.hub : prev.base
    }));
  };

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
      const spec = getAircraftSpec(selectedCat, selectedVar);
      const carrier = detectAirlineInfo({ reg: cleanReg, operator: draft.operator }, {});

      const newAircraftData = {
        reg: cleanReg,
        make: selectedCat.make,
        group: selectedCat.g,
        variant: selectedVar.l,
        typeLabel: `${selectedCat.make} ${selectedVar.l}`,
        icao: selectedVar.i,
        tpl: selectedCat.tpl,
        exact: true,
        operator: draft.operator || carrier.name,
        serial: draft.serial || String(10000 + Math.floor(Math.random() * 89999)),
        engine: draft.engine || spec.defaultEngine || 'Turbofan',
        base: (draft.base || carrier.hub).toUpperCase(),
        config: spec.config,
        bew: String(Math.round(Number(spec.limits.mzfw) * 0.62)),
        taxiFuel: String(spec.taxi),
        fuelCap: String(spec.fuelCap),
        limits: {
          mrw: String(spec.limits.mrw),
          mtow: String(spec.limits.mtow),
          mlw: String(spec.limits.mlw),
          mzfw: String(spec.limits.mzfw)
        },
        tanks: (spec.tanks || []).map(t => ({ name: t.name, max: String(t.max || '') })),
        holds: (spec.holds || []).map(h => ({ name: h.name, limit: String(h.limit || ''), group: h.group })),
        zones: (spec.zones || []).map(z => ({ name: z.name })),
        history: generateAirframeHistory({ reg: cleanReg, operator: draft.operator, variant: selectedVar.l, group: selectedCat.g, icao: selectedVar.i }, {}, 7).map(s => ({
          flt: s.fltNo,
          pilot: s.pic,
          dep: s.dep,
          arr: s.arr,
          when: `${s.date}`,
          dur: s.dur,
          remarks: s.remarks,
          fr24Url: s.fr24Url
        })),
        historyAt: Date.now(),
        airframeHrs: String(Math.floor(1200 + Math.random() * 15000) + '.4'),
        landings: String(Math.floor(350 + Math.random() * 4000)),
        eng1Hrs: String(Math.floor(1200 + Math.random() * 15000) + '.4'),
        eng2Hrs: String(Math.floor(1200 + Math.random() * 15000) + '.4'),
        apuHrs: String(Math.floor(900 + Math.random() * 8000) + '.0'),
        notes: `Registered under ${carrier.authority || 'Aviation Authority'} - ${carrier.amo || 'Line Maintenance'}`,
        insp: [
          { check: 'A-Check', interval: '600 HRS', last: '120.0 HRS', next: '720.0 HRS', rem: '480.0 HRS', status: 'Active' },
          { check: 'C-Check', interval: '6000 HRS', last: '2400 HRS', next: '6000 HRS', rem: '3600 HRS', status: 'Active' },
          { check: 'Daily / Transit Check', interval: '48 HRS', last: 'Yesterday', next: 'Today', rem: 'Valid', status: 'Active' }
        ],
        ads: [],
        life: [],
        audit: { sig: `${carrier.licencePrefix}-88201`, qa: `CERT-QA-${cleanReg}`, cert: `${carrier.hub}-MRO` }
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
                onChange={e => handleRegChange(e.target.value)}
                placeholder="HZ-AK2" 
                style={{ textTransform: 'uppercase' }}
              />
            </label>
            <label className="fld">
              <span>Aircraft type</span>
              <select 
                value={draft.ti}
                onChange={e => handleTypeChange(e.target.value)}
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
                onChange={e => handleVariantChange(e.target.value)}
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
                placeholder="GE90 / CFM56 / Trent / GEnx"
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

          <div className="row" style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, fontSize: '12px', gap: 16 }}>
            <span><strong>MTOW:</strong> {Number(currentSpec.limits.mtow).toLocaleString()} kg</span>
            <span><strong>MZFW:</strong> {Number(currentSpec.limits.mzfw).toLocaleString()} kg</span>
            <span><strong>Max Fuel:</strong> {Number(currentSpec.fuelCap).toLocaleString()} kg</span>
            <span><strong>Tanks:</strong> {(currentSpec.tanks || []).length}</span>
            <span><strong>Holds:</strong> {(currentSpec.holds || []).length}</span>
            <span><strong>Config:</strong> {currentSpec.config}</span>
          </div>

          <p className="note" style={{ marginTop: 8 }}>
            Weights, fuel tanks, cargo distribution, and default engine specs are automatically tailored for this variant. All parameters can be customized anytime.
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
                    {a.airframeHrs || '0'} airframe hrs · {a.landings || '0'} landings · {a.engine || ''}
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
