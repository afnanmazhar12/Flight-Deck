const mongoose = require('mongoose');

const FleetSchema = new mongoose.Schema({
  id: { type: String, required: true, index: true },
  userId: { type: String, default: 'public', index: true },
  reg: { type: String, required: true, index: true },
  make: { type: String, default: '' },
  group: { type: String, default: '' },
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
  zones: [{ name: String }],
  airframeHrs: { type: String, default: '0' },
  landings: { type: String, default: '0' },
  eng1Hrs: { type: String, default: '0' },
  eng2Hrs: { type: String, default: '0' },
  apuHrs: { type: String, default: '0' },
  notes: { type: String, default: '' },
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
  },
  history: [{
    flt: String,
    pilot: String,
    dep: String,
    arr: String,
    when: String,
    dur: String,
    remarks: String
  }],
  historyAt: { type: Number, default: 0 }
}, { minimize: false, timestamps: true });

module.exports = mongoose.model('Fleet', FleetSchema);
