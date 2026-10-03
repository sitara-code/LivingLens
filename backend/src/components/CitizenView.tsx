import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Compass,
  Radio,
  Info,
  Clock,
  Send,
} from 'lucide-react';
import { api } from '../lib/api';
import { User, Alert, RiskAnalysis } from '../types';

interface CitizenViewProps {
  user: User | null;
  alerts: Alert[];
  riskAnalysis: RiskAnalysis | null;
}

export const CitizenView: React.FC<CitizenViewProps> = ({ user, alerts, riskAnalysis }) => {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(user?.latitude || null);
  const [currentLng, setCurrentLng] = useState<number | null>(user?.longitude || null);
  const [locationPermitted, setLocationPermitted] = useState<boolean>(user?.locationPermission ?? true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshLocation = () => {
    setGpsLoading(true);
    setStatusMessage(null);

    if (!('geolocation' in navigator)) {
      setStatusMessage('Geolocation is not supported by your browser.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLat(lat);
        setCurrentLng(lng);
        setLocationPermitted(true);
        setGpsLoading(false);

        // Update on backend for targeted emergency SMS alerting
        try {
          await api.updateCitizenLocation(lat, lng, true);
          setStatusMessage('Location synchronized with emergency dispatch registry.');
        } catch (e) {
          console.error('Failed to sync location:', e);
        }
      },
      (err) => {
        setLocationPermitted(false);
        setGpsLoading(false);
        setStatusMessage('Location permission denied or unavailable. Fallback to registered city area.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Check if citizen is inside any active risk circle
  const isInsideRiskZone =
    currentLat && currentLng && riskAnalysis
      ? calculateDistanceKm(
          currentLat,
          currentLng,
          riskAnalysis.centerLatitude,
          riskAnalysis.centerLongitude
        ) <= riskAnalysis.estimatedRadiusKm
      : false;

  function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return (
    <div className="space-y-6">
      {/* Official Safety Disclaimer (Critical Requirement) */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-200 flex items-start space-x-3 shadow-lg">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider text-amber-300">
            OFFICIAL EMERGENCY ADVISORY DISCLAIMER
          </p>
          <p className="leading-relaxed">
            Zoo Sentinel provides probabilistic biological early-warning indicators based on animal
            distress behavior. Anomaly detections do not replace official emergency services.
            <strong className="text-white">
              {' '}Always follow official government civil defense instructions, evacuation notices, and local emergency personnel.
            </strong>
          </p>
        </div>
      </div>

      {/* Citizen Telemetry Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold font-mono text-white uppercase tracking-tight">
                Citizen Safety & Emergency SMS Dispatch
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Registered Citizen: <span className="text-white font-medium">{user?.fullName}</span> |{' '}
              {user?.email}
            </p>
          </div>

          <button
            id="btn-refresh-citizen-gps"
            onClick={refreshLocation}
            disabled={gpsLoading}
            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{gpsLoading ? 'Acquiring GPS...' : 'Update My Live Location'}</span>
          </button>
        </div>

        {statusMessage && (
          <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300">
            {statusMessage}
          </div>
        )}

        {/* Current Location & Zone Proximity Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase block">Phone for Emergency SMS</span>
            <div className="flex items-center space-x-1.5 text-white font-bold">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>{user?.phoneNumber || 'Not registered'}</span>
            </div>
            <span className="text-[10px] text-emerald-400 block">✓ SMS Notification Active</span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase block">Location Status</span>
            <div className="text-slate-200">
              {currentLat && currentLng ? (
                <span className="font-bold text-white">
                  {currentLat.toFixed(5)}°, {currentLng.toFixed(5)}°
                </span>
              ) : (
                <span className="text-slate-500">Awaiting location capture</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Permission: {locationPermitted ? '✓ Granted' : '⚠ Limited'}
            </span>
          </div>

          <div
            className={`p-3.5 rounded-lg border space-y-1 ${
              isInsideRiskZone
                ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
            }`}
          >
            <span className="text-[10px] uppercase block">Proximity Evaluation</span>
            <div className="flex items-center space-x-1.5 font-bold text-sm">
              {isInsideRiskZone ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-300">INSIDE THREAT ZONE</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">OUTSIDE ESTIMATED DANGER ZONE</span>
                </>
              )}
            </div>
            <span className="text-[10px] opacity-80 block">
              {riskAnalysis
                ? `Closest threat epicenter: ${riskAnalysis.eventType}`
                : 'No active threat perimeter'}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Alerts Feed */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Emergency Warning Bulletins
            </h3>
          </div>
          <span className="text-xs text-slate-400">Total: {alerts.length}</span>
        </div>

        {alerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/60" />
            <p className="text-slate-300 font-medium">No emergency alerts active for your area.</p>
            <p className="text-[11px] text-slate-500">
              When clustered biological precursor distress triggers an emergency threshold, alerts will
              be dispatched here and via SMS.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-lg bg-slate-950 border border-rose-900/60 text-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <h4 className="font-bold text-white text-sm font-mono uppercase">
                      {alert.title}
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-300 whitespace-pre-line leading-relaxed">{alert.message}</p>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Affected Radius: {alert.radiusKm} km</span>
                  <span className="text-emerald-400">SMS Status: {alert.smsDispatchStatus}</span>
                  <span>Targeted Citizens in Zone: {alert.targetedCitizensCount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
