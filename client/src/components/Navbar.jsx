import React from 'react';
import Clock from './Clock';
import { User, LogOut, LogIn } from 'lucide-react';

export default function Navbar({ currentView, setView, mongoStatus, onOpenMongoModal, currentUser, onOpenAuthModal, onLogout }) {
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

        {/* Pilot Account Chip / Sign In Button */}
        {currentUser ? (
          <div className="flex items-center gap-1.5 bg-[#0b1622] border border-[#22394f] px-2.5 py-1 rounded-full text-xs font-mono">
            <span className="text-[#52c7ff] flex items-center gap-1 font-semibold">
              <User className="w-3.5 h-3.5" />
              {currentUser.callsign || currentUser.username}
            </span>
            <button
              onClick={onLogout}
              title="Sign Out of Private Hangar"
              className="text-[#6d8ba6] hover:text-[#ff7070] transition ml-1 p-0.5 rounded"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#52c7ff]/15 hover:bg-[#52c7ff]/25 border border-[#52c7ff]/40 text-[#52c7ff] rounded-full text-xs font-head font-bold tracking-wider uppercase transition shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" /> Pilot Sign In
          </button>
        )}

        <Clock />
      </div>
    </div>
  );
}
