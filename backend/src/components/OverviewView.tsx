import React from 'react';
import {
  ShieldAlert,
  Activity,
  MapPin,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  Radio,
  FileCheck2,
  Compass,
  ChevronRight,
  Info,
} from 'lucide-react';
import { RiskAnalysis, Zoo, Observation, Alert, User } from '../types';

interface OverviewViewProps {
  riskAnalysis: RiskAnalysis | null;
  zoos: Zoo[];
  observations: Observation[];
  alerts: Alert[];
  user: User | null;
  onNavigate: (tab: string) => void;
  onOpenReportModal: () => void;
  onOpenLogin: (role?: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  riskAnalysis,
  zoos,
  observations,
  alerts,
  user,
  onNavigate,
  onOpenReportModal,
  onOpenLogin,
}) => {
  const verifiedCount = observations.filter((o) => o.verificationStatus === 'VERIFIED_IN_GEOFENCE').length;
  const criticalAlerts = alerts.filter((a) => a.riskScore >= 60);

  return (
    <div className="space-y-6">
      {/* Official Safety Advisory Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start space-x-3 shadow-md">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold text-white uppercase tracking-wider font-mono">
            Scientific Protocol Notice:
          </span>{' '}
          Zoo Sentinel is a biological early-warning and precursor research platform. Animal sensory
          distress anomalies are probabilistic bio-seismic indicators, not deterministic guarantees.
          <span className="text-amber-300 font-medium">
            {' '}Always follow official civil emergency services, meteorological offices, and government alerts.
          </span>
        </div>
      </div>

      {/* Real-time Status Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase tracking-wider font-mono">Verified Institutions</span>
            <Building2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {zoos.filter((z) => z.verified).length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {zoos.length} total institutions in master network
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase tracking-wider font-mono">Verified Observations</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{verifiedCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {observations.length === 0 ? 'No observations yet' : `${observations.length} total submissions recorded`}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase tracking-wider font-mono">Active Threat Level</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {riskAnalysis ? (
              <span
                className={
                  riskAnalysis.riskScore >= 60
                    ? 'text-rose-400'
                    : riskAnalysis.riskScore >= 35
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }
              >
                {riskAnalysis.riskScore}% ({riskAnalysis.confidence})
              </span>
            ) : (
              <span className="text-slate-500 text-lg">Nominal</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {riskAnalysis ? `Potential: ${riskAnalysis.eventType}` : 'No active anomaly detected'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="uppercase tracking-wider font-mono">Emergency Alerts</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{alerts.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {criticalAlerts.length} high-severity warnings issued
          </p>
        </div>
      </div>

      {/* Main Feature: Interpretable Risk Card (Section 9 & 20) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Card */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                  BIOLOGICAL ANOMALY RISK ASSESSMENT
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                MODEL: v2.4 HYBRID
              </span>
            </div>

            {riskAnalysis ? (
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Potential Event
                    </span>
                    <span className="text-xl font-bold text-white font-mono uppercase tracking-tight">
                      {riskAnalysis.eventType}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Model-Estimated Risk
                    </span>
                    <div className="flex items-baseline space-x-2">
                      <span
                        className={`text-2xl font-black font-mono ${
                          riskAnalysis.riskScore >= 60
                            ? 'text-rose-400'
                            : riskAnalysis.riskScore >= 35
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {riskAnalysis.riskScore}%
                      </span>
                      <span className="text-xs text-slate-400">
                        ({riskAnalysis.confidence} Confidence)
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      Estimated Window
                    </span>
                    <span className="text-sm font-semibold text-slate-200 block truncate">
                      {riskAnalysis.estimatedTimeWindow}
                    </span>
                  </div>
                </div>

                {/* Cluster metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">OBSERVATION CLUSTER</span>
                    <span className="text-white font-bold">
                      {riskAnalysis.observationCount} reports / {riskAnalysis.zooCount} zoo(s)
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">SPECIES DIVERSITY</span>
                    <span className="text-white font-bold">{riskAnalysis.speciesCount} species</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">AFFECTED RADIUS</span>
                    <span className="text-amber-400 font-bold">
                      {riskAnalysis.estimatedRadiusKm} km
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 text-[10px] block">EPICENTER COORDINATES</span>
                    <span className="text-slate-300">
                      {riskAnalysis.centerLatitude.toFixed(3)}°, {riskAnalysis.centerLongitude.toFixed(3)}°
                    </span>
                  </div>
                </div>

                {/* Explainability Section - "Why?" (Section 9 Requirement) */}
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-2">
                    <span className="text-emerald-400">Why was this score generated?</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                    {riskAnalysis.explanation.map((reason, idx) => (
                      <li key={idx} className="text-slate-300">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <Activity className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                <div>
                  <h4 className="font-semibold text-slate-300">Insufficient verified observations for risk analysis.</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    The biological early warning system evaluates real-time clusters as verified
                    observations are logged by zookeepers inside their zoo geofence.
                  </p>
                </div>
                {!user && (
                  <button
                    onClick={() => onOpenLogin('ZOOKEEPER')}
                    className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                  >
                    Log In as Zookeeper to Submit Field Data
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {riskAnalysis
                ? `Last calculated: ${new Date(riskAnalysis.analysisTime).toLocaleTimeString()}`
                : 'Listening for real-time sensor events...'}
            </span>
            <button
              onClick={() => onNavigate('risk')}
              className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1"
            >
              <span>View Full Interpretability Engine</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Panel & Real-time Feeds */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              Operational Actions
            </h4>

            <button
              onClick={onOpenReportModal}
              className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950 flex items-center justify-center space-x-2 transition-all active:scale-95"
            >
              <Radio className="w-4 h-4" />
              <span>SUBMIT ANOMALOUS BEHAVIOUR</span>
            </button>

            <button
              onClick={() => onNavigate('map')}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>Explore Interactive Live Map</span>
            </button>

            <button
              onClick={() => onNavigate('alerts')}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>View Emergency Warning Dispatches</span>
            </button>
          </div>

          {/* Institutional Participation Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold font-mono text-slate-300 uppercase">
                Active Zoos In Network
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">ONLINE</span>
            </div>

            <div className="space-y-2 text-xs">
              {zoos.slice(0, 3).map((z) => (
                <div
                  key={z.id}
                  className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-white block truncate max-w-[170px]">
                      {z.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {z.city}, {z.country}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-mono text-[11px] font-bold block">
                      {z.truthRating}%
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase">Truth Rating</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('truth')}
              className="w-full text-center text-xs text-sky-400 hover:text-sky-300 pt-1"
            >
              View All Institution Truth Ratings →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
