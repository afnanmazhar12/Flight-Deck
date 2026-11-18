import React from 'react';
import Clock from './Clock';
import { User, LogOut, LogIn } from 'lucide-react';

export default function Navbar({ currentView, setView, mongoStatus, onOpenMongoModal, currentUser, onLogout }) {
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

        {/* Database Status Chip */}
        <span 
          className={`chip ${mongoStatus?.connected ? 'ok' : 'busy'}`}
          onClick={onOpenMongoModal}
          title={mongoStatus?.connected ? 'MongoDB Atlas Connected' : 'Local Storage Fallback'}
          style={{ cursor: 'pointer' }}
        >
          {mongoStatus?.connected ? 'MongoDB Atlas' : 'Local Fallback'}
        </span>

        {/* Pilot Account Chip */}
        {currentUser && (
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '99px',
              background: 'rgba(82, 199, 255, 0.1)',
              border: '1px solid rgba(82, 199, 255, 0.3)',
              font: '600 12px var(--f-mono)'
            }}
          >
            <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <User size={13} />
              {currentUser.callsign || currentUser.username}
            </span>
            <button
              onClick={onLogout}
              title="Sign Out to Login Screen"
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--mute)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px',
                marginLeft: '4px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--bad)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--mute)'}
            >
              <LogOut size={13} />
            </button>
          </div>
        )}

        <Clock />
      </div>
    </div>
  );
}
