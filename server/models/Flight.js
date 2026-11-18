const mongoose = require('mongoose');

const FlightSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  callsign: { type: String, default: '' },
  flightNo: { type: String, default: '' },
  date: { type: String, default: '' },
  dep: { type: String, default: '' },
  arr: { type: String, default: '' },
  alt: { type: String, default: '' },
  network: { type: String, default: 'VATSIM' },
  status: { type: String, default: 'Planning' }, // Planning, Briefed, Ground, Flying, Completed
  created: { type: Number, default: Date.now },
  updatedAt: { type: Number, default: Date.now },
  ac: {
    id: { type: String, default: '' },
    reg: { type: String, default: '' },
    make: { type: String, default: '' },
    variant: { type: String, default: '' },
    typeLabel: { type: String, default: '' },
    icao: { type: String, default: '' },
    tpl: { type: String, default: 'a320' },
    exact: { type: Boolean, default: false },
    operator: { type: String, default: '' },
    serial: { type: String, default: '' },
    engine: { type: String, default: '' },
    base: { type: String, default: '' },
    config: { type: String, default: '' },
    bew: { type: String, default: '' },
    taxiFuel: { type: String, default: '' },
    fuelCap: { type: String, default: '' },
    limits: {
      mrw: { type: String, default: '' },
      mtow: { type: String, default: '' },
      mlw: { type: String, default: '' },
      mzfw: { type: String, default: '' }
    },
    tanks: [{ name: String, max: String }],
    holds: [{ name: String, limit: String, group: mongoose.Schema.Types.Mixed }],
    zones: [{ name: String }]
  },
  done: { type: Map, of: Boolean, default: {} },
  pre: {
    route: { type: String, default: '' },
    cruise: { type: String, default: '' },
    etd: { type: String, default: '' },
    eta: { type: String, default: '' },
    checks: { type: Map, of: Boolean, default: {} },
    ofp: { type: String, default: '' },
    notam: { type: String, default: '' },
    wx: { type: String, default: '' },
    brief: { type: String, default: '' },
    etops: {
      req: { type: Boolean, default: false },
      rule: { type: String, default: '' },
      alts: [{ type: String }],
      etps: [{
        etp: String,
        fix: String,
        time: String,
        divA: String,
        divB: String,
        remarks: String
      }]
    }
  },
  tech: {
    logbookNo: { type: String, default: '' },
    hdr: {
      afHrs: { type: String, default: '' },
      landings: { type: String, default: '' },
      e1: { type: String, default: '' },
      e2: { type: String, default: '' },
      apu: { type: String, default: '' }
    },
    flightRows: [{
      fltNo: String,
      date: String,
      dep: String,
      arr: String,
      out: String,
      off: String,
      on: String,
      in: String,
      ldgs: String,
      pic: String,
      remarks: String,
      dur: String,
      hist: Number
    }],
    fuelRows: [{
      station: String,
      uplift: String,
      depFuel: String,
      arrFuel: String,
      oil1: String,
      oil2: String,
      hyd: String,
      sig: String
    }],
    crs: {
      sig: { type: String, default: '' },
      lic: { type: String, default: '' },
      amo: { type: String, default: '' },
      dt: { type: String, default: '' }
    },
    defects: [{
      item: String,
      date: String,
      desc: String,
      action: String,
      cert: String,
      status: String
    }],
    mel: [{
      ref: String,
      item: String,
      sys: String,
      cat: String,
      defer: String,
      expiry: String,
      sign: String
    }],
    wo: [{
      no: String,
      sys: String,
      removed: String,
      installed: String,
      form: String
    }],
    insp: [{
      check: String,
      interval: String,
      last: String,
      next: String,
      rem: String,
      status: String
    }],
    ads: [{
      ref: String,
      eff: String,
      subject: String,
      method: String,
      next: String,
      status: String
    }],
    life: [{
      comp: String,
      pn: String,
      sn: String,
      limit: String,
      acc: String,
      rem: String
    }],
    audit: {
      sig: { type: String, default: '' },
      qa: { type: String, default: '' },
      cert: { type: String, default: '' }
    }
  },
  fuel: {
    voucherNo: { type: String, default: '' },
    date: { type: String, default: '' },
    station: { type: String, default: '' },
    gate: { type: String, default: '' },
    dispenser: { type: String, default: '' },
    bowser: { type: String, default: '' },
    massUnit: { type: String, default: 'KG' },
    volUnit: { type: String, default: 'L' },
    tanks: [{ arr: String, dep: String }],
    fin: { g: String, t: String, d: String },
    ini: { g: String, t: String, d: String },
    upMan: { type: String, default: '' },
    grade: { type: String, default: 'Jet A-1' },
    fsii: { type: Boolean, default: false },
    sda: { type: Boolean, default: false },
    water: { type: Boolean, default: false },
    appear: { type: Boolean, default: false },
    start: { type: String, default: '' },
    stop: { type: String, default: '' },
    dp: { type: String, default: '' },
    bond: { type: Boolean, default: false },
    bondV: { type: Boolean, default: false },
    arrFob: { type: String, default: '' },
    required: { type: String, default: '' },
    actualDep: { type: String, default: '' },
    sig: [{ id: String, sign: String }]
  },
  load: {
    preparedBy: { type: String, default: '' },
    bew: { type: String, default: '' },
    pantry: { type: String, default: '' },
    paxCount: { type: String, default: '' },
    paxAvg: { type: String, default: '84' },
    cargoNote: { type: String, default: '' },
    block: { type: String, default: '' },
    taxi: { type: String, default: '' },
    trip: { type: String, default: '' },
    zones: [{ type: String }],
    holds: [{ type: String }],
    cg: {
      zfw: { idx: String, mac: String, st: String },
      tow: { idx: String, mac: String, st: String, trim: String },
      law: { idx: String, mac: String, st: String }
    },
    disp: { sig: String, time: String },
    cap: { sig: String, date: String }
  },
  comms: {
    selcal: { type: String, default: '' },
    squawk: { type: String, default: '' },
    rows: [{
      time: String,
      sector: String,
      freq: String,
      sec: String,
      cpdlc: String,
      sqwk: String,
      remarks: String
    }]
  },
  times: {
    plan: {
      out: { type: String, default: '' },
      off: { type: String, default: '' },
      on: { type: String, default: '' },
      in: { type: String, default: '' },
      txo: { type: String, default: '' },
      txi: { type: String, default: '' }
    }
  },
  sb: {
    user: { type: String, default: '' },
    at: { type: Number, default: 0 },
    d: { type: mongoose.Schema.Types.Mixed, default: null },
    fixes: [{ type: mongoose.Schema.Types.Mixed }],
    text: { type: String, default: '' }
  },
  post: {
    fuelRem: { type: String, default: '' },
    rate: { type: String, default: '' },
    rwy: { type: String, default: '' },
    stand: { type: String, default: '' },
    notes: { type: String, default: '' },
    checks: { type: Map, of: Boolean, default: {} },
    completed: { type: Boolean, default: false },
    completedAt: { type: Number, default: 0 },
    hoursApplied: {
      air: Number,
      block: Number,
      ldg: Number
    }
  }
}, { minimize: false, timestamps: true });

module.exports = mongoose.model('Flight', FlightSchema);
