import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Shield, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { AuditLog } from '../types';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold font-mono text-white uppercase tracking-tight">
                Institutional Security & System Audit Trail
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Immutable logging of administrative actions, credential issuance, perimeter
              modifications, and emergency alert dispatches.
            </p>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Total Audit Records: <strong className="text-purple-400">{logs.length}</strong>
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">No audit records logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300 font-mono">
              <thead className="bg-slate-950 text-[10px] text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Actor Role / Name</th>
                  <th className="py-2.5 px-3">Actor ID</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{log.actorId}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
