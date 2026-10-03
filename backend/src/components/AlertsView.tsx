import React from 'react';
import {
  AlertTriangle,
  Send,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { Alert } from '../types';

interface AlertsViewProps {
  alerts: Alert[];
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-bold font-mono text-white uppercase tracking-tight">
                Emergency Warning Dispatches & Geo-Targeted Alerts
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Automated biological early warning bulletins generated when multi-zoo cluster risk
              crosses threshold (≥60%).
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs">
            <span className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
              Total Bulletins Issued: <strong className="text-rose-400">{alerts.length}</strong>
            </span>
          </div>
        </div>

        {/* Emergency SMS Protocol */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-white font-mono uppercase text-[11px]">
            Geo-Targeted SMS Dispatch Architecture:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
            <li>
              When risk crosses the 60% threshold, an emergency hazard polygon is computed.
            </li>
            <li>
              The server queries registered citizens whose live GPS or registered district coordinates
              fall strictly inside the danger zone.
            </li>
            <li>
              Emergency SMS dispatch is triggered via Twilio (or logged with explicit delivery status if
              credentials are in test mode).
            </li>
            <li>
              Alerts clearly instruct recipients to follow official municipal emergency civil defense
              channels.
            </li>
          </ul>
        </div>
      </div>

      {/* Alerts Feed */}
      {alerts.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500/60" />
          <h3 className="font-bold text-white font-mono text-base">No active emergency alerts</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            The system currently has no active biological emergency warnings. Alerts are triggered
            automatically when clustered observations from accredited institutions indicate elevated
            hazard probability.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base font-mono uppercase tracking-tight">
                      {alert.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                      <span>Radius: {alert.radiusKm} km</span>
                      <span>•</span>
                      <span>Risk: {alert.riskScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1 font-mono text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold">
                    {alert.smsDispatchStatus}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Message Payload */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {alert.message}
              </div>

              {/* Footer details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                <div className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Targeted Citizens in Zone: {alert.targetedCitizensCount}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-sky-400" />
                  <span>
                    Epicenter: {alert.centerLatitude.toFixed(4)}°, {alert.centerLongitude.toFixed(4)}°
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 text-slate-400 sm:justify-end">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Dispatched: {new Date(alert.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
