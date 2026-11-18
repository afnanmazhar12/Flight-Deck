import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { PRESETS } from '../data/presets';

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

const PRE_ITEMS = [
  ['ofp', 'SimBrief briefing generated and reviewed'],
  ['plan', 'Flight plan filed on the network'],
  ['notam', 'NOTAMs reviewed for departure, destination and alternate'],
  ['wx', 'Weather and ATIS checked'],
  ['fuelplan', 'Fuel plan checked: trip, contingency, alternate, final reserve'],
  ['tech', 'Tech log reviewed, MEL items acknowledged'],
  ['fuel', 'Fuel voucher completed'],
  ['load', 'Loadsheet and trim accepted'],
  ['stand', 'Stand confirmed on VDGS'],
  ['cpdlc', 'CPDLC logged on'],
  ['etops', 'ETOPS and ETP plan reviewed, if applicable'],
  ['brief', 'Departure briefing complete']
];

const POST_ITEMS = [
  ['brake', 'Parking brake set, engines shut down'],
  ['gpu', 'APU and ground power configured'],
  ['tech', 'Tech log entries completed'],
  ['file', 'Fuel voucher and loadsheet filed'],
  ['fpl', 'Flight plan closed, network disconnected'],
  ['pirep', 'PIREP filed with the virtual airline']
];

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
  return m ? `${+m[3]} ${MON[+m[2] - 1]} ${m[1]}` : (d || '');
}

const n = v => {
  const x = parseFloat(String(v == null ? '' : v).replace(/,/g, ''));
  return isFinite(x) ? x : 0;
};
const has = v => String(v == null ? '' : v).trim() !== '';
const f0 = x => isFinite(x) && x !== '' && x != null ? Math.round(Number(x)).toLocaleString('en-US') : '—';
const dash = x => x ? f0(x) : '—';
const LB = 2.20462262;
const USG = 3.785411784;

function mins(a, b) {
  if (!a || !b) return null;
  const p = a.split(':').map(Number);
  const q = b.split(':').map(Number);
  if ([...p, ...q].some(isNaN)) return null;
  let d = (q[0] * 60 + q[1]) - (p[0] * 60 + p[1]);
  if (d < 0) d += 1440;
  return d;
}

const hm = m => m == null || isNaN(m) ? '—' : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const nowZ = () => new Date().toISOString().slice(11, 16);

function calcDelayPill(planStr, actStr) {
  if (!planStr || !actStr) return { text: 'Pending', cls: 'ghost' };
  const d = mins(planStr, actStr);
  if (d == null) return { text: '—', cls: 'ghost' };
  if (d === 0) return { text: 'On time (±0m)', cls: 'ok' };
  if (d > 0 && d <= 15) return { text: `+${d}m (Minor delay)`, cls: 'ok' };
  if (d > 15) return { text: `+${d}m delay`, cls: 'bad' };
  return { text: `${Math.abs(d)}m early`, cls: 'ok' };
}

function statusOf(F) {
  if (F.post && F.post.completed) return 'Completed';
  const d = F.done || {};
  if (d.comms) return 'Postflight';
  if (d.load || d.fuel || d.tech) return 'Ground';
  if (d.pre) return 'Briefed';
  return 'Planning';
}


const DEFAULT_STAR_ALLIANCE_HISTORY = [
  { flt: 'EWG6892', pilot: 'Francesco', dep: 'LEPA', arr: 'EDDM', when: '3 days ago', dur: '1:48', remarks: 'Lav 2 smoke detector fault at boarding. Reset, did not recur.' },
  { flt: 'EWG6839', pilot: 'Karl S.', dep: 'EDLP', arr: 'LEPA', when: '9 days ago', dur: '1:57', remarks: 'Cabin reading light row 14 inop. Cabin log entry made.' },
  { flt: 'EWG9823', pilot: 'Max', dep: 'LIMC', arr: 'EDDL', when: '26 days ago', dur: '1:19', remarks: 'IRS 2 alignment slow at start-up. Cleared after re-align.' },
  { flt: 'EWG9822', pilot: 'Christian', dep: 'EDDL', arr: 'LIMC', when: '2 months ago', dur: '1:13', remarks: 'Nil defects. Aircraft serviceable.' },
  { flt: 'EWG9845', pilot: 'Tobias K.', dep: 'LIEO', arr: 'EDDL', when: '4 months ago', dur: '1:42', remarks: 'Brake temps high after taxi-in. Cooled normally, no further action.' },
  { flt: 'EWG9844', pilot: 'Matteo', dep: 'EDDL', arr: 'LIEO', when: '5 months ago', dur: '1:41', remarks: 'Nose wheel steering caution at pushback. Cleared after reset.' },
  { flt: 'EWG9009', pilot: 'Matteo', dep: 'EDXW', arr: 'EDDL', when: '6 months ago', dur: '0:50', remarks: 'IRS 2 alignment slow at start-up. Cleared after re-align.' }
];

function ensureTechDefaults(f) {
  if (!f) return f;
  const next = JSON.parse(JSON.stringify(f));
  if (!next.tech) next.tech = {};
  const acObj = next.ac || {};
  const histList = (acObj.history && acObj.history.length > 0) ? acObj.history : DEFAULT_STAR_ALLIANCE_HISTORY;
  
  if (!next.tech.flightRows || next.tech.flightRows.length <= 1) {
    const past = histList.slice(0, 5).map(h => ({
      hist: 1,
      fltNo: h.flt,
      date: 'dd/mm/yyyy',
      dep: h.dep,
      arr: h.arr,
      out: '',
      off: '',
      on: '',
      in: '',
      dur: h.dur,
      ldgs: '',
      pic: h.pilot,
      remarks: (h.when ? `(${h.when}) ` : '') + (h.remarks || '')
    }));
    const currentActive = next.tech?.flightRows?.[0] || {
      fltNo: next.flightNo || next.callsign || '',
      date: next.date || '',
      dep: next.dep || '',
      arr: next.arr || '',
      out: '',
      off: '',
      on: '',
      in: '',
      dur: '-',
      ldgs: '1',
      pic: 'Capt. Afnan Mazhar',
      remarks: ''
    };
    next.tech.flightRows = [currentActive, ...past];
  }
  
  if (!next.tech.defects || next.tech.defects.length === 0) {
    next.tech.defects = [
      { item: '1', date: '14/11/2026', desc: 'Lav 2 smoke detector fault reported at boarding', action: 'BITE test performed normal, smoke sensor harness re-seated. Cleared after ops check.', cert: 'AP-849201', status: 'Cleared' },
      { item: '2', date: '08/11/2026', desc: 'Cabin reading light row 14 inop', action: 'Bulb replaced, circuit breaker 12VU reset. Satisfactory test.', cert: 'AP-773190', status: 'Cleared' },
      { item: '3', date: '22/10/2026', desc: 'IRS 2 alignment slow at start-up (exceeded 10 min)', action: 'IR2 alignment test completed satisfactory via MCDU. Monitor next sector.', cert: 'AP-664120', status: 'Cleared' }
    ];
  }
  if (!next.tech.mel || next.tech.mel.length === 0) {
    next.tech.mel = [
      { ref: 'MEL 25-21-01A', item: '1', sys: 'Cabin Reading Light Row 14 Inoperative', cat: 'C', defer: '08/11/2026', expiry: '18/11/2026', sign: 'Deferral authorized per MEL 25-21-01A (AP-773190)' }
    ];
  }
  if (!next.tech.wo || next.tech.wo.length === 0) {
    next.tech.wo = [
      { no: 'WO-2026-9481', sys: 'ATA 26 Fire Protection', removed: 'SD-401 P/N 39482-1 S/N 84920', installed: 'SD-401 P/N 39482-1 S/N 99201', form: 'EASA Form 1' }
    ];
  }
  if (!next.tech.insp || next.tech.insp.length === 0) {
    next.tech.insp = [
      { check: 'A-Check', interval: '600 HRS / 750 CYC', last: '120.0 HRS (12 SEP 2026)', next: '720.0 HRS (12 MAR 2027)', rem: '548.6 HRS', status: 'CURRENT' },
      { check: 'C-Check', interval: '24 MONTHS / 6000 CYC', last: '15 JAN 2025', next: '15 JAN 2027', rem: '2 MONTHS', status: 'SCHEDULED' },
      { check: 'Daily / Transit Check', interval: '24 HRS / 48 HRS', last: '17 NOV 2026 (EDDL)', next: '18 NOV 2026 (EKCH)', rem: 'VALID', status: 'CURRENT' }
    ];
  }
  if (!next.tech.ads || next.tech.ads.length === 0) {
    next.tech.ads = [
      { ref: 'EASA AD 2024-0182', eff: 'Airbus A320-214', subject: 'Elevator Aileron Computer (ELAC) software update', method: 'SB A320-27-1244 Rev 02 complied with', next: 'TERMINATING', status: 'COMPLIED' },
      { ref: 'FAA AD 2025-09-11', eff: 'CFM56-5B Engines', subject: 'High Pressure Turbine rotor blade inspection', method: 'Boroscopic inspection performed 12 SEP 2026', next: '400 CYC', status: 'OPEN / MONITORED' }
    ];
  }
  if (!next.tech.life || next.tech.life.length === 0) {
    next.tech.life = [
      { comp: 'NLG Shock Strut', pn: 'D23581000-4', sn: 'SN-88219', limit: '20,000 CYC', acc: '3,410 CYC', rem: '16,590 CYC' },
      { comp: 'LH MLG Actuator', pn: 'D23640000-2', sn: 'SN-74102', limit: '18,000 CYC', acc: '2,890 CYC', rem: '15,110 CYC' },
      { comp: 'CFM56-5B Stage 1 HPT Disk', pn: '1808M32P01', sn: 'GTE-55219', limit: '15,000 CYC', acc: '3,850 CYC', rem: '11,150 CYC' }
    ];
  }
  if (!next.tech.audit) {
    next.tech.audit = {
      sig: 'EASA Part-66 / QA-4481',
      qa: 'CERT-CRS-EDDL-2026',
      cert: 'EDDL-MRO-A320'
    };
  }
  return next;
}

