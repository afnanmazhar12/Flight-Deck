const mongoose = require('mongoose');

const LogbookSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  flightId: { type: String, default: '', index: true },
  date: { type: String, required: true, index: true },
  callsign: { type: String, required: true, index: true },
  flightNo: { type: String, default: '' },
  dep: { type: String, required: true, index: true },
  arr: { type: String, required: true, index: true },
  alt: { type: String, default: '' },
  aircraftReg: { type: String, required: true, index: true },
  aircraftType: { type: String, default: '' },
  aircraftIcao: { type: String, default: '' },
  network: { type: String, default: 'VATSIM' },
  pic: { type: String, default: 'Self' },
  sic: { type: String, default: '' },
  times: {
    out: { type: String, default: '' },
    off: { type: String, default: '' },
    on: { type: String, default: '' },
    in: { type: String, default: '' },
    blockMinutes: { type: Number, default: 0 },
    airMinutes: { type: Number, default: 0 },
    blockFormatted: { type: String, default: '0:00' },
    airFormatted: { type: String, default: '0:00' }
  },
  fuel: {
    departureFOB: { type: String, default: '' },
    arrivalFOB: { type: String, default: '' },
    uplift: { type: String, default: '' },
    burned: { type: String, default: '' },
    unit: { type: String, default: 'KG' }
  },
  weights: {
    zfw: { type: String, default: '' },
    tow: { type: String, default: '' },
    law: { type: String, default: '' },
    payload: { type: String, default: '' },
    paxCount: { type: String, default: '' }
  },
  landing: {
    runway: { type: String, default: '' },
    rateFpm: { type: String, default: '' },
    score: { type: String, default: 'Normal' },
    landingsCount: { type: Number, default: 1 },
    dayLandings: { type: Number, default: 1 },
    nightLandings: { type: Number, default: 0 },
    ifr: { type: Boolean, default: true }
  },
  route: { type: String, default: '' },
  cruise: { type: String, default: '' },
  distanceNm: { type: String, default: '' },
  remarks: { type: String, default: '' },
  defectsSummary: { type: String, default: '' },
  status: { type: String, default: 'Verified' }, // Verified, Draft, Archived
  created: { type: Number, default: Date.now }
}, { minimize: false, timestamps: true });

module.exports = mongoose.model('Logbook', LogbookSchema);
