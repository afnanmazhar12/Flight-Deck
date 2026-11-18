const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const Flight = require('./models/Flight');
const Fleet = require('./models/Fleet');
const Logbook = require('./models/Logbook');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'flightdesk-aviation-jwt-secret-key-2026';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// -----------------------------------------------------------------------------
// Local JSON Storage Fallback (Runs if MongoDB is not running or unreachable)
// -----------------------------------------------------------------------------
const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'local_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let localStore = {
  flights: {},
  fleet: {},
  logbooks: {},
  settings: {
    simbriefUser: '',
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/flightdesk'
  }
};

function loadLocalStore() {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      localStore = {
        flights: parsed.flights || {},
        fleet: parsed.fleet || {},
        logbooks: parsed.logbooks || {},
        settings: { ...localStore.settings, ...(parsed.settings || {}) }
      };
    }
  } catch (err) {
    console.error('Failed to load local DB:', err.message);
  }
}

function saveLocalStore() {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save local DB:', err.message);
  }
}

loadLocalStore();

// Seed initial fleet if completely empty
function seedInitialFleet() {
  if (Object.keys(localStore.fleet).length === 0) {
    const defaultPlane = {
      id: 'ac_b777_hzak11',
      reg: 'HZ-AK11',
      make: 'Boeing',
      group: 'Boeing 777',
      variant: '777-300ER',
      typeLabel: 'Boeing 777-300ER',
      icao: 'B77W',
      tpl: 'b777',
      exact: true,
      operator: 'Saudia',
      base: 'OEJN',
      config: 'F8C42Y304 / C28Y368',
      taxiFuel: '500',
      fuelCap: '145500',
      limits: { mrw: '352441', mtow: '351534', mlw: '251290', mzfw: '237682' },
      tanks: [
        { name: 'Left Main Tank', max: '31300' },
        { name: 'Center Main Tank', max: '82900' },
        { name: 'Right Main Tank', max: '31300' }
      ],
      holds: [
        { name: 'Hold 1 (Fwd Pallets)', limit: '25000', group: 1 },
        { name: 'Hold 2 (Fwd Container)', limit: '21000', group: 1 },
        { name: 'Hold 3 (Aft Container)', limit: '18000', group: 2 },
        { name: 'Hold 4 (Aft Loose/Bulk)', limit: '3000', group: 2 }
      ],
      zones: [
        { name: 'Zone A (First / Business)' },
        { name: 'Zone B (Business / Premium)' },
        { name: 'Zone C (Economy Fwd)' },
        { name: 'Zone D (Economy Mid)' },
        { name: 'Zone E (Economy Aft)' }
      ],
      airframeHrs: '1420.5',
      landings: '312',
      eng1Hrs: '1420.5',
      eng2Hrs: '1420.5',
      apuHrs: '1105.0',
      created: Date.now()
    };
    const b738 = {
      id: 'ac_b738_d_aidv',
      reg: 'D-AIDV',
      make: 'Boeing',
      group: 'Boeing 737',
      variant: '737-800',
      typeLabel: 'Boeing 737-800',
      icao: 'B738',
      tpl: 'b737',
      exact: true,
      operator: 'Eurowings',
      base: 'EDDL',
      config: 'Y189 / C12Y150',
      taxiFuel: '200',
      fuelCap: '20890',
      limits: { mrw: '79242', mtow: '79015', mlw: '66361', mzfw: '62731' },
      tanks: [
        { name: 'Main Tank 1 (Left)', max: '3915' },
        { name: 'Center Tank', max: '13060' },
        { name: 'Main Tank 2 (Right)', max: '3915' }
      ],
      holds: [
        { name: 'Hold 1 (Fwd)', limit: '1361', group: 1 },
        { name: 'Hold 2 (Fwd)', limit: '2041', group: 1 },
        { name: 'Hold 3 (Aft)', limit: '2268', group: 2 },
        { name: 'Hold 4 (Aft / Bulk)', limit: '1247', group: 2 }
      ],
      zones: [
        { name: 'Zone A (Rows 1-6)' },
        { name: 'Zone B (Rows 7-15)' },
        { name: 'Zone C (Rows 16-24)' },
        { name: 'Zone D (Rows 25-33)' }
      ],
      airframeHrs: '890.0',
      landings: '540',
      eng1Hrs: '890.0',
      eng2Hrs: '890.0',
      apuHrs: '620.0',
      created: Date.now()
    };
    localStore.fleet[defaultPlane.id] = defaultPlane;
    const dabnl = {
      id: 'ac_a320_d_abnl',
      reg: 'D-ABNL',
      make: 'Airbus',
      group: 'Airbus A320',
      variant: 'A320-200',
      typeLabel: 'Airbus A320-200',
      icao: 'A320',
      tpl: 'a320',
      exact: true,
      operator: 'Eurowings',
      base: 'EDDL',
      config: 'Y180 / C12Y138',
      taxiFuel: '150',
      fuelCap: '18720',
      limits: { mrw: '77400', mtow: '77000', mlw: '66000', mzfw: '62500' },
      tanks: [
        { name: 'Outer + Inner Left', max: '6250' },
        { name: 'Center Tank', max: '6470' },
        { name: 'Inner + Outer Right', max: '6250' }
      ],
      holds: [
        { name: 'Hold 1 (Fwd)', limit: '2270', group: 1 },
        { name: 'Hold 3 (Aft)', limit: '1900', group: 2 },
        { name: 'Hold 4 (Aft)', limit: '1502', group: 2 },
        { name: 'Hold 5 (Bulk / Loose)', limit: '1497', group: 2 }
      ],
      zones: [
        { name: 'Zone OA (Rows 1-6)' },
        { name: 'Zone OB (Rows 7-13)' },
        { name: 'Zone OC (Rows 14-22)' },
        { name: 'Zone OD (Rows 23-30)' }
      ],
      airframeHrs: '271.4',
      landings: '0',
      eng1Hrs: '0',
      eng2Hrs: '0',
      apuHrs: '0',
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
      created: Date.now()
    };
    localStore.fleet[dabnl.id] = dabnl;
    localStore.fleet[b738.id] = b738;
    saveLocalStore();
  }
}
seedInitialFleet();

// -----------------------------------------------------------------------------
// MongoDB Connection Handling with Dynamic Reconnect
// -----------------------------------------------------------------------------
const DEFAULT_MONGO_URI = 'mongodb+srv://mafnanmazhar_db_user:yYcQyEH8z7K9ohqk@cluster0.1uqar4p.mongodb.net/flightdesk?retryWrites=true&w=majority';

let mongoStatus = {
  connected: false,
  uri: process.env.MONGODB_URI || localStore.settings.mongoUri || DEFAULT_MONGO_URI,
  host: null,
  database: null,
  mode: 'local-fallback',
  lastError: null,
  lastAttempt: null
};

