const BASE_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('flightdesk_token');
  const user = JSON.parse(localStorage.getItem('flightdesk_user') || 'null');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (user && user.id) {
    headers['x-user-id'] = user.id;
  }
  return headers;
}

async function authFetch(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

export const api = {
  // Authentication
  async login(credentials) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.token) {
      localStorage.setItem('flightdesk_token', data.token);
      localStorage.setItem('flightdesk_user', JSON.stringify(data.user));
    }
    return data;
  },

  async register(userData) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    if (data.token) {
      localStorage.setItem('flightdesk_token', data.token);
      localStorage.setItem('flightdesk_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getMe() {
    const res = await authFetch(`${BASE_URL}/auth/me`);
    if (!res.ok) return null;
    return res.json();
  },

  async updateProfile(profileData) {
    const res = await authFetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Profile update failed');
    if (data.user) {
      localStorage.setItem('flightdesk_user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('flightdesk_token');
    localStorage.removeItem('flightdesk_user');
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('flightdesk_user') || 'null');
    } catch (e) {
      return null;
    }
  },

  // System Status & MongoDB
  async getStatus() {
    const res = await authFetch(`${BASE_URL}/status`);
    if (!res.ok) throw new Error('Failed to get status');
    return res.json();
  },

  async updateMongoUri(uri) {
    const res = await authFetch(`${BASE_URL}/settings/mongo`, {
      method: 'POST',
      body: JSON.stringify({ uri })
    });
    if (!res.ok) throw new Error('Failed to update Mongo URI');
    return res.json();
  },

  async getSettings() {
    const res = await authFetch(`${BASE_URL}/settings`);
    if (!res.ok) return {};
    return res.json();
  },

  async saveSettings(settings) {
    const res = await authFetch(`${BASE_URL}/settings`, {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },

  // Callsign Auto-Fetching based on last created flight
  async getSuggestedCallsign() {
    const res = await authFetch(`${BASE_URL}/flights/suggest-callsign`);
    if (!res.ok) throw new Error('Failed to suggest callsign');
    return res.json();
  },

  // Flights
  async getFlights() {
    const res = await authFetch(`${BASE_URL}/flights`);
    if (!res.ok) throw new Error('Failed to fetch flights');
    return res.json();
  },

  async getFlight(id) {
    const res = await authFetch(`${BASE_URL}/flights/${id}`);
    if (!res.ok) throw new Error('Failed to fetch flight');
    return res.json();
  },

  async createFlight(flightData) {
    const res = await authFetch(`${BASE_URL}/flights`, {
      method: 'POST',
      body: JSON.stringify(flightData)
    });
    if (!res.ok) throw new Error('Failed to create flight');
    return res.json();
  },

  async updateFlight(id, flightData) {
    const res = await authFetch(`${BASE_URL}/flights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(flightData)
    });
    if (!res.ok) throw new Error('Failed to update flight');
    return res.json();
  },

  async deleteFlight(id) {
    const res = await authFetch(`${BASE_URL}/flights/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete flight');
    return res.json();
  },

  // Fleet
  async getFleet() {
    const res = await authFetch(`${BASE_URL}/fleet`);
    if (!res.ok) throw new Error('Failed to fetch fleet');
    return res.json();
  },

  async getAircraft(id) {
    const fleet = await this.getFleet();
    const ac = fleet.find(f => f.id === id);
    if (!ac) throw new Error('Aircraft not found');
    return ac;
  },

  async createAircraft(aircraftData) {
    const res = await authFetch(`${BASE_URL}/fleet`, {
      method: 'POST',
      body: JSON.stringify(aircraftData)
    });
    if (!res.ok) throw new Error('Failed to create aircraft');
    return res.json();
  },

  async updateAircraft(id, aircraftData) {
    const res = await authFetch(`${BASE_URL}/fleet/${id}`, {
      method: 'PUT',
      body: JSON.stringify(aircraftData)
    });
    if (!res.ok) throw new Error('Failed to update aircraft');
    return res.json();
  },

  async deleteAircraft(id) {
    const res = await authFetch(`${BASE_URL}/fleet/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete aircraft');
    return res.json();
  },

  // Logbooks
  async getLogbooks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.callsign) params.set('callsign', filters.callsign);
    if (filters.reg) params.set('reg', filters.reg);
    if (filters.airport) params.set('airport', filters.airport);
    if (filters.network) params.set('network', filters.network);
    if (filters.sort) params.set('sort', filters.sort);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await authFetch(`${BASE_URL}/logbooks${queryStr}`);
    if (!res.ok) throw new Error('Failed to fetch logbooks');
    return res.json();
  },

  async getLogbookStats() {
    const res = await authFetch(`${BASE_URL}/logbooks/stats`);
    if (!res.ok) throw new Error('Failed to fetch logbook stats');
    return res.json();
  },

  async createLogbook(logData) {
    const res = await authFetch(`${BASE_URL}/logbooks`, {
      method: 'POST',
      body: JSON.stringify(logData)
    });
    if (!res.ok) throw new Error('Failed to create logbook entry');
    return res.json();
  },

  async archiveFlightToLogbook(flightId) {
    const res = await authFetch(`${BASE_URL}/logbooks/from-flight/${flightId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to archive flight to logbook');
    return res.json();
  },

  async createLogbookFromFlight(flightId) {
    return this.archiveFlightToLogbook(flightId);
  },

  async deleteLogbook(id) {
    const res = await authFetch(`${BASE_URL}/logbooks/${id}`, {
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
    const res = await authFetch(`${BASE_URL}/simbrief/${encodeURIComponent(username)}`);
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
    const res = await authFetch(`${BASE_URL}/vatsim/pilot/${encodeURIComponent(callsign)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Pilot lookup failed');
    }
    return res.json();
  },

  async searchVatsim(query) {
    const res = await authFetch(`${BASE_URL}/vatsim/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async getVatsimFeedOverview() {
    const res = await authFetch(`${BASE_URL}/vatsim/data`);
    if (!res.ok) throw new Error('Failed to get VATSIM data');
    return res.json();
  },

  // Aircraft Radar & Tracking
  async getAircraftRadarHistory(registration) {
    const res = await authFetch(`${BASE_URL}/radar/aircraft/${encodeURIComponent(registration)}`);
    if (!res.ok) throw new Error('Failed to fetch aircraft radar history');
    return res.json();
  }
};
