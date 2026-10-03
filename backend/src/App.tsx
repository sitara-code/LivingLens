import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { LiveMapView } from './components/LiveMapView';
import { ObservationsView } from './components/ObservationsView';
import { RiskAnalysisView } from './components/RiskAnalysisView';
import { AlertsView } from './components/AlertsView';
import { TruthRatingView } from './components/TruthRatingView';
import { ZooManagementView } from './components/ZooManagementView';
import { ZookeeperPortalView } from './components/ZookeeperPortalView';
import { CitizenView } from './components/CitizenView';
import { AuditLogsView } from './components/AuditLogsView';
import { LoginModal } from './components/LoginModal';
import { ReportAnomalyModal } from './components/ReportAnomalyModal';
import { SystemStatusModal } from './components/SystemStatusModal';
import { api, getStoredToken, setStoredToken } from './lib/api';
import { User, Zoo, Observation, RiskAnalysis, Alert } from './types';
import { AlertTriangle, Bell, CheckCircle, Radio } from 'lucide-react';

export default function App() {
  // App State
  const [user, setUser] = useState<User | null>(null);
  const [zoo, setZoo] = useState<Zoo | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Real data state
  const [zoos, setZoos] = useState<Zoo[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // UI Modals & Stream
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginRoleHint, setLoginRoleHint] = useState<string>('ZOO_ADMIN');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [systemStatusModalOpen, setSystemStatusModalOpen] = useState(false);
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'alert' | 'observation' | 'info';
    title: string;
    body: string;
  } | null>(null);

  // Initial Data Fetching
  const refreshAllData = useCallback(async () => {
    try {
      const [zoosData, obsData, riskData, alertsData] = await Promise.all([
        api.getZoos(),
        api.getObservations(),
        api.getCurrentRiskAnalysis(),
        api.getAlerts(),
      ]);
      setZoos(zoosData);
      setObservations(obsData);
      setRiskAnalysis(riskData.analysis);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Error fetching Zoo Sentinel state:', err);
    }
  }, []);

  // Check authenticated session
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api
        .getMe()
        .then((res) => {
          setUser(res.user);
          if (res.zoo) setZoo(res.zoo);
        })
        .catch(() => {
          setStoredToken(null);
        });
    }

    refreshAllData();
  }, [refreshAllData]);

  // Real-Time Server-Sent Events (SSE) Stream Listener
  useEffect(() => {
    let eventSource: EventSource | null = null;

    function connectSSE() {
      eventSource = new EventSource('/api/stream');

      eventSource.onopen = () => {
        setIsStreamConnected(true);
      };

      eventSource.addEventListener('connected', () => {
        setIsStreamConnected(true);
      });

      eventSource.addEventListener('new_observation', (e) => {
        try {
          const newObs: Observation = JSON.parse(e.data);
          setObservations((prev) => {
            if (prev.some((o) => o.id === newObs.id)) return prev;
            return [newObs, ...prev];
          });
          setToastMessage({
            type: 'observation',
            title: `New Observation: ${newObs.species}`,
            body: `${newObs.behaviourCategory} reported at ${newObs.zooName} (Severity ${newObs.severity}/5)`,
          });
          setTimeout(() => setToastMessage(null), 5000);
        } catch (err) {
          console.error('Failed to parse new_observation event:', err);
        }
      });

      eventSource.addEventListener('risk_updated', (e) => {
        try {
          const updatedAnalysis: RiskAnalysis = JSON.parse(e.data);
          setRiskAnalysis(updatedAnalysis);
        } catch (err) {
          console.error('Failed to parse risk_updated event:', err);
        }
      });

      eventSource.addEventListener('new_alert', (e) => {
        try {
          const newAlert: Alert = JSON.parse(e.data);
          setAlerts((prev) => [newAlert, ...prev]);
          setToastMessage({
            type: 'alert',
            title: `EMERGENCY ALERT: ${newAlert.title}`,
            body: `Radius ${newAlert.radiusKm} km. Targeted citizens in zone: ${newAlert.targetedCitizensCount}. Check civil defense.`,
          });
          setTimeout(() => setToastMessage(null), 8000);
        } catch (err) {
          console.error('Failed to parse new_alert event:', err);
        }
      });

      eventSource.addEventListener('zoo_updated', (e) => {
        try {
          const updatedZoo: Zoo = JSON.parse(e.data);
          setZoos((prev) => prev.map((z) => (z.id === updatedZoo.id ? updatedZoo : z)));
          if (zoo && zoo.id === updatedZoo.id) {
            setZoo(updatedZoo);
          }
        } catch (err) {
          console.error('Failed to parse zoo_updated event:', err);
        }
      });

      eventSource.addEventListener('system_reset', () => {
        refreshAllData();
        setToastMessage({
          type: 'info',
          title: 'Database State Reset',
          body: 'System database state has been cleanly reset to pure zero records.',
        });
        setTimeout(() => setToastMessage(null), 4000);
      });

      eventSource.addEventListener('zookeeper_updated', () => {
        refreshAllData();
      });

      eventSource.onerror = () => {
        setIsStreamConnected(false);
        if (eventSource) eventSource.close();
        // Retry connection after 5 seconds
        setTimeout(connectSSE, 5000);
      };
    }

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [zoo]);

  const handleLoginSuccess = (authenticatedUser: User, associatedZoo?: Zoo | null) => {
    setUser(authenticatedUser);
    if (associatedZoo) {
      setZoo(associatedZoo);
    }
    // Route to appropriate initial dashboard
    if (authenticatedUser.role === 'ZOO_ADMIN') {
      setCurrentTab('zoo-admin');
    } else if (authenticatedUser.role === 'ZOOKEEPER') {
      setCurrentTab('zookeeper');
    } else if (authenticatedUser.role === 'CITIZEN') {
      setCurrentTab('citizen');
    }
    refreshAllData();
  };

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    setZoo(null);
    setCurrentTab('overview');
  };

  const handleOpenLogin = (roleHint = 'ZOO_ADMIN') => {
    setLoginRoleHint(roleHint);
    setLoginModalOpen(true);
  };

  const handleOpenReportModal = () => {
    if (!user) {
      handleOpenLogin('ZOOKEEPER');
      return;
    }
    if (user.role !== 'ZOOKEEPER') {
      alert('Only authenticated zookeepers can submit official anomaly observations.');
      return;
    }
    setReportModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        user={user}
        zoo={zoo}
        activeAlerts={alerts}
        onOpenLogin={handleOpenLogin}
        onOpenReportModal={handleOpenReportModal}
        onLogout={handleLogout}
        isStreamConnected={isStreamConnected}
        onOpenSystemStatus={() => setSystemStatusModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'overview' && (
          <OverviewView
            riskAnalysis={riskAnalysis}
            zoos={zoos}
            observations={observations}
            alerts={alerts}
            user={user}
            onNavigate={setCurrentTab}
            onOpenReportModal={handleOpenReportModal}
            onOpenLogin={handleOpenLogin}
          />
        )}

        {currentTab === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-mono text-white uppercase tracking-tight">
                  Geospatial Biological Surveillance Map
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time overlay of accredited zoological perimeters, verified observations, risk
                  epicenters, and targeted alert zones.
                </p>
              </div>
            </div>
            <LiveMapView
              zoos={zoos}
              observations={observations}
              riskAnalysis={riskAnalysis}
              alerts={alerts}
            />
          </div>
        )}

        {currentTab === 'observations' && (
          <ObservationsView observations={observations} zoos={zoos} />
        )}

        {currentTab === 'risk' && <RiskAnalysisView riskAnalysis={riskAnalysis} />}

        {currentTab === 'alerts' && <AlertsView alerts={alerts} />}

        {currentTab === 'truth' && <TruthRatingView user={user} />}

        {currentTab === 'zoo-admin' && (
          <ZooManagementView
            zoo={zoo}
            user={user}
            onZooUpdated={(updatedZoo) => {
              setZoo(updatedZoo);
              setZoos((prev) => prev.map((z) => (z.id === updatedZoo.id ? updatedZoo : z)));
            }}
          />
        )}

        {currentTab === 'zookeeper' && (
          <ZookeeperPortalView
            user={user}
            zoo={zoo}
            observations={observations}
            alerts={alerts}
            onOpenReportModal={handleOpenReportModal}
          />
        )}

        {currentTab === 'citizen' && (
          <CitizenView user={user} alerts={alerts} riskAnalysis={riskAnalysis} />
        )}

        {currentTab === 'audit' && <AuditLogsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 text-center space-y-1">
        <p className="font-mono">
          ZOO SENTINEL — Production Biological Early Warning & Infrasound Sensor Precursor Network
        </p>
        <p className="text-[11px] text-slate-600">
          Operated for accredited zoological facilities, civil protection agencies, and registered citizens.
        </p>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialRole={loginRoleHint}
        zoos={zoos}
      />

      <ReportAnomalyModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        user={user}
        zoo={zoo}
        onObservationSubmitted={refreshAllData}
      />

      <SystemStatusModal
        isOpen={systemStatusModalOpen}
        onClose={() => setSystemStatusModalOpen(false)}
        user={user}
        onDatabaseReset={refreshAllData}
      />

      {/* Floating Real-Time Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border flex items-start space-x-3 max-w-md animate-bounce ${
            toastMessage.type === 'alert'
              ? 'bg-rose-950 border-rose-700 text-rose-100'
              : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}
        >
          {toastMessage.type === 'alert' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Radio className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5 text-xs">
            <h4 className="font-bold font-mono uppercase tracking-tight">
              {toastMessage.title}
            </h4>
            <p className="text-[11px] leading-relaxed opacity-90">{toastMessage.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