// Attach mongoose connection error handler so unhandled connection events don't exit the process
mongoose.connection.on('error', (err) => {
  mongoStatus.connected = false;
  mongoStatus.mode = 'local-fallback';
  mongoStatus.lastError = err.message;
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Handled uncaught exception:', err.message);
});

let connectingPromise = null;


async function syncLocalToMongo() {
  try {
    // Sync any local flights, fleet, and logbooks into MongoDB
    for (const flt of Object.values(localStore.flights)) {
      await Flight.findOneAndUpdate({ id: flt.id }, flt, { upsert: true });
    }
    for (const ac of Object.values(localStore.fleet)) {
      await Fleet.findOneAndUpdate({ id: ac.id }, ac, { upsert: true });
    }
    for (const log of Object.values(localStore.logbooks)) {
      await Logbook.findOneAndUpdate({ id: log.id }, log, { upsert: true });
    }
    console.log('[MongoDB] Local store synced to MongoDB.');
  } catch (err) {
    console.error('[MongoDB] Sync error:', err.message);
  }
}

async function connectToMongo(uri) {
  const targetUri = uri || mongoStatus.uri || DEFAULT_MONGO_URI;
  mongoStatus.lastAttempt = new Date().toISOString();
  try {
    if (mongoose.connection.readyState === 1) {
      mongoStatus.connected = true;
      mongoStatus.mode = 'mongodb';
      return { success: true, message: 'Already connected', host: mongoose.connection.host };
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 8000
    });
    mongoStatus.connected = true;
    mongoStatus.uri = targetUri;
    mongoStatus.host = mongoose.connection.host;
    mongoStatus.database = mongoose.connection.name;
    mongoStatus.mode = 'mongodb';
    mongoStatus.lastError = null;
    localStore.settings.mongoUri = targetUri;
    saveLocalStore();
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
    await syncLocalToMongo();
    return { success: true, message: 'Connected to MongoDB', host: mongoose.connection.host };
  } catch (err) {
    mongoStatus.connected = false;
    mongoStatus.mode = 'local-fallback';
    mongoStatus.lastError = err.message;
    console.log(`[MongoDB] Could not connect to (${targetUri}): ${err.message}. Using persistent local database.`);
    return { success: false, message: err.message, mode: 'local-fallback' };
  }
}

async function ensureMongoConnected() {
  if (mongoose.connection.readyState === 1) {
    mongoStatus.connected = true;
    mongoStatus.mode = 'mongodb';
    return true;
  }
  if (connectingPromise) {
    await connectingPromise;
    return mongoStatus.connected;
  }
  const targetUri = process.env.MONGODB_URI || localStore.settings.mongoUri || DEFAULT_MONGO_URI;
  connectingPromise = connectToMongo(targetUri).finally(() => {
    connectingPromise = null;
  });
  await connectingPromise;
  return mongoStatus.connected;
}

// Initial connection attempt
connectToMongo();

// -----------------------------------------------------------------------------
// VATSIM Data Cache & Proxy
// -----------------------------------------------------------------------------
let vatsimCache = {
  data: null,
  fetchedAt: 0,
  isFetching: false
};
const VATSIM_TTL_MS = 15000; // 15 seconds cache to respect VATSIM policy

async function refreshVatsimFeed() {
  if (vatsimCache.isFetching) return vatsimCache.data;
  vatsimCache.isFetching = true;
  try {
    const res = await axios.get('https://data.vatsim.net/v3/vatsim-data.json', { 
      timeout: 15000,
      headers: { 'Accept-Encoding': 'gzip,deflate,compress' }
    });
    if (res.data && res.data.pilots) {
      vatsimCache.data = res.data;
      vatsimCache.fetchedAt = Date.now();
    }
    return vatsimCache.data;
  } catch (err) {
    console.warn('[VATSIM Feed] Refresh warning:', err.message);
    return vatsimCache.data;
  } finally {
    vatsimCache.isFetching = false;
  }
}

// Background auto-refresh feed
refreshVatsimFeed();
setInterval(refreshVatsimFeed, VATSIM_TTL_MS);

async function getVatsimData() {
  const now = Date.now();
  if (vatsimCache.data && now - vatsimCache.fetchedAt < VATSIM_TTL_MS) {
    return vatsimCache.data;
  }
  if (!vatsimCache.data) {
    return await refreshVatsimFeed();
  }
  // Return cached immediately and refresh in background
  refreshVatsimFeed().catch(() => {});
  return vatsimCache.data;
}

function computeVatsimFlightPhase(pilot) {
  if (!pilot) return null;
  const gs = Number(pilot.groundspeed) || 0;
  const alt = Number(pilot.altitude) || 0;
  const fp = pilot.flight_plan || {};
  let plannedCruise = parseInt(String(fp.altitude).replace(/[^\d]/g, ''), 10);
  if (plannedCruise && plannedCruise < 1000) plannedCruise *= 100;
  if (!plannedCruise) plannedCruise = 30000;

  if (gs < 5 && alt < 3500) return 'Boarding / Gate';
  if (gs >= 5 && gs <= 40 && alt < 3500) return 'Taxiing';
  if (gs > 40 && gs < 160 && alt < 2500) return 'Takeoff / Departure';
  if (alt >= plannedCruise - 2000 || (alt > 20000 && gs > 300)) {
    const fl = Math.round(alt / 100);
    return `Cruising (FL${fl})`;
  }
  if (alt > 8000 && gs > 200) return `Enroute (${Math.round(alt / 100) * 100}ft)`;
  if (gs > 60 && alt < 8000) return 'Approach / Descent';
  return 'Online (VATSIM)';
}

async function attachVatsimLiveInfo(flights) {
  if (!flights || !flights.length) return flights;
  try {
    const vatsim = await getVatsimData().catch(() => null);
    const pilots = (vatsim && vatsim.pilots) || [];
    const pilotMap = new Map();
    if (pilots.length) {
      pilots.forEach(p => {
        if (p.callsign) {
          pilotMap.set(p.callsign.toUpperCase(), p);
        }
      });
    }

    return flights.map(f => {
      const cs = (f.callsign || '').toUpperCase();
      const fn = (f.flightNo || '').toUpperCase();
      const matchedPilot = pilotMap.get(cs) || (fn ? pilotMap.get(fn) : null);

      if (matchedPilot) {
        const phase = computeVatsimFlightPhase(matchedPilot);
        return {
          ...f,
          vatsimPhase: phase,
          vatsimLive: {
            online: true,
            phase,
            gs: matchedPilot.groundspeed,
            alt: matchedPilot.altitude,
            heading: matchedPilot.heading,
            logon_time: matchedPilot.logon_time
          }
        };
      }
      return {
        ...f,
        vatsimPhase: null,
        vatsimLive: { online: false }
      };
    });
  } catch (err) {
    return flights.map(f => ({ ...f, vatsimPhase: null, vatsimLive: { online: false } }));
  }
}

