export function parseSimbriefOFP(data) {
  if (!data || typeof data !== 'object') return null;

  const g = data.general || {};
  const o = data.origin || {};
  const d = data.destination || {};
  const ac = data.aircraft || {};
  const fu = data.fuel || {};
  const w = data.weights || {};
  const tm = data.times || {};
  const fl = data.files || {};
  const pa = data.params || {};
  const al = Array.isArray(data.alternate) ? (data.alternate[0] || {}) : (data.alternate || {});

  const z = s => {
    const v = +s;
    return v ? new Date(v * 1000).toISOString().slice(11, 16) : '';
  };

  const s = x => (x == null ? '' : String(x));
  const ete = +tm.est_time_enroute;
  const hm = m => (m == null ? '' : `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`);

  let link = '';
  if (fl.pdf && fl.pdf.link) {
    link = s(fl.directory || 'https://www.simbrief.com/ofp/flightplans/') + s(fl.pdf.link);
  }

  const ia = +g.initial_altitude;

  const D = {
    fn: s(g.icao_airline) + s(g.flight_number),
    cs: s(data.atc && data.atc.callsign),
    route: s(g.route),
    fl: ia ? 'FL' + Math.round(ia / 100) : '',
    ci: s(g.costindex),
    dist: s(g.route_distance || g.air_distance),
    ete: ete ? hm(Math.round(ete / 60)) : '',
    org: s(o.icao_code),
    orwy: s(o.plan_rwy),
    dst: s(d.icao_code),
    drwy: s(d.plan_rwy),
    alt: s(al.icao_code),
    arwy: s(al.plan_rwy),
    acft: s(ac.icaocode),
    reg: s(ac.reg),
    out: z(tm.sched_out || tm.est_out),
    off: z(tm.est_off || tm.sched_off),
    on: z(tm.est_on || tm.sched_on),
    in: z(tm.est_in || tm.sched_in),
    txo: +tm.taxi_out ? String(Math.round(+tm.taxi_out / 60)) : '15',
    txi: +tm.taxi_in ? String(Math.round(+tm.taxi_in / 60)) : '8',
    fuel: {
      taxi: s(fu.taxi),
      trip: s(fu.enroute_burn),
      cont: s(fu.contingency),
      altn: s(fu.alternate_burn),
      res: s(fu.reserve),
      etops: s(fu.etops),
      extra: s(fu.extra),
      takeoff: s(fu.plan_takeoff),
      ramp: s(fu.plan_ramp),
      ldg: s(fu.plan_landing)
    },
    wt: {
      oew: s(w.oew),
      pax: s(w.pax_count),
      payload: s(w.payload),
      cargo: s(w.cargo),
      zfw: s(w.est_zfw),
      tow: s(w.est_tow),
      ldw: s(w.est_ldw),
      mzfw: s(w.max_zfw),
      mtow: s(w.max_tow),
      mldw: s(w.max_ldw)
    },
    units: /lb/i.test(s(pa.units || (data.params && data.params.units) || fl.units || (data.general && data.general.units))) ? 'LBS' : 'KG',
    pdf: link,
    metarO: s(o.metar).slice(0, 400),
    metarD: s(d.metar).slice(0, 400),
    metarA: s(al.metar).slice(0, 400),
    gen: s(pa.time_generated || tm.time_generated || ''),
    notams: (Array.isArray(data.notams) ? data.notams : (data.notams && data.notams.notam ? [].concat(data.notams.notam) : []))
      .slice(0, 30)
      .map(x => s(x && (x.notam_text || x.notam_raw || x.notam_qcode_subject || '')))
      .filter(Boolean)
  };

  const fx = data.navlog && data.navlog.fix;
  const fixes = (Array.isArray(fx) ? fx : []).slice(0, 150).map(f => ({
    id: s(f.ident),
    awy: s(f.via_airway),
    alt: s(f.altitude_feet),
    dist: s(f.distance),
    fob: s(f.fuel_plan_onboard)
  }));

  let text = '';
  if (data.text && data.text.plan_html) {
    try {
      const doc = new DOMParser().parseFromString(String(data.text.plan_html), 'text/html');
      text = (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 60000);
    } catch (e) {
      text = '';
    }
  }

  return { d: D, fixes, text };
}

