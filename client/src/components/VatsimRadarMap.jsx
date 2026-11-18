import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function VatsimRadarMap({ pilotData, callsign }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const lat = pilotData?.telemetry?.latitude;
  const lon = pilotData?.telemetry?.longitude;
  const heading = pilotData?.telemetry?.heading || 0;
  const altitude = pilotData?.telemetry?.altitude;
  const speed = pilotData?.telemetry?.groundspeed;
  const squawk = pilotData?.telemetry?.transponder;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const defaultLat = lat != null ? lat : 25.0;
    const defaultLon = lon != null ? lon : 55.0;
    const zoomLevel = lat != null && lon != null ? 7 : 4;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLon],
        zoom: zoomLevel,
        zoomControl: true,
        attributionControl: false
      });

      // CartoDB Dark Matter tiles - matches Flight Desk dark glass theme with 0 API keys required!
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      if (lat != null && lon != null) {
        mapInstanceRef.current.setView([lat, lon], mapInstanceRef.current.getZoom());
      }
    }

    const map = mapInstanceRef.current;

    // Aircraft Icon with Heading Rotation
    if (lat != null && lon != null) {
      const planeSvg = `
        <div style="transform: rotate(${heading}deg); transform-origin: center center; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="#52c7ff" style="filter: drop-shadow(0 0 6px rgba(82, 199, 255, 0.9));">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: planeSvg,
        className: 'vatsim-plane-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
        markerRef.current.setIcon(customIcon);
      } else {
        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: 'IBM Plex Sans', sans-serif; color: #0e1a29; padding: 4px;">
            <b style="font-size: 14px; color: #0a74b5;">${pilotData.callsign || callsign}</b><br/>
            <span>Altitude: <b>${altitude != null ? altitude.toLocaleString() : '—'} ft</b></span><br/>
            <span>Speed: <b>${speed || '—'} kts</b> | Heading: <b>${heading}°</b></span><br/>
            <span>Squawk: <b>${squawk || '—'}</b></span>
          </div>
        `);
        markerRef.current = marker;
      }
    }
  }, [lat, lon, heading, pilotData]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapContainerRef} 
      style={{
        width: '100%',
        height: '460px',
        borderRadius: '10px',
        border: '1px solid var(--line)',
        overflow: 'hidden'
      }} 
    />
  );
}