// -----------------------------------------------------------------------------
// Auth & User Helper
// -----------------------------------------------------------------------------
function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

app.use((req, res, next) => {
  req.user = getAuthUser(req);
  next();
});

async function seedFleetForUser(userId) {
  const p1 = {
    id: `ac_a320_${userId}`,
    userId,
    reg: 'D-ABNL',
    make: 'Airbus',
    group: 'Airbus A320',
    variant: 'A320-200',
    typeLabel: 'Airbus A320-200',
    icao: 'A320',
    tpl: 'a320',
    exact: true,
    operator: 'Eurowings',
    base: 'EDDL',
    config: 'Y180 / C12Y138',
    taxiFuel: '150',
    fuelCap: '18720',
    limits: { mrw: '77400', mtow: '77000', mlw: '66000', mzfw: '62500' },
    tanks: [
      { name: 'Outer + Inner Left', max: '6250' },
      { name: 'Center Tank', max: '6470' },
      { name: 'Inner + Outer Right', max: '6250' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd)', limit: '2270', group: 1 },
      { name: 'Hold 3 (Aft)', limit: '1900', group: 2 },
      { name: 'Hold 4 (Aft)', limit: '1502', group: 2 },
      { name: 'Hold 5 (Bulk / Loose)', limit: '1497', group: 2 }
    ],
    zones: [
      { name: 'Zone OA (Rows 1-6)' },
      { name: 'Zone OB (Rows 7-13)' },
      { name: 'Zone OC (Rows 14-22)' },
      { name: 'Zone OD (Rows 23-30)' }
    ],
    airframeHrs: '271.4',
    landings: '0',
    eng1Hrs: '0',
    eng2Hrs: '0',
    apuHrs: '0',
    history: [
      { flt: 'EWG6892', pilot: 'Francesco', dep: 'LEPA', arr: 'EDDM', when: '3 days ago', dur: '1:48', remarks: 'Lav 2 smoke detector fault at boarding. Reset, did not recur.' },
      { flt: 'EWG6839', pilot: 'Karl S.', dep: 'EDLP', arr: 'LEPA', when: '9 days ago', dur: '1:57', remarks: 'Cabin reading light row 14 inop. Cabin log entry made.' }
    ],
    created: Date.now()
  };

  const p2 = {
    id: `ac_b777_${userId}`,
    userId,
    reg: 'HZ-AK11',
    make: 'Boeing',
    group: 'Boeing 777',
    variant: '777-300ER',
    typeLabel: 'Boeing 777-300ER',
    icao: 'B77W',
    tpl: 'b777',
    exact: true,
    operator: 'Saudia',
    base: 'OEJN',
    config: 'F8C42Y304 / C28Y368',
    taxiFuel: '500',
    fuelCap: '145500',
    limits: { mrw: '352441', mtow: '351534', mlw: '251290', mzfw: '237682' },
    tanks: [
      { name: 'Left Main Tank', max: '31300' },
      { name: 'Center Main Tank', max: '82900' },
      { name: 'Right Main Tank', max: '31300' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd Pallets)', limit: '25000', group: 1 },
      { name: 'Hold 2 (Fwd Container)', limit: '21000', group: 1 },
      { name: 'Hold 3 (Aft Container)', limit: '18000', group: 2 },
      { name: 'Hold 4 (Aft Loose/Bulk)', limit: '3000', group: 2 }
    ],
    zones: [
      { name: 'Zone A (First / Business)' },
      { name: 'Zone B (Business / Premium)' },
      { name: 'Zone C (Economy Fwd)' },
      { name: 'Zone D (Economy Mid)' },
      { name: 'Zone E (Economy Aft)' }
    ],
    airframeHrs: '1420.5',
    landings: '312',
    eng1Hrs: '1420.5',
    eng2Hrs: '1420.5',
    apuHrs: '1105.0',
    created: Date.now()
  };

  const p3 = {
    id: `ac_b738_${userId}`,
    userId,
    reg: 'D-AIDV',
    make: 'Boeing',
    group: 'Boeing 737',
    variant: '737-800',
    typeLabel: 'Boeing 737-800',
    icao: 'B738',
    tpl: 'b737',
    exact: true,
    operator: 'Eurowings',
    base: 'EDDL',
    config: 'Y189 / C12Y150',
    taxiFuel: '200',
    fuelCap: '20890',
    limits: { mrw: '79242', mtow: '79015', mlw: '66361', mzfw: '62731' },
    tanks: [
      { name: 'Main Tank 1 (Left)', max: '3915' },
      { name: 'Center Tank', max: '13060' },
      { name: 'Main Tank 2 (Right)', max: '3915' }
    ],
    holds: [
      { name: 'Hold 1 (Fwd)', limit: '1361', group: 1 },
      { name: 'Hold 2 (Fwd)', limit: '2041', group: 1 },
      { name: 'Hold 3 (Aft)', limit: '2268', group: 2 },
      { name: 'Hold 4 (Aft / Bulk)', limit: '1247', group: 2 }
    ],
    zones: [
      { name: 'Zone A (Rows 1-6)' },
      { name: 'Zone B (Rows 7-15)' },
      { name: 'Zone C (Rows 16-24)' },
      { name: 'Zone D (Rows 25-33)' }
    ],
    airframeHrs: '890.0',
    landings: '540',
    eng1Hrs: '890.0',
    eng2Hrs: '890.0',
    apuHrs: '620.0',
    created: Date.now()
  };

  const starter = [p1, p2, p3];
  for (const plane of starter) {
    localStore.fleet[plane.id] = plane;
    if (mongoStatus.connected) {
      await Fleet.findOneAndUpdate({ id: plane.id }, plane, { upsert: true, new: true });
    }
  }
  saveLocalStore();
  return starter;
}

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, callsign, simbriefUser } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanUser.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    if (mongoStatus.connected) {
      const existing = await User.findOne({
        $or: [{ username: cleanUser }, { email: cleanEmail }]
      });
      if (existing) {
        return res.status(400).json({ error: 'Username or email is already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);

    const userObj = {
      id: userId,
      username: cleanUser,
      email: cleanEmail,
      password: hashedPassword,
      callsign: callsign ? callsign.trim().toUpperCase() : cleanUser.toUpperCase(),
      simbriefUser: simbriefUser ? simbriefUser.trim() : cleanUser,
      createdAt: new Date()
    };

    if (mongoStatus.connected) {
      await User.create(userObj);
    }
    if (!localStore.users) localStore.users = {};
    localStore.users[userId] = userObj;
    saveLocalStore();

    // Automatically seed personal fleet for the new pilot
    await seedFleetForUser(userId);

    const token = jwt.sign(
      { id: userId, username: cleanUser, email: cleanEmail },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        username: cleanUser,
        email: cleanEmail,
        callsign: userObj.callsign,
        simbriefUser: userObj.simbriefUser
      }
    });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body || {};
    if (!login || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }
    const cleanLogin = login.trim().toLowerCase();

    let user = null;
    if (mongoStatus.connected) {
      user = await User.findOne({
        $or: [{ username: cleanLogin }, { email: cleanLogin }]
      });
    }
    if (!user && localStore.users) {
      user = Object.values(localStore.users).find(
        u => u.username === cleanLogin || u.email === cleanLogin
      );
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        callsign: user.callsign,
        simbriefUser: user.simbriefUser
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    let user = null;
    if (mongoStatus.connected) {
      user = await User.findOne({ id: req.user.id }).lean();
    }
    if (!user && localStore.users) {
      user = localStore.users[req.user.id];
    }
    if (!user) {
      return res.json({ user: req.user });
    }
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        callsign: user.callsign,
        simbriefUser: user.simbriefUser
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const { callsign, simbriefUser } = req.body || {};
    const updates = {};
    if (callsign !== undefined) updates.callsign = callsign.trim().toUpperCase();
    if (simbriefUser !== undefined) updates.simbriefUser = simbriefUser.trim();

    let updated = null;
    if (mongoStatus.connected) {
      updated = await User.findOneAndUpdate({ id: req.user.id }, updates, { new: true }).lean();
    }
    if (localStore.users && localStore.users[req.user.id]) {
      localStore.users[req.user.id] = { ...localStore.users[req.user.id], ...updates };
      saveLocalStore();
      updated = localStore.users[req.user.id];
    }

    res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        callsign: updated?.callsign || '',
        simbriefUser: updated?.simbriefUser || ''
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function maskUri(uri) {
  if (!uri) return '';
  return uri.replace(/:([^:@]+)@/, ':****@');
}

function getSafeMongoStatus() {
  return {
    ...mongoStatus,
    uri: maskUri(mongoStatus.uri)
  };
}

// Ensure MongoDB is connected for API requests
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && mongoose.connection.readyState !== 1) {
    try {
      await ensureMongoConnected();
    } catch (e) {}
  }
  next();
});