export default function ActiveFlightView({ flight, onBack, onUpdateFlight, onTrackOnVatsim, onSwitchToLogbook }) {
  const [stage, setStage] = useState('pre');
  const [F, setF] = useState(() => ensureTechDefaults(flight));
  const [saving, setSaving] = useState(false);
  const [sbLoading, setSbLoading] = useState(false);
  const [sbMsg, setSbMsg] = useState('');
  const [showPdf, setShowPdf] = useState(true);
  const [archivedToMongo, setArchivedToMongo] = useState(flight?.post?.completed || false);

  const saveTimerRef = useRef(null);
  const pendingFlightRef = useRef(null);

  // Synchronize when active flight changes (NOT on each echo render)
  useEffect(() => {
    if (flight && flight.id !== F?.id) {
      setF(ensureTechDefaults(flight));
    }
  }, [flight?.id]);

  useEffect(() => {
    const sbUser = F.sb?.user || localStorage.getItem('flightdesk-sbuser') || 'afnanmazhar12';
    if (sbUser && !F.sb?.d) {
      handleFetchOFP(sbUser, true);
    }
  }, [F.id]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (pendingFlightRef.current) {
        api.updateFlight(pendingFlightRef.current.id, pendingFlightRef.current).catch(() => {});
      }
    };
  }, []);

  const debouncedSave = (updated) => {
    pendingFlightRef.current = updated;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(async () => {
      if (!pendingFlightRef.current) return;
      const toSave = pendingFlightRef.current;
      setSaving(true);
      try {
        await api.updateFlight(toSave.id, toSave);
        if (onUpdateFlight) onUpdateFlight(toSave);
      } catch (err) {
        console.error('Failed to save flight:', err);
      } finally {
        setSaving(false);
      }
    }, 500);
  };

  const flushSave = async (updated) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    const toSave = updated || pendingFlightRef.current || F;
    if (!toSave) return;
    setSaving(true);
    try {
      await api.updateFlight(toSave.id, toSave);
      if (onUpdateFlight) onUpdateFlight(toSave);
    } catch (err) {
      console.error('Failed to save flight:', err);
    } finally {
      setSaving(false);
    }
  };

  // High performance, 0ms lag input updater
  const updateFlightPath = (path, val) => {
    setF(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]]) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = val;
      debouncedSave(next);
      return next;
    });
  };

  const toggleDone = () => {
    const nextDone = { ...(F.done || {}) };
    nextDone[stage] = !nextDone[stage];
    updateFlightPath('done', nextDone);
  };

  const setNowTime = (path) => {
    updateFlightPath(path, nowZ());
  };

  // SimBrief fetch & apply
  const handleFetchOFP = async (userParam, silent = false) => {
    const user = userParam || F.sb?.user || localStorage.getItem('flightdesk-sbuser') || 'afnanmazhar12';
    if (!user) {
      if (!silent) alert('Enter your SimBrief username or Pilot ID');
      return;
    }
    setSbLoading(true);
    setSbMsg('Fetching latest OFP from SimBrief...');
    try {
      localStorage.setItem('flightdesk-sbuser', user);
      const res = await api.getSimbriefOFP(user);
      if (res && res.d) {
        const next = JSON.parse(JSON.stringify(F));
        next.sb = {
          user,
          at: Date.now(),
          d: res.d,
          fixes: res.fixes || [],
          text: res.text || ''
        };

        // Apply OFP to documents
        const D = res.d;
        const kg = x => !has(x) ? '' : (D.units === 'lbs' ? String(Math.round(n(x) / LB)) : String(Math.round(n(x))));
        next.dep = D.org || next.dep;
        next.arr = D.dst || next.arr;
        next.alt = D.alt || next.alt;
        next.callsign = D.cs || next.callsign;
        next.flightNo = D.fn || next.flightNo;

        if (!next.pre) next.pre = {};
        next.pre.route = D.route;
        next.pre.cruise = D.fl;
        next.pre.etd = D.out;
        next.pre.eta = D.in;
        next.pre.wx = [D.metarO, D.metarD, D.metarA].filter(Boolean).join('\n');
        if (D.notams && D.notams.length) next.pre.notam = D.notams.join('\n\n').slice(0, 4000);

        if (!next.load) next.load = {};
        next.load.bew = kg(D.wt.oew);
        next.load.paxCount = D.wt.pax;
        next.load.block = kg(D.fuel.ramp);
        next.load.taxi = kg(D.fuel.taxi);
        next.load.trip = kg(D.fuel.trip);

        // Distribute holds and zones
        const cargoKg = n(kg(D.wt.cargo));
        const holds = (next.ac && next.ac.holds) || [];
        if (cargoKg && holds.length) {
          const lims = holds.map(h => n(h.limit)), tot = lims.reduce((a, b) => a + b, 0);
          let left = cargoKg;
          if (!next.load.holds) next.load.holds = [];
          holds.forEach((h, i) => {
            let w = tot ? Math.round(cargoKg * lims[i] / tot) : (i === 0 ? cargoKg : 0);
            if (i === holds.length - 1) w = left;
            w = Math.max(0, Math.min(w, left));
            left -= w;
            next.load.holds[i] = w ? String(w) : '';
          });
        }

        const pax = n(D.wt.pax);
        const zones = (next.ac && next.ac.zones) || [];
        if (pax && zones.length) {
          const base = Math.floor(pax / zones.length);
          let rem = pax - base * zones.length;
          if (!next.load.zones) next.load.zones = [];
          zones.forEach((z, i) => {
            next.load.zones[i] = String(base + (rem > 0 ? 1 : 0));
            rem--;
          });
        }

        if (!next.fuel) next.fuel = {};
        next.fuel.required = D.fuel.ramp;
        next.fuel.massUnit = D.units === 'lbs' ? 'LBS' : 'KG';

        if (!next.times) next.times = { plan: {} };
        if (!next.times.plan) next.times.plan = {};
        next.times.plan.out = D.out;
        next.times.plan.off = D.off;
        next.times.plan.on = D.on;
        next.times.plan.in = D.in;
        next.times.plan.txo = D.txo || '20';
        next.times.plan.txi = D.txi || '8';

        if (!next.tech) next.tech = {};
        if (!next.tech.flightRows || !next.tech.flightRows.length) next.tech.flightRows = [{}];
        next.tech.flightRows[0].fltNo = D.fn || next.tech.flightRows[0].fltNo;
        next.tech.flightRows[0].dep = D.org || next.tech.flightRows[0].dep;
        next.tech.flightRows[0].arr = D.dst || next.tech.flightRows[0].arr;
        if (!next.tech.flightRows[0].out) next.tech.flightRows[0].out = D.out || '';
        if (!next.tech.flightRows[0].off) next.tech.flightRows[0].off = D.off || '';
        if (!next.tech.flightRows[0].on) next.tech.flightRows[0].on = D.on || '';
        if (!next.tech.flightRows[0].in) next.tech.flightRows[0].in = D.in || '';

        setF(next);
        await flushSave(next);
        setSbMsg(`Latest OFP loaded ${new Date().toISOString().slice(11, 16)}Z and applied to your documents.`);
      } else {
        setSbMsg('Could not read SimBrief data.');
      }
    } catch (err) {
      setSbMsg('Failed to fetch SimBrief OFP: ' + err.message);
    } finally {
      setSbLoading(false);
    }
  };

  // Archive to MongoDB Logbook
  const handleCompleteAndArchive = async () => {
    try {
      const next = JSON.parse(JSON.stringify(F));
      if (!next.post) next.post = {};
      next.post.completed = true;
      next.post.completedAt = Date.now();
      if (!next.done) next.done = {};
      next.done.post = true;

      await flushSave(next);
      await api.createLogbookFromFlight(next.id);
      setArchivedToMongo(true);
      alert('Flight sector completed and successfully archived to MongoDB Atlas Logbook!');
    } catch (err) {
      alert('Archival error: ' + err.message);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const ac = F.ac || {};
  const tpl = ac.tpl || 'a320';
  const P = PRESETS[tpl] || PRESETS.a320;

  // Math Calculations for Loadsheet (with complete user custom overrides)
  const L = F.load || {};
  const calcDow = n(L.bew) + n(L.pantry);
  const dow = has(L.dow) ? n(L.dow) : calcDow;

  const paxCount = has(L.paxCount) ? n(L.paxCount) : (L.zones ? (L.zones.reduce((a, b) => a + n(b), 0) || 0) : 0);
  const paxAvg = n(L.paxAvg || 84);
  const calcPaxWt = paxCount * paxAvg;
  const paxWt = has(L.paxWt) ? n(L.paxWt) : calcPaxWt;

  let calcC1 = 0, calcC2 = 0;
  (ac.holds || []).forEach((h, i) => {
    const w = n(L.holds?.[i]);
    if (+h.group === 2) calcC2 += w;
    else calcC1 += w;
  });
  const c1 = has(L.c1) ? n(L.c1) : calcC1;
  const c2 = has(L.c2) ? n(L.c2) : calcC2;
  const cargo = c1 + c2;
  const calcPayload = paxWt + cargo;
  const payload = has(L.payload) ? n(L.payload) : calcPayload;
  const calcZfw = dow + payload;
  const zfw = has(L.zfw) ? n(L.zfw) : calcZfw;
  const calcTof = n(L.block) - n(L.taxi);
  const tof = has(L.tof) ? n(L.tof) : calcTof;
  const calcTow = zfw + tof;
  const tow = has(L.tow) ? n(L.tow) : calcTow;
  const calcLaw = tow - n(L.trip);
  const law = has(L.law) ? n(L.law) : calcLaw;
  const ramp = zfw + n(L.block);

  // Structural Limits checks
  const mrwLim = n(ac.limits?.mrw || P.limits?.mrw);
  const mtowLim = n(ac.limits?.mtow || P.limits?.mtow);
  const mlwLim = n(ac.limits?.mlw || P.limits?.mlw);
  const mzfwLim = n(ac.limits?.mzfw || P.limits?.mzfw);

  // Math Calculations for Fuel Voucher (with complete user custom overrides)
  const FU = F.fuel || {};
  const u = FU.massUnit === 'LBS' ? 'LBS' : 'KG';
  const vu = FU.volUnit === 'USG' ? 'USG' : 'L';
  const toKg = x => u === 'LBS' ? x / LB : x;
  const fromKg = x => u === 'LBS' ? x * LB : x;
  const toL = x => vu === 'USG' ? x * USG : x;
  const dens = has(FU.dens) ? n(FU.dens) : (n(FU.fin?.d) || n(FU.ini?.d) || 0.800);
  const calcNetVol = (has(FU.fin?.g) && has(FU.ini?.g)) ? n(FU.fin.g) - n(FU.ini.g) : 0;
  const netVol = has(FU.netVol) ? n(FU.netVol) : calcNetVol;
  const calcMeterUplift = netVol && dens ? fromKg(toL(netVol) * dens) : 0;
  const finalUplift = has(FU.upMan) ? n(FU.upMan) : (calcMeterUplift || n(FU.required));
  const calcExpectedDepFOB = has(FU.arrFob) && finalUplift ? n(FU.arrFob) + finalUplift : n(FU.required);
  const expectedDepFOB = has(FU.expDep) ? n(FU.expDep) : calcExpectedDepFOB;
  const calcVarianceFOB = has(FU.actualDep) && expectedDepFOB ? n(FU.actualDep) - expectedDepFOB : 0;
  const varianceFOB = has(FU.variance) ? n(FU.variance) : calcVarianceFOB;
  const variancePct = expectedDepFOB ? (varianceFOB / expectedDepFOB) * 100 : 0;

  // Postflight calculations
  const PO = F.post || {};
  const actualDepFOB = n(FU.actualDep) || n(FU.required);
  const fuelRemBlocks = n(PO.fuelRem);
  const fuelBurned = (actualDepFOB && fuelRemBlocks) ? actualDepFOB - fuelRemBlocks : n(L.trip);

  const currentIdx = STAGES.findIndex(s => s[0] === stage);
  const prevStage = STAGES[currentIdx - 1];
  const nextStage = STAGES[currentIdx + 1];

  // Links for preflight
  const links = [
    { name: 'SIMBRIEF DISPATCH', url: 'https://dispatch.simbrief.com/briefing/latest' },
    { name: 'SKYNEXUS', url: 'https://app.skynexus.nl/dashboard/dep' },
    { name: 'VDGS SPAIN', url: 'https://vdgs.vatsimspain.es/vdgs/getCallsignResult.php' },
    { name: 'VATSIM RADAR', url: 'https://vatsim-radar.com/' },
    { name: 'FSM CPDLC', url: 'https://fsm.vsrsoftware.com/#' }
  ];

  const handleCopyPlanToActual = () => {
    const next = JSON.parse(JSON.stringify(F));
    if (!next.tech) next.tech = {};
    if (!next.tech.flightRows || !next.tech.flightRows.length) next.tech.flightRows = [{}];
    const plan = next.times?.plan || {};
    if (plan.out) next.tech.flightRows[0].out = plan.out;
    if (plan.off) next.tech.flightRows[0].off = plan.off;
    if (plan.on) next.tech.flightRows[0].on = plan.on;
    if (plan.in) next.tech.flightRows[0].in = plan.in;
    setF(next);
    flushSave(next);
  };

  const handlePullSimbriefTimes = async () => {
    const sbUser = F.sb?.user || localStorage.getItem('flightdesk-sbuser') || 'afnanmazhar12';
    await handleFetchOFP(sbUser);
  };

  // Tech Log Actions (Supports unlimited rows in all sections)
  const handleRefillPastSectors = () => {
    const histList = (ac.history && ac.history.length > 0) ? ac.history : DEFAULT_STAR_ALLIANCE_HISTORY;
    const past = histList.slice(0, 5).map(h => ({
      hist: 1,
      fltNo: h.flt,
      date: 'dd/mm/yyyy',
      dep: h.dep,
      arr: h.arr,
      out: '',
      off: '',
      on: '',
      in: '',
      dur: h.dur,
      ldgs: '',
      pic: h.pilot,
      remarks: (h.when ? `(${h.when}) ` : '') + (h.remarks || '')
    }));
    const currentActive = F.tech?.flightRows?.[0] || {
      fltNo: F.flightNo || F.callsign || '',
      date: F.date || '',
      dep: F.dep || '',
      arr: F.arr || '',
      out: '',
      off: '',
      on: '',
      in: '',
      dur: '-',
      ldgs: '1',
      pic: 'Capt. Afnan Mazhar',
      remarks: ''
    };
    updateFlightPath('tech.flightRows', [currentActive, ...past]);
  };

  const handleAddSector = () => {
    const list = [...(F.tech?.flightRows || [])];
    list.push({ fltNo: '', date: F.date || '', dep: '', arr: '', out: '', off: '', on: '', in: '', dur: '—', ldgs: '1', pic: '', remarks: '' });
    updateFlightPath('tech.flightRows', list);
  };

  const handleRemoveSector = (idx) => {
    const list = (F.tech?.flightRows || []).filter((_, i) => i !== idx);
    updateFlightPath('tech.flightRows', list);
  };

  const handleAddFuelStation = () => {
    const list = [...(F.tech?.fuelRows || [])];
    list.push({ station: '', uplift: '', depFuel: '', arrFuel: '', oil1: '', oil2: '', hyd: '', sig: '' });
    updateFlightPath('tech.fuelRows', list);
  };

  const handleRemoveFuelStation = (idx) => {
    const list = (F.tech?.fuelRows || []).filter((_, i) => i !== idx);
    updateFlightPath('tech.fuelRows', list);
  };

  const handleAddDefect = () => {
    const list = [...(F.tech?.defects || [])];
    list.push({ item: String(list.length + 1), date: F.date || '', desc: '', action: '', cert: '', status: 'Open' });
    updateFlightPath('tech.defects', list);
  };

  const handleRemoveDefect = (idx) => {
    const list = (F.tech?.defects || []).filter((_, i) => i !== idx);
    updateFlightPath('tech.defects', list);
  };

  const handleAddMel = () => {
    const list = [...(F.tech?.mel || [])];
    list.push({ ref: '', item: String(list.length + 1), sys: '', cat: 'C', defer: F.date || '', expiry: '', sign: '' });
    updateFlightPath('tech.mel', list);
  };

  const handleRemoveMel = (idx) => {
    const list = (F.tech?.mel || []).filter((_, i) => i !== idx);
    updateFlightPath('tech.mel', list);
  };

  const handleAddWorkOrder = () => {
    const list = [...(F.tech?.wo || [])];
    list.push({ no: '', sys: '', removed: '', installed: '', form: '' });
    updateFlightPath('tech.wo', list);
  };

  const handleRemoveWorkOrder = (idx) => {
    const list = (F.tech?.wo || []).filter((_, i) => i !== idx);
    updateFlightPath('tech.wo', list);
  };

  const handleAddInspRow = () => {
    const list = [...(F.tech?.insp || [])];
    list.push({ check: '', interval: '', last: '', next: '', rem: '', status: 'CURRENT' });
    updateFlightPath('tech.insp', list);
  };

  const handleRemoveInspRow = (idx) => {
    const list = (F.tech?.insp || []).filter((_, i) => i !== idx);
    updateFlightPath('tech.insp', list);
  };

  const handleAddAdRow = () => {
    const list = [...(F.tech?.ads || [])];
    list.push({ ref: '', eff: '', subject: '', method: '', next: '', status: 'OPEN' });
    updateFlightPath('tech.ads', list);
  };

  const handleRemoveAdRow = (idx) => {
    const list = (F.tech?.ads || []).filter((_, i) => i !== idx);
    updateFlightPath('tech.ads', list);
  };

  const handleAddLifeRow = () => {
    const list = [...(F.tech?.life || [])];
    list.push({ comp: '', pn: '', sn: '', limit: '', acc: '', rem: '' });
    updateFlightPath('tech.life', list);
  };

  const handleRemoveLifeRow = (idx) => {
    const list = (F.tech?.life || []).filter((_, i) => i !== idx);
    updateFlightPath('tech.life', list);
  };

  return (
    <>
      <div className="fhead">
        <div>
          <p className="eyebrow">{statusOf(F)} · {F.network || 'VATSIM'}</p>
          <h1>
            {F.callsign || 'Flight'} <span className="route">{F.dep || '----'} → {F.arr || '----'}</span>
          </h1>
          <p className="sub">
            {ac.reg} · {ac.typeLabel} · {fmtDate(F.date)}
          </p>
        </div>
        <div className="row">
          <button 
            className="btn ghost" 
            onClick={() => onTrackOnVatsim(F.callsign)}
            title="Track this flight on VATSIM Radar"
          >
            Track on VATSIM
          </button>
          <button className="btn ghost" onClick={onBack}>
            All flights
          </button>
        </div>
      </div>

      {/* Stage Selector Navigation */}
      <nav className="stages" aria-label="Flight documents">
        {STAGES.map(([k, l], i) => (
          <button 
            key={k}
            className={`stage ${stage === k ? 'on' : ''} ${F.done?.[k] ? 'done' : ''}`}
            onClick={() => setStage(k)}
          >
            <i>{F.done?.[k] ? '✓' : i + 1}</i>
            <span>{l}</span>
          </button>
        ))}
      </nav>

      {/* STAGE 1: SIMBRIEF OFP */}
      {stage === 'sb' && (
        <article className="sheet" id="sheet" data-doc="simbrief">
          <header className="dh">
            <div>
              <h2 className="dt">SIMBRIEF OFP</h2>
              <p className="ds">
                {F.sb?.d ? `${F.sb.d.org} — ${F.sb.d.dst} — ${ac.icao || 'A320'} ${ac.reg || ''}` : 'OPERATIONAL FLIGHT PLAN'}
              </p>
            </div>
            <span className="dbadge">SIMBRIEF</span>
          </header>

          {F.sb?.d ? (
            <>
              <div className="sh" style={{ marginTop: 0 }}>FLIGHT</div>
              <div className="g" style={{ '--min': '130px' }}>
                <div className="cell"><span className="lab">FLIGHT</span><span className="calc">{F.sb.d.fn || F.sb.d.cs}</span></div>
                <div className="cell"><span className="lab">FROM / RWY</span><span className="calc">{F.sb.d.org} {F.sb.d.orwy ? `/ ${F.sb.d.orwy}` : ''}</span></div>
                <div className="cell"><span className="lab">TO / RWY</span><span className="calc">{F.sb.d.dst} {F.sb.d.drwy ? `/ ${F.sb.d.drwy}` : ''}</span></div>
                <div className="cell"><span className="lab">ALTERNATE / RWY</span><span className="calc">{F.sb.d.alt} {F.sb.d.arwy ? `/ ${F.sb.d.arwy}` : ''}</span></div>
                <div className="cell"><span className="lab">CRUISE</span><span className="calc">{F.sb.d.fl}</span></div>
                <div className="cell"><span className="lab">COST INDEX</span><span className="calc">{F.sb.d.ci}</span></div>
                <div className="cell"><span className="lab">DISTANCE (NM)</span><span className="calc">{F.sb.d.dist}</span></div>
                <div className="cell"><span className="lab">TIME ENROUTE</span><span className="calc">{F.sb.d.ete}</span></div>
              </div>

              <div className="sh">TIMES (Z)</div>
              <div className="g" style={{ '--min': '130px' }}>
                <div className="cell"><span className="lab">OUT</span><span className="calc">{F.sb.d.out}</span></div>
                <div className="cell"><span className="lab">OFF</span><span className="calc">{F.sb.d.off}</span></div>
                <div className="cell"><span className="lab">ON</span><span className="calc">{F.sb.d.on}</span></div>
                <div className="cell"><span className="lab">IN</span><span className="calc">{F.sb.d.in}</span></div>
              </div>

              <div className="sh">FUEL <small>{F.sb.d.units?.toUpperCase() || 'KG'}</small></div>
              <div className="g" style={{ '--min': '120px' }}>
                <div className="cell"><span className="lab">TAXI</span><span className="calc">{f0(F.sb.d.fuel?.taxi)}</span></div>
                <div className="cell"><span className="lab">TRIP</span><span className="calc">{f0(F.sb.d.fuel?.trip)}</span></div>
                <div className="cell"><span className="lab">CONTINGENCY</span><span className="calc">{f0(F.sb.d.fuel?.cont)}</span></div>
                <div className="cell"><span className="lab">ALTERNATE</span><span className="calc">{f0(F.sb.d.fuel?.altn)}</span></div>
                <div className="cell"><span className="lab">RESERVE</span><span className="calc">{f0(F.sb.d.fuel?.res)}</span></div>
                <div className="cell"><span className="lab">ETOPS</span><span className="calc">{f0(F.sb.d.fuel?.etops || 0)}</span></div>
                <div className="cell"><span className="lab">EXTRA</span><span className="calc">{f0(F.sb.d.fuel?.extra || 0)}</span></div>
                <div className="cell"><span className="lab">TAKE-OFF</span><span className="calc">{f0(F.sb.d.fuel?.takeoff)}</span></div>
                <div className="cell"><span className="lab">RAMP / BLOCK</span><span className="calc big">{f0(F.sb.d.fuel?.ramp)}</span></div>
                <div className="cell"><span className="lab">LANDING</span><span className="calc">{f0(F.sb.d.fuel?.ldg)}</span></div>
              </div>

              <div className="sh">WEIGHTS <small>{F.sb.d.units?.toUpperCase() || 'KG'}</small></div>
              <div className="g" style={{ '--min': '150px' }}>
                <div className="cell"><span className="lab">OEW</span><span className="calc">{f0(F.sb.d.wt?.oew)}</span></div>
                <div className="cell"><span className="lab">PAX</span><span className="calc">{F.sb.d.wt?.pax}</span></div>
                <div className="cell"><span className="lab">PAYLOAD</span><span className="calc">{f0(F.sb.d.wt?.payload)}</span></div>
                <div className="cell">
                  <span className="lab">ZFW</span>
                  <span className="calc">{f0(F.sb.d.wt?.zfw)}</span>
                  {F.sb.d.wt?.mzfw && (
                    <span className={`pill ${n(F.sb.d.wt.zfw) <= n(F.sb.d.wt.mzfw) ? 'ok' : 'bad'}`} style={{ marginTop: 2 }}>
                      {n(F.sb.d.wt.zfw) <= n(F.sb.d.wt.mzfw) ? 'OK' : 'OVER'} · max {f0(F.sb.d.wt.mzfw)}
                    </span>
                  )}
                </div>
                <div className="cell">
                  <span className="lab">TOW</span>
                  <span className="calc">{f0(F.sb.d.wt?.tow)}</span>
                  {F.sb.d.wt?.mtow && (
                    <span className={`pill ${n(F.sb.d.wt.tow) <= n(F.sb.d.wt.mtow) ? 'ok' : 'bad'}`} style={{ marginTop: 2 }}>
                      {n(F.sb.d.wt.tow) <= n(F.sb.d.wt.mtow) ? 'OK' : 'OVER'} · max {f0(F.sb.d.wt.mtow)}
                    </span>
                  )}
                </div>
                <div className="cell">
                  <span className="lab">LDW</span>
                  <span className="calc">{f0(F.sb.d.wt?.ldw)}</span>
                  {F.sb.d.wt?.mldw && (
                    <span className={`pill ${n(F.sb.d.wt.ldw) <= n(F.sb.d.wt.mldw) ? 'ok' : 'bad'}`} style={{ marginTop: 2 }}>
                      {n(F.sb.d.wt.ldw) <= n(F.sb.d.wt.mldw) ? 'OK' : 'OVER'} · max {f0(F.sb.d.wt.mldw)}
                    </span>
                  )}
                </div>
              </div>

              <div className="sh">ROUTE</div>
              <p className="calc" style={{ margin: '10px 0', wordBreak: 'break-word', color: 'var(--accent)' }}>
                {F.sb.d.route || '—'}
              </p>

              {(F.sb.d.metarO || F.sb.d.metarD) && (
                <>
                  <div className="sh">WEATHER</div>
                  <p className="note" style={{ color: 'var(--fg)', fontFamily: 'var(--f-mono)' }}>
                    {F.sb.d.metarO}<br/>{F.sb.d.metarD}
                  </p>
                </>
              )}

              {F.sb.d.pdf && (
                <>
                  <div className="sh">OFP PDF</div>
                  <div className="row noprint" style={{ marginTop: 10 }}>
                    <button className="btn sm" onClick={() => setShowPdf(!showPdf)}>
                      {showPdf ? 'Hide PDF' : 'Show PDF here'}
                    </button>
                    <a className="btn sm ghost" href={F.sb.d.pdf} target="_blank" rel="noopener noreferrer">
                      Open PDF in new tab ↗
                    </a>
                    <a className="btn sm ghost" href={F.sb.d.pdf} download="OFP.pdf">
                      Download PDF
                    </a>
                  </div>
                  {showPdf && (
                    <iframe 
                      src={F.sb.d.pdf} 
                      title="SimBrief OFP PDF" 
                      className="noprint" 
                      style={{
                        width: '100%',
                        height: '75vh',
                        border: '1px solid var(--line)',
                        borderRadius: '8px',
                        marginTop: 10,
                        background: '#fff'
                      }} 
                    />
                  )}
                </>
              )}

              {F.sb.text && (
                <>
                  <div className="sh">FULL OFP (TEXT)</div>
                  <details style={{ marginTop: 10 }}>
                    <summary className="note noprint" style={{ cursor: 'pointer', margin: '0 0 6px' }}>
                      Show or hide
                    </summary>
                    <pre style={{
                      margin: 0,
                      whiteSpace: 'pre',
                      overflowX: 'auto',
                      maxHeight: '60vh',
                      overflowY: 'auto',
                      font: '12px/1.35 var(--f-mono)',
                      background: 'var(--field)',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}>
                      {F.sb.text}
                    </pre>
                  </details>
                </>
              )}

              {F.sb.fixes && F.sb.fixes.length > 0 && (
                <>
                  <div className="sh">
                    NAVLOG <small>{F.sb.fixes.length} fixes</small>
                  </div>
                  <div className="tw">
                    <table className="t" style={{ minWidth: 520 }}>
                      <thead>
                        <tr>
                          <th>FIX</th>
                          <th>AIRWAY</th>
                          <th>ALT (FT)</th>
                          <th>DIST</th>
                          <th>FUEL ON BOARD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {F.sb.fixes.map((f, i) => (
                          <tr key={i}>
                            <td><b>{f.id}</b></td>
                            <td>{f.awy}</td>
                            <td>{f.alt}</td>
                            <td>{f.dist}</td>
                            <td>{f.fob}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="empty-state">
              No OFP loaded for this flight yet.
            </div>
          )}

          {/* Bottom SimBrief Input Bar */}
          <div className="hist noprint" style={{ marginTop: 20 }}>
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <label className="fld" style={{ minWidth: 240 }}>
                <span>SimBrief username or Pilot ID</span>
                <input 
                  className="f"
                  value={F.sb?.user || ''} 
                  onChange={e => updateFlightPath('sb.user', e.target.value)}
                  placeholder="username or pilot ID"
                />
              </label>
              <button 
                type="button" 
                className="btn" 
                onClick={() => handleFetchOFP()}
                disabled={sbLoading}
              >
                {sbLoading ? 'Fetching...' : (F.sb?.d ? 'Refresh latest OFP' : 'Fetch my latest OFP')}
              </button>
              {F.sb?.d && (
                <>
                  <button 
                    type="button" 
                    className="btn sm ghost"
                    onClick={() => handleFetchOFP(F.sb.user)}
                  >
                    Re-apply to documents (overwrite)
                  </button>
                  <button 
                    type="button" 
                    className="btn sm danger"
                    onClick={() => updateFlightPath('sb', { user: F.sb.user, at: 0, d: null, fixes: [], text: '' })}
                  >
                    Clear OFP
                  </button>
                </>
              )}
            </div>
            <p className="note" style={{ marginTop: 6 }}>
              {sbMsg || 'Generate your flight on SimBrief, then fetch. Route, times, fuel, weights, NOTAMs, weather and the PDF fill your documents automatically.'}
            </p>
          </div>
        </article>
      )}

      {/* STAGE 2: PREFLIGHT */}
      {stage === 'pre' && (
        <article className="sheet" id="sheet" data-doc="preflight">
          <header className="dh">
            <div>
              <h2 className="dt">PRE-FLIGHT OPERATIONAL PACKAGE</h2>
              <p className="ds">BRIEFING · CHECKLIST · ETOPS / ETP PLANNING</p>
            </div>
            <span className="dbadge">{ac.variant || 'A320-200'}</span>
          </header>

          <div className="g">
            <div className="cell"><span className="lab">CALLSIGN</span><input className="f up" value={F.callsign || ''} onChange={e => updateFlightPath('callsign', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">FLIGHT NO.</span><input className="f up" value={F.flightNo || ''} onChange={e => updateFlightPath('flightNo', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">DATE (UTC)</span><input type="date" className="f" value={F.date || ''} onChange={e => updateFlightPath('date', e.target.value)} /></div>
            <div className="cell">
              <span className="lab">NETWORK</span>
              <select className="f" value={F.network || 'VATSIM'} onChange={e => updateFlightPath('network', e.target.value)}>
                <option value="VATSIM">VATSIM</option>
                <option value="IVAO">IVAO</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div className="cell"><span className="lab">DEPARTURE</span><input className="f up" value={F.dep || ''} onChange={e => updateFlightPath('dep', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">ARRIVAL</span><input className="f up" value={F.arr || ''} onChange={e => updateFlightPath('arr', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">ALTERNATE</span><input className="f up" value={F.alt || ''} onChange={e => updateFlightPath('alt', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">AIRCRAFT</span><span className="calc">{ac.reg} · {ac.icao}</span></div>
            <div className="cell"><span className="lab">CRUISE LEVEL</span><input className="f" value={F.pre?.cruise || 'FL350'} onChange={e => updateFlightPath('pre.cruise', e.target.value)} /></div>
            <div className="cell">
              <span className="lab">ETD (Z)</span>
              <div className="tz">
                <input type="time" className="f" value={F.pre?.etd || ''} onChange={e => updateFlightPath('pre.etd', e.target.value)} />
                <button type="button" className="zb noprint" onClick={() => setNowTime('pre.etd')}>Z</button>
              </div>
            </div>
            <div className="cell">
              <span className="lab">ETA (Z)</span>
              <div className="tz">
                <input type="time" className="f" value={F.pre?.eta || ''} onChange={e => updateFlightPath('pre.eta', e.target.value)} />
                <button type="button" className="zb noprint" onClick={() => setNowTime('pre.eta')}>Z</button>
              </div>
            </div>
          </div>

          <div className="g tight" style={{ '--min': '300px' }}>
            <div className="cell">
              <span className="lab">ROUTE</span>
              <textarea 
                className="f ta" 
                rows="2" 
                value={F.pre?.route || ''} 
                onChange={e => updateFlightPath('pre.route', e.target.value)}
                placeholder="Paste the route string from SimBrief"
              />
            </div>
          </div>

          <div className="row noprint" style={{ marginTop: 12 }}>
            <span className="lab" style={{ alignSelf: 'center' }}>Open</span>
            {links.map(l => (
              <a key={l.name} className="btn sm ghost" href={l.url} target="_blank" rel="noopener noreferrer">
                {l.name} ↗
              </a>
            ))}
          </div>

          <div className="sh">
            PRE-FLIGHT CHECKLIST <small>{PRE_ITEMS.filter(([k]) => F.pre?.checks?.[k]).length} / {PRE_ITEMS.length}</small>
          </div>
          <div className="g" style={{ '--min': '340px' }}>
            {PRE_ITEMS.map(([k, t]) => (
              <div key={k}>
                <label className="chk">
                  <input 
                    type="checkbox" 
                    className="ck" 
                    checked={!!F.pre?.checks?.[k]} 
                    onChange={e => updateFlightPath(`pre.checks.${k}`, e.target.checked)}
                  />
                  <span>{t}</span>
                </label>
              </div>
            ))}
          </div>

          <div className="sh">ETOPS &amp; ETP PLANNING</div>
          <div className="g">
            <div className="cell">
              <span className="lab">ETOPS FLIGHT</span>
              <label className="chk">
                <input 
                  type="checkbox" 
                  className="ck" 
                  checked={!!F.pre?.etops?.req} 
                  onChange={e => updateFlightPath('pre.etops.req', e.target.checked)}
                />
                <span>Required</span>
              </label>
            </div>
            <div className="cell"><span className="lab">ETOPS RULE TIME (MIN)</span><input className="f n" value={F.pre?.etops?.rule || ''} onChange={e => updateFlightPath('pre.etops.rule', e.target.value)} /></div>
            <div className="cell"><span className="lab">ETOPS ALTERNATE 1</span><input className="f up" value={F.pre?.etops?.alts?.[0] || ''} onChange={e => updateFlightPath('pre.etops.alts.0', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">ETOPS ALTERNATE 2</span><input className="f up" value={F.pre?.etops?.alts?.[1] || ''} onChange={e => updateFlightPath('pre.etops.alts.1', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">ETOPS ALTERNATE 3</span><input className="f up" value={F.pre?.etops?.alts?.[2] || ''} onChange={e => updateFlightPath('pre.etops.alts.2', e.target.value.toUpperCase())} /></div>
          </div>

          <div className="sh">NOTES</div>
          <div className="g" style={{ '--min': '300px' }}>
            <div className="cell"><span className="lab">FUEL PLAN / OFP NOTES</span><textarea className="f ta" rows="3" value={F.pre?.ofp || ''} onChange={e => updateFlightPath('pre.ofp', e.target.value)} /></div>
            <div className="cell"><span className="lab">NOTAMS</span><textarea className="f ta" rows="3" value={F.pre?.notam || ''} onChange={e => updateFlightPath('pre.notam', e.target.value)} /></div>
            <div className="cell"><span className="lab">WEATHER / ATIS</span><textarea className="f ta" rows="3" value={F.pre?.wx || ''} onChange={e => updateFlightPath('pre.wx', e.target.value)} /></div>
            <div className="cell"><span className="lab">DEPARTURE BRIEFING</span><textarea className="f ta" rows="3" value={F.pre?.brief || ''} onChange={e => updateFlightPath('pre.brief', e.target.value)} placeholder="SID, runway, flex, V-speeds, EOSID" /></div>
          </div>
        </article>
      )}

      {/* STAGE 3: TECH LOG */}
      {stage === 'tech' && (
        <article className="sheet" id="sheet" data-doc="techlog">
          {/* SECTION 1: FLIGHT OPERATIONS & MAINTENANCE RELEASE */}
          <section className="page">
            <header className="dh">
              <div>
                <h2 className="dt">AIRCRAFT TECHNICAL LOGBOOK</h2>
                <p className="ds">SECTION 1: FLIGHT OPERATIONS &amp; MAINTENANCE RELEASE</p>
              </div>
              <span className="dbadge">{ac.variant || 'A320-200'}</span>
            </header>

            <div className="g">
              <div className="cell"><span className="lab">LOGBOOK NO:</span><input className="f" value={F.tech?.logbookNo || 'TLB-2026-01'} onChange={e => updateFlightPath('tech.logbookNo', e.target.value)} /></div>
              <div className="cell"><span className="lab">OPERATOR:</span><input className="f" value={ac.operator || 'Eurowings'} onChange={e => updateFlightPath('ac.operator', e.target.value)} /></div>
              <div className="cell"><span className="lab">REGISTRATION:</span><span className="calc">{ac.reg}</span></div>
            </div>
            <div className="g tight">
              <div className="cell"><span className="lab">AIRCRAFT TYPE</span><span className="calc">{ac.typeLabel}</span></div>
              <div className="cell"><span className="lab">SERIAL NUMBER</span><input className="f" value={ac.serial || '4152'} onChange={e => updateFlightPath('ac.serial', e.target.value)} /></div>
              <div className="cell"><span className="lab">ENGINE TYPE</span><input className="f" value={ac.engine || 'CFM56-5B4'} onChange={e => updateFlightPath('ac.engine', e.target.value)} /></div>
              <div className="cell"><span className="lab">HOME BASE</span><input className="f up" value={ac.base || 'EDDL'} onChange={e => updateFlightPath('ac.base', e.target.value.toUpperCase())} /></div>
            </div>
            <div className="g tight" style={{ '--min': '130px' }}>
              <div className="cell"><span className="lab">TOTAL AIRFRAME HOURS</span><input className="f n" value={F.tech?.hdr?.afHrs || ac.airframeHrs || '171.4'} onChange={e => updateFlightPath('tech.hdr.afHrs', e.target.value)} /></div>
              <div className="cell"><span className="lab">TOTAL LANDINGS</span><input className="f n" value={F.tech?.hdr?.landings || ac.landings || '0'} onChange={e => updateFlightPath('tech.hdr.landings', e.target.value)} /></div>
              <div className="cell"><span className="lab">ENG #1 HOURS</span><input className="f n" value={F.tech?.hdr?.e1 || '0'} onChange={e => updateFlightPath('tech.hdr.e1', e.target.value)} /></div>
              <div className="cell"><span className="lab">ENG #2 HOURS</span><input className="f n" value={F.tech?.hdr?.e2 || '0'} onChange={e => updateFlightPath('tech.hdr.e2', e.target.value)} /></div>
              <div className="cell"><span className="lab">APU HOURS</span><input className="f n" value={F.tech?.hdr?.apu || '0'} onChange={e => updateFlightPath('tech.hdr.apu', e.target.value)} /></div>
            </div>

            <div className="sh" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>PREVIOUS SECTORS · LAST 5 FLIGHTS</span>
              <small style={{ textTransform: 'none' }}>Star Alliance Virtual · {ac.reg} · as of 17 Nov 2026</small>
            </div>
            <p className="note" style={{ margin: '6px 0 10px' }}>
              The last 5 sectors from Star Alliance Virtual are filled into the flight log below, under your active sector. Remarks are drafts, so replace them with what actually applies.
            </p>
            <div className="row noprint" style={{ gap: 8, marginBottom: 12 }}>
              <button type="button" className="btn sm ghost" onClick={handleRefillPastSectors}>
                REFILL PAST SECTORS
              </button>
              <span className="note" style={{ cursor: 'pointer', margin: 0 }}>▶ Update from Star Alliance Virtual</span>
            </div>

            <div className="sh">FLIGHT LOG &amp; SECTOR DETAILS</div>
            <div className="tw">
              <table className="t" style={{ minWidth: 1240 }}>
                <thead>
                  <tr>
                    <th>FLT #</th>
                    <th>DATE</th>
                    <th>DEP</th>
                    <th>ARR</th>
                    <th>OUT</th>
                    <th>OFF</th>
                    <th>ON</th>
                    <th>IN</th>
                    <th>FLT TIME</th>
                    <th>LDGS</th>
                    <th>PILOT IN CMD</th>
                    <th>DISCREPANCY / REMARKS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(F.tech?.flightRows || []).map((row, i) => (
                    <tr key={i} style={row.hist ? { opacity: 0.9 } : {}}>
                      <td>
                        <input
                          className="f up"
                          style={{ minWidth: 80 }}
                          value={row.fltNo || ''}
                          onChange={e => updateFlightPath(`tech.flightRows.${i}.fltNo`, e.target.value.toUpperCase())}
                        />
                      </td>
                      <td>
                        <input
                          className="f"
                          style={{ minWidth: 100 }}
                          value={row.date || ''}
                          onChange={e => updateFlightPath(`tech.flightRows.${i}.date`, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="f up"
                          style={{ width: 56 }}
                          maxLength={4}
                          value={row.dep || ''}
                          onChange={e => updateFlightPath(`tech.flightRows.${i}.dep`, e.target.value.toUpperCase())}
                        />
                      </td>
                      <td>
                        <input
                          className="f up"
                          style={{ width: 56 }}
                          maxLength={4}
                          value={row.arr || ''}
                          onChange={e => updateFlightPath(`tech.flightRows.${i}.arr`, e.target.value.toUpperCase())}
                        />
                      </td>
                      <td>
                        <div className="tz">
                          <input
                            type="time"
                            className="f"
                            value={row.out || ''}
                            onChange={e => updateFlightPath(`tech.flightRows.${i}.out`, e.target.value)}
                          />
                          {!row.hist && (
                            <button type="button" className="zb noprint" onClick={() => setNowTime(`tech.flightRows.${i}.out`)}>Z</button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="tz">
                          <input
                            type="time"
                            className="f"
                            value={row.off || ''}
                            onChange={e => updateFlightPath(`tech.flightRows.${i}.off`, e.target.value)}
                          />
                          {!row.hist && (
                            <button type="button" className="zb noprint" onClick={() => setNowTime(`tech.flightRows.${i}.off`)}>Z</button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="tz">
                          <input
                            type="time"
                            className="f"
                            value={row.on || ''}
                            onChange={e => updateFlightPath(`tech.flightRows.${i}.on`, e.target.value)}
                          />
                          {!row.hist && (
                            <button type="button" className="zb noprint" onClick={() => setNowTime(`tech.flightRows.${i}.on`)}>Z</button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="tz">
                          <input
                            type="time"
                            className="f"
                            value={row.in || ''}
                            onChange={e => updateFlightPath(`tech.flightRows.${i}.in`, e.target.value)}
                          />
                          {!row.hist && (
                            <button type="button" className="zb noprint" onClick={() => setNowTime(`tech.flightRows.${i}.in`)}>Z</button>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="calc">{row.dur || hm(mins(row.off, row.on))}</span>
                      </td>
                      <td>
                        <input
                          className="f n"
                          style={{ width: 36 }}
                          value={row.ldgs || ''}
                          onChange={e => updateFlightPath(`tech.flightRows.${i}.ldgs`, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="f"
                          style={{ minWidth: 110 }}
                          value={row.pic || ''}
                          onChange={e => updateFlightPath(`tech.flightRows.${i}.pic`, e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="f"
                          style={{ minWidth: 260 }}
                          value={row.remarks || ''}
                          onChange={e => updateFlightPath(`tech.flightRows.${i}.remarks`, e.target.value)}
                        />
                      </td>
                      <td>
                        {i > 0 && (
                          <button
                            type="button"
                            className="btn sm danger noprint"
                            style={{ padding: '2px 6px' }}
                            onClick={() => handleRemoveSector(i)}
                            title="Remove sector"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row noprint" style={{ marginTop: 8 }}>
              <button type="button" className="btn sm ghost" onClick={handleAddSector}>
                + ADD SECTOR
              </button>
            </div>

            <div className="sh">FUEL &amp; FLUID MANAGEMENT</div>
            <div className="tw">
              <table className="t" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>STATION</th>
                    <th>UPLIFT (GAL/LBS)</th>
                    <th>DEPART FUEL</th>
                    <th>ARRIVE FUEL</th>
                    <th>OIL ADDED (ENG 1)</th>
                    <th>OIL ADDED (ENG 2)</th>
                    <th>HYD FLUID</th>
                    <th>SIGNATURE</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(F.tech?.fuelRows || []).map((row, i) => (
                    <tr key={i}>
                      <td><input className="f up" value={row.station || ''} onChange={e => updateFlightPath(`tech.fuelRows.${i}.station`, e.target.value.toUpperCase())} /></td>
                      <td><input className="f n" value={row.uplift || ''} onChange={e => updateFlightPath(`tech.fuelRows.${i}.uplift`, e.target.value)} /></td>
                      <td><input className="f n" value={row.depFuel || ''} onChange={e => updateFlightPath(`tech.fuelRows.${i}.depFuel`, e.target.value)} /></td>
                      <td><input className="f n" value={row.arrFuel || ''} onChange={e => updateFlightPath(`tech.fuelRows.${i}.arrFuel`, e.target.value)} /></td>
                      <td><input className="f n" value={row.oil1 || ''} onChange={e => updateFlightPath(`tech.fuelRows.${i}.oil1`, e.target.value)} /></td>
                      <td><input className="f n" value={row.oil2 || ''} onChange={e => updateFlightPath(`tech.fuelRows.${i}.oil2`, e.target.value)} /></td>
                      <td><input className="f n" value={row.hyd || ''} onChange={e => updateFlightPath(`tech.fuelRows.${i}.hyd`, e.target.value)} /></td>
                      <td><input className="f" value={row.sig || ''} onChange={e => updateFlightPath(`tech.fuelRows.${i}.sig`, e.target.value)} /></td>
                      <td>
                        {i > 0 && (
                          <button
                            type="button"
                            className="btn sm danger noprint"
                            style={{ padding: '2px 6px' }}
                            onClick={() => handleRemoveFuelStation(i)}
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row noprint" style={{ marginTop: 8 }}>
              <button type="button" className="btn sm ghost" onClick={handleAddFuelStation}>
                + ADD STATION
              </button>
            </div>

            <div className="sh">CERTIFICATE OF RELEASE TO SERVICE (CRS)</div>
            <p className="note" style={{ color: 'var(--fg)' }}>
              Certifies that the work specified, except as otherwise stated, was carried out in accordance with applicable aviation authority maintenance standards and regulations, and in respect to that work, the aircraft is considered ready for release to service.
            </p>
            <div className="g">
              <div className="cell"><span className="lab">CERTIFYING STAFF SIGNATURE</span><input className="f" value={F.tech?.crs?.sig || 'A. Mazhar (AME)'} onChange={e => updateFlightPath('tech.crs.sig', e.target.value)} /></div>
              <div className="cell"><span className="lab">LICENCE / CERT NUMBER</span><input className="f" value={F.tech?.crs?.lic || 'GACA-AME-88412'} onChange={e => updateFlightPath('tech.crs.lic', e.target.value)} /></div>
              <div className="cell"><span className="lab">AMO / FACILITY REF</span><input className="f" value={F.tech?.crs?.amo || 'SAUDIA TECH-EDDL'} onChange={e => updateFlightPath('tech.crs.amo', e.target.value)} /></div>
              <div className="cell"><span className="lab">DATE &amp; UTC TIME</span><input className="f" value={F.tech?.crs?.dt || `17 NOV 2026 1621Z`} onChange={e => updateFlightPath('tech.crs.dt', e.target.value)} /></div>
            </div>
            <div className="foot">
              <span>AIRCRAFT TECHNICAL LOGBOOK — DIGITAL COPY</span>
              <span>CONFIDENTIAL &amp; PROPRIETARY</span>
              <span>Page 1 of 3</span>
            </div>
          </section>

          {/* SECTION 2: MAINTENANCE DISCREPANCY & ACTION LOG */}
          <section className="page" style={{ marginTop: 24 }}>
            <header className="dh">
              <div>
                <h2 className="dt">SECTION 2: MAINTENANCE DISCREPANCY &amp; ACTION LOG</h2>
                <p className="ds">AIRCRAFT TECHNICAL LOGBOOK</p>
              </div>
              <span className="dbadge">{ac.variant || 'A320-200'}</span>
            </header>

            <div className="tw" style={{ marginTop: 12 }}>
              <table className="t" style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th>ITEM #</th>
                    <th>LOG DATE</th>
                    <th>DISCREPANCY / DEFECT DESCRIPTION</th>
                    <th>CORRECTIVE ACTION / ACTION TAKEN</th>
                    <th>A&amp;P CERT</th>
                    <th>STATUS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(F.tech?.defects || []).length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--mute)', padding: '16px' }}>No discrepancies logged.</td></tr>
                  ) : (
                    (F.tech?.defects || []).map((d, i) => (
                      <tr key={i}>
                        <td style={{ width: 70 }}><input className="f n" value={d.item || String(i + 1)} onChange={e => updateFlightPath(`tech.defects.${i}.item`, e.target.value)} /></td>
                        <td style={{ width: 120 }}><input className="f" value={d.date || ''} onChange={e => updateFlightPath(`tech.defects.${i}.date`, e.target.value)} /></td>
                        <td><input className="f" style={{ minWidth: 260 }} value={d.desc || ''} onChange={e => updateFlightPath(`tech.defects.${i}.desc`, e.target.value)} /></td>
                        <td><input className="f" style={{ minWidth: 260 }} value={d.action || ''} onChange={e => updateFlightPath(`tech.defects.${i}.action`, e.target.value)} /></td>
                        <td style={{ width: 120 }}><input className="f" value={d.cert || ''} onChange={e => updateFlightPath(`tech.defects.${i}.cert`, e.target.value)} /></td>
                        <td style={{ width: 100 }}>
                          <select className="f sel" value={d.status || 'Cleared'} onChange={e => updateFlightPath(`tech.defects.${i}.status`, e.target.value)}>
                            <option value="Open">Open</option>
                            <option value="Deferred">Deferred</option>
                            <option value="Cleared">Cleared</option>
                          </select>
                        </td>
                        <td>
                          <button type="button" className="btn sm danger noprint" style={{ padding: '2px 6px' }} onClick={() => handleRemoveDefect(i)}>✕</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="row noprint" style={{ marginTop: 8 }}>
              <button type="button" className="btn sm ghost" onClick={handleAddDefect}>
                + ADD DISCREPANCY
              </button>
            </div>

            <div className="sh">DEFERRED MAINTENANCE ITEMS (MEL / CDL TRACK)</div>
            <div className="tw">
              <table className="t" style={{ minWidth: 960 }}>
                <thead>
                  <tr>
                    <th>MEL/CDL REF</th>
                    <th>ITEM #</th>
                    <th>SYSTEM / RESTRICTION</th>
                    <th>CAT</th>
                    <th>DEFER DATE</th>
                    <th>EXPIRY DATE</th>
                    <th>ACTION / SIGN-OFF</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(F.tech?.mel || []).length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--mute)', padding: '16px' }}>No deferred items.</td></tr>
                  ) : (
                    (F.tech?.mel || []).map((m, i) => (
                      <tr key={i}>
                        <td><input className="f up" value={m.ref || ''} onChange={e => updateFlightPath(`tech.mel.${i}.ref`, e.target.value.toUpperCase())} /></td>
                        <td><input className="f n" style={{ width: 50 }} value={m.item || String(i + 1)} onChange={e => updateFlightPath(`tech.mel.${i}.item`, e.target.value)} /></td>
                        <td><input className="f" style={{ minWidth: 200 }} value={m.sys || ''} onChange={e => updateFlightPath(`tech.mel.${i}.sys`, e.target.value)} /></td>
                        <td style={{ width: 60 }}>
                          <select className="f sel" value={m.cat || 'C'} onChange={e => updateFlightPath(`tech.mel.${i}.cat`, e.target.value)}>
                            <option value=""></option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </td>
                        <td><input className="f" value={m.defer || ''} onChange={e => updateFlightPath(`tech.mel.${i}.defer`, e.target.value)} /></td>
                        <td><input className="f" value={m.expiry || ''} onChange={e => updateFlightPath(`tech.mel.${i}.expiry`, e.target.value)} /></td>
                        <td><input className="f" value={m.sign || ''} onChange={e => updateFlightPath(`tech.mel.${i}.sign`, e.target.value)} /></td>
                        <td>
                          <button type="button" className="btn sm danger noprint" style={{ padding: '2px 6px' }} onClick={() => handleRemoveMel(i)}>✕</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="row noprint" style={{ marginTop: 8 }}>
              <button type="button" className="btn sm ghost" onClick={handleAddMel}>
                + ADD DEFERRED ITEM
              </button>
            </div>

            <div className="sh">WORK ORDER &amp; MAJOR COMPONENT REPLACEMENT SUMMARY</div>
            <div className="tw">
              <table className="t" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>WO NUMBER</th>
                    <th>SYSTEM / ATA CHAPTER</th>
                    <th>REMOVED COMPONENT (P/N &amp; S/N)</th>
                    <th>INSTALLED COMPONENT (P/N &amp; S/N)</th>
                    <th>RELEASE FORM</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(F.tech?.wo || []).length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--mute)', padding: '16px' }}>No work orders.</td></tr>
                  ) : (
                    (F.tech?.wo || []).map((w, i) => (
                      <tr key={i}>
                        <td><input className="f up" value={w.no || ''} onChange={e => updateFlightPath(`tech.wo.${i}.no`, e.target.value.toUpperCase())} /></td>
                        <td><input className="f" value={w.sys || ''} onChange={e => updateFlightPath(`tech.wo.${i}.sys`, e.target.value)} /></td>
                        <td><input className="f" value={w.removed || ''} onChange={e => updateFlightPath(`tech.wo.${i}.removed`, e.target.value)} /></td>
                        <td><input className="f" value={w.installed || ''} onChange={e => updateFlightPath(`tech.wo.${i}.installed`, e.target.value)} /></td>
                        <td><input className="f" value={w.form || ''} onChange={e => updateFlightPath(`tech.wo.${i}.form`, e.target.value)} /></td>
                        <td>
                          <button type="button" className="btn sm danger noprint" style={{ padding: '2px 6px' }} onClick={() => handleRemoveWorkOrder(i)}>✕</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="row noprint" style={{ marginTop: 8 }}>
              <button type="button" className="btn sm ghost" onClick={handleAddWorkOrder}>
                + ADD WORK ORDER
              </button>
            </div>

            <div className="sh">TECHNICAL LOGBOOK SECTION 2 COMPLIANCE STATEMENT</div>
            <p className="note" style={{ color: 'var(--fg)', marginTop: 8 }}>
              All discrepancies logged during operations must be addressed, deferred in strict accordance with the Minimum Equipment List (MEL) / Configuration Deviation List (CDL), or cleared by licensed maintenance personnel prior to flight authorization.
            </p>
            <div className="foot">
              <span>AIRCRAFT TECHNICAL LOGBOOK — DIGITAL COPY</span>
              <span>SECTION 2: DISCREPANCIES &amp; DEFECTS</span>
              <span>Page 2 of 3</span>
            </div>
          </section>

          {/* SECTION 3: SCHEDULED INSPECTION STATUS & DIRECTIVE TRACKING */}
          <section className="page" style={{ marginTop: 24 }}>
            <header className="dh">
              <div>
                <h2 className="dt">SECTION 3: SCHEDULED INSPECTION STATUS &amp; DIRECTIVE TRACKING</h2>
                <p className="ds">AIRCRAFT TECHNICAL LOGBOOK</p>
              </div>
              <span className="dbadge">{ac.variant || 'A320-200'}</span>
            </header>

            <div className="lab" style={{ marginTop: 12 }}>INSPECTION / CHECK</div>
            <div className="tw">
              <table className="t" style={{ minWidth: 760 }}>
                <thead>
                  <tr>
                    <th>INSPECTION / CHECK</th>
                    <th>INTERVAL</th>
                    <th>LAST DONE (HRS/DATE)</th>
                    <th>NEXT DUE (HRS/DATE)</th>
                    <th>REMAINING</th>
                    <th>STATUS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(F.tech?.insp || []).map((ins, i) => (
                    <tr key={i}>
                      <td><input className="f" value={ins.check || ''} onChange={e => updateFlightPath(`tech.insp.${i}.check`, e.target.value)} /></td>
                      <td><input className="f" value={ins.interval || ''} onChange={e => updateFlightPath(`tech.insp.${i}.interval`, e.target.value)} /></td>
                      <td><input className="f" value={ins.last || ''} onChange={e => updateFlightPath(`tech.insp.${i}.last`, e.target.value)} /></td>
                      <td><input className="f" value={ins.next || ''} onChange={e => updateFlightPath(`tech.insp.${i}.next`, e.target.value)} /></td>
                      <td><input className="f" value={ins.rem || ''} onChange={e => updateFlightPath(`tech.insp.${i}.rem`, e.target.value)} /></td>
                      <td><input className="f up" value={ins.status || ''} onChange={e => updateFlightPath(`tech.insp.${i}.status`, e.target.value.toUpperCase())} /></td>
                      <td>
                        <button type="button" className="btn sm danger noprint" style={{ padding: '2px 6px' }} onClick={() => handleRemoveInspRow(i)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row noprint" style={{ marginTop: 8 }}>
              <button type="button" className="btn sm ghost" onClick={handleAddInspRow}>
                + ADD ROW
              </button>
            </div>

            <div className="lab" style={{ marginTop: 16 }}>AIRWORTHINESS DIRECTIVES (ADS) &amp; SERVICE BULLETINS (SBS)</div>
            <div className="tw">
              <table className="t" style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th>AD / SB REF</th>
                    <th>EFFECTIVITY</th>
                    <th>SUBJECT / REQUIREMENT</th>
                    <th>COMPLIANCE METHOD</th>
                    <th>NEXT DUE</th>
                    <th>STATUS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(F.tech?.ads || []).length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--mute)', padding: '16px' }}>No rows yet.</td></tr>
                  ) : (
                    (F.tech?.ads || []).map((ad, i) => (
                      <tr key={i}>
                        <td><input className="f up" value={ad.ref || ''} onChange={e => updateFlightPath(`tech.ads.${i}.ref`, e.target.value.toUpperCase())} /></td>
                        <td><input className="f" value={ad.eff || ''} onChange={e => updateFlightPath(`tech.ads.${i}.eff`, e.target.value)} /></td>
                        <td><input className="f" value={ad.subject || ''} onChange={e => updateFlightPath(`tech.ads.${i}.subject`, e.target.value)} /></td>
                        <td><input className="f" value={ad.method || ''} onChange={e => updateFlightPath(`tech.ads.${i}.method`, e.target.value)} /></td>
                        <td><input className="f" value={ad.next || ''} onChange={e => updateFlightPath(`tech.ads.${i}.next`, e.target.value)} /></td>
                        <td><input className="f up" value={ad.status || ''} onChange={e => updateFlightPath(`tech.ads.${i}.status`, e.target.value.toUpperCase())} /></td>
                        <td>
                          <button type="button" className="btn sm danger noprint" style={{ padding: '2px 6px' }} onClick={() => handleRemoveAdRow(i)}>✕</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="row noprint" style={{ marginTop: 8 }}>
              <button type="button" className="btn sm ghost" onClick={handleAddAdRow}>
                + ADD ROW
              </button>
            </div>

            <div className="lab" style={{ marginTop: 16 }}>COMPONENT LIFE-LIMIT &amp; ENGINE TREND TRACKING</div>
            <div className="tw">
              <table className="t" style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th>COMPONENT</th>
                    <th>PART NUMBER</th>
                    <th>SERIAL NUMBER</th>
                    <th>LIFE LIMIT</th>
                    <th>ACCUMULATED</th>
                    <th>REMAINING</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(F.tech?.life || []).length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--mute)', padding: '16px' }}>No rows yet.</td></tr>
                  ) : (
                    (F.tech?.life || []).map((li, i) => (
                      <tr key={i}>
                        <td><input className="f" value={li.comp || ''} onChange={e => updateFlightPath(`tech.life.${i}.comp`, e.target.value)} /></td>
                        <td><input className="f up" value={li.pn || ''} onChange={e => updateFlightPath(`tech.life.${i}.pn`, e.target.value.toUpperCase())} /></td>
                        <td><input className="f up" value={li.sn || ''} onChange={e => updateFlightPath(`tech.life.${i}.sn`, e.target.value.toUpperCase())} /></td>
                        <td><input className="f" value={li.limit || ''} onChange={e => updateFlightPath(`tech.life.${i}.limit`, e.target.value)} /></td>
                        <td><input className="f" value={li.acc || ''} onChange={e => updateFlightPath(`tech.life.${i}.acc`, e.target.value)} /></td>
                        <td><input className="f" value={li.rem || ''} onChange={e => updateFlightPath(`tech.life.${i}.rem`, e.target.value)} /></td>
                        <td>
                          <button type="button" className="btn sm danger noprint" style={{ padding: '2px 6px' }} onClick={() => handleRemoveLifeRow(i)}>✕</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="row noprint" style={{ marginTop: 8 }}>
              <button type="button" className="btn sm ghost" onClick={handleAddLifeRow}>
                + ADD ROW
              </button>
            </div>

            <div className="sh">LOGBOOK AUDIT &amp; ARCHIVAL STATUS</div>
            <div className="g">
              <div className="cell"><span className="lab">INSPECTOR SIG / STAMP</span><input className="f" value={F.tech?.audit?.sig || 'EASA Part-66 / QA-4481'} onChange={e => updateFlightPath('tech.audit.sig', e.target.value)} /></div>
              <div className="cell"><span className="lab">QUALITY ASSURANCE APPROVAL</span><input className="f" value={F.tech?.audit?.qa || 'CERT-CRS-EDDL-2026'} onChange={e => updateFlightPath('tech.audit.qa', e.target.value)} /></div>
              <div className="cell"><span className="lab">FACILITY CERT REF</span><input className="f" value={F.tech?.audit?.cert || 'EDDL-MRO-A320'} onChange={e => updateFlightPath('tech.audit.cert', e.target.value)} /></div>
            </div>
            <p className="note noprint" style={{ marginTop: 12 }}>
              Section 3 belongs to the aircraft, so these entries are shared by every flight on {ac.reg}.
            </p>
            <div className="foot">
              <span>AIRCRAFT TECHNICAL LOGBOOK — DIGITAL COPY</span>
              <span>SECTION 3: SCHEDULED MAINTENANCE &amp; ADS</span>
              <span>Page 3 of 3</span>
            </div>
          </section>
        </article>
      )}

      {/* STAGE 4: FUEL VOUCHER */}
      {stage === 'fuel' && (
        <article className="sheet" id="sheet" data-doc="fuel">
          <header className="dh">
            <div>
              <h2 className="dt">AVIATION FUEL DELIVERY VOUCHER</h2>
              <p className="ds">{P.fvSub} — {ac.typeLabel?.toUpperCase()}</p>
            </div>
            <span className="dbadge">{ac.variant || 'A320-200'}</span>
          </header>

          <div className="g" style={{ '--min': '230px' }}>
            <div className="cell"><span className="lab">Voucher No:</span><input className="f" value={FU.voucherNo || `${tpl.toUpperCase()}-FDV-0001`} onChange={e => updateFlightPath('fuel.voucherNo', e.target.value)} /></div>
            <div className="cell"><span className="lab">Date:</span><input type="date" className="f" value={FU.date || F.date} onChange={e => updateFlightPath('fuel.date', e.target.value)} /></div>
            <div className="cell">
              <span className="lab">Units:</span>
              <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                <select className="f" value={FU.massUnit || 'KG'} onChange={e => updateFlightPath('fuel.massUnit', e.target.value)}>
                  <option value="KG">KG</option>
                  <option value="LBS">LBS</option>
                </select>
                <select className="f" value={FU.volUnit || 'L'} onChange={e => updateFlightPath('fuel.volUnit', e.target.value)}>
                  <option value="L">Litres</option>
                  <option value="USG">US gal</option>
                </select>
              </div>
            </div>
          </div>

          <div className="g tight">
            <div className="cell"><span className="lab">OPERATOR / AIRLINE</span><input className="f" value={ac.operator || ''} onChange={e => updateFlightPath('ac.operator', e.target.value)} /></div>
            <div className="cell"><span className="lab">FLIGHT NUMBER</span><input className="f up" value={F.flightNo || F.callsign || ''} onChange={e => updateFlightPath('flightNo', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">AIRCRAFT REG.</span><input className="f up" value={F.ac?.reg || ac.reg || ''} onChange={e => updateFlightPath('ac.reg', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">AIRCRAFT TYPE</span><input className="f" value={F.ac?.typeLabel || ac.typeLabel || ''} onChange={e => updateFlightPath('ac.typeLabel', e.target.value)} /></div>
          </div>
          <div className="g tight">
            <div className="cell"><span className="lab">ICAO / IATA STATION</span><input className="f up" value={FU.station || F.dep || ''} onChange={e => updateFlightPath('fuel.station', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">PARKING BAY</span><input className="f" value={FU.gate || 'Gate 22'} onChange={e => updateFlightPath('fuel.gate', e.target.value)} /></div>
            <div className="cell"><span className="lab">FUEL TANKER / HYDRANT</span><input className="f" value={FU.dispenser || 'HYD-04'} onChange={e => updateFlightPath('fuel.dispenser', e.target.value)} /></div>
            <div className="cell"><span className="lab">BATCH / CONTROL NO.</span><input className="f" value={FU.bowser || 'BATCH-8821'} onChange={e => updateFlightPath('fuel.bowser', e.target.value)} /></div>
          </div>

          <div className="sh" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>1. ECAM / FUEL PANEL DISTRIBUTION RECORD ({u} / {vu})</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'none', fontSize: '11px' }}>
              <span>MAX CAPACITY:</span>
              <input className="f n" style={{ width: 80, padding: '2px 4px', fontSize: '11px' }} value={ac.fuelCap || ''} placeholder={f0(P.fuelCap)} onChange={e => updateFlightPath('ac.fuelCap', e.target.value)} />
              <span>KG</span>
            </div>
          </div>
          <div className="tanks">
            {(ac.tanks || []).map((t, i) => (
              <div key={i} className="tank">
                <input className="f" style={{ fontWeight: 700, fontSize: '12px', marginBottom: 2 }} value={t.name || ''} onChange={e => updateFlightPath(`ac.tanks.${i}.name`, e.target.value)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
                  <small style={{ fontSize: '10px' }}>Max:</small>
                  <input className="f n" style={{ width: 65, padding: '1px 3px', fontSize: '11px' }} value={t.max || ''} placeholder="kg" onChange={e => updateFlightPath(`ac.tanks.${i}.max`, e.target.value)} />
                  <small style={{ fontSize: '10px' }}>kg</small>
                </div>
                <div className="two">
                  <label>
                    Arr
                    <input 
                      className="f n" 
                      value={FU.tanks?.[i]?.arr || ''} 
                      onChange={e => updateFlightPath(`fuel.tanks.${i}.arr`, e.target.value)}
                    />
                  </label>
                  <label>
                    Dep
                    <input 
                      className="f n" 
                      value={FU.tanks?.[i]?.dep || ''} 
                      onChange={e => updateFlightPath(`fuel.tanks.${i}.dep`, e.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="sh">2. METER LOG &amp; DELIVERED VOLUME</div>
          <div className="tw">
            <table className="t" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>METER STAGE</th>
                  <th>VOLUME DELIVERED ({vu})</th>
                  <th>FUEL TEMP (°C)</th>
                  <th>STANDARD DENSITY (KG/L)</th>
                  <th>CALCULATED WEIGHT ({u})</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="lbl">Meter Reading After Refueling</td>
                  <td><input className="f n" value={FU.fin?.g || ''} onChange={e => updateFlightPath('fuel.fin.g', e.target.value)} /></td>
                  <td><input className="f n" value={FU.fin?.t || '15'} onChange={e => updateFlightPath('fuel.fin.t', e.target.value)} /></td>
                  <td><input className="f n" value={FU.fin?.d || '0.800'} onChange={e => updateFlightPath('fuel.fin.d', e.target.value)} /></td>
                  <td><span className="calc">{f0(calcMeterUplift)}</span></td>
                </tr>
                <tr>
                  <td className="lbl">Meter Reading Before Refueling</td>
                  <td><input className="f n" value={FU.ini?.g || ''} onChange={e => updateFlightPath('fuel.ini.g', e.target.value)} /></td>
                  <td><input className="f n" value={FU.ini?.t || '15'} onChange={e => updateFlightPath('fuel.ini.t', e.target.value)} /></td>
                  <td><input className="f n" value={FU.ini?.d || '0.800'} onChange={e => updateFlightPath('fuel.ini.d', e.target.value)} /></td>
                  <td><span className="calc">0</span></td>
                </tr>
                <tr>
                  <td className="lbl">Net Delivered Volume &amp; Mass</td>
                  <td><input className="f n" placeholder={f0(calcNetVol)} value={FU.netVol || ''} onChange={e => updateFlightPath('fuel.netVol', e.target.value)} /></td>
                  <td><input className="f n" placeholder="15" value={FU.sampleTemp !== undefined ? FU.sampleTemp : (FU.fin?.t || '')} onChange={e => updateFlightPath('fuel.sampleTemp', e.target.value)} /></td>
                  <td><input className="f n" placeholder={dens.toFixed(3)} value={FU.dens || ''} onChange={e => updateFlightPath('fuel.dens', e.target.value)} /></td>
                  <td><input className="f n" style={{ fontWeight: 700 }} placeholder={f0(finalUplift)} value={FU.upMan || ''} onChange={e => updateFlightPath('fuel.upMan', e.target.value)} /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="sh">3. FLIGHT DECK FUEL CROSS-CHECK (FOB VS METERED)</div>
          <div className="g" style={{ '--min': '230px' }}>
            <div className="cell"><span className="lab">Arrival FOB (ECAM):</span><input className="f n" value={FU.arrFob || ''} onChange={e => updateFlightPath('fuel.arrFob', e.target.value)} /></div>
            <div className="cell"><span className="lab">Metered Fuel Uplift:</span><input className="f n" placeholder={f0(calcMeterUplift || FU.required)} value={FU.upMan || ''} onChange={e => updateFlightPath('fuel.upMan', e.target.value)} /></div>
            <div className="cell"><span className="lab">Block Fuel Required:</span><input className="f n" value={FU.required || ''} onChange={e => updateFlightPath('fuel.required', e.target.value)} /></div>
            <div className="cell"><span className="lab">Departure FOB (ECAM):</span><input className="f n" value={FU.actualDep || ''} onChange={e => updateFlightPath('fuel.actualDep', e.target.value)} /></div>
            <div className="cell"><span className="lab">Expected Departure FOB:</span><input className="f n" placeholder={f0(calcExpectedDepFOB)} value={FU.expDep || ''} onChange={e => updateFlightPath('fuel.expDep', e.target.value)} /></div>
            <div className="cell"><span className="lab">Discrepancy Amount:</span><input className="f n" placeholder={(calcVarianceFOB > 0 ? '+' : '') + f0(calcVarianceFOB)} value={FU.variance || ''} onChange={e => updateFlightPath('fuel.variance', e.target.value)} /></div>
            <div className="cell">
              <span className="lab">Fuel Discrepancy Check (&lt; 400 kg):</span>
              <span className={`pill ${Math.abs(varianceFOB) < 400 ? 'ok' : 'bad'}`}>
                {Math.abs(varianceFOB) < 400 ? 'Difference < 400 kg, acceptable' : 'Difference ≥ 400 kg, check'}
              </span>
            </div>
          </div>

          <div className="sign">
            <div>
              <h4>FUEL SUPPLIER / TECHNICIAN</h4>
              <div className="cell"><span className="lab">Name / ID</span><input className="f" value={FU.sig?.[0]?.name ?? 'T. Schmidt (Shell Fuel)'} onChange={e => updateFlightPath('fuel.sig.0.name', e.target.value)} /></div>
              <div className="cell"><span className="lab">Sign &amp; Date</span><input className="f" value={FU.sig?.[0]?.sign ?? 'T. Schmidt · 17/11/2026'} onChange={e => updateFlightPath('fuel.sig.0.sign', e.target.value)} /></div>
            </div>
            <div>
              <h4>GROUND HANDLING ENGINEER</h4>
              <div className="cell"><span className="lab">Licence No</span><input className="f" value={FU.sig?.[1]?.name ?? 'GACA-AME-88412'} onChange={e => updateFlightPath('fuel.sig.1.name', e.target.value)} /></div>
              <div className="cell"><span className="lab">Sign &amp; Date</span><input className="f" value={FU.sig?.[1]?.sign ?? 'A. Mazhar · 17/11/2026'} onChange={e => updateFlightPath('fuel.sig.1.sign', e.target.value)} /></div>
            </div>
            <div>
              <h4>COMMANDER / PILOT FLYING</h4>
              <div className="cell"><span className="lab">Staff ID</span><input className="f" value={FU.sig?.[2]?.name ?? 'EW-8890'} onChange={e => updateFlightPath('fuel.sig.2.name', e.target.value)} /></div>
              <div className="cell"><span className="lab">Sign &amp; Date</span><input className="f" value={FU.sig?.[2]?.sign ?? 'Capt. Afnan Mazhar · 17/11/2026'} onChange={e => updateFlightPath('fuel.sig.2.sign', e.target.value)} /></div>
            </div>
          </div>
        </article>
      )}

      {/* STAGE 5: LOADSHEET & TRIM */}
      {stage === 'load' && (
        <article className="sheet" id="sheet" data-doc="loadsheet">
          <header className="dh">
            <div>
              <h2 className="dt">LOADSHEET &amp; TRIM SHEET</h2>
              <p className="ds">{ac.typeLabel?.toUpperCase()} {P.cat}</p>
            </div>
            <span className="dbadge">{ac.variant || 'A320-200'}</span>
          </header>

          <div className="g">
            <div className="cell"><span className="lab">FLIGHT NO.</span><input className="f up" value={F.flightNo || F.callsign || ''} onChange={e => updateFlightPath('flightNo', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">DATE</span><input type="date" className="f" value={F.date || ''} onChange={e => updateFlightPath('date', e.target.value)} /></div>
            <div className="cell">
              <span className="lab">ROUTE</span>
              <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                <input className="f up" style={{ width: 85 }} value={F.dep || ''} onChange={e => updateFlightPath('dep', e.target.value.toUpperCase())} placeholder="DEP" />
                <span>→</span>
                <input className="f up" style={{ width: 85 }} value={F.arr || ''} onChange={e => updateFlightPath('arr', e.target.value.toUpperCase())} placeholder="ARR" />
              </div>
            </div>
          </div>
          <div className="g tight">
            <div className="cell"><span className="lab">AIRCRAFT REG</span><input className="f up" value={F.ac?.reg || ac.reg || ''} onChange={e => updateFlightPath('ac.reg', e.target.value.toUpperCase())} /></div>
            <div className="cell"><span className="lab">CONFIG</span><input className="f" value={ac.config || P.config || 'Y180'} onChange={e => updateFlightPath('ac.config', e.target.value)} /></div>
            <div className="cell"><span className="lab">PREPARED BY</span><input className="f" value={L.preparedBy || 'Dispatch / Loadmaster'} onChange={e => updateFlightPath('load.preparedBy', e.target.value)} /></div>
          </div>

          <div className="g" style={{ '--min': '360px', border: 0, marginTop: 0, gap: '0 22px' }}>
            <div style={{ border: 0, padding: 0 }}>
              <div className="sh">1. WEIGHT CALCULATIONS (KG)</div>
              <div className="tw" style={{ marginTop: 0 }}>
                <table className="t" style={{ minWidth: 320 }}>
                  <thead>
                    <tr><th>ITEM / DESCRIPTION</th><th>WEIGHT (KG)</th></tr>
                  </thead>
                  <tbody>
                    <tr><td className="lbl">Basic Empty Weight (BEW)</td><td><input className="f n" value={L.bew || ''} placeholder="42,600" onChange={e => updateFlightPath('load.bew', e.target.value)} /></td></tr>
                    <tr><td className="lbl">Pantry / Catering / Crew</td><td><input className="f n" value={L.pantry || '0'} onChange={e => updateFlightPath('load.pantry', e.target.value)} /></td></tr>
                    <tr><td className="lbl"><b>Dry Operating Weight (DOW)</b></td><td><input className="f n" style={{ fontWeight: 700 }} placeholder={f0(calcDow)} value={L.dow || ''} onChange={e => updateFlightPath('load.dow', e.target.value)} /></td></tr>
                    <tr>
                      <td className="lbl">
                        Passenger Weight
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <small>Pax:</small>
                          <input className="f n" style={{ width: 55, padding: '1px 3px', fontSize: '11px' }} value={L.paxCount || ''} placeholder={String(paxCount)} onChange={e => updateFlightPath('load.paxCount', e.target.value)} />
                          <small>×</small>
                          <input className="f n" style={{ width: 45, padding: '1px 3px', fontSize: '11px' }} value={L.paxAvg || '84'} onChange={e => updateFlightPath('load.paxAvg', e.target.value)} />
                          <small>kg</small>
                        </div>
                      </td>
                      <td><input className="f n" placeholder={f0(calcPaxWt)} value={L.paxWt || ''} onChange={e => updateFlightPath('load.paxWt', e.target.value)} /></td>
                    </tr>
                    <tr><td className="lbl">Cargo / Luggage (Hold 1 + 2)</td><td><input className="f n" placeholder={f0(calcC1)} value={L.c1 || ''} onChange={e => updateFlightPath('load.c1', e.target.value)} /></td></tr>
                    <tr><td className="lbl">Cargo / Luggage (Hold 3 + 4 + 5)</td><td><input className="f n" placeholder={f0(calcC2)} value={L.c2 || ''} onChange={e => updateFlightPath('load.c2', e.target.value)} /></td></tr>
                    <tr><td className="lbl"><b>Total Payload</b></td><td><input className="f n" style={{ fontWeight: 700 }} placeholder={f0(calcPayload)} value={L.payload || ''} onChange={e => updateFlightPath('load.payload', e.target.value)} /></td></tr>
                    <tr><td className="lbl"><b>Zero Fuel Weight (ZFW)</b></td><td><input className="f n" style={{ fontWeight: 700 }} placeholder={f0(calcZfw)} value={L.zfw || ''} onChange={e => updateFlightPath('load.zfw', e.target.value)} /></td></tr>
                    <tr><td className="lbl">Block Fuel</td><td><input className="f n" value={L.block || ''} onChange={e => updateFlightPath('load.block', e.target.value)} /></td></tr>
                    <tr><td className="lbl">Taxi Fuel (Std: {ac.taxiFuel || P.taxi} kg)</td><td><input className="f n" value={L.taxi || ''} onChange={e => updateFlightPath('load.taxi', e.target.value)} /></td></tr>
                    <tr><td className="lbl"><b>Take-off Fuel (TOF)</b></td><td><input className="f n" style={{ fontWeight: 700 }} placeholder={f0(calcTof)} value={L.tof || ''} onChange={e => updateFlightPath('load.tof', e.target.value)} /></td></tr>
                    <tr><td className="lbl"><b>Take-off Weight (TOW)</b></td><td><input className="f n" style={{ fontWeight: 700 }} placeholder={f0(calcTow)} value={L.tow || ''} onChange={e => updateFlightPath('load.tow', e.target.value)} /></td></tr>
                    <tr><td className="lbl">Trip Fuel</td><td><input className="f n" value={L.trip || ''} onChange={e => updateFlightPath('load.trip', e.target.value)} /></td></tr>
                    <tr><td className="lbl"><b>Landing Weight (LAW)</b></td><td><input className="f n" style={{ fontWeight: 700 }} placeholder={f0(calcLaw)} value={L.law || ''} onChange={e => updateFlightPath('load.law', e.target.value)} /></td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ border: 0, padding: 0 }}>
              <div className="sh">2. STRUCTURAL LIMITATIONS</div>
              <div className="tw" style={{ marginTop: 0 }}>
                <table className="t" style={{ minWidth: 320 }}>
                  <thead>
                    <tr><th>MAXIMUM CERTIFIED LIMITS</th><th>LIMIT (KG)</th><th>CHECK</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="lbl">Max Ramp Weight (MRW):</td>
                      <td><input className="f n" style={{ width: 95 }} value={ac.limits?.mrw ?? mrwLim} onChange={e => updateFlightPath('ac.limits.mrw', e.target.value)} /></td>
                      <td><span className={`pill ${ramp <= mrwLim ? 'ok' : 'bad'}`}>{ramp <= mrwLim ? `OK · ${f0(mrwLim - ramp)} kg margin` : 'OVER'}</span></td>
                    </tr>
                    <tr>
                      <td className="lbl">Max Take-off Weight (MTOW):</td>
                      <td><input className="f n" style={{ width: 95 }} value={ac.limits?.mtow ?? mtowLim} onChange={e => updateFlightPath('ac.limits.mtow', e.target.value)} /></td>
                      <td><span className={`pill ${tow <= mtowLim ? 'ok' : 'bad'}`}>{tow <= mtowLim ? `OK · ${f0(mtowLim - tow)} kg margin` : 'OVER'}</span></td>
                    </tr>
                    <tr>
                      <td className="lbl">Max Landing Weight (MLW):</td>
                      <td><input className="f n" style={{ width: 95 }} value={ac.limits?.mlw ?? mlwLim} onChange={e => updateFlightPath('ac.limits.mlw', e.target.value)} /></td>
                      <td><span className={`pill ${law <= mlwLim ? 'ok' : 'bad'}`}>{law <= mlwLim ? `OK · ${f0(mlwLim - law)} kg margin` : 'OVER'}</span></td>
                    </tr>
                    <tr>
                      <td className="lbl">Max Zero Fuel Weight (MZFW):</td>
                      <td><input className="f n" style={{ width: 95 }} value={ac.limits?.mzfw ?? mzfwLim} onChange={e => updateFlightPath('ac.limits.mzfw', e.target.value)} /></td>
                      <td><span className={`pill ${zfw <= mzfwLim ? 'ok' : 'bad'}`}>{zfw <= mzfwLim ? `OK · ${f0(mzfwLim - zfw)} kg margin` : 'OVER'}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="sh">3. PASSENGER DISTRIBUTION</div>
              <div className="tw" style={{ marginTop: 0 }}>
                <table className="t" style={{ minWidth: 320 }}>
                  <thead>
                    <tr><th>ZONE / CABIN</th><th>PAX COUNT</th><th>EST. WEIGHT</th></tr>
                  </thead>
                  <tbody>
                    {(ac.zones || []).map((z, i) => {
                      const count = n(L.zones?.[i]);
                      return (
                        <tr key={i}>
                          <td className="lbl">{z.name}</td>
                          <td>
                            <input 
                              className="f n" 
                              value={L.zones?.[i] || ''} 
                              onChange={e => updateFlightPath(`load.zones.${i}`, e.target.value)}
                            />
                          </td>
                          <td><span className="calc">{f0(count * paxAvg)} kg</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="sh">4. CARGO HOLD DISTRIBUTION</div>
              <div className="tw" style={{ marginTop: 0 }}>
                <table className="t" style={{ minWidth: 320 }}>
                  <thead>
                    <tr><th>COMPARTMENT</th><th>MAX LIMIT</th><th>ACTUAL WT</th></tr>
                  </thead>
                  <tbody>
                    {(ac.holds || []).map((h, i) => (
                      <tr key={i}>
                        <td className="lbl">
                          <input className="f" style={{ fontSize: '12px' }} value={h.name || ''} onChange={e => updateFlightPath(`ac.holds.${i}.name`, e.target.value)} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input className="f n" style={{ width: 80 }} value={h.limit || ''} placeholder="limit" onChange={e => updateFlightPath(`ac.holds.${i}.limit`, e.target.value)} />
                            <small>kg</small>
                          </div>
                        </td>
                        <td>
                          <input 
                            className="f n" 
                            value={L.holds?.[i] || ''} 
                            onChange={e => updateFlightPath(`load.holds.${i}`, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="sh">5. BALANCE &amp; TRIM SHEET (CG INDEX % MAC)</div>
          <div className="tw" style={{ marginTop: 0 }}>
            <table className="t" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>CONDITION</th>
                  <th>TOTAL WT (KG)</th>
                  <th>INDEX UNIT</th>
                  <th>% MAC</th>
                  <th>CG ENVELOPE STATUS</th>
                  <th>{P.trim || 'THS TRIM SETTING (UP/DN)'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="lbl">Zero Fuel Weight</td>
                  <td><span className="calc">{f0(zfw)}</span></td>
                  <td><input className="f n" value={L.cg?.zfw?.idx || ''} onChange={e => updateFlightPath('load.cg.zfw.idx', e.target.value)} /></td>
                  <td><input className="f n" value={L.cg?.zfw?.mac || ''} onChange={e => updateFlightPath('load.cg.zfw.mac', e.target.value)} /></td>
                  <td>
                    <span className="bxs">
                      {['IN', 'OUT'].map(v => (
                        <button key={v} type="button" className={`tog ${L.cg?.zfw?.st === v ? 'on' : ''}`} onClick={() => updateFlightPath('load.cg.zfw.st', v)}>{v}</button>
                      ))}
                    </span>
                  </td>
                  <td>—</td>
                </tr>
                <tr>
                  <td className="lbl">Take-off Weight</td>
                  <td><span className="calc">{f0(tow)}</span></td>
                  <td><input className="f n" value={L.cg?.tow?.idx || ''} onChange={e => updateFlightPath('load.cg.tow.idx', e.target.value)} /></td>
                  <td><input className="f n" value={L.cg?.tow?.mac || ''} onChange={e => updateFlightPath('load.cg.tow.mac', e.target.value)} /></td>
                  <td>
                    <span className="bxs">
                      {['IN', 'OUT'].map(v => (
                        <button key={v} type="button" className={`tog ${L.cg?.tow?.st === v ? 'on' : ''}`} onClick={() => updateFlightPath('load.cg.tow.st', v)}>{v}</button>
                      ))}
                    </span>
                  </td>
                  <td><input className="f" value={L.cg?.tow?.trim || 'UP 1.2'} onChange={e => updateFlightPath('load.cg.tow.trim', e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="lbl">Landing Weight</td>
                  <td><span className="calc">{f0(law)}</span></td>
                  <td><input className="f n" value={L.cg?.law?.idx || ''} onChange={e => updateFlightPath('load.cg.law.idx', e.target.value)} /></td>
                  <td><input className="f n" value={L.cg?.law?.mac || ''} onChange={e => updateFlightPath('load.cg.law.mac', e.target.value)} /></td>
                  <td>
                    <span className="bxs">
                      {['IN', 'OUT'].map(v => (
                        <button key={v} type="button" className={`tog ${L.cg?.law?.st === v ? 'on' : ''}`} onClick={() => updateFlightPath('load.cg.law.st', v)}>{v}</button>
                      ))}
                    </span>
                  </td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="sign" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div>
              <h4>LOADMASTER / DISPATCHER DECLARATION</h4>
              <p>I certify that this aircraft has been loaded in accordance with the loading instructions and balance limits.</p>
              <div className="cell"><span className="lab">Signature:</span><input className="f" value={L.disp?.sig ?? 'G. Dupont (Loadmaster)'} onChange={e => updateFlightPath('load.disp.sig', e.target.value)} /></div>
              <div className="cell"><span className="lab">Time:</span><input className="f" placeholder="14:35" value={L.disp?.time ?? '14:35'} onChange={e => updateFlightPath('load.disp.time', e.target.value)} /></div>
            </div>
            <div>
              <h4>CAPTAIN ACCEPTANCE</h4>
              <p>I have checked the loadsheet figures and accept the weight and trim calculations for flight.</p>
              <div className="cell"><span className="lab">Signature:</span><input className="f" value={L.cap?.sig ?? 'Capt. Afnan Mazhar'} onChange={e => updateFlightPath('load.cap.sig', e.target.value)} /></div>
              <div className="cell"><span className="lab">Date:</span><input type="date" className="f" value={L.cap?.date ?? F.date} onChange={e => updateFlightPath('load.cap.date', e.target.value)} /></div>
            </div>
          </div>
        </article>
      )}

      {/* STAGE 6: ATC LOG */}
      {stage === 'comms' && (
        <article className="sheet" id="sheet" data-doc="atclog">
          <header className="dh">
            <div>
              <h2 className="dt">COMMUNICATION &amp; ATC FREQUENCY LOGBOOK</h2>
              <p className="ds">SECTOR HANDOFF &amp; RADAR CONTROL LOG — FULL FLIGHT SHEET {ac.typeLabel?.toUpperCase()}</p>
            </div>
          </header>

          <div className="g">
            <div className="cell"><span className="lab">CALLSIGN</span><span className="calc">{F.callsign}</span></div>
            <div className="cell"><span className="lab">DEP / ARR</span><span className="calc">{F.dep} / {F.arr}</span></div>
            <div className="cell"><span className="lab">SELCAL</span><input className="f up" value={F.comms?.selcal || ''} onChange={e => updateFlightPath('comms.selcal', e.target.value.toUpperCase())} placeholder="CS-MQ" /></div>
            <div className="cell"><span className="lab">SQUAWK</span><input className="f n" value={F.comms?.squawk || ''} onChange={e => updateFlightPath('comms.squawk', e.target.value)} placeholder="2145" /></div>
          </div>

          <div className="sh">VHF / HF / CPDLC ATC CONTROL HANDOFF LOGBOOK ({ac.typeLabel?.toUpperCase()})</div>
          <div className="tw">
            <table className="t" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>TIME (Z)</th>
                  <th>ATC SECTOR / CONTROL UNIT</th>
                  <th>PRIMARY FREQ</th>
                  <th>SECONDARY / HF</th>
                  <th>CPDLC CENTER</th>
                  <th>SQWK</th>
                  <th>REMARKS / HANDOFF</th>
                  <th className="noprint x"></th>
                </tr>
              </thead>
              <tbody>
                {(F.comms?.rows || []).map((r, i) => (
                  <tr key={i}>
                    <td>
                      <div className="tz">
                        <input type="time" className="f" value={r.time || ''} onChange={e => updateFlightPath(`comms.rows.${i}.time`, e.target.value)} />
                        <button type="button" className="zb noprint" onClick={() => updateFlightPath(`comms.rows.${i}.time`, nowZ())}>Z</button>
                      </div>
                    </td>
                    <td><input className="f" value={r.sector || ''} onChange={e => updateFlightPath(`comms.rows.${i}.sector`, e.target.value)} placeholder="Bremen Radar" /></td>
                    <td><input className="f n" value={r.freq || ''} onChange={e => updateFlightPath(`comms.rows.${i}.freq`, e.target.value)} placeholder="124.800" /></td>
                    <td><input className="f" value={r.sec || ''} onChange={e => updateFlightPath(`comms.rows.${i}.sec`, e.target.value)} /></td>
                    <td><input className="f up" value={r.cpdlc || ''} onChange={e => updateFlightPath(`comms.rows.${i}.cpdlc`, e.target.value.toUpperCase())} placeholder="EDVV" /></td>
                    <td><input className="f n" value={r.sqwk || ''} onChange={e => updateFlightPath(`comms.rows.${i}.sqwk`, e.target.value)} placeholder="2145" /></td>
                    <td><input className="f" value={r.remarks || ''} onChange={e => updateFlightPath(`comms.rows.${i}.remarks`, e.target.value)} /></td>
                    <td className="noprint x">
                      <button 
                        type="button" 
                        className="ib" 
                        onClick={() => {
                          const rows = [...(F.comms?.rows || [])];
                          rows.splice(i, 1);
                          updateFlightPath('comms.rows', rows);
                        }}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row noprint" style={{ marginTop: 8 }}>
            <button 
              type="button" 
              className="btn sm ghost" 
              onClick={() => {
                const rows = [...(F.comms?.rows || [])];
                rows.push({ time: '', sector: '', freq: '', sec: '', cpdlc: '', sqwk: F.comms?.squawk || '', remarks: '' });
                updateFlightPath('comms.rows', rows);
              }}
            >
              + Add row
            </button>
            <button 
              type="button" 
              className="btn sm" 
              onClick={() => {
                const rows = [...(F.comms?.rows || [])];
                rows.push({ time: nowZ(), sector: '', freq: '', sec: '', cpdlc: '', sqwk: F.comms?.squawk || '', remarks: '' });
                updateFlightPath('comms.rows', rows);
              }}
            >
              Log handoff now (UTC)
            </button>
          </div>
        </article>
      )}

      {/* STAGE 7: TIMES & DELAY */}
      {stage === 'times' && (
        <article className="sheet" id="sheet" data-doc="times">
          <header className="dh">
            <div>
              <h2 className="dt">TIMES &amp; DELAY REPORT</h2>
              <p className="ds">PLANNED (SIMBRIEF) VS ACTUAL · OFF-BLOCK · TAKE-OFF · LANDING · ON-BLOCK</p>
            </div>
            <span className="dbadge">{ac.variant || 'A320-200'}</span>
          </header>

          <div className="g">
            <div className="cell"><span className="lab">CALLSIGN</span><span className="calc">{F.callsign || '—'}</span></div>
            <div className="cell"><span className="lab">ROUTE</span><span className="calc">{F.dep || '----'} → {F.arr || '----'}</span></div>
            <div className="cell"><span className="lab">AIRCRAFT</span><span className="calc">{ac.reg} · {ac.icao}</span></div>
            <div className="cell"><span className="lab">DATE (UTC)</span><span className="calc">{fmtDate(F.date)}</span></div>
          </div>

          <div className="row noprint" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn sm" 
              onClick={handlePullSimbriefTimes}
            >
              📥 Pull planned times from SimBrief (UTC)
            </button>
            <button 
              type="button" 
              className="btn sm ghost" 
              onClick={handleCopyPlanToActual}
            >
              📋 Copy planned to actual (Z)
            </button>
            <span className="note" style={{ margin: 0, alignSelf: 'center' }}>
              All times follow aviation UTC / Zulu standard (24-hour HH:MM Z). Click Z to stamp current UTC time.
            </span>
          </div>

          <div className="sh">DEPARTURE &amp; ARRIVAL PERFORMANCE (ZULU STANDARD)</div>
          <div className="g" style={{ '--min': '220px' }}>
            <div className="cell">
              <span className="lab">DEPARTURE (OFF-BLOCK / OUT)</span>
              {(() => {
                const depVar = calcDelayPill(F.times?.plan?.out, F.tech?.flightRows?.[0]?.out);
                return (
                  <>
                    <span className={`pill ${depVar.cls}`}>{depVar.text}</span>
                    <span className="note" style={{ margin: 0 }}>Plan: {F.times?.plan?.out ? `${F.times.plan.out}Z` : '—'} · Actual: {F.tech?.flightRows?.[0]?.out ? `${F.tech.flightRows[0].out}Z` : 'pending'}</span>
                  </>
                );
              })()}
            </div>
            <div className="cell">
              <span className="lab">ARRIVAL (ON-BLOCK / IN)</span>
              {(() => {
                const arrVar = calcDelayPill(F.times?.plan?.in, F.tech?.flightRows?.[0]?.in);
                return (
                  <>
                    <span className={`pill ${arrVar.cls}`}>{arrVar.text}</span>
                    <span className="note" style={{ margin: 0 }}>Plan: {F.times?.plan?.in ? `${F.times.plan.in}Z` : '—'} · Actual: {F.tech?.flightRows?.[0]?.in ? `${F.tech.flightRows[0].in}Z` : 'pending'}</span>
                  </>
                );
              })()}
            </div>
            <div className="cell">
              <span className="lab">EN-ROUTE AIR TIME RESULT</span>
              {(() => {
                const planAir = mins(F.times?.plan?.off, F.times?.plan?.on);
                const actAir = mins(F.tech?.flightRows?.[0]?.off, F.tech?.flightRows?.[0]?.on);
                if (planAir == null || actAir == null) {
                  return <span className="calc big">Sector planned · {hm(planAir)} air time</span>;
                }
                const diff = actAir - planAir;
                return (
                  <span className="calc big" style={{ color: diff <= 5 ? 'var(--ok)' : 'var(--warn)' }}>
                    {diff === 0 ? 'Flown exactly to plan' : (diff > 0 ? `+${diff} min en-route` : `${Math.abs(diff)} min faster than plan`)}
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="sh">TIMES (UTC / ZULU) <small>actual times are automatically synchronized with technical logbook</small></div>
          <div className="tw" style={{ marginTop: 0 }}>
            <table className="t" style={{ minWidth: 620 }}>
              <thead>
                <tr>
                  <th>EVENT</th>
                  <th>PLANNED (UTC ZULU)</th>
                  <th>ACTUAL (UTC ZULU)</th>
                  <th>VARIANCE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="lbl">OUT<br/><span className="note" style={{ margin: 0 }}>Off-block, doors closed, pushback</span></td>
                  <td>
                    <div className="tz">
                      <input 
                        type="text" 
                        className="f" 
                        placeholder="HH:MM" 
                        maxLength={5} 
                        value={F.times?.plan?.out || ''} 
                        onChange={e => updateFlightPath('times.plan.out', e.target.value)} 
                        style={{ fontFamily: 'var(--f-mono)', textAlign: 'center', width: 90 }}
                      />
                      <span style={{ marginLeft: 4, color: 'var(--accent)', fontWeight: 700, fontSize: '11px' }}>Z</span>
                    </div>
                  </td>
                  <td>
                    <div className="tz">
                      <input 
                        type="text" 
                        className="f" 
                        placeholder="HH:MM" 
                        maxLength={5} 
                        value={F.tech?.flightRows?.[0]?.out || ''} 
                        onChange={e => updateFlightPath('tech.flightRows.0.out', e.target.value)} 
                        style={{ fontFamily: 'var(--f-mono)', textAlign: 'center', width: 90 }}
                      />
                      <button type="button" className="zb noprint" title="Stamp current UTC Zulu time" onClick={() => setNowTime('tech.flightRows.0.out')}>Z</button>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const v = calcDelayPill(F.times?.plan?.out, F.tech?.flightRows?.[0]?.out);
                      return <span className={`pill ${v.cls}`}>{v.text}</span>;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td className="lbl">OFF<br/><span className="note" style={{ margin: 0 }}>Take-off, wheels up</span></td>
                  <td>
                    <div className="tz">
                      <input 
                        type="text" 
                        className="f" 
                        placeholder="HH:MM" 
                        maxLength={5} 
                        value={F.times?.plan?.off || ''} 
                        onChange={e => updateFlightPath('times.plan.off', e.target.value)} 
                        style={{ fontFamily: 'var(--f-mono)', textAlign: 'center', width: 90 }}
                      />
                      <span style={{ marginLeft: 4, color: 'var(--accent)', fontWeight: 700, fontSize: '11px' }}>Z</span>
                    </div>
                  </td>
                  <td>
                    <div className="tz">
                      <input 
                        type="text" 
                        className="f" 
                        placeholder="HH:MM" 
                        maxLength={5} 
                        value={F.tech?.flightRows?.[0]?.off || ''} 
                        onChange={e => updateFlightPath('tech.flightRows.0.off', e.target.value)} 
                        style={{ fontFamily: 'var(--f-mono)', textAlign: 'center', width: 90 }}
                      />
                      <button type="button" className="zb noprint" title="Stamp current UTC Zulu time" onClick={() => setNowTime('tech.flightRows.0.off')}>Z</button>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const v = calcDelayPill(F.times?.plan?.off, F.tech?.flightRows?.[0]?.off);
                      return <span className={`pill ${v.cls}`}>{v.text}</span>;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td className="lbl">ON<br/><span className="note" style={{ margin: 0 }}>Landing, touchdown</span></td>
                  <td>
                    <div className="tz">
                      <input 
                        type="text" 
                        className="f" 
                        placeholder="HH:MM" 
                        maxLength={5} 
                        value={F.times?.plan?.on || ''} 
                        onChange={e => updateFlightPath('times.plan.on', e.target.value)} 
                        style={{ fontFamily: 'var(--f-mono)', textAlign: 'center', width: 90 }}
                      />
                      <span style={{ marginLeft: 4, color: 'var(--accent)', fontWeight: 700, fontSize: '11px' }}>Z</span>
                    </div>
                  </td>
                  <td>
                    <div className="tz">
                      <input 
                        type="text" 
                        className="f" 
                        placeholder="HH:MM" 
                        maxLength={5} 
                        value={F.tech?.flightRows?.[0]?.on || ''} 
                        onChange={e => updateFlightPath('tech.flightRows.0.on', e.target.value)} 
                        style={{ fontFamily: 'var(--f-mono)', textAlign: 'center', width: 90 }}
                      />
                      <button type="button" className="zb noprint" title="Stamp current UTC Zulu time" onClick={() => setNowTime('tech.flightRows.0.on')}>Z</button>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const v = calcDelayPill(F.times?.plan?.on, F.tech?.flightRows?.[0]?.on);
                      return <span className={`pill ${v.cls}`}>{v.text}</span>;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td className="lbl">IN<br/><span className="note" style={{ margin: 0 }}>On-block, engines off, parked</span></td>
                  <td>
                    <div className="tz">
                      <input 
                        type="text" 
                        className="f" 
                        placeholder="HH:MM" 
                        maxLength={5} 
                        value={F.times?.plan?.in || ''} 
                        onChange={e => updateFlightPath('times.plan.in', e.target.value)} 
                        style={{ fontFamily: 'var(--f-mono)', textAlign: 'center', width: 90 }}
                      />
                      <span style={{ marginLeft: 4, color: 'var(--accent)', fontWeight: 700, fontSize: '11px' }}>Z</span>
                    </div>
                  </td>
                  <td>
                    <div className="tz">
                      <input 
                        type="text" 
                        className="f" 
                        placeholder="HH:MM" 
                        maxLength={5} 
                        value={F.tech?.flightRows?.[0]?.in || ''} 
                        onChange={e => updateFlightPath('tech.flightRows.0.in', e.target.value)} 
                        style={{ fontFamily: 'var(--f-mono)', textAlign: 'center', width: 90 }}
                      />
                      <button type="button" className="zb noprint" title="Stamp current UTC Zulu time" onClick={() => setNowTime('tech.flightRows.0.in')}>Z</button>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const v = calcDelayPill(F.times?.plan?.in, F.tech?.flightRows?.[0]?.in);
                      return <span className={`pill ${v.cls}`}>{v.text}</span>;
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="sh">JOURNEY TIME ANALYSIS</div>
          <div className="tw" style={{ marginTop: 0 }}>
            <table className="t" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>SEGMENT</th>
                  <th>PLANNED</th>
                  <th>ACTUAL</th>
                  <th>VARIANCE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="lbl">Block time (OUT → IN)</td>
                  <td><span className="calc">{hm(mins(F.times?.plan?.out, F.times?.plan?.in))}</span></td>
                  <td><span className="calc">{hm(mins(F.tech?.flightRows?.[0]?.out, F.tech?.flightRows?.[0]?.in))}</span></td>
                  <td>
                    {(() => {
                      const p = mins(F.times?.plan?.out, F.times?.plan?.in);
                      const a = mins(F.tech?.flightRows?.[0]?.out, F.tech?.flightRows?.[0]?.in);
                      if (p == null || a == null) return <span className="pill ghost">—</span>;
                      const d = a - p;
                      return <span className={`pill ${Math.abs(d) <= 5 ? 'ok' : (d > 0 ? 'bad' : 'ok')}`}>{d === 0 ? 'On schedule' : (d > 0 ? `+${d} min` : `${d} min`)}</span>;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td className="lbl">Air time (OFF → ON)</td>
                  <td><span className="calc">{hm(mins(F.times?.plan?.off, F.times?.plan?.on))}</span></td>
                  <td><span className="calc">{hm(mins(F.tech?.flightRows?.[0]?.off, F.tech?.flightRows?.[0]?.on))}</span></td>
                  <td>
                    {(() => {
                      const p = mins(F.times?.plan?.off, F.times?.plan?.on);
                      const a = mins(F.tech?.flightRows?.[0]?.off, F.tech?.flightRows?.[0]?.on);
                      if (p == null || a == null) return <span className="pill ghost">—</span>;
                      const d = a - p;
                      return <span className={`pill ${Math.abs(d) <= 5 ? 'ok' : (d > 0 ? 'bad' : 'ok')}`}>{d === 0 ? 'On schedule' : (d > 0 ? `+${d} min` : `${d} min`)}</span>;
                    })()}
                  </td>
                </tr>
                <tr>
                  <td className="lbl">Taxi out (min)</td>
                  <td><input className="f n" value={F.times?.plan?.txo || '20'} onChange={e => updateFlightPath('times.plan.txo', e.target.value)} /></td>
                  <td><span className="calc">{mins(F.tech?.flightRows?.[0]?.out, F.tech?.flightRows?.[0]?.off) != null ? mins(F.tech?.flightRows?.[0]?.out, F.tech?.flightRows?.[0]?.off) + ' min' : '—'}</span></td>
                  <td><span className="pill ok">Standard</span></td>
                </tr>
                <tr>
                  <td className="lbl">Taxi in (min)</td>
                  <td><input className="f n" value={F.times?.plan?.txi || '8'} onChange={e => updateFlightPath('times.plan.txi', e.target.value)} /></td>
                  <td><span className="calc">{mins(F.tech?.flightRows?.[0]?.on, F.tech?.flightRows?.[0]?.in) != null ? mins(F.tech?.flightRows?.[0]?.on, F.tech?.flightRows?.[0]?.in) + ' min' : '—'}</span></td>
                  <td><span className="pill ok">Standard</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* STAGE 8: POSTFLIGHT */}
      {stage === 'post' && (
        <article className="sheet" id="sheet" data-doc="postflight">
          <header className="dh">
            <div>
              <h2 className="dt">POST-FLIGHT COMPLETION REPORT</h2>
              <p className="ds">BLOCK TIMES · FUEL · LANDING · CLOSE-OUT</p>
            </div>
            <span className="dbadge">{ac.variant || 'A320-200'}</span>
          </header>

          <div className="g">
            <div className="cell"><span className="lab">CALLSIGN</span><span className="calc">{F.callsign || '—'}</span></div>
            <div className="cell"><span className="lab">ROUTE</span><span className="calc">{F.dep || '----'} → {F.arr || '----'}</span></div>
            <div className="cell"><span className="lab">AIRCRAFT</span><span className="calc">{ac.reg} · {ac.typeLabel}</span></div>
            <div className="cell"><span className="lab">DATE</span><span className="calc">{fmtDate(F.date)}</span></div>
          </div>

          <div className="sh">TIMES (UTC) <small>same entries as sector 1 of the tech log</small></div>
          <div className="g">
            <div className="cell">
              <span className="lab">OUT (BLOCK OFF)</span>
              <div className="tz">
                <input type="time" className="f" value={F.tech?.flightRows?.[0]?.out || ''} onChange={e => updateFlightPath('tech.flightRows.0.out', e.target.value)} />
                <button type="button" className="zb noprint" onClick={() => setNowTime('tech.flightRows.0.out')}>Z</button>
              </div>
            </div>
            <div className="cell">
              <span className="lab">OFF (TAKE-OFF)</span>
              <div className="tz">
                <input type="time" className="f" value={F.tech?.flightRows?.[0]?.off || ''} onChange={e => updateFlightPath('tech.flightRows.0.off', e.target.value)} />
                <button type="button" className="zb noprint" onClick={() => setNowTime('tech.flightRows.0.off')}>Z</button>
              </div>
            </div>
            <div className="cell">
              <span className="lab">ON (TOUCHDOWN)</span>
              <div className="tz">
                <input type="time" className="f" value={F.tech?.flightRows?.[0]?.on || ''} onChange={e => updateFlightPath('tech.flightRows.0.on', e.target.value)} />
                <button type="button" className="zb noprint" onClick={() => setNowTime('tech.flightRows.0.on')}>Z</button>
              </div>
            </div>
            <div className="cell">
              <span className="lab">IN (BLOCK ON)</span>
              <div className="tz">
                <input type="time" className="f" value={F.tech?.flightRows?.[0]?.in || ''} onChange={e => updateFlightPath('tech.flightRows.0.in', e.target.value)} />
                <button type="button" className="zb noprint" onClick={() => setNowTime('tech.flightRows.0.in')}>Z</button>
              </div>
            </div>
            <div className="cell"><span className="lab">BLOCK TIME</span><span className="calc big">{hm(mins(F.tech?.flightRows?.[0]?.out, F.tech?.flightRows?.[0]?.in))}</span></div>
            <div className="cell"><span className="lab">AIR TIME</span><span className="calc big">{hm(mins(F.tech?.flightRows?.[0]?.off, F.tech?.flightRows?.[0]?.on))}</span></div>
          </div>

          <div className="sh">FUEL &amp; LANDING</div>
          <div className="g">
            <div className="cell"><span className="lab">DEPARTURE FOB ({u})</span><span className="calc">{f0(actualDepFOB)}</span></div>
            <div className="cell">
              <span className="lab">FUEL REMAINING ON BLOCKS ({u})</span>
              <input 
                className="f n" 
                value={PO.fuelRem || ''} 
                onChange={e => updateFlightPath('post.fuelRem', e.target.value)} 
                placeholder="2940"
              />
            </div>
            <div className="cell"><span className="lab">FUEL BURNED</span><span className="calc big">{f0(fuelBurned)} {u}</span></div>
            <div className="cell">
              <span className="lab">LANDING RATE (FPM)</span>
              <input 
                className="f n" 
                value={PO.rate || ''} 
                onChange={e => updateFlightPath('post.rate', e.target.value)} 
                placeholder="-95"
              />
            </div>
            <div className="cell">
              <span className="lab">LANDING RUNWAY</span>
              <input 
                className="f up" 
                value={PO.rwy || '22L'} 
                onChange={e => updateFlightPath('post.rwy', e.target.value.toUpperCase())} 
              />
            </div>
            <div className="cell">
              <span className="lab">ARRIVAL STAND</span>
              <input 
                className="f up" 
                value={PO.stand || 'Stand A12'} 
                onChange={e => updateFlightPath('post.stand', e.target.value)} 
              />
            </div>
          </div>

          <div className="sh">
            CLOSE-OUT CHECKLIST <small>{POST_ITEMS.filter(([k]) => PO.checks?.[k]).length} / {POST_ITEMS.length}</small>
          </div>
          <div className="g" style={{ '--min': '340px' }}>
            {POST_ITEMS.map(([k, t]) => (
              <div key={k}>
                <label className="chk">
                  <input 
                    type="checkbox" 
                    className="ck" 
                    checked={!!PO.checks?.[k]} 
                    onChange={e => updateFlightPath(`post.checks.${k}`, e.target.checked)}
                  />
                  <span>{t}</span>
                </label>
              </div>
            ))}
          </div>

          <div className="sh">DEBRIEF NOTES</div>
          <div className="g tight" style={{ '--min': '300px' }}>
            <div className="cell">
              <textarea 
                className="f ta" 
                rows="3" 
                value={PO.notes || ''} 
                onChange={e => updateFlightPath('post.notes', e.target.value)}
                placeholder="Anything worth carrying into the tech log or the PIREP"
              />
            </div>
          </div>

          <div className="noprint" style={{ marginTop: 20 }}>
            {archivedToMongo ? (
              <div className="row">
                <span className="pill ok" style={{ fontSize: 13, padding: '6px 14px' }}>
                  ✓ Flight completed &amp; sector archived to MongoDB Atlas Logbook
                </span>
                <button className="btn ghost" onClick={onSwitchToLogbook}>
                  View in Logbooks →
                </button>
              </div>
            ) : (
              <div>
                <button className="btn" onClick={handleCompleteAndArchive}>
                  Complete flight
                </button>
                <p className="note" style={{ marginTop: 6 }}>
                  Marks the flight completed and adds its hours and landings to the aircraft's running totals. This happens once per flight.
                </p>
              </div>
            )}
          </div>
        </article>
      )}

      {/* Action Bar */}
      <div className="actbar noprint">
        <div className="row">
          <button className="btn ghost" onClick={handlePrint}>Download this form</button>
          <button className="btn ghost" onClick={toggleDone}>
            {F.done?.[stage] ? 'Mark not done' : 'Mark stage done'}
          </button>
        </div>
        <div className="row">
          {prevStage && (
            <button className="btn ghost" onClick={() => setStage(prevStage[0])}>
              ← {prevStage[1]}
            </button>
          )}
          {nextStage && (
            <button className="btn glow" onClick={() => setStage(nextStage[0])}>
              {nextStage[1]} →
            </button>
          )}
        </div>
      </div>
    </>
  );
}
