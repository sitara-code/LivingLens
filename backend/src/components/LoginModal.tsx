import React, { useState } from 'react';
import { X, Building2, UserCheck, Shield, AlertCircle, Phone, Lock, CheckCircle } from 'lucide-react';
import { api, setStoredToken } from '../lib/api';
import { User, Zoo } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, zoo?: Zoo | null) => void;
  initialRole?: string;
  zoos: Zoo[];
}


const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
} | null> => {
  if (!('geolocation' in navigator)) return null;

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch {
    return null;
  }
};

const storeCurrentLocation = async () => {
  const location = await getCurrentLocation();

  if (location) {
    localStorage.setItem('currentUserLocation', JSON.stringify({
      ...location,
      capturedAt: new Date().toISOString(),
    }));
  }

  return location;
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'ZOO_ADMIN',
  zoos,
}) => {
  const [activeTab, setActiveTab] = useState<'ZOO_ADMIN' | 'ZOOKEEPER' | 'CITIZEN' | 'MASTER_ADMIN'>(
    (initialRole as any) || 'ZOO_ADMIN'
  );

  const [citizenMode, setCitizenMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  // Zoo Admin
  const [zooIdentifier, setZooIdentifier] = useState('');
  const [zooEmail, setZooEmail] = useState('');
  const [zooPassword, setZooPassword] = useState('');

  // Zookeeper
  const [zkZooId, setZkZooId] = useState('');
  const [zkIdentifier, setZkIdentifier] = useState('');
  const [zkAccessCode, setZkAccessCode] = useState('');

  // Citizen
  const [citizenFullName, setCitizenFullName] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenLocation, setCitizenLocation] = useState('');
  const [citizenLocPermission, setCitizenLocPermission] = useState(true);

  // Master Admin
  const [masterEmail, setMasterEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');

  if (!isOpen) return null;

  const handleZooAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.zooAdminLogin({
        identifier: zooIdentifier,
        email: zooEmail,
        password: zooPassword,
      });
      setStoredToken(res.token);
      await storeCurrentLocation();
      onLoginSuccess(res.user, res.zoo);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify institution and credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleZookeeperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.zookeeperLogin({
        zooId: zkZooId,
        zookeeperIdentifier: zkIdentifier,
        accessCode: zkAccessCode,
      });
      setStoredToken(res.token);
      await storeCurrentLocation();
      onLoginSuccess(res.user, res.zoo);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Zookeeper authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (citizenMode === 'register') {
        // Capture the user's current GPS location during registration.
        let lat: number | undefined;
        let lng: number | undefined;

        if (citizenLocPermission) {
          const location = await getCurrentLocation();

          if (location) {
            lat = location.latitude;
            lng = location.longitude;

            localStorage.setItem('currentUserLocation', JSON.stringify({
              ...location,
              capturedAt: new Date().toISOString(),
            }));
          }
        }

        const res = await api.citizenRegister({
          fullName: citizenFullName,
          email: citizenEmail,
          password: citizenPassword,
          phoneNumber: citizenPhone,
          latitude: lat,
          longitude: lng,
          registeredLocation: citizenLocation,
          locationPermission: citizenLocPermission,
        });
        setStoredToken(res.token);

        // Capture the user's CURRENT location every time they sign in.
        // If permission is denied, login still succeeds.
        await storeCurrentLocation();

        onLoginSuccess(res.user);
        onClose();
      } else {
        const res = await api.citizenLogin({
          email: citizenEmail,
          password: citizenPassword,
        });
        setStoredToken(res.token);
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Citizen authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleMasterAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.masterAdminLogin({
        email: masterEmail,
        password: masterPassword,
      });
      setStoredToken(res.token);
      await storeCurrentLocation();
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Master Authority authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        id="modal-login"
        className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold font-mono tracking-tight text-white flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>ZOO SENTINEL SECURE GATEWAY</span>
            </h2>
            <p className="text-xs text-slate-400">Production Role-Based Institutional Access</p>
          </div>
          <button
            id="btn-close-login"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-800 text-xs bg-slate-950">
          <button
            id="tab-role-zoo"
            type="button"
            onClick={() => {
              setActiveTab('ZOO_ADMIN');
              setError(null);
            }}
            className={`py-3 text-center font-medium transition-colors border-b-2 flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'ZOO_ADMIN'
                ? 'border-sky-500 text-sky-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Zoo Admin</span>
          </button>

          <button
            id="tab-role-zk"
            type="button"
            onClick={() => {
              setActiveTab('ZOOKEEPER');
              setError(null);
            }}
            className={`py-3 text-center font-medium transition-colors border-b-2 flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'ZOOKEEPER'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Zookeeper</span>
          </button>

          <button
            id="tab-role-citizen"
            type="button"
            onClick={() => {
              setActiveTab('CITIZEN');
              setError(null);
            }}
            className={`py-3 text-center font-medium transition-colors border-b-2 flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'CITIZEN'
                ? 'border-amber-500 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Citizen</span>
          </button>

          <button
            id="tab-role-master"
            type="button"
            onClick={() => {
              setActiveTab('MASTER_ADMIN');
              setError(null);
            }}
            className={`py-3 text-center font-medium transition-colors border-b-2 flex flex-col items-center justify-center space-y-1 ${
              activeTab === 'MASTER_ADMIN'
                ? 'border-purple-500 text-purple-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Master Auth</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* A. Zoo / Institution Login */}
          {activeTab === 'ZOO_ADMIN' && (
            <form onSubmit={handleZooAdminSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-sky-950/40 border border-sky-900/60 rounded-lg text-slate-300 space-y-1">
                <p className="font-semibold text-sky-400">Institution Administrator Account</p>
                <p className="text-[11px] text-slate-400">
                  Backend verifies institution existence in master registry with verified=true.
                </p>
                <p className="text-[11px] font-mono text-sky-300">
                  Registered Demo Institution ID: <span className="font-bold">ZOO-SD-001</span> | Email:{' '}
                  <span className="font-bold">admin@sandiegozoo.org</span> | Pass:{' '}
                  <span className="font-bold">SentinelAdmin2026!</span>
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Zoo ID / Registered Institution Identifier
                </label>
                <input
                  id="input-zoo-id"
                  type="text"
                  required
                  placeholder="e.g. ZOO-SD-001"
                  value={zooIdentifier}
                  onChange={(e) => setZooIdentifier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Administrator Email</label>
                <input
                  id="input-zoo-email"
                  type="email"
                  required
                  placeholder="admin@sandiegozoo.org"
                  value={zooEmail}
                  onChange={(e) => setZooEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Password</label>
                <input
                  id="input-zoo-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={zooPassword}
                  onChange={(e) => setZooPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                id="btn-submit-zoo-login"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? <span>Verifying Institution...</span> : <span>Zoo / Institution Login</span>}
              </button>
            </form>
          )}

          {/* B. Zookeeper Login */}
          {activeTab === 'ZOOKEEPER' && (
            <form onSubmit={handleZookeeperSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-lg text-slate-300 space-y-1">
                <p className="font-semibold text-emerald-400">Zookeeper Field Access</p>
                <p className="text-[11px] text-slate-400">
                  Zookeepers belong to a verified institution. Access codes are generated by the Zoo Admin,
                  hashed server-side, and verified against the institution database.
                </p>
                <p className="text-[11px] text-slate-300">
                  <span className="text-emerald-300 font-semibold">To onboard:</span> Log in as Zoo Admin
                  first to generate a zookeeper account and access code, or use a code issued by your director.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Zoo / Institution</label>
                <select
                  id="select-zk-zoo"
                  required
                  value={zkZooId}
                  onChange={(e) => setZkZooId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select your registered institution...</option>
                  {zoos.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.identifier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Zookeeper ID / Badge / Registered Email
                </label>
                <input
                  id="input-zk-id"
                  type="text"
                  required
                  placeholder="e.g. ZK-401 or keeper email"
                  value={zkIdentifier}
                  onChange={(e) => setZkIdentifier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Zoo Access Code (Issued by Zoo Admin)
                </label>
                <input
                  id="input-zk-access-code"
                  type="password"
                  required
                  placeholder="Enter secret access code"
                  value={zkAccessCode}
                  onChange={(e) => setZkAccessCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Access codes are cryptographically hashed and verified server-side.
                </p>
              </div>

              <button
                id="btn-submit-zk-login"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? <span>Authenticating Zookeeper...</span> : <span>Zookeeper Login</span>}
              </button>
            </form>
          )}

          {/* C. Citizen Account */}
          {activeTab === 'CITIZEN' && (
            <form onSubmit={handleCitizenSubmit} className="space-y-4 text-xs">
              <div className="flex border-b border-slate-800 pb-2 mb-2">
                <button
                  type="button"
                  id="btn-citizen-tab-login"
                  onClick={() => setCitizenMode('login')}
                  className={`flex-1 py-1 text-center font-medium ${
                    citizenMode === 'login' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-400'
                  }`}
                >
                  Existing Citizen Sign In
                </button>
                <button
                  type="button"
                  id="btn-citizen-tab-register"
                  onClick={() => setCitizenMode('register')}
                  className={`flex-1 py-1 text-center font-medium ${
                    citizenMode === 'register' ? 'text-amber-400 border-b-2 border-amber-500' : 'text-slate-400'
                  }`}
                >
                  Register for Emergency Alerts
                </button>
              </div>

              {citizenMode === 'register' && (
                <>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">Full Name</label>
                    <input
                      id="input-citizen-name"
                      type="text"
                      required
                      placeholder="Jane Citizen"
                      value={citizenFullName}
                      onChange={(e) => setCitizenFullName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Phone Number (REQUIRED for Geo-targeted Emergency SMS)
                    </label>
                    <input
                      id="input-citizen-phone"
                      type="tel"
                      required
                      placeholder="+15551234567"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Phone numbers are encrypted and stored for emergency life-safety SMS alerts only.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Current City / District Location
                    </label>
                    <input
                      id="input-citizen-loc"
                      type="text"
                      placeholder="e.g. San Diego Metro / Downtown"
                      value={citizenLocation}
                      onChange={(e) => setCitizenLocation(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      id="check-citizen-geo"
                      type="checkbox"
                      checked={citizenLocPermission}
                      onChange={(e) => setCitizenLocPermission(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-800 border-slate-700"
                    />
                    <label htmlFor="check-citizen-geo" className="text-slate-300 cursor-pointer">
                      Grant browser geolocation permission to evaluate danger zone proximity
                    </label>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Email Address</label>
                <input
                  id="input-citizen-email"
                  type="email"
                  required
                  placeholder="citizen@example.org"
                  value={citizenEmail}
                  onChange={(e) => setCitizenEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Password</label>
                <input
                  id="input-citizen-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={citizenPassword}
                  onChange={(e) => setCitizenPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                id="btn-submit-citizen"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <span>{citizenMode === 'register' ? 'Complete Citizen Registration' : 'Citizen Sign In'}</span>
                )}
              </button>
            </form>
          )}

          {/* D. Master Admin */}
          {activeTab === 'MASTER_ADMIN' && (
            <form onSubmit={handleMasterAdminSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-950/40 border border-purple-900/60 rounded-lg text-slate-300 space-y-1">
                <p className="font-semibold text-purple-400">Master Institutional Authority</p>
                <p className="text-[11px] text-slate-400">
                  Global management of verified zoological institutions, perimeter approvals, and network audits.
                </p>
                <p className="text-[11px] font-mono text-purple-300">
                  Master Authority: <span className="font-bold">authority@zoosentinel.int</span> | Pass:{' '}
                  <span className="font-bold">MasterSentinel2026!</span>
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Authority Email</label>
                <input
                  id="input-master-email"
                  type="email"
                  required
                  placeholder="authority@zoosentinel.int"
                  value={masterEmail}
                  onChange={(e) => setMasterEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Authority Key / Password</label>
                <input
                  id="input-master-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                id="btn-submit-master-login"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? <span>Authenticating Master Authority...</span> : <span>Master Authority Login</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
