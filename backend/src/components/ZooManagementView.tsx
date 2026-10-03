import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  UserPlus,
  Key,
  RotateCw,
  Trash2,
  MapPin,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Compass,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../lib/api';
import { Zoo, Zookeeper, User } from '../types';

interface ZooManagementViewProps {
  zoo: Zoo | null;
  user: User | null;
  onZooUpdated: (updatedZoo: Zoo) => void;
}

export const ZooManagementView: React.FC<ZooManagementViewProps> = ({
  zoo,
  user,
  onZooUpdated,
}) => {
  const [zookeepers, setZookeepers] = useState<Zookeeper[]>([]);
  const [loadingKeepers, setLoadingKeepers] = useState(false);

  // New keeper modal state
  const [showAddKeeperModal, setShowAddKeeperModal] = useState(false);
  const [keeperName, setKeeperName] = useState('');
  const [keeperBadge, setKeeperBadge] = useState('');
  const [keeperEmail, setKeeperEmail] = useState('');
  const [submittingKeeper, setSubmittingKeeper] = useState(false);
  const [newAccessCodeModal, setNewAccessCodeModal] = useState<{
    keeperName: string;
    code: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Geofence calibration state
  const [calibrating, setCalibrating] = useState(false);
  const [geofenceMessage, setGeofenceMessage] = useState<string | null>(null);

  useEffect(() => {
    loadZookeepers();
  }, [zoo?.id]);

  const loadZookeepers = async () => {
    if (!zoo) return;
    setLoadingKeepers(true);
    try {
      const data = await api.getZookeepers();
      setZookeepers(data);
    } catch (err) {
      console.error('Failed to load keepers:', err);
    } finally {
      setLoadingKeepers(false);
    }
  };

  const handleCreateKeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingKeeper(true);
    try {
      const res = await api.createZookeeper({
        fullName: keeperName,
        badgeNumber: keeperBadge,
        email: keeperEmail,
      });

      setShowAddKeeperModal(false);
      setNewAccessCodeModal({
        keeperName: res.zookeeper.fullName,
        code: res.oneTimeAccessCode,
      });

      setKeeperName('');
      setKeeperBadge('');
      setKeeperEmail('');
      loadZookeepers();
    } catch (err: any) {
      alert(err.message || 'Failed to create zookeeper account');
    } finally {
      setSubmittingKeeper(false);
    }
  };

  const handleRegenerateCode = async (keeperId: string, name: string) => {
    if (!confirm(`Regenerate access code for zookeeper ${name}? Previous code will be invalidated.`)) {
      return;
    }

    try {
      const res = await api.regenerateAccessCode(keeperId);
      setNewAccessCodeModal({
        keeperName: name,
        code: res.oneTimeAccessCode,
      });
      loadZookeepers();
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate code');
    }
  };

  const handleRevokeKeeper = async (keeperId: string, name: string) => {
    if (!confirm(`Revoke field access for zookeeper ${name}? They will no longer be able to log in.`)) {
      return;
    }

    try {
      await api.revokeZookeeperAccess(keeperId);
      loadZookeepers();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke access');
    }
  };

  const handleCalibrateToCurrentGps = () => {
    if (!zoo) return;
    setCalibrating(true);
    setGeofenceMessage(null);

    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      setCalibrating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Create 1500m square geofence polygon centered on current position (~0.0135 degrees lat/long)
        const dLat = 0.0135;
        const dLng = 0.0135;

        const newPolygon: [number, number][] = [
          [Number((latitude + dLat).toFixed(6)), Number((longitude - dLng).toFixed(6))],
          [Number((latitude + dLat).toFixed(6)), Number((longitude + dLng).toFixed(6))],
          [Number((latitude - dLat).toFixed(6)), Number((longitude + dLng).toFixed(6))],
          [Number((latitude - dLat).toFixed(6)), Number((longitude - dLng).toFixed(6))],
        ];

        try {
          const updated = await api.updateGeofence(zoo.id, newPolygon, latitude, longitude, 1500);
          onZooUpdated(updated);
          setGeofenceMessage(
            `Successfully calibrated perimeter! Zoo coordinates set to your exact current location (${latitude.toFixed(
              4
            )}°, ${longitude.toFixed(4)}°) with a 1,500m geofence. You can now test submitting observations from this device!`
          );
        } catch (err: any) {
          alert(err.message || 'Failed to update geofence');
        } finally {
          setCalibrating(false);
        }
      },
      (err) => {
        alert(`Could not acquire GPS: ${err.message}. Ensure location permissions are granted.`);
        setCalibrating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!zoo) {
    return (
      <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center">
        <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-2" />
        <h3 className="text-white font-bold font-mono">No Institution Assigned</h3>
        <p className="text-xs text-slate-400">
          Log in with a verified Zoo Administrator account to manage institutional parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Institution Profile Card */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold font-mono text-white tracking-tight">
                  {zoo.name}
                </h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                  {zoo.identifier}
                </span>
                {zoo.verified && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>VERIFIED INSTITUTION</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {zoo.city}, {zoo.country} • Administrator: {user?.fullName} ({user?.email})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] uppercase block">Truth Rating</span>
              <span className="text-emerald-400 font-bold text-base">{zoo.truthRating}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-slate-500 text-[10px] uppercase block">Total Reports</span>
              <span className="text-white font-bold text-base">{zoo.totalReports}</span>
            </div>
          </div>
        </div>

        {/* Geofence Perimeter Quick Calibrate (Crucial for real tester usability) */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Geofence Perimeter & GPS Calibration</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Center Coordinates: {zoo.latitude.toFixed(5)}°, {zoo.longitude.toFixed(5)}° | Radius:{' '}
                {zoo.geofenceRadiusMeters}m ({zoo.geofencePolygon.length} polygon vertices)
              </p>
            </div>

            <button
              id="btn-calibrate-gps"
              onClick={handleCalibrateToCurrentGps}
              disabled={calibrating}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>
                {calibrating ? 'Acquiring GPS...' : 'Calibrate Perimeter to My Current Location'}
              </span>
            </button>
          </div>

          {geofenceMessage && (
            <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{geofenceMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Zookeeper Management Section */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Accredited Zookeepers & Access Credentials</span>
            </h3>
            <p className="text-xs text-slate-400">
              Only zookeepers created here receive authorized one-time access codes to submit verified
              field logs.
            </p>
          </div>

          <button
            id="btn-add-zookeeper"
            onClick={() => setShowAddKeeperModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Onboard New Zookeeper</span>
          </button>
        </div>

        {/* Zookeeper Roster Table */}
        {loadingKeepers ? (
          <div className="py-6 text-center text-xs text-slate-500">Loading zookeeper roster...</div>
        ) : zookeepers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-700" />
            <p>No zookeepers currently registered for this institution.</p>
            <p className="text-slate-400">
              Click "Onboard New Zookeeper" above to generate credentials for your staff.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-950 font-mono text-[10px] text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Keeper Name</th>
                  <th className="py-2.5 px-3">Badge / ID</th>
                  <th className="py-2.5 px-3">Registered Email</th>
                  <th className="py-2.5 px-3">Access Credential</th>
                  <th className="py-2.5 px-3">Access Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {zookeepers.map((zk) => (
                  <tr key={zk.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-white">{zk.fullName}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400">{zk.badgeNumber}</td>
                    <td className="py-2.5 px-3 text-slate-400">{zk.email}</td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="text-emerald-400 text-[10px]">
                        {zk.hasActiveAccessCode ? 'HASHED CODE ACTIVE' : 'NO CODE'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          zk.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {zk.active ? 'ACTIVE' : 'REVOKED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleRegenerateCode(zk.id, zk.fullName)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-medium transition-colors"
                        title="Regenerate one-time access code"
                      >
                        New Code
                      </button>
                      <button
                        onClick={() => handleRevokeKeeper(zk.id, zk.fullName)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-rose-400 text-[11px] font-medium transition-colors"
                        title="Revoke access"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Keeper Modal */}
      {showAddKeeperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 text-xs text-slate-200 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Onboard Accredited Zookeeper
            </h3>
            <p className="text-slate-400 text-[11px]">
              The server will generate a secure one-time access code. You will share this code with
              the keeper to allow them to authenticate.
            </p>

            <form onSubmit={handleCreateKeeper} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Zookeeper Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Gonzalez"
                  value={keeperName}
                  onChange={(e) => setKeeperName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Badge / Staff ID Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ZK-509"
                  value={keeperBadge}
                  onChange={(e) => setKeeperBadge(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Official Staff Email</label>
                <input
                  type="email"
                  required
                  placeholder="keeper@zoo.org"
                  value={keeperEmail}
                  onChange={(e) => setKeeperEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddKeeperModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingKeeper}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded"
                >
                  {submittingKeeper ? 'Generating Code...' : 'Create & Issue Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Code Reveal Modal (Strict Security: One-time view for Director) */}
      {newAccessCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500 rounded-xl w-full max-w-md p-6 text-xs text-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Key className="w-5 h-5" />
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-white">
                One-Time Zookeeper Access Code
              </h3>
            </div>

            <p className="text-slate-300 text-xs">
              Provide this code securely to{' '}
              <strong className="text-white">{newAccessCodeModal.keeperName}</strong>. The server has
              hashed this code and will NOT store the plain text.
            </p>

            <div className="p-4 bg-slate-950 border border-emerald-700 rounded-lg flex items-center justify-between">
              <span className="font-mono text-lg font-bold tracking-widest text-emerald-300">
                {newAccessCodeModal.code}
              </span>
              <button
                onClick={() => copyToClipboard(newAccessCodeModal.code)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center space-x-1"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              The zookeeper will enter this code on the Zookeeper Login screen along with their Badge/Email.
            </p>

            <button
              onClick={() => setNewAccessCodeModal(null)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg"
            >
              I Have Securely Distributed This Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
