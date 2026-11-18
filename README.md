# Flight Desk - Fullstack Aviation Dispatch & Flight Management

A fullstack React + Node.js/Express flight desk connected to **MongoDB**, featuring automated callsign pre-fetching, instant **SimBrief OFP** synchronization with embedded PDF briefings, dedicated **Pilot Logbooks**, and live **VATSIM Radar** flight telemetry & controller tracking.

---

## ✨ Features Implemented

### 1. 🛫 Smart Callsign Auto-Fetching & Plane Selection
- **Auto-fetching based on last flight**: When you click **New Flight**, the app automatically analyzes your last created sector and pre-fills:
  - Suggested callsign (e.g. `SVA123` → `SVA124` or previous callsign)
  - Next flight departure set to the **arrival airport of your previous sector** (e.g. if you landed at `OPKC`, your next flight automatically departs `OPKC`)
  - Return destination pre-selected
  - Last used aircraft pre-selected from your registered hangar
- **Registered Plane Selector**: Select any registered aircraft from your fleet with instant previews of certified MTOW, Fuel Capacity, and Base.

### 2. 📋 Dedicated MongoDB Logbooks Section
- **MongoDB Connected**: Stores all pilot flight logs with Mongoose models and automatic offline local persistence.
- **KPI Metrics**: Real-time summary of Total Sectors, Airborne Hours, Block Hours, Total Landings, Total Fuel Burned, and Average Touchdown Rate.
- **Butter Score Index**: Automatic landing quality detection (`-140 fpm 🧈` Butter / Smooth / Firm).
- **Search & Filter**: Search by Callsign, Route (Departure / Arrival ICAO), Tail Registration, and Network.
- **1-Click Sector Closeout**: Archive active flights directly into the logbook with calculated block minutes and fuel burns.
- **Export Options**: Export your logbook anytime as CSV or JSON.

### 3. 📄 Instant SimBrief OFP Loading
- **Loads SimBrief on Press**: As soon as you open or create a flight, SimBrief is loaded directly.
- **Zero CORS Block Proxy**: Backend proxy fetches the latest OFP without cross-origin issues.
- **Automatic Document Synchronization**: Route, cruising FL, block fuel, payload, passenger count, taxi fuel, and schedule are populated directly into your Preflight, Tech Log, Fuel Voucher, Loadsheet, and Times.
- **Embedded PDF Briefing**: View the official SimBrief flight plan PDF directly inside an inline viewer with 1-click new window or download options.
- **Full Enroute Navlog**: Waypoints, airways, altitudes, distances, and planned FOB.

### 4. 🛰️ VATSIM Radar & Live Telemetry Section
- **Live VATSIM Network Feed**: Real-time integration with VATSIM Data Feed (`https://data.vatsim.net/v3/vatsim-data.json`).
- **Interactive Leaflet Radar Map**:
  - Live aircraft marker rotated dynamically to the pilot's true magnetic heading.
  - CartoDB Dark Matter aviation cartography.
  - Live HUD overlay with Altitude (ft), Ground Speed (kts), Heading (°), and Transponder/Squawk.
  - 1-click toggle to embed [vatsim-radar.com](https://vatsim-radar.com/) directly.
- **Complete Pilot Details**:
  - Pilot Name, CID, Pilot Rating, Server, and Time Online.
  - Filed Flight Plan (Departure, Destination, Alternate, Cruise TAS, Altitude, full Route string, Remarks).
  - Matched active ATC controllers online covering the departure, arrival, or sector with live frequencies and ATIS.
- **1-Click Flight Tracking**: Track your current desk flight's callsign on VATSIM with a single click.

### 5. 🗄️ MongoDB Connection & Local Fallback
- Connects to your local MongoDB (`mongodb://127.0.0.1:27017/flightdesk`) or **MongoDB Atlas Cloud URI** (`mongodb+srv://...`).
- Built-in **Local Storage Fallback Mode**: If MongoDB is not yet running or configured, the app works 100% out of the box using persistent local storage, and syncs automatically once MongoDB is connected.
- In-app **Database Settings Modal**: Change or test connection strings live with instant status indicator in the top navbar.

---

## 🚀 Quick Start

### 1. Run the Fullstack App
From the project root (`flightdesk-app`):

```bash
npm run dev
```

This concurrently starts:
- **Backend API**: `http://localhost:5000`
- **React Frontend**: `http://localhost:5173`

### 2. Configure MongoDB (Optional)
To connect MongoDB Atlas, either:
1. Open the app in your browser at `http://localhost:5173`
2. Click the **MongoDB / Local DB** status pill in the top-right navbar
3. Paste your MongoDB connection string (e.g. `mongodb+srv://user:pass@cluster0.mongodb.net/flightdesk`) and click **Connect & Sync**

Alternatively, configure `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/flightdesk?retryWrites=true&w=majority
```

---

## 📂 Project Structure

```
flightdesk-app/
├── package.json              # Root concurrently scripts
├── README.md
├── server/
│   ├── index.js              # Express REST API, SimBrief & VATSIM proxies
│   ├── .env                  # MongoDB URI and port configuration
│   ├── models/
│   │   ├── Flight.js         # Mongoose schema for active flight documents
│   │   ├── Fleet.js          # Mongoose schema for registered aircraft
│   │   └── Logbook.js        # Mongoose schema for pilot logbooks
│   └── data/
│       └── local_db.json     # Safe fallback database when MongoDB is offline
└── client/
    ├── vite.config.js        # Vite + API proxy to localhost:5000
    ├── tailwind.config.js    # Aviation glass dark theme
    └── src/
        ├── App.jsx           # Main application state and view router
        ├── components/
        │   ├── Navbar.jsx    # Top navigation & UTC/Local clock
        │   ├── VatsimRadarMap.jsx # Interactive Leaflet live map + vatradar
        │   ├── SimbriefViewer.jsx # Live OFP fetcher & embedded PDF
        │   └── MongoStatusModal.jsx # Live MongoDB URI switcher
        └── views/
            ├── LaunchpadView.jsx # Launchpad and quick dispatch portals
            ├── FlightsView.jsx   # Callsign auto-fetch & flight management
            ├── ActiveFlightView.jsx # Multi-stage flight document workspace
            ├── LogbooksView.jsx  # Dedicated MongoDB pilot logbook section
            ├── VatsimView.jsx    # VATSIM Radar & pilot telemetry section
            └── FleetView.jsx     # Registered aircraft hangar & specs
```
