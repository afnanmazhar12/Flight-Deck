import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import MongoStatusModal from './components/MongoStatusModal';
import AuthModal from './components/AuthModal';
import LaunchpadView from './views/LaunchpadView';
import FlightsView from './views/FlightsView';
import ActiveFlightView from './views/ActiveFlightView';
import LogbooksView from './views/LogbooksView';
import VatsimView from './views/VatsimView';
import FleetView from './views/FleetView';
import AircraftDetailView from './views/AircraftDetailView';
import { api } from './services/api';

export default function App() {
  const [currentView, setView] = useState('launchpad');
  const [activeFlightId, setActiveFlightId] = useState(null);
  const [activeAircraftId, setActiveAircraftId] = useState(null);
  const [activeVatsimCallsign, setActiveVatsimCallsign] = useState('');

  const [currentUser, setCurrentUser] = useState(() => api.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => !api.getCurrentUser());

  const [flights, setFlights] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [mongoStatus, setMongoStatus] = useState(null);
  const [isMongoModalOpen, setIsMongoModalOpen] = useState(false);

  // Initial Load & Refresh
  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshStatus, 20000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const refreshAll = async () => {
    try {
      const [flts, fltFleet, statusRes] = await Promise.all([
        api.getFlights().catch(() => []),
        api.getFleet().catch(() => []),
        api.getStatus().catch(() => null)
      ]);
      setFlights(flts);
      setFleet(fltFleet);
      if (statusRes) setMongoStatus(statusRes.mongo);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const refreshStatus = async () => {
    try {
      const statusRes = await api.getStatus();
      if (statusRes) setMongoStatus(statusRes.mongo);
    } catch (err) {
      // offline
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    refreshAll();
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setFlights([]);
    setFleet([]);
    setIsAuthModalOpen(true);
    refreshAll();
  };

  const handleOpenFlight = (id) => {
    setActiveFlightId(id);
    setView('active-flight');
    window.scrollTo(0, 0);
  };

  const handleOpenAircraft = (id) => {
    setActiveAircraftId(id);
    setView('aircraft-detail');
    window.scrollTo(0, 0);
  };

  const handleTrackOnVatsim = (callsign) => {
    setActiveVatsimCallsign(callsign);
    setView('vatsim');
    window.scrollTo(0, 0);
  };

  const activeFlight = flights.find(f => f.id === activeFlightId);
  const activeAircraft = fleet.find(a => a.id === activeAircraftId);

  return (
    <>
      <Navbar
        currentView={currentView}
        setView={(v) => {
          setView(v);
          window.scrollTo(0, 0);
        }}
        mongoStatus={mongoStatus}
        onOpenMongoModal={() => setIsMongoModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <div className="wrap">
        <div id="banner"></div>
        <main id="main">
          {currentView === 'launchpad' && (
            <LaunchpadView
              flights={flights}
              fleet={fleet}
              onNewFlight={() => {
                setView('flights');
              }}
              onOpenFlight={handleOpenFlight}
              setView={setView}
            />
          )}

          {currentView === 'flights' && (
            <FlightsView
              flights={flights}
              fleet={fleet}
              onOpenFlight={handleOpenFlight}
              onRefreshFlights={refreshAll}
            />
          )}

          {currentView === 'active-flight' && activeFlight && (
            <ActiveFlightView
              flight={activeFlight}
              onBack={() => setView('flights')}
              onUpdateFlight={(updated) => {
                setFlights(prev => prev.map(f => f.id === updated.id ? updated : f));
              }}
              onTrackOnVatsim={handleTrackOnVatsim}
              onSwitchToLogbook={() => setView('logbooks')}
            />
          )}

          {currentView === 'logbooks' && (
            <LogbooksView
              mongoStatus={mongoStatus}
            />
          )}

          {currentView === 'vatsim' && (
            <VatsimView
              activeCallsign={activeVatsimCallsign || (activeFlight ? activeFlight.callsign : '')}
            />
          )}

          {currentView === 'fleet' && (
            <FleetView
              fleet={fleet}
              onOpenAircraft={handleOpenAircraft}
              onRefreshFleet={refreshAll}
            />
          )}

          {currentView === 'aircraft-detail' && activeAircraft && (
            <AircraftDetailView
              aircraft={activeAircraft}
              onBack={() => setView('fleet')}
              onRefreshFleet={refreshAll}
            />
          )}
        </main>
      </div>

      <MongoStatusModal
        isOpen={isMongoModalOpen}
        onClose={() => setIsMongoModalOpen(false)}
        mongoStatus={mongoStatus}
        onStatusChange={(newStatus) => setMongoStatus(newStatus)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        canClose={!!currentUser}
      />
    </>
  );
}
