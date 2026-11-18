import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, FileText, Check, Copy, ExternalLink, AlertCircle, Plane } from 'lucide-react';
import { api } from '../services/api';
import { parseSimbriefOFP, applyOFPToFlight } from '../services/simbriefService';

export default function SimbriefViewer({ flight, onUpdateFlight }) {
  const [username, setUsername] = useState(flight?.sb?.user || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPdf, setShowPdf] = useState(true);
  const [copiedRoute, setCopiedRoute] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  const ofpData = flight?.sb?.d;

  // Auto-fetch SimBrief as soon as flight is opened if username is known or saved
  useEffect(() => {
    async function checkAndAutoFetch() {
      if (flight?.sb?.d) return; // already loaded
      let user = flight?.sb?.user;
      if (!user) {
        const settings = await api.getSettings().catch(() => ({}));
        user = settings.simbriefUser;
        if (user) setUsername(user);
      }
      if (user && !flight?.sb?.d) {
        handleFetch(user);
      }
    }
    checkAndAutoFetch();
  }, [flight?.id]);

  const handleFetch = async (targetUser) => {
    const userToFetch = targetUser || username;
    if (!userToFetch.trim()) {
      setError('Please enter your SimBrief username or Pilot ID');
      return;
    }
    setLoading(true);
    setError(null);
    setAppliedNotice(false);

    try {
      const rawData = await api.fetchSimbriefOFP(userToFetch.trim());
      const parsed = parseSimbriefOFP(rawData);
      if (!parsed || !parsed.d) {
        throw new Error('Unable to parse SimBrief operational flight plan data');
      }

      // Automatically apply OFP to the active flight
      const updatedFlight = applyOFPToFlight(flight, parsed, true);
      updatedFlight.sb.user = userToFetch.trim();

      await api.updateFlight(flight.id, updatedFlight);
      onUpdateFlight(updatedFlight);
      setAppliedNotice(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch flight plan from SimBrief');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRoute = () => {
    if (ofpData?.route) {
      navigator.clipboard.writeText(ofpData.route);
      setCopiedRoute(true);
      setTimeout(() => setCopiedRoute(false), 2500);
    }
  };

  const pdfProxyUrl = ofpData?.pdf ? api.getSimbriefPdfProxyUrl(ofpData.pdf) : null;

  return (
    <div className="space-y-6">
      {/* Fetch & Account Bar */}
      <div className="bg-[#101a25] border border-[#22344a] rounded-xl p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#52c7ff]/10 text-[#52c7ff] flex items-center justify-center border border-[#52c7ff]/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-head text-xl font-bold uppercase tracking-wider text-white">
                SimBrief Operational Flight Plan (OFP)
              </h3>
              <p className="text-xs text-[#8aa0b8]">
                Loads briefing data, weights, fuel numbers, route and official PDF into your desk
              </p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleFetch(); }} className="flex items-center gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="SimBrief Username or ID"
              className="bg-[#0a121b] border border-[#34506b] rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#52c7ff] w-52"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3.5 py-1.5 bg-[#52c7ff] hover:bg-[#68d1ff] text-[#031a28] font-head font-bold text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Fetching...' : ofpData ? 'Refresh OFP' : 'Fetch Latest OFP'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-[#ff6f7d]/10 border border-[#ff6f7d]/30 text-[#ff6f7d] text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-none" />
            <span>{error}</span>
          </div>
        )}

        {appliedNotice && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#43e0a0]/10 border border-[#43e0a0]/30 text-[#43e0a0] text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>SimBrief OFP successfully loaded and synchronized to all flight documents (Loadsheet, Fuel Voucher, Tech Log)!</span>
          </div>
        )}
      </div>

      {ofpData ? (
        <>
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 font-mono">
            <div className="bg-[#101a25] border border-[#22344a] p-3 rounded-lg text-center">
              <div className="text-[10px] text-[#8aa0b8] uppercase font-head font-semibold">Flight</div>
              <div className="text-base font-bold text-white mt-0.5">{ofpData.fn || ofpData.cs || '—'}</div>
            </div>
            <div className="bg-[#101a25] border border-[#22344a] p-3 rounded-lg text-center">
              <div className="text-[10px] text-[#8aa0b8] uppercase font-head font-semibold">Origin</div>
              <div className="text-base font-bold text-[#52c7ff] mt-0.5">{ofpData.org} {ofpData.orwy ? `(${ofpData.orwy})` : ''}</div>
            </div>
            <div className="bg-[#101a25] border border-[#22344a] p-3 rounded-lg text-center">
              <div className="text-[10px] text-[#8aa0b8] uppercase font-head font-semibold">Destination</div>
              <div className="text-base font-bold text-[#43e0a0] mt-0.5">{ofpData.dst} {ofpData.drwy ? `(${ofpData.drwy})` : ''}</div>
            </div>
            <div className="bg-[#101a25] border border-[#22344a] p-3 rounded-lg text-center">
              <div className="text-[10px] text-[#8aa0b8] uppercase font-head font-semibold">Alternate</div>
              <div className="text-base font-bold text-[#ffb340] mt-0.5">{ofpData.alt || 'NONE'}</div>
            </div>
            <div className="bg-[#101a25] border border-[#22344a] p-3 rounded-lg text-center">
              <div className="text-[10px] text-[#8aa0b8] uppercase font-head font-semibold">Altitude</div>
              <div className="text-base font-bold text-white mt-0.5">{ofpData.fl || '—'}</div>
            </div>
            <div className="bg-[#101a25] border border-[#22344a] p-3 rounded-lg text-center">
              <div className="text-[10px] text-[#8aa0b8] uppercase font-head font-semibold">Cost Index</div>
              <div className="text-base font-bold text-white mt-0.5">{ofpData.ci || '—'}</div>
            </div>
            <div className="bg-[#101a25] border border-[#22344a] p-3 rounded-lg text-center">
              <div className="text-[10px] text-[#8aa0b8] uppercase font-head font-semibold">Distance</div>
              <div className="text-base font-bold text-white mt-0.5">{ofpData.dist} NM</div>
            </div>
            <div className="bg-[#101a25] border border-[#22344a] p-3 rounded-lg text-center">
              <div className="text-[10px] text-[#8aa0b8] uppercase font-head font-semibold">Enroute ETE</div>
              <div className="text-base font-bold text-[#52c7ff] mt-0.5">{ofpData.ete || '—'}</div>
            </div>
          </div>

          {/* Route Section with 1-Click Copy */}
          <div className="bg-[#101a25] border border-[#22344a] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-head text-xs font-bold uppercase tracking-wider text-[#8aa0b8]">
                Filed Flight Route
              </span>
              <button
                onClick={handleCopyRoute}
                className="flex items-center gap-1 text-xs font-mono text-[#52c7ff] hover:text-[#68d1ff] transition"
              >
                {copiedRoute ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedRoute ? 'Copied' : 'Copy Route'}
              </button>
            </div>
            <div className="p-3 bg-[#0a121b] border border-[#22344a] rounded-lg font-mono text-sm text-[#52c7ff] leading-relaxed break-words select-all">
              {ofpData.route || 'DIRECT'}
            </div>
          </div>

          {/* Fuel & Weights Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fuel Breakdown */}
            <div className="bg-[#101a25] border border-[#22344a] rounded-xl p-4">
              <h4 className="font-head text-sm font-bold uppercase tracking-wider text-[#8aa0b8] mb-3 flex items-center justify-between">
                <span>Fuel Planning</span>
                <span className="text-xs font-mono text-white">Unit: {ofpData.units}</span>
              </h4>
              <div className="space-y-1.5 font-mono text-xs">
                {Object.entries(ofpData.fuel).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-[#162230] last:border-0">
                    <span className="text-[#8aa0b8] uppercase">{k}:</span>
                    <span className="text-white font-semibold">{v ? Number(v).toLocaleString() : '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weights Breakdown */}
            <div className="bg-[#101a25] border border-[#22344a] rounded-xl p-4">
              <h4 className="font-head text-sm font-bold uppercase tracking-wider text-[#8aa0b8] mb-3 flex items-center justify-between">
                <span>Weight Planning</span>
                <span className="text-xs font-mono text-white">Pax: {ofpData.wt?.pax || '—'}</span>
              </h4>
              <div className="space-y-1.5 font-mono text-xs">
                {Object.entries(ofpData.wt).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-[#162230] last:border-0">
                    <span className="text-[#8aa0b8] uppercase">{k}:</span>
                    <span className="text-white font-semibold">{v ? Number(v).toLocaleString() : '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Official SimBrief PDF Embedded Viewer */}
          {ofpData.pdf && (
            <div className="bg-[#101a25] border border-[#22344a] rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#52c7ff]" />
                  <span className="font-head text-sm font-bold uppercase tracking-wider text-white">
                    Official SimBrief Briefing PDF Document
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPdf(!showPdf)}
                    className="px-3 py-1 bg-[#162230] hover:bg-[#22344a] text-xs font-head font-bold uppercase rounded tracking-wider text-white transition border border-[#34506b]"
                  >
                    {showPdf ? 'Hide PDF' : 'Show PDF Viewer'}
                  </button>
                  <a
                    href={pdfProxyUrl || ofpData.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 bg-[#52c7ff]/15 text-[#52c7ff] hover:bg-[#52c7ff]/25 text-xs font-head font-bold uppercase rounded tracking-wider transition border border-[#52c7ff]/30"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open PDF in New Window
                  </a>
                </div>
              </div>

              {showPdf && (
                <div className="rounded-lg overflow-hidden border border-[#22344a] bg-white h-[75vh]">
                  <iframe
                    src={pdfProxyUrl || ofpData.pdf}
                    title="SimBrief Flight Plan PDF"
                    className="w-full h-full border-0"
                  />
                </div>
              )}
            </div>
          )}

          {/* Navlog Fixes Table */}
          {flight.sb?.fixes && flight.sb.fixes.length > 0 && (
            <div className="bg-[#101a25] border border-[#22344a] rounded-xl p-4 overflow-hidden">
              <h4 className="font-head text-sm font-bold uppercase tracking-wider text-[#8aa0b8] mb-3">
                Enroute Navlog ({flight.sb.fixes.length} Waypoints)
              </h4>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#162230] text-[#8aa0b8] sticky top-0 uppercase">
                    <tr>
                      <th className="py-2 px-3">Fix</th>
                      <th className="py-2 px-3">Airway</th>
                      <th className="py-2 px-3">Altitude (ft)</th>
                      <th className="py-2 px-3">Distance (NM)</th>
                      <th className="py-2 px-3">Planned FOB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22344a]">
                    {flight.sb.fixes.map((f, i) => (
                      <tr key={i} className="hover:bg-[#162230]/50">
                        <td className="py-1.5 px-3 font-bold text-white">{f.id}</td>
                        <td className="py-1.5 px-3 text-[#8aa0b8]">{f.awy || 'DCT'}</td>
                        <td className="py-1.5 px-3 text-[#52c7ff]">{f.alt}</td>
                        <td className="py-1.5 px-3 text-[#8aa0b8]">{f.dist}</td>
                        <td className="py-1.5 px-3 text-[#43e0a0] font-semibold">{f.fob}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center border border-dashed border-[#34506b] rounded-xl bg-[#101a25]/50">
          <Plane className="w-12 h-12 text-[#5f7791] mx-auto mb-3 opacity-60" />
          <h4 className="font-head text-lg font-bold uppercase text-white tracking-wider mb-1">
            No SimBrief OFP Loaded Yet
          </h4>
          <p className="text-xs text-[#8aa0b8] max-w-md mx-auto mb-4">
            Enter your SimBrief Username or Pilot ID above and click "Fetch Latest OFP" to instantly import route, times, fuel, passenger load and certified figures.
          </p>
        </div>
      )}
    </div>
  );
}
