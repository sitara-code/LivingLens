import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Compass,
  PlusCircle,
  FileText,
  AlertTriangle,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { User, Zoo, Observation, Alert } from '../types';

interface ZookeeperPortalViewProps {
  user: User | null;
  zoo: Zoo | null;
  observations: Observation[];
  alerts: Alert[];
  onOpenReportModal: () => void;
}

export const ZookeeperPortalView: React.FC<ZookeeperPortalViewProps> = ({
  user,
  zoo,
  observations,
  alerts,
  onOpenReportModal,
}) => {
  const [gpsStatus, setGpsStatus] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: string;
  } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    checkGps();
  }, []);

  const checkGps = () => {
    setGpsLoading(true);
    if (!('geolocation' in navigator)) {
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date(pos.timestamp).toLocaleTimeString(),
        });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Observations by this zookeeper
  const myObservations = observations.filter((o) => o.zookeeperId === user?.id);

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold font-mono text-white tracking-tight">
                  {user?.fullName}
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {user?.badgeNumber || 'ACCREDITED KEEPER'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Assigned Institution:{' '}
                <strong className="text-white">{zoo ? zoo.name : 'Unknown Zoo'}</strong> (
                {zoo?.identifier})
              </p>
            </div>
          </div>

          <button
            onClick={onOpenReportModal}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-950 flex items-center space-x-2 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>REPORT ANIMAL ANOMALY</span>
          </button>
        </div>

        {/* Live GPS Telemetry Strip */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center space-x-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Current Field GPS Telemetry</span>
            </span>
            <button
              onClick={checkGps}
              className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
            >
              {gpsLoading ? 'Acquiring...' : 'Refresh GPS'}
            </button>
          </div>

          {gpsStatus ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">LATITUDE</span>
                <span className="text-white font-bold">{gpsStatus.lat.toFixed(6)}°</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">LONGITUDE</span>
                <span className="text-white font-bold">{gpsStatus.lng.toFixed(6)}°</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ACCURACY</span>
                <span className="text-emerald-400">±{Math.round(gpsStatus.accuracy)}m</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">LAST SYNC</span>
                <span className="text-slate-300">{gpsStatus.timestamp}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              Awaiting device GPS initialization. High-accuracy location is captured automatically when
              you launch an anomaly report.
            </p>
          )}
        </div>
      </div>

      {/* My Reports */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              My Field Observations ({myObservations.length})
            </h3>
          </div>
        </div>

        {myObservations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-700" />
            <p className="text-slate-300">You have not submitted any observations yet today.</p>
            <p className="text-[11px]">
              Click "REPORT ANIMAL ANOMALY" whenever an exhibit shows acute panic, fleeing, or abnormal
              precursor behavior.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myObservations.map((obs) => (
              <div
                key={obs.id}
                className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono uppercase">{obs.species}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {obs.intensity !== undefined ? `INTENSITY ${obs.intensity} / 10` : `SEVERITY ${obs.severity} / 5`}
                  </span>
                </div>
                {obs.totalAnimals !== undefined && (
                  <div className="text-[11px] font-mono text-slate-400">
                    Exhibiting: <span className="text-emerald-400 font-semibold">{obs.animalsShowingBehaviour ?? 0}</span> / {obs.totalAnimals} animals
                  </div>
                )}
                <p className="text-slate-300 italic">"{obs.description}"</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
                  <span>Category: {obs.behaviourCategory}</span>
                  <span>{new Date(obs.observedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
