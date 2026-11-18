import React, { useState } from 'react';
import { api } from '../services/api';

export default function AircraftDetailView({ aircraft, onBack, onRefreshFleet }) {
  const [acState, setAcState] = useState(aircraft);
  const [saving, setSaving] = useState(false);
  const [delArm, setDelArm] = useState(false);

  const handleChange = (path, val) => {
    const next = JSON.parse(JSON.stringify(acState));
    const parts = path.split('.');
    let cur = next;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
    setAcState(next);
    triggerSave(next);
  };

  const triggerSave = async (updated) => {
    setSaving(true);
    try {
      await api.updateAircraft(updated.id, updated);
      if (onRefreshFleet) onRefreshFleet();
    } catch (err) {
      console.error('Failed to save aircraft:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (delArm) {
      try {
        await api.deleteAircraft(aircraft.id);
        if (onRefreshFleet) await onRefreshFleet();
        onBack();
      } catch (err) {
        alert('Could not delete aircraft');
      }
    } else {
      setDelArm(true);
      setTimeout(() => setDelArm(false), 4000);
    }
  };

  const A = acState;

  return (
    <>
      <div className="fhead">
        <div>
          <p className="eyebrow">{A.typeLabel}</p>
          <h1>{A.reg}</h1>
          <p className="sub">
            {A.operator || 'No operator set'} · {A.engine || ''} {A.base ? `· Base: ${A.base}` : ''}
          </p>
        </div>
        <div className="row">
          <span className="chip ok" style={{ alignSelf: 'center' }}>
            {saving ? 'Saving...' : 'Saved to DB'}
          </span>
          <button className="btn ghost" onClick={onBack}>
            All aircraft
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="sh" style={{ marginTop: 0 }}>Identity</div>
        <div className="g">
          <div className="cell">
            <span className="lab">REGISTRATION</span>
            <input 
              className="f up" 
              value={A.reg || ''} 
              onChange={e => handleChange('reg', e.target.value.toUpperCase())}
            />
          </div>
          <div className="cell">
            <span className="lab">OPERATOR</span>
            <input 
              className="f" 
              value={A.operator || ''} 
              onChange={e => handleChange('operator', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">SERIAL NUMBER</span>
            <input 
              className="f" 
              value={A.serial || ''} 
              onChange={e => handleChange('serial', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">ENGINE TYPE</span>
            <input 
              className="f" 
              value={A.engine || ''} 
              onChange={e => handleChange('engine', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">HOME BASE</span>
            <input 
              className="f up" 
              value={A.base || ''} 
              onChange={e => handleChange('base', e.target.value.toUpperCase())}
            />
          </div>
          <div className="cell">
            <span className="lab">CABIN CONFIG</span>
            <input 
              className="f" 
              value={A.config || ''} 
              onChange={e => handleChange('config', e.target.value)}
            />
          </div>
        </div>

        <div className="sh">Weights and limits (kg)</div>
        <div className="g">
          <div className="cell">
            <span className="lab">BASIC EMPTY WEIGHT (BEW)</span>
            <input 
              className="f n" 
              value={A.bew || ''} 
              onChange={e => handleChange('bew', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">MAX RAMP WEIGHT (MRW)</span>
            <input 
              className="f n" 
              value={A.limits?.mrw || ''} 
              onChange={e => handleChange('limits.mrw', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">MAX TAKE-OFF WEIGHT (MTOW)</span>
            <input 
              className="f n" 
              value={A.limits?.mtow || ''} 
              onChange={e => handleChange('limits.mtow', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">MAX LANDING WEIGHT (MLW)</span>
            <input 
              className="f n" 
              value={A.limits?.mlw || ''} 
              onChange={e => handleChange('limits.mlw', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">MAX ZERO FUEL WEIGHT (MZFW)</span>
            <input 
              className="f n" 
              value={A.limits?.mzfw || ''} 
              onChange={e => handleChange('limits.mzfw', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">STANDARD TAXI FUEL (kg)</span>
            <input 
              className="f n" 
              value={A.taxiFuel || ''} 
              onChange={e => handleChange('taxiFuel', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">MAX FUEL CAPACITY (kg)</span>
            <input 
              className="f n" 
              value={A.fuelCap || ''} 
              onChange={e => handleChange('fuelCap', e.target.value)}
            />
          </div>
        </div>
        <p className="note">
          These limits automatically populate every new flight document created for this aircraft.
        </p>

        <div className="sh">Fuel tanks</div>
        <div className="tw">
          <table className="t" style={{ minWidth: 420 }}>
            <thead>
              <tr>
                <th>TANK NAME</th>
                <th>MAX (kg)</th>
              </tr>
            </thead>
            <tbody>
              {(A.tanks || []).map((t, i) => (
                <tr key={i}>
                  <td>
                    <input 
                      className="f" 
                      value={t.name || ''} 
                      onChange={e => handleChange(`tanks.${i}.name`, e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      className="f n" 
                      value={t.max || ''} 
                      onChange={e => handleChange(`tanks.${i}.max`, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sh">Cargo holds</div>
        <div className="tw">
          <table className="t" style={{ minWidth: 520 }}>
            <thead>
              <tr>
                <th>COMPARTMENT</th>
                <th>MAX LIMIT (kg)</th>
                <th>LOADSHEET ROW</th>
              </tr>
            </thead>
            <tbody>
              {(A.holds || []).map((h, i) => (
                <tr key={i}>
                  <td>
                    <input 
                      className="f" 
                      value={h.name || ''} 
                      onChange={e => handleChange(`holds.${i}.name`, e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      className="f n" 
                      value={h.limit || ''} 
                      onChange={e => handleChange(`holds.${i}.limit`, e.target.value)}
                    />
                  </td>
                  <td>
                    <select 
                      className="f"
                      value={h.group || 1}
                      onChange={e => handleChange(`holds.${i}.group`, e.target.value)}
                    >
                      <option value="1">Cargo row 1</option>
                      <option value="2">Cargo row 2</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sh">Running totals</div>
        <div className="g">
          <div className="cell">
            <span className="lab">TOTAL AIRFRAME HOURS</span>
            <input 
              className="f n" 
              value={A.airframeHrs || '0'} 
              onChange={e => handleChange('airframeHrs', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">TOTAL LANDINGS</span>
            <input 
              className="f n" 
              value={A.landings || '0'} 
              onChange={e => handleChange('landings', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">ENG #1 HOURS</span>
            <input 
              className="f n" 
              value={A.eng1Hrs || '0'} 
              onChange={e => handleChange('eng1Hrs', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">ENG #2 HOURS</span>
            <input 
              className="f n" 
              value={A.eng2Hrs || '0'} 
              onChange={e => handleChange('eng2Hrs', e.target.value)}
            />
          </div>
          <div className="cell">
            <span className="lab">APU HOURS</span>
            <input 
              className="f n" 
              value={A.apuHrs || '0'} 
              onChange={e => handleChange('apuHrs', e.target.value)}
            />
          </div>
        </div>
        <p className="note">Completing a flight automatically updates airframe hours, block time and landings to these totals.</p>

        <div className="row" style={{ marginTop: 22 }}>
          <button className="btn danger" onClick={handleDelete}>
            {delArm ? 'Confirm Delete Aircraft?' : 'Delete aircraft'}
          </button>
        </div>
      </div>
    </>
  );
}