// System Status & MongoDB Health
app.get('/api/status', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    await ensureMongoConnected();
  }
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    mongo: getSafeMongoStatus(),
    counts: {
      flights: Object.keys(localStore.flights).length,
      fleet: Object.keys(localStore.fleet).length,
      logbooks: Object.keys(localStore.logbooks).length
    }
  });
});

// Update MongoDB URI and Reconnect
app.post('/api/settings/mongo', async (req, res) => {
  const { uri } = req.body;
  if (!uri) {
    return res.status(400).json({ error: 'URI is required' });
  }
  const result = await connectToMongo(uri.trim());
  res.json({ ...result, mongoStatus: getSafeMongoStatus() });
});

// Settings (e.g. SimBrief username)
app.get('/api/settings', (req, res) => {
  res.json({
    ...localStore.settings,
    mongoUri: maskUri(localStore.settings.mongoUri)
  });
});

app.post('/api/settings', (req, res) => {
  localStore.settings = { ...localStore.settings, ...req.body };
  saveLocalStore();
  res.json(localStore.settings);
});

// -----------------------------------------------------------------------------
// Auto-fetching Callsign based upon last flight
// -----------------------------------------------------------------------------
app.get('/api/flights/suggest-callsign', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    let lastFlight = null;
    if (mongoStatus.connected) {
      lastFlight = await Flight.findOne({ userId }).sort({ created: -1 }).lean();
    }
    if (!lastFlight) {
      const all = Object.values(localStore.flights).filter(f => (f.userId || 'guest') === userId).sort((a, b) => (b.created || 0) - (a.created || 0));
      if (all.length > 0) lastFlight = all[0];
    }

    if (!lastFlight) {
      // Default initial suggestion
      return res.json({
        hasLast: false,
        lastCallsign: '',
        suggestedCallsign: 'SVA123',
        suggestedFlightNo: 'SV123',
        suggestedDep: 'OEJN',
        suggestedArr: 'OPKC',
        suggestedAcId: Object.keys(localStore.fleet)[0] || '',
        message: 'No previous flights found. Starting with default callsign.'
      });
    }

    const lastCs = lastFlight.callsign || '';
    let nextCs = lastCs;
    let nextFlightNo = lastFlight.flightNo || '';

    // Smart increment or return leg callsign suggestion:
    // e.g. SVA123 -> SVA124, or BAW101 -> BAW102
    const numMatch = lastCs.match(/^([A-Za-z]+)(\d+)$/);
    if (numMatch) {
      const prefix = numMatch[1];
      const num = parseInt(numMatch[2], 10);
      nextCs = `${prefix}${num + 1}`;
    }

    const fnMatch = nextFlightNo.match(/^([A-Za-z]+)(\d+)$/);
    if (fnMatch) {
      const prefix = fnMatch[1];
      const num = parseInt(fnMatch[2], 10);
      nextFlightNo = `${prefix}${num + 1}`;
    }

    res.json({
      hasLast: true,
      lastFlightId: lastFlight.id,
      lastCallsign: lastFlight.callsign,
      lastFlightNo: lastFlight.flightNo,
      lastDate: lastFlight.date,
      lastDep: lastFlight.dep,
      lastArr: lastFlight.arr,
      suggestedCallsign: nextCs || lastCs,
      suggestedFlightNo: nextFlightNo || lastFlight.flightNo,
      suggestedDep: lastFlight.arr || 'OEJN', // Next sector departs from last flight arrival!
      suggestedArr: lastFlight.dep || 'OPKC', // Return route suggested
      suggestedAcId: lastFlight.ac ? lastFlight.ac.id : '',
      lastAircraft: lastFlight.ac ? `${lastFlight.ac.reg} (${lastFlight.ac.typeLabel})` : ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Flights CRUD (Segregated per Pilot / User)
// -----------------------------------------------------------------------------
app.get('/api/flights', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    let flights = [];
    if (mongoStatus.connected) {
      flights = await Flight.find({ userId }).sort({ created: -1 }).lean();
    } else {
      flights = Object.values(localStore.flights)
        .filter(f => (f.userId || 'guest') === userId)
        .sort((a, b) => (b.created || 0) - (a.created || 0));
    }
    const enriched = await attachVatsimLiveInfo(flights);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/flights/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : 'guest';
    let flt = null;
    if (mongoStatus.connected) {
      flt = await Flight.findOne({ id, userId }).lean();
    }
    if (!flt) {
      flt = localStore.flights[id];
    }
    if (!flt || (flt.userId && flt.userId !== userId)) {
      return res.status(404).json({ error: 'Flight not found or unauthorized' });
    }
    const [enriched] = await attachVatsimLiveInfo([flt]);
    res.json(enriched || flt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function aircraftSnap(A) {
  if (!A) return { id: '', reg: 'N/A', make: '', variant: '', typeLabel: 'Aircraft', icao: 'ACFT', tpl: 'a320', exact: false, operator: '', base: '', config: '', bew: '', taxiFuel: '150', fuelCap: '', limits: {}, tanks: [], holds: [], zones: [] };
  return {
    id: A.id || '',
    reg: A.reg || 'N/A',
    make: A.make || '',
    variant: A.variant || '',
    typeLabel: A.typeLabel || 'Aircraft',
    icao: A.icao || 'ACFT',
    tpl: A.tpl || 'a320',
    exact: !!A.exact,
    operator: A.operator || '',
    serial: A.serial || '',
    engine: A.engine || '',
    base: A.base || '',
    config: A.config || '',
    bew: A.bew || '',
    taxiFuel: A.taxiFuel || '150',
    fuelCap: A.fuelCap || '',
    limits: JSON.parse(JSON.stringify(A.limits || {})),
    tanks: JSON.parse(JSON.stringify(A.tanks || [])),
    holds: JSON.parse(JSON.stringify(A.holds || [])),
    zones: JSON.parse(JSON.stringify(A.zones || []))
  };
}

function skeleton() {
  return {
    callsign: '', flightNo: '', date: new Date().toISOString().slice(0, 10), dep: '', arr: '', alt: '', network: 'VATSIM', done: {},
    pre: { route: '', cruise: '', etd: '', eta: '', checks: {}, ofp: '', notam: '', wx: '', brief: '', etops: { req: false, rule: '', alts: ['', '', ''], etps: [] } },
    tech: { logbookNo: '', hdr: { afHrs: '', landings: '', e1: '', e2: '', apu: '' }, flightRows: [], fuelRows: [], crs: { sig: '', lic: '', amo: '', dt: '' }, defects: [], mel: [], wo: [] },
    fuel: { voucherNo: '', date: '', station: '', gate: '', dispenser: '', bowser: '', massUnit: 'KG', volUnit: 'L', tanks: [], fin: { g: '', t: '', d: '' }, ini: { g: '', t: '', d: '' }, upMan: '', grade: 'Jet A-1', fsii: false, sda: false, water: false, appear: false, start: '', stop: '', dp: '', bond: false, bondV: false, arrFob: '', required: '', actualDep: '', sig: [{ id: '', sign: '' }, { id: '', sign: '' }, { id: '', sign: '' }] },
    load: { preparedBy: '', bew: '', pantry: '', paxCount: '', paxAvg: '84', cargoNote: '', block: '', taxi: '', trip: '', zones: [], holds: [], cg: { zfw: { idx: '', mac: '', st: '' }, tow: { idx: '', mac: '', st: '', trim: '' }, law: { idx: '', mac: '', st: '' } }, disp: { sig: '', time: '' }, cap: { sig: '', date: '' } },
    comms: { selcal: '', squawk: '', rows: [] },
    times: { plan: { out: '', off: '', on: '', in: '', txo: '', txi: '' } },
    sb: { user: '', at: 0, d: null, fixes: [], text: '' },
    post: { fuelRem: '', rate: '', rwy: '', stand: '', notes: '', checks: {}, completed: false }
  };
}

app.post('/api/flights', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const data = req.body || {};
    if (!data.id) {
      data.id = 'flt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    }

    // Resolve aircraft
    let planeObj = null;
    const acId = typeof data.ac === 'string' ? data.ac : (data.aircraftId || data.ac?.id);
    if (acId) {
      if (mongoStatus.connected) {
        planeObj = await Fleet.findOne({ id: acId, userId }).lean();
      }
      if (!planeObj) planeObj = localStore.fleet[acId];
    }
    if (!planeObj && data.ac && typeof data.ac === 'object' && data.ac.reg) {
      planeObj = data.ac;
    }
    if (!planeObj) {
      const userPlanes = Object.values(localStore.fleet).filter(p => (p.userId || 'guest') === userId);
      planeObj = userPlanes[0];
    }

    const acSnap = aircraftSnap(planeObj);
    const skel = skeleton();

    const flightRecord = {
      ...skel,
      ...data,
      id: data.id,
      userId,
      ac: acSnap,
      created: data.created || Date.now(),
      updatedAt: Date.now(),
      tech: {
        ...skel.tech,
        ...(data.tech || {}),
        hdr: {
          afHrs: planeObj?.airframeHrs || '',
          landings: planeObj?.landings || '',
          e1: planeObj?.eng1Hrs || '',
          e2: planeObj?.eng2Hrs || '',
          apu: planeObj?.apuHrs || ''
        },
        flightRows: (data.tech && data.tech.flightRows && data.tech.flightRows.length > 0)
          ? data.tech.flightRows
          : [{ fltNo: data.flightNo || data.callsign || '', date: data.date || '', dep: data.dep || '', arr: data.arr || '', out: '', off: '', on: '', in: '', ldgs: '1', pic: '', remarks: '' }],
        fuelRows: (data.tech && data.tech.fuelRows && data.tech.fuelRows.length > 0)
          ? data.tech.fuelRows
          : [{ station: data.dep || '', uplift: '', depFuel: '', arrFuel: '', oil1: '', oil2: '', hyd: '', sig: '' }]
      },
      fuel: {
        ...skel.fuel,
        ...(data.fuel || {}),
        station: data.dep || '',
        date: data.date || '',
        tanks: (planeObj?.tanks || []).map(() => ({ arr: '', dep: '' }))
      },
      load: {
        ...skel.load,
        ...(data.load || {}),
        bew: planeObj?.bew || '',
        taxi: planeObj?.taxiFuel || '150',
        zones: (planeObj?.zones || []).map(() => ''),
        holds: (planeObj?.holds || []).map(() => '')
      },
      comms: {
        ...skel.comms,
        rows: Array.from({ length: 6 }, () => ({ time: '', sector: '', freq: '', sec: '', cpdlc: '', sqwk: '', remarks: '' }))
      }
    };

    localStore.flights[flightRecord.id] = flightRecord;
    saveLocalStore();

    if (mongoStatus.connected) {
      await Flight.findOneAndUpdate({ id: flightRecord.id, userId }, flightRecord, { upsert: true, new: true });
    }

    res.status(201).json(flightRecord);
  } catch (err) {
    console.error('[POST /api/flights Error]', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/flights/:id', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const { id } = req.params;
    const update = { ...req.body, id, userId, updatedAt: Date.now() };

    localStore.flights[id] = update;
    saveLocalStore();

    if (mongoStatus.connected) {
      await Flight.findOneAndUpdate({ id, userId }, update, { upsert: true, new: true });
    }

    res.json(update);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/flights/:id', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const { id } = req.params;
    delete localStore.flights[id];
    saveLocalStore();

    if (mongoStatus.connected) {
      await Flight.deleteOne({ id, userId });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Fleet CRUD (Segregated per Pilot / User)
// -----------------------------------------------------------------------------
app.get('/api/fleet', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    if (mongoStatus.connected) {
      let fleet = await Fleet.find({ userId }).sort({ reg: 1 }).lean();
      if (fleet.length === 0) {
        fleet = await seedFleetForUser(userId);
      }
      return res.json(fleet);
    }
    let list = Object.values(localStore.fleet).filter(p => (p.userId || 'guest') === userId);
    if (list.length === 0) {
      list = await seedFleetForUser(userId);
    }
    list.sort((a, b) => a.reg.localeCompare(b.reg));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fleet', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const data = req.body;
    if (!data.id) {
      data.id = 'ac_' + (data.reg || Date.now()).toString().toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + userId.slice(-4);
    }
    data.userId = userId;
    data.created = data.created || Date.now();

    localStore.fleet[data.id] = data;
    saveLocalStore();

    if (mongoStatus.connected) {
      await Fleet.findOneAndUpdate({ id: data.id, userId }, data, { upsert: true, new: true });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/fleet/:id', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const { id } = req.params;
    const update = { ...req.body, id, userId };

    localStore.fleet[id] = update;
    saveLocalStore();

    if (mongoStatus.connected) {
      await Fleet.findOneAndUpdate({ id, userId }, update, { upsert: true, new: true });
    }

    res.json(update);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/fleet/:id', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const { id } = req.params;
    delete localStore.fleet[id];
    saveLocalStore();

    if (mongoStatus.connected) {
      await Fleet.deleteOne({ id, userId });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// LOGBOOKS (Connected to MongoDB with Full Filtering & Archival)
// -----------------------------------------------------------------------------
app.get('/api/logbooks', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const { callsign, reg, airport, network, sort = 'desc' } = req.query;

    if (mongoStatus.connected) {
      const query = { userId };
      if (callsign) query.callsign = new RegExp(callsign, 'i');
      if (reg) query.aircraftReg = new RegExp(reg, 'i');
      if (airport) {
        query.$or = [
          { dep: new RegExp(airport, 'i') },
          { arr: new RegExp(airport, 'i') }
        ];
      }
      if (network) query.network = network;

      const logs = await Logbook.find(query)
        .sort({ date: sort === 'asc' ? 1 : -1, created: -1 })
        .lean();
      return res.json(logs);
    }

    let list = Object.values(localStore.logbooks).filter(l => (l.userId || 'guest') === userId);
    if (callsign) {
      const re = new RegExp(callsign, 'i');
      list = list.filter(l => re.test(l.callsign));
    }
    if (reg) {
      const re = new RegExp(reg, 'i');
      list = list.filter(l => re.test(l.aircraftReg));
    }
    if (airport) {
      const re = new RegExp(airport, 'i');
      list = list.filter(l => re.test(l.dep) || re.test(l.arr));
    }
    if (network) {
      list = list.filter(l => l.network === network);
    }

    list.sort((a, b) => {
      const cmp = (b.date || '').localeCompare(a.date || '');
      return sort === 'asc' ? -cmp : cmp;
    });

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/logbooks/stats', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    let logs = [];
    if (mongoStatus.connected) {
      logs = await Logbook.find({ userId }).lean();
    } else {
      logs = Object.values(localStore.logbooks).filter(l => (l.userId || 'guest') === userId);
    }

    let totalBlockMinutes = 0;
    let totalAirMinutes = 0;
    let totalLandings = 0;
    let totalFuelBurned = 0;
    let landingRates = [];
    const airframeStats = {};

    logs.forEach(l => {
      totalBlockMinutes += (l.times && l.times.blockMinutes) || 0;
      totalAirMinutes += (l.times && l.times.airMinutes) || 0;
      totalLandings += (l.landing && l.landing.landingsCount) || 1;
      const burn = parseFloat((l.fuel && l.fuel.burned) || 0);
      if (!isNaN(burn)) totalFuelBurned += burn;

      const rate = parseFloat(l.landing && l.landing.rateFpm);
      if (!isNaN(rate) && rate < 0) landingRates.push(rate);

      const plane = l.aircraftReg || 'Unknown';
      airframeStats[plane] = (airframeStats[plane] || 0) + (((l.times && l.times.airMinutes) || 0) / 60);
    });

    const avgRate = landingRates.length
      ? Math.round(landingRates.reduce((a, b) => a + b, 0) / landingRates.length)
      : null;

    res.json({
      totalFlights: logs.length,
      totalBlockHours: (totalBlockMinutes / 60).toFixed(1),
      totalAirHours: (totalAirMinutes / 60).toFixed(1),
      totalLandings,
      totalFuelBurned: Math.round(totalFuelBurned),
      avgLandingRateFpm: avgRate,
      airframeStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logbooks', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const data = req.body;
    if (!data.id) {
      data.id = 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    }
    data.userId = userId;
    data.created = data.created || Date.now();

    localStore.logbooks[data.id] = data;
    saveLocalStore();

    if (mongoStatus.connected) {
      await Logbook.findOneAndUpdate({ id: data.id, userId }, data, { upsert: true, new: true });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logbooks/from-flight/:flightId', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const { flightId } = req.params;
    let flight = null;
    if (mongoStatus.connected) {
      flight = await Flight.findOne({ id: flightId, userId }).lean();
    }
    if (!flight) flight = localStore.flights[flightId];

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found to convert to logbook' });
    }

    // Calculate times
    const techRow = (flight.tech && flight.tech.flightRows && flight.tech.flightRows[0]) || {};
    const outTime = techRow.out || flight.times?.plan?.out || '';
    const offTime = techRow.off || flight.times?.plan?.off || '';
    const onTime = techRow.on || flight.times?.plan?.on || '';
    const inTime = techRow.in || flight.times?.plan?.in || '';

    const calcMins = (a, b) => {
      if (!a || !b) return 0;
      const [h1, m1] = a.split(':').map(Number);
      const [h2, m2] = b.split(':').map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff < 0) diff += 1440;
      return diff;
    };

    const blkMins = calcMins(outTime, inTime);
    const airMins = calcMins(offTime, onTime);
    const toHm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

    // Fuel calculation
    const depFob = flight.fuel?.actualDep || flight.fuel?.required || '';
    const arrFob = flight.post?.fuelRem || '';
    let burned = '';
    if (depFob && arrFob) {
      const b = parseFloat(depFob) - parseFloat(arrFob);
      if (!isNaN(b) && b > 0) burned = String(Math.round(b));
    }

    const logEntry = {
      id: 'log_' + flight.id,
      flightId: flight.id,
      date: flight.date || new Date().toISOString().slice(0, 10),
      callsign: flight.callsign || 'UNKNOWN',
      flightNo: flight.flightNo || '',
      dep: flight.dep || '',
      arr: flight.arr || '',
      alt: flight.alt || '',
      aircraftReg: flight.ac?.reg || 'N/A',
      aircraftType: flight.ac?.typeLabel || '',
      aircraftIcao: flight.ac?.icao || '',
      network: flight.network || 'VATSIM',
      pic: techRow.pic || 'Pilot in Command',
      times: {
        out: outTime,
        off: offTime,
        on: onTime,
        in: inTime,
        blockMinutes: blkMins,
        airMinutes: airMins,
        blockFormatted: toHm(blkMins),
        airFormatted: toHm(airMins)
      },
      fuel: {
        departureFOB: depFob,
        arrivalFOB: arrFob,
        uplift: flight.fuel?.uplift || '',
        burned,
        unit: flight.fuel?.massUnit || 'KG'
      },
      weights: {
        zfw: flight.load?.zfw || '',
        tow: flight.load?.tow || '',
        law: flight.load?.law || '',
        payload: flight.load?.payload || '',
        paxCount: flight.load?.paxCount || ''
      },
      landing: {
        runway: flight.post?.rwy || '',
        rateFpm: flight.post?.rate || '',
        score: parseFloat(flight.post?.rate) > -150 ? 'Butter' : (parseFloat(flight.post?.rate) > -250 ? 'Smooth' : 'Firm'),
        landingsCount: parseInt(techRow.ldgs, 10) || 1,
        dayLandings: 1,
        nightLandings: 0,
        ifr: true
      },
      route: flight.pre?.route || '',
      cruise: flight.pre?.cruise || '',
      remarks: flight.post?.notes || techRow.remarks || '',
      status: 'Verified',
      userId,
      created: Date.now()
    };

    localStore.logbooks[logEntry.id] = logEntry;
    saveLocalStore();

    if (mongoStatus.connected) {
      await Logbook.findOneAndUpdate({ id: logEntry.id, userId }, logEntry, { upsert: true, new: true });
    }

    res.status(201).json(logEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/logbooks/:id', async (req, res) => {
  const userId = req.user ? req.user.id : 'guest';
  try {
    const { id } = req.params;
    delete localStore.logbooks[id];
    saveLocalStore();

    if (mongoStatus.connected) {
      await Logbook.deleteOne({ id, userId });
    }

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// SIMBRIEF PROXY & PDF PROXY (Auto-fetches on flight click, zero CORS block)
// -----------------------------------------------------------------------------


function parseOFP(j) {
  if (!j || typeof j !== 'object' || !(j.general || j.origin)) return null;
  const g = j.general || {}, o = j.origin || {}, d = j.destination || {}, ac = j.aircraft || {}, fu = j.fuel || {}, w = j.weights || {}, tm = j.times || {}, fl = j.files || {}, pa = j.params || {};
  const al = Array.isArray(j.alternate) ? (j.alternate[0] || {}) : (j.alternate || {});
  const z = s => { const v = +s; return v ? new Date(v * 1000).toISOString().slice(11, 16) : ''; };
  const s = x => x == null ? '' : String(x);
  const hm = m => m == null || isNaN(m) ? '—' : (Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'));
  const ete = +tm.est_time_enroute;
  const link = fl.pdf && fl.pdf.link ? s(fl.directory || 'https://www.simbrief.com/ofp/flightplans/') + s(fl.pdf.link) : '';
  const ia = +g.initial_altitude;
  const D = {
    fn: s(g.icao_airline) + s(g.flight_number),
    cs: s(j.atc && j.atc.callsign),
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
    txo: tm.taxi_out ? String(Math.round(+tm.taxi_out / 60)) : (tm.sched_taxi_out ? String(Math.round(+tm.sched_taxi_out / 60)) : '20'),
    txi: tm.taxi_in ? String(Math.round(+tm.taxi_in / 60)) : (tm.sched_taxi_in ? String(Math.round(+tm.sched_taxi_in / 60)) : '8'),
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
    units: /lb/i.test(s(pa.units || (j.params && j.params.units) || fl.units || (j.general && j.general.units))) ? 'lbs' : 'kgs',
    pdf: /^https:\/\/www\.simbrief\.com\//.test(link) ? link : '',
    metarO: s(o.metar).slice(0, 400),
    metarD: s(d.metar).slice(0, 400),
    metarA: s(al.metar).slice(0, 400),
    gen: s(pa.time_generated || tm.time_generated || ''),
    txo: +tm.taxi_out ? String(Math.round(+tm.taxi_out / 60)) : '',
    txi: +tm.taxi_in ? String(Math.round(+tm.taxi_in / 60)) : '',
    notams: (Array.isArray(j.notams) ? j.notams : (j.notams && j.notams.notam ? [].concat(j.notams.notam) : [])).slice(0, 60).map(x => s(x && (x.notam_text || x.notam_raw || x.notam_qcode_subject || ''))).filter(Boolean)
  };

  const fx = j.navlog && j.navlog.fix;
  const fixes = (Array.isArray(fx) ? fx : []).slice(0, 150).map(f => ({
    id: s(f.ident),
    awy: s(f.via_airway),
    alt: s(f.altitude_feet),
    dist: s(f.distance),
    fob: s(f.fuel_plan_onboard)
  }));

  let text = '';
  const ph = j.text && j.text.plan_html;
  if (ph) {
    text = String(ph).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 60000);
  }

  return { d: D, fixes, text };
}


const sbCache = new Map();
const SB_CACHE_TTL = 60 * 1000; // 60 seconds cache

app.get('/api/simbrief/:user', async (req, res) => {
  const { user } = req.params;
  if (!user) return res.status(400).json({ error: 'Username or Pilot ID is required' });

  const cleanUser = user.trim().toLowerCase();
  const cached = sbCache.get(cleanUser);
  if (cached && (Date.now() - cached.time < SB_CACHE_TTL)) {
    return res.json(cached.data);
  }

  const isNumeric = /^\d+$/.test(user.trim());
  const queryParam = isNumeric ? `userid=${encodeURIComponent(user.trim())}` : `username=${encodeURIComponent(user.trim())}`;
  const url = `https://www.simbrief.com/api/xml.fetcher.php?${queryParam}&json=1`;

  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) {
        throw new Error(`SimBrief HTTP ${response.status}`);
      }
      const data = await response.json();

      if (data.fetch && data.fetch.status && data.fetch.status.toLowerCase() !== 'success') {
        return res.status(400).json({ error: 'SimBrief error: ' + (data.fetch.status || 'Flight plan not found') });
      }

      localStore.settings.simbriefUser = user;
      saveLocalStore();

      if (req.user && mongoStatus.connected) {
        try {
          await User.updateOne({ id: req.user.id }, { simbriefUser: user.trim() });
        } catch (e) {}
      }

      const parsed = parseOFP(data) || {};
      const payload = {
        ...data,
        d: parsed.d,
        fixes: parsed.fixes || [],
        text: parsed.text || ''
      };

      sbCache.set(cleanUser, { time: Date.now(), data: payload });
      return res.json(payload);
    } catch (err) {
      lastErr = err;
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // If failed but we have stale cache, return stale cache gracefully
  if (cached) {
    return res.json(cached.data);
  }

  res.status(502).json({ error: 'Failed to contact SimBrief: ' + (lastErr?.message || 'Network error') });
});

// Proxy SimBrief PDF to allow clean inline embedding in <iframe> without X-Frame-Options errors
app.get('/api/simbrief-pdf', async (req, res) => {
  const pdfUrl = req.query.url;
  if (!pdfUrl) return res.status(400).send('Missing url parameter');

  try {
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="simbrief_ofp.pdf"');
    res.send(response.data);
  } catch (err) {
    res.status(502).send('Failed to fetch PDF: ' + err.message);
  }
});

// -----------------------------------------------------------------------------
// VATSIM LIVE RADAR & TELEMETRY API
// -----------------------------------------------------------------------------
app.get('/api/vatsim/data', async (req, res) => {
  try {
    const data = await getVatsimData();
    res.json({
      general: data.general,
      pilotsCount: data.pilots ? data.pilots.length : 0,
      controllersCount: data.controllers ? data.controllers.length : 0,
      facilities: data.facilities
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch detailed pilot flight, live telemetry and active ATC by Callsign
app.get('/api/vatsim/pilot/:callsign', async (req, res) => {
  try {
    const targetCs = (req.params.callsign || '').trim().toUpperCase();
    if (!targetCs) return res.status(400).json({ error: 'Callsign is required' });

    const data = await getVatsimData();
    const pilots = data.pilots || [];
    const controllers = data.controllers || [];

    // Find pilot by callsign
    const pilot = pilots.find(p => p.callsign.toUpperCase() === targetCs);

    if (!pilot) {
      return res.status(404).json({
        found: false,
        callsign: targetCs,
        message: `Pilot with callsign ${targetCs} is currently not online on VATSIM.`
      });
    }

    // Extract flight plan info
    const fp = pilot.flight_plan || {};
    const dep = (fp.departure || '').toUpperCase();
    const arr = (fp.arrival || '').toUpperCase();

    // Match nearby or en-route controllers for departure, arrival or sector
    const matchingControllers = controllers.filter(c => {
      const cs = c.callsign.toUpperCase();
      if (dep && cs.startsWith(dep)) return true;
      if (arr && cs.startsWith(arr)) return true;
      return false;
    }).map(c => ({
      callsign: c.callsign,
      frequency: c.frequency,
      facility: c.facility,
      visual_range: c.visual_range,
      rating: c.rating,
      text_atis: c.text_atis,
      logon_time: c.logon_time
    }));

    // Calculate time online
    let minutesOnline = null;
    if (pilot.logon_time) {
      const logon = new Date(pilot.logon_time).getTime();
      const now = Date.now();
      minutesOnline = Math.max(0, Math.round((now - logon) / 60000));
    }

    const phase = computeVatsimFlightPhase(pilot);

    // Build comprehensive telemetry and flight details
    const result = {
      found: true,
      callsign: pilot.callsign,
      cid: pilot.cid,
      name: pilot.name,
      rating: pilot.rating,
      pilot_rating: pilot.pilot_rating,
      server: pilot.server,
      logon_time: pilot.logon_time,
      flightPhase: phase,
      phase,
      groundspeed: pilot.groundspeed,
      altitude: pilot.altitude,
      heading: pilot.heading,
      minutesOnline,
      hoursOnlineFormatted: minutesOnline != null ? `${Math.floor(minutesOnline / 60)}h ${minutesOnline % 60}m` : '—',

      // Live Telemetry
      telemetry: {
        latitude: pilot.latitude,
        longitude: pilot.longitude,
        altitude: pilot.altitude,
        groundspeed: pilot.groundspeed,
        heading: pilot.heading,
        transponder: pilot.transponder,
        qnh_i_hg: pilot.qnh_i_hg,
        qnh_mb: pilot.qnh_mb
      },

      // Filed Flight Plan
      flight_plan: {
        flight_rules: fp.flight_rules || 'IFR',
        aircraft: fp.aircraft || '—',
        aircraft_faa: fp.aircraft_faa || '',
        aircraft_short: fp.aircraft_short || fp.aircraft || '',
        departure: dep || '—',
        arrival: arr || '—',
        alternate: (fp.alternate || '').toUpperCase() || '—',
        cruise_tas: fp.cruise_tas || '—',
        altitude: fp.altitude || '—',
        deptime: fp.deptime || '—',
        enroute_time: fp.enroute_time || '—',
        fuel_time: fp.fuel_time || '—',
        remarks: fp.remarks || '',
        route: fp.route || 'DIRECT',
        assigned_transponder: fp.assigned_transponder || pilot.transponder
      },

      // ATC Controllers Online
      matchedControllers: matchingControllers,

      // VATSIM Radar external links
      vatradarUrl: `https://vatsim-radar.com/?callsign=${encodeURIComponent(pilot.callsign)}`,
      statsUrl: `https://stats.vatsim.net/stats/${pilot.cid}`
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search online VATSIM pilots or controllers
app.get('/api/vatsim/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim().toUpperCase();
    if (!q || q.length < 2) return res.json({ pilots: [], controllers: [] });

    const data = await getVatsimData();
    const pilots = (data.pilots || []).filter(p =>
      p.callsign.toUpperCase().includes(q) ||
      (p.name && p.name.toUpperCase().includes(q)) ||
      String(p.cid).includes(q)
    ).slice(0, 15);

    const controllers = (data.controllers || []).filter(c =>
      c.callsign.toUpperCase().includes(q) ||
      (c.name && c.name.toUpperCase().includes(q))
    ).slice(0, 10);

    res.json({ pilots, controllers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Live Aviation Weather (METAR)
// -----------------------------------------------------------------------------
app.get('/api/weather/:icao', async (req, res) => {
  const { icao } = req.params;
  try {
    const response = await axios.get(
      `https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao.trim().toUpperCase())}&format=json`,
      { timeout: 6000 }
    );
    res.json(response.data);
  } catch (err) {
    res.status(502).json({ error: 'Weather unavailable' });
  }
});

// -----------------------------------------------------------------------------
// Serve React Static Frontend in Production
// -----------------------------------------------------------------------------
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// -----------------------------------------------------------------------------
// Start Server
// -----------------------------------------------------------------------------
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`✈️  Flight Desk Fullstack Backend running on port ${PORT}`);
    console.log(`📡 MongoDB Status: ${mongoStatus.mode} (${mongoStatus.connected ? 'CONNECTED' : 'LOCAL FALLBACK'})`);
    console.log(`🗺️  VATSIM Radar & Pilot Telemetry Ready`);
    console.log(`📋 Logbooks Module Connected`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