export function applyOFPToFlight(flight, parsedOFP, overwrite = true) {
  if (!flight || !parsedOFP || !parsedOFP.d) return flight;
  const D = parsedOFP.d;
  const LB = 2.20462262;

  const toKg = x => {
    if (!x) return '';
    const val = parseFloat(x);
    if (isNaN(val)) return '';
    return D.units === 'LBS' ? String(Math.round(val / LB)) : String(Math.round(val));
  };

  const updated = JSON.parse(JSON.stringify(flight));

  // Route & Callsigns
  if (overwrite || !updated.callsign) updated.callsign = D.cs || updated.callsign;
  if (overwrite || !updated.flightNo) updated.flightNo = D.fn || updated.flightNo;
  if (overwrite || !updated.dep) updated.dep = D.org || updated.dep;
  if (overwrite || !updated.arr) updated.arr = D.dst || updated.arr;
  if (overwrite || !updated.alt) updated.alt = D.alt || updated.alt;

  // Pre-flight
  updated.pre = updated.pre || {};
  if (overwrite || !updated.pre.route) updated.pre.route = D.route || '';
  if (overwrite || !updated.pre.cruise) updated.pre.cruise = D.fl || '';
  if (overwrite || !updated.pre.etd) updated.pre.etd = D.out || '';
  if (overwrite || !updated.pre.eta) updated.pre.eta = D.in || '';
  if (overwrite || !updated.pre.ofp) {
    updated.pre.ofp = `Taxi ${D.fuel.taxi} · Trip ${D.fuel.trip} · Cont ${D.fuel.cont} · Altn ${D.fuel.altn} · Res ${D.fuel.res} · Block ${D.fuel.ramp} ${D.units}`;
  }
  if (overwrite || !updated.pre.wx) {
    updated.pre.wx = [D.metarO, D.metarD, D.metarA].filter(Boolean).join('\n');
  }

  // Loadsheet (All weights standardized to KG)
  updated.load = updated.load || {};
  if (overwrite || !updated.load.bew) updated.load.bew = toKg(D.wt.oew);
  if (overwrite || !updated.load.paxCount) updated.load.paxCount = D.wt.pax;
  if (overwrite || !updated.load.block) updated.load.block = toKg(D.fuel.ramp);
  if (overwrite || !updated.load.taxi) updated.load.taxi = toKg(D.fuel.taxi);
  if (overwrite || !updated.load.trip) updated.load.trip = toKg(D.fuel.trip);

  // Fuel Voucher
  updated.fuel = updated.fuel || {};
  if (overwrite || !updated.fuel.required) updated.fuel.required = D.fuel.ramp;
  updated.fuel.massUnit = D.units;

  // Times
  updated.times = updated.times || { plan: {} };
  updated.times.plan = {
    out: D.out || '',
    off: D.off || '',
    on: D.on || '',
    in: D.in || '',
    txo: D.txo || '15',
    txi: D.txi || '8'
  };

  // Tech log first row
  updated.tech = updated.tech || { flightRows: [] };
  if (!updated.tech.flightRows || updated.tech.flightRows.length === 0) {
    updated.tech.flightRows = [{
      fltNo: D.fn || updated.flightNo,
      date: updated.date,
      dep: D.org,
      arr: D.dst,
      out: '',
      off: '',
      on: '',
      in: '',
      ldgs: '1',
      pic: '',
      remarks: ''
    }];
  } else {
    updated.tech.flightRows[0].fltNo = D.fn || updated.flightNo;
    updated.tech.flightRows[0].dep = D.org;
    updated.tech.flightRows[0].arr = D.dst;
  }

  // SimBrief state
  updated.sb = {
    user: updated.sb?.user || '',
    at: Date.now(),
    d: D,
    fixes: parsedOFP.fixes || [],
    text: parsedOFP.text || ''
  };

  return updated;
}
