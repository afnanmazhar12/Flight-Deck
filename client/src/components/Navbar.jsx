import React from 'react';
import Clock from './Clock';

export default function Navbar({ currentView, setView, mongoStatus, onOpenMongoModal }) {
  return (
    <div className="top">
      <div className="top-in">
        <div 
          className="brand" 
          onClick={() => setView('launchpad')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 21 12 2l9 19-9-5z" fill="currentColor"/>
          </svg>
          Flight Desk
        </div>

        <nav className="nav" id="nav" aria-label="Sections">
          <button 
            className={currentView === 'launchpad' ? 'on' : ''} 
            onClick={() => setView('launchpad')}
          >
            Launchpad
          </button>
          <button 
            className={currentView === 'flights' || currentView === 'active-flight' ? 'on' : ''} 
            onClick={() => setView('flights')}
          >
            Flights
          </button>
          <button 
            className={currentView === 'logbooks' ? 'on' : ''} 
            onClick={() => setView('logbooks')}
          >
            Logbooks
          </button>
          <button 
            className={currentView === 'vatsim' ? 'on' : ''} 
            onClick={() => setView('vatsim')}
          >
            VATSIM Radar
          </button>
          <button 
            className={currentView === 'fleet' || currentView === 'aircraft-detail' ? 'on' : ''} 
            onClick={() => setView('fleet')}
          >
            Fleet
          </button>
        </nav>

        <span 
          className={`chip ${mongoStatus?.connected ? 'ok' : 'busy'}`}
          onClick={onOpenMongoModal}
          title={mongoStatus?.connected ? 'MongoDB Atlas Connected' : 'Local Storage Fallback'}
          style={{ cursor: 'pointer' }}
        >
          {mongoStatus?.connected ? 'MongoDB Atlas' : 'Local Fallback'}
        </span>

        <Clock />
      </div>
    </div>
  );
}
