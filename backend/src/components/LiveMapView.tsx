import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Eye, ShieldAlert, ZoomIn, ZoomOut, RotateCcw, AlertTriangle } from 'lucide-react';
import { Zoo, Observation, RiskAnalysis, Alert } from '../types';

interface LiveMapViewProps {
  zoos: Zoo[];
  observations: Observation[];
  riskAnalysis: RiskAnalysis | null;
  alerts: Alert[];
  onSelectObservation?: (obs: Observation) => void;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  zoos,
  observations,
  riskAnalysis,
  alerts,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const zoosLayerRef = useRef<L.LayerGroup | null>(null);
  const geofencesLayerRef = useRef<L.LayerGroup | null>(null);
  const observationsLayerRef = useRef<L.LayerGroup | null>(null);
  const riskZoneLayerRef = useRef<L.LayerGroup | null>(null);
  const alertsLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer visibility toggles
  const [showZoos, setShowZoos] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showObservations, setShowObservations] = useState(true);
  const [showRiskZone, setShowRiskZone] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  // Current logged-in user's GPS location captured during login.
  const [currentUserLocation, setCurrentUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);

  // Load the current user's location captured during login.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUserLocation');

      if (stored) {
        const parsed = JSON.parse(stored);

        if (
          typeof parsed.latitude === 'number' &&
          typeof parsed.longitude === 'number'
        ) {
          setCurrentUserLocation({
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            accuracy: parsed.accuracy,
          });
        }
      }
    } catch {
      // Ignore invalid/missing stored location.
    }
  }, [currentUserLocation, zoos]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Prefer the logged-in user's current GPS location.
    // Fall back to the first zoo, then global view.
    const initialLat = currentUserLocation?.latitude ?? (zoos.length > 0 ? zoos[0].latitude : 20);
    const initialLng = currentUserLocation?.longitude ?? (zoos.length > 0 ? zoos[0].longitude : 0);
    const initialZoom = currentUserLocation ? 13 : (zoos.length > 0 ? 5 : 2);

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | Zoo Sentinel',
    }).addTo(map);

    // Current logged-in user's location marker.
    if (currentUserLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-location',
        html: `
          <div style="
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #2563eb;
            border: 3px solid white;
            box-shadow: 0 0 0 6px rgba(37,99,235,0.22), 0 2px 8px rgba(0,0,0,0.35);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const userMarker = L.marker(
        [currentUserLocation.latitude, currentUserLocation.longitude],
        { icon: userIcon }
      );

      userMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #2563eb;">YOUR CURRENT LOCATION</strong><br/>
          <span>Latitude: ${currentUserLocation.latitude.toFixed(6)}</span><br/>
          <span>Longitude: ${currentUserLocation.longitude.toFixed(6)}</span><br/>
          ${
            currentUserLocation.accuracy
              ? `<span>GPS Accuracy: ±${Math.round(currentUserLocation.accuracy)}m</span>`
              : ''
          }
        </div>
      `);

      userMarker.addTo(map);
    }

    // Zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initialize LayerGroups
    const zoosLayer = L.layerGroup().addTo(map);
    const geofencesLayer = L.layerGroup().addTo(map);
    const observationsLayer = L.layerGroup().addTo(map);
    const riskZoneLayer = L.layerGroup().addTo(map);
    const alertsLayer = L.layerGroup().addTo(map);

    zoosLayerRef.current = zoosLayer;
    geofencesLayerRef.current = geofencesLayer;
    observationsLayerRef.current = observationsLayer;
    riskZoneLayerRef.current = riskZoneLayer;
    alertsLayerRef.current = alertsLayer;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Zoos & Geofences
  useEffect(() => {
    if (!mapRef.current || !zoosLayerRef.current || !geofencesLayerRef.current) return;

    zoosLayerRef.current.clearLayers();
    geofencesLayerRef.current.clearLayers();

    if (showZoos) {
      for (const zoo of zoos) {
        // Institution Icon
        const zooIcon = L.divIcon({
          className: 'custom-zoo-marker',
          html: `<div style="background-color: #0284c7; color: white; width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">🏛️</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([zoo.latitude, zoo.longitude], { icon: zooIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <strong style="color: #0284c7; font-size: 13px;">${zoo.name}</strong><br/>
            <span style="color: #64748b;">Code: <b>${zoo.identifier}</b> | ${zoo.city}, ${zoo.country}</span><br/>
            <span style="color: #059669;">Verified Institution Status: ${zoo.verified ? '✓ Verified' : 'Pending'}</span><br/>
            <span>Truth Rating: <b>${zoo.truthRating}%</b></span><br/>
            <span>Geofence Perimeter: <b>${zoo.geofenceRadiusMeters}m</b></span>
          </div>
        `);
        zoosLayerRef.current.addLayer(marker);
      }
    }

    if (showGeofences) {
      for (const zoo of zoos) {
        if (zoo.geofencePolygon && zoo.geofencePolygon.length >= 3) {
          const poly = L.polygon(zoo.geofencePolygon, {
            color: '#0284c7',
            weight: 2,
            dashArray: '4, 4',
            fillColor: '#38bdf8',
            fillOpacity: 0.12,
          });
          poly.bindTooltip(`${zoo.name} Geofence`, { sticky: true });
          geofencesLayerRef.current.addLayer(poly);
        }
      }
    }
  }, [zoos, showZoos, showGeofences]);

  // Update Observations Layer
  useEffect(() => {
    if (!mapRef.current || !observationsLayerRef.current) return;
    observationsLayerRef.current.clearLayers();

    if (!showObservations) return;

    for (const obs of observations) {
      const isVerified = obs.verificationStatus === 'VERIFIED_IN_GEOFENCE';
      const color =
        obs.severity >= 4 ? '#e11d48' : obs.severity === 3 ? '#f59e0b' : '#10b981';

      const obsIcon = L.divIcon({
        className: 'custom-obs-marker',
        html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 8px ${color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 9px; font-weight: bold;">!</div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([obs.latitude, obs.longitude], { icon: obsIcon });
      const mediaSnippet = obs.mediaUrl
        ? obs.mediaType === 'video'
          ? `<video src="${obs.mediaUrl}" controls style="width: 100%; max-height: 120px; border-radius: 4px; margin-top: 6px;"></video>`
          : `<img src="${obs.mediaUrl}" alt="Media" style="width: 100%; max-height: 120px; object-fit: cover; border-radius: 4px; margin-top: 6px;" />`
        : '';

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; max-width: 240px;">
          <div style="font-weight: bold; color: ${color}; font-size: 13px; text-transform: uppercase;">
            ${obs.species}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
            <b>Category:</b> ${obs.behaviourCategory}
          </div>
          <div style="background: #f8fafc; border-left: 3px solid ${color}; padding: 4px 6px; margin: 4px 0; font-size: 11px; color: #1e293b;">
            "${obs.description}"
          </div>
          <div style="font-size: 11px; color: #64748b;">
            <b>Severity:</b> Level ${obs.severity}/5<br/>
            <b>Institution:</b> ${obs.zooName}<br/>
            <b>Keeper:</b> ${obs.zookeeperName}<br/>
            <b>GPS Accuracy:</b> ±${Math.round(obs.gpsAccuracy)}m<br/>
            <b>Observed:</b> ${new Date(obs.observedAt).toLocaleString()}
          </div>
          ${mediaSnippet}
        </div>
      `);

      observationsLayerRef.current.addLayer(marker);
    }
  }, [observations, showObservations]);

  // Update Risk Zones & Clustering
  useEffect(() => {
    if (!mapRef.current || !riskZoneLayerRef.current) return;
    riskZoneLayerRef.current.clearLayers();

    if (!showRiskZone || !riskAnalysis || riskAnalysis.observationCount < 2) return;

    // Draw estimated affected radius circle
    const dangerCircle = L.circle([riskAnalysis.centerLatitude, riskAnalysis.centerLongitude], {
      radius: riskAnalysis.estimatedRadiusKm * 1000,
      color: riskAnalysis.riskScore >= 60 ? '#dc2626' : '#d97706',
      fillColor: riskAnalysis.riskScore >= 60 ? '#ef4444' : '#f59e0b',
      fillOpacity: 0.18,
      weight: 2,
      dashArray: '6, 6',
    });

    dangerCircle.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
        <strong style="color: #dc2626; font-size: 13px;">BIOLOGICAL ANOMALY RISK ZONE</strong><br/>
        <b>Potential Event:</b> ${riskAnalysis.eventType}<br/>
        <b>Model-Estimated Risk:</b> ${riskAnalysis.riskScore}% (${riskAnalysis.confidence} Confidence)<br/>
        <b>Estimated Radius:</b> ${riskAnalysis.estimatedRadiusKm} km<br/>
        <b>Estimated Window:</b> ${riskAnalysis.estimatedTimeWindow}<br/>
        <div style="margin-top: 4px; font-size: 11px; color: #64748b;">
          Calculated from ${riskAnalysis.observationCount} verified observation(s) across ${riskAnalysis.zooCount} zoo(s).
        </div>
      </div>
    `);

    riskZoneLayerRef.current.addLayer(dangerCircle);

    // Center icon
    const centerIcon = L.divIcon({
      className: 'custom-risk-center',
      html: `<div style="background-color: #dc2626; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px #dc2626;">⚠</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const centerMarker = L.marker([riskAnalysis.centerLatitude, riskAnalysis.centerLongitude], {
      icon: centerIcon,
    });
    centerMarker.bindTooltip(`Risk Epicenter: ${riskAnalysis.eventType}`, { permanent: false });
    riskZoneLayerRef.current.addLayer(centerMarker);
  }, [riskAnalysis, showRiskZone]);

  // Update Active Alerts Polygons
  useEffect(() => {
    if (!mapRef.current || !alertsLayerRef.current) return;
    alertsLayerRef.current.clearLayers();

    if (!showAlerts) return;

    for (const alert of alerts) {
      if (alert.polygon && alert.polygon.length >= 3) {
        const poly = L.polygon(alert.polygon, {
          color: '#e11d48',
          weight: 3,
          fillColor: '#f43f5e',
          fillOpacity: 0.22,
        });

        poly.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
            <div style="font-weight: bold; color: #e11d48; font-size: 13px;">
              ${alert.title}
            </div>
            <div style="font-size: 11px; color: #475569; margin: 4px 0;">
              <b>Targeted Citizens in Zone:</b> ${alert.targetedCitizensCount}<br/>
              <b>Emergency SMS:</b> ${alert.smsDispatchStatus}<br/>
              <b>Radius:</b> ${alert.radiusKm} km<br/>
              <b>Timestamp:</b> ${new Date(alert.createdAt).toLocaleTimeString()}
            </div>
            <div style="font-size: 10px; color: #64748b; font-style: italic;">
              ${alert.message.replace(/\n/g, '<br/>')}
            </div>
          </div>
        `);

        alertsLayerRef.current.addLayer(poly);
      }
    }
  }, [alerts, showAlerts]);

  // Fit view helper
  const handleFitToData = () => {
    if (!mapRef.current) return;

    const bounds = L.latLngBounds([]);

    // Include current logged-in user's location
    if (currentUserLocation) {
      bounds.extend([currentUserLocation.latitude, currentUserLocation.longitude]);
    }

    // Include zoos
    for (const zoo of zoos) {
      bounds.extend([zoo.latitude, zoo.longitude]);
    }

    // Include observations
    for (const obs of observations) {
      bounds.extend([obs.latitude, obs.longitude]);
    }

    if (riskAnalysis) {
      bounds.extend([riskAnalysis.centerLatitude, riskAnalysis.centerLongitude]);
    }

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };

  return (
    <div className="relative w-full h-[650px] rounded-xl overflow-hidden border border-slate-700 shadow-xl bg-slate-950">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Control Deck */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 shadow-lg text-xs space-y-2 text-slate-200 w-60">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-mono font-semibold text-slate-300">
          <span className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>MAP INTELLIGENCE</span>
          </span>
          <button
            onClick={handleFitToData}
            className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center space-x-0.5"
            title="Fit to active data"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset View</span>
          </button>
        </div>

        {currentUserLocation && (
          <div className="border-b border-slate-800 pb-2 mb-2 text-[10px] text-blue-300">
            <span className="font-semibold">● LIVE USER LOCATION</span>
            {currentUserLocation.accuracy
              ? ` • ±${Math.round(currentUserLocation.accuracy)}m`
              : ''}
          </div>
        )}

        <div className="space-y-1.5 text-[11px]">
          <label className="flex items-center justify-between cursor-pointer hover:text-white">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-sky-500" />
              <span>Registered Zoos ({zoos.length})</span>
            </span>
            <input
              type="checkbox"
              checked={showZoos}
              onChange={(e) => setShowZoos(e.target.checked)}
              className="rounded accent-sky-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:text-white">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 border border-sky-400 border-dashed rounded" />
              <span>Zoo Geofence Boundaries</span>
            </span>
            <input
              type="checkbox"
              checked={showGeofences}
              onChange={(e) => setShowGeofences(e.target.checked)}
              className="rounded accent-sky-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:text-white">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Verified Observations ({observations.length})</span>
            </span>
            <input
              type="checkbox"
              checked={showObservations}
              onChange={(e) => setShowObservations(e.target.checked)}
              className="rounded accent-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:text-white">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300" />
              <span>Anomaly Risk Zone</span>
            </span>
            <input
              type="checkbox"
              checked={showRiskZone}
              onChange={(e) => setShowRiskZone(e.target.checked)}
              className="rounded accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:text-white">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded border border-rose-500 bg-rose-500/30" />
              <span>Active Alert Polygons ({alerts.length})</span>
            </span>
            <input
              type="checkbox"
              checked={showAlerts}
              onChange={(e) => setShowAlerts(e.target.checked)}
              className="rounded accent-rose-500"
            />
          </label>
        </div>
      </div>

      {/* Bottom Status Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-2 text-[11px] text-slate-300 flex items-center space-x-3 shadow-lg">
          <span className="font-semibold text-white">Severity Legend:</span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>1-2 (Mild)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>3 (Marked)</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-600" />
            <span>4-5 (Acute Panic)</span>
          </span>
        </div>

        {riskAnalysis && (
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-amber-600/70 rounded-lg px-3 py-2 text-xs text-amber-300 flex items-center space-x-2 shadow-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Active Threat Epicenter: <b>{riskAnalysis.eventType}</b> ({riskAnalysis.estimatedRadiusKm} km radius)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
