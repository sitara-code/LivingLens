import React from 'react';
import {
  ShieldAlert,
  Activity,
  MapPin,
  FileText,
  AlertTriangle,
  Building2,
  Award,
  Lock,
  UserCheck,
  Radio,
  LogOut,
  PlusCircle,
  FileSpreadsheet,
  Server,
} from 'lucide-react';
import { User, Zoo, Alert } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: User | null;
  zoo: Zoo | null;
  activeAlerts: Alert[];
  onOpenLogin: (roleHint?: string) => void;
  onOpenReportModal: () => void;
  onLogout: () => void;
  isStreamConnected: boolean;
  onOpenSystemStatus: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  user,
  zoo,
  activeAlerts,
  onOpenLogin,
  onOpenReportModal,
  onLogout,
  isStreamConnected,
  onOpenSystemStatus,
}) => {
  const criticalAlertCount = activeAlerts.filter((a) => a.riskScore >= 60).length;

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs border-b border-slate-800/60">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isStreamConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono uppercase text-slate-400 tracking-wider">
              {isStreamConnected ? 'Stream Active' : 'Connecting Stream...'}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <button
            id="btn-system-telemetry"
            onClick={onOpenSystemStatus}
            className="flex items-center space-x-1 text-slate-400 hover:text-emerald-400 transition-colors font-mono"
            title="Open System Diagnostics & Verification"
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="underline decoration-slate-700 underline-offset-2">System Diagnostics</span>
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-medium text-emerald-300">
                {user.role === 'ZOO_ADMIN' && '🏛️ Institution Admin'}
                {user.role === 'ZOOKEEPER' && '🐾 Verified Zookeeper'}
                {user.role === 'CITIZEN' && '👤 Registered Citizen'}
                {user.role === 'MASTER_ADMIN' && '🌐 Master Authority'}
              </span>
              <span className="text-slate-300 font-medium">{user.fullName}</span>
              {zoo && <span className="text-slate-400 hidden md:inline">({zoo.name})</span>}
              <button
                id="btn-logout"
                onClick={onLogout}
                className="ml-2 text-slate-400 hover:text-rose-400 transition-colors p-1 flex items-center space-x-1"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                id="btn-login-zoo"
                onClick={() => onOpenLogin('ZOO_ADMIN')}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center space-x-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Zoo Login</span>
              </button>
              <span className="text-slate-600">|</span>
              <button
                id="btn-login-zk"
                onClick={() => onOpenLogin('ZOOKEEPER')}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center space-x-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Zookeeper Login</span>
              </button>
              <span className="text-slate-600">|</span>
              <button
                id="btn-login-citizen"
                onClick={() => onOpenLogin('CITIZEN')}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Citizen Portal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Brand & Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={() => onSelectTab('overview')}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-950">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white font-mono">
                ZOO SENTINEL
              </h1>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                PROD v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-tight">
              Zoo-Based Biological Early Warning System
            </p>
          </div>
        </div>

        {/* Primary Action: Report Anomaly */}
        <div className="flex items-center space-x-3">
          <button
            id="btn-report-anomaly"
            onClick={onOpenReportModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-950 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>REPORT ANIMAL ANOMALY</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto scrollbar-none border-t border-slate-800 text-sm">
        <NavButton
          id="nav-overview"
          active={currentTab === 'overview'}
          onClick={() => onSelectTab('overview')}
          icon={<Activity className="w-4 h-4" />}
          label="Overview"
        />
        <NavButton
          id="nav-map"
          active={currentTab === 'map'}
          onClick={() => onSelectTab('map')}
          icon={<MapPin className="w-4 h-4" />}
          label="Live Map"
        />
        <NavButton
          id="nav-observations"
          active={currentTab === 'observations'}
          onClick={() => onSelectTab('observations')}
          icon={<FileText className="w-4 h-4" />}
          label="Observations"
        />
        <NavButton
          id="nav-risk"
          active={currentTab === 'risk'}
          onClick={() => onSelectTab('risk')}
          icon={<ShieldAlert className="w-4 h-4" />}
          label="Risk Analysis"
        />
        <NavButton
          id="nav-alerts"
          active={currentTab === 'alerts'}
          onClick={() => onSelectTab('alerts')}
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Alerts"
          badge={criticalAlertCount > 0 ? String(criticalAlertCount) : undefined}
        />
        <NavButton
          id="nav-truth"
          active={currentTab === 'truth'}
          onClick={() => onSelectTab('truth')}
          icon={<Award className="w-4 h-4" />}
          label="Truth Rating"
        />

        {/* Role Specific Tabs */}
        {user?.role === 'ZOO_ADMIN' && (
          <NavButton
            id="nav-zoo-admin"
            active={currentTab === 'zoo-admin'}
            onClick={() => onSelectTab('zoo-admin')}
            icon={<Building2 className="w-4 h-4" />}
            label="Zoo Administration"
          />
        )}
        {user?.role === 'ZOOKEEPER' && (
          <NavButton
            id="nav-zookeeper"
            active={currentTab === 'zookeeper'}
            onClick={() => onSelectTab('zookeeper')}
            icon={<UserCheck className="w-4 h-4" />}
            label="Zookeeper Portal"
          />
        )}
        {user?.role === 'CITIZEN' && (
          <NavButton
            id="nav-citizen"
            active={currentTab === 'citizen'}
            onClick={() => onSelectTab('citizen')}
            icon={<ShieldAlert className="w-4 h-4" />}
            label="Citizen Safety"
          />
        )}
        {(user?.role === 'ZOO_ADMIN' || user?.role === 'MASTER_ADMIN') && (
          <NavButton
            id="nav-audit"
            active={currentTab === 'audit'}
            onClick={() => onSelectTab('audit')}
            icon={<FileSpreadsheet className="w-4 h-4" />}
            label="Audit Logs"
          />
        )}
      </div>
    </header>
  );
};

interface NavButtonProps {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ id, active, onClick, icon, label, badge }) => (
  <button
    id={id}
    onClick={onClick}
    className={`flex items-center space-x-2 px-3.5 py-2.5 font-medium whitespace-nowrap transition-colors border-b-2 text-xs uppercase tracking-wider ${
      active
        ? 'border-emerald-400 text-emerald-400 bg-slate-800/40'
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
    }`}
  >
    {icon}
    <span>{label}</span>
    {badge && (
      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
        {badge}
      </span>
    )}
  </button>
);
