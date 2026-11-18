const BASE_URL = '/api';

export const api = {
  // System Status & MongoDB
  async getStatus() {
    const res = await fetch(`${BASE_URL}/status`);
    if (!res.ok) throw new Error('Failed to get status');
    return res.json();
  },

  async updateMongoUri(uri) {
    const res = await fetch(`${BASE_URL}/settings/mongo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri })
    });
    if (!res.ok) throw new Error('Failed to update Mongo URI');
    return res.json();
  },

  async getSettings() {
    const res = await fetch(`${BASE_URL}/settings`);
    if (!res.ok) return {};
    return res.json();
  },

  async saveSettings(settings) {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },

  // Callsign Auto-Fetching based on last created flight
  async getSuggestedCallsign() {
    const res = await fetch(`${BASE_URL}/flights/suggest-callsign`);
    if (!res.ok) throw new Error('Failed to suggest callsign');
    return res.json();
  },

  // Flights
  async getFlights() {
    const res = await fetch(`${BASE_URL}/flights`);
    if (!res.ok) throw new Error('Failed to fetch flights');
    return res.json();
  },

  async getFlight(id) {
    const res = await fetch(`${BASE_URL}/flights/${id}`);
    if (!res.ok) throw new Error('Failed to fetch flight');
    return res.json();
  },

  async createFlight(flightData) {
    const res = await fetch(`${BASE_URL}/flights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flightData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create flight');
    }
    return res.json();
  },

  async updateFlight(id, flightData) {
    const res = await fetch(`${BASE_URL}/flights/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flightData)
    });
    if (!res.ok) throw new Error('Failed to update flight');
    return res.json();
  },

  async deleteFlight(id) {
    const res = await fetch(`${BASE_URL}/flights/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete flight');
    return res.json();
  },

  // Fleet
  async getFleet() {
    const res = await fetch(`${BASE_URL}/fleet`);
    if (!res.ok) throw new Error('Failed to fetch fleet');
    return res.json();
  },

  async createAircraft(aircraftData) {
    const res = await fetch(`${BASE_URL}/fleet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aircraftData)
    });
    if (!res.ok) throw new Error('Failed to register aircraft');
    return res.json();
  },

  async updateAircraft(id, aircraftData) {
    const res = await fetch(`${BASE_URL}/fleet/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aircraftData)
    });
    if (!res.ok) throw new Error('Failed to update aircraft');
    return res.json();
  },

  async deleteAircraft(id) {
    const res = await fetch(`${BASE_URL}/fleet/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete aircraft');
    return res.json();
  },

  // Logbooks (Connected to MongoDB)
  async getLogbooks(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/logbooks${query ? '?' + query : ''}`);
    if (!res.ok) throw new Error('Failed to fetch logbooks');
    return res.json();
  },

  async getLogbookStats() {
    const res = await fetch(`${BASE_URL}/logbooks/stats`);
    if (!res.ok) throw new Error('Failed to fetch logbook statistics');
    return res.json();
  },

  async createLogbook(logData) {
    const res = await fetch(`${BASE_URL}/logbooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
    if (!res.ok) throw new Error('Failed to create logbook entry');
    return res.json();
  },

  async createLogbookFromFlight(flightId) {
    const res = await fetch(`${BASE_URL}/logbooks/from-flight/${flightId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to archive flight to logbook');
    return res.json();
  },

  async deleteLogbook(id) {
    const res = await fetch(`${BASE_URL}/logbooks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete logbook entry');
    return res.json();
  },

  // SimBrief
  async getSimbriefOFP(username) {
    return this.fetchSimbriefOFP(username);
  },

  async fetchSimbriefOFP(username) {
    const res = await fetch(`${BASE_URL}/simbrief/${encodeURIComponent(username)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'SimBrief fetch failed');
    }
    return res.json();
  },

  getSimbriefPdfProxyUrl(pdfUrl) {
    return `${BASE_URL}/simbrief-pdf?url=${encodeURIComponent(pdfUrl)}`;
  },

  // VATSIM Radar & Pilot Tracking
  async getVatsimPilot(callsign) {
    const res = await fetch(`${BASE_URL}/vatsim/pilot/${encodeURIComponent(callsign)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Pilot lookup failed');
    }
    return res.json();
  },

  async searchVatsim(query) {
    const res = await fetch(`${BASE_URL}/vatsim/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getVatsimFeedOverview() {
    const res = await fetch(`${BASE_URL}/vatsim/data`);
    if (!res.ok) throw new Error('Failed to get VATSIM data');
    return res.json();
  }
};
