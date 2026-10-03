import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api';
import { TruthRatingData, User } from '../types';

interface TruthRatingViewProps {
  user: User | null;
}

export const TruthRatingView: React.FC<TruthRatingViewProps> = ({ user }) => {
  const [ratings, setRatings] = useState<TruthRatingData[]>([]);
  const [loading, setLoading] = useState(true);

  // Outcome logger modal for Admins
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [selectedZooId, setSelectedZooId] = useState('');
  const [outcome, setOutcome] = useState<'CORRELATED' | 'FALSE_ALARM' | 'UNVERIFIED'>('CORRELATED');
  const [eventType, setEventType] = useState('Earthquake Mw 4.8');
  const [notes, setNotes] = useState('');
  const [submittingOutcome, setSubmittingOutcome] = useState(false);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const data = await api.getTruthRatings();
      setRatings(data);
    } catch (err) {
      console.error('Failed to load truth ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZooId) return;

    setSubmittingOutcome(true);
    try {
      const res = await api.recordTruthOutcome({
        zooId: selectedZooId,
        outcome,
        notes,
        eventType,
      });
      setRatings(res.ratings);
      setShowOutcomeModal(false);
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to record truth outcome');
    } finally {
      setSubmittingOutcome(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold font-mono text-white uppercase tracking-tight">
                Institutional Truth Rating & Reliability Index
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dynamic reputation weight based on empirical post-event seismic, barometric, and hazard
              correlation.
            </p>
          </div>

          {(user?.role === 'ZOO_ADMIN' || user?.role === 'MASTER_ADMIN') && (
            <button
              id="btn-verify-outcome"
              onClick={() => setShowOutcomeModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Record Event Ground-Truth Outcome</span>
            </button>
          )}
        </div>

        {/* Explainability notice */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-white font-mono uppercase text-[11px]">
            Reputation Weighting Protocol:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
            <li>
              Every participating zoo begins with a baseline calibrated rating (e.g. 75%).
            </li>
            <li>
              When biological distress anomalies correlate with confirmed physical events (e.g. USGS
              earthquake, NOAA storm front, civil alert), the institution's Truth Rating increments.
            </li>
            <li>
              Confirmed false alarms decrease the score, reducing the institution's weight in
              future Bayesian clustering equations.
            </li>
            <li>
              Facilities with fewer than 3 total evaluations show:{' '}
              <span className="font-mono text-amber-400">"Not enough verified history yet."</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Ratings Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading institutional ratings...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ratings.map((item) => {
            const hasSufficientHistory = item.hasEnoughHistory;

            return (
              <div
                key={item.zooId}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="font-bold text-white text-sm font-mono">{item.zooName}</h3>
                      <span className="text-[11px] text-slate-400">Institution ID: {item.zooId}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black font-mono text-slate-300 block">
                        {hasSufficientHistory ? `${item.truthRating}%` : 'UNRATED'}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase font-mono">
                        Truth Rating
                      </span>
                    </div>
                  </div>

                  {/* Rating Meter */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Reliability Score</span>
                      <span className="font-mono font-semibold text-slate-200">
                        {hasSufficientHistory ? `${item.truthRating} / 100` : 'Not enough verified history yet.'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${hasSufficientHistory ? item.truthRating : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1.5 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Historical Status:</span>
                      <span className="text-slate-300">
                        {hasSufficientHistory ? (
                          <span className="text-emerald-400">CALIBRATED</span>
                        ) : (
                          <span className="text-amber-400">Not enough verified history yet.</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Confirmed Correlations:</span>
                      <span className="text-emerald-400 font-bold">{item.confirmedCorrelations}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">False Alarm Rate:</span>
                      <span className="text-rose-400 font-bold">{item.falseAlarmRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total Observations:</span>
                      <span className="text-white font-bold">{item.totalReports}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Last Evaluated:</span>
                  <span>{item.history && item.history.length > 0 ? new Date(item.history[0].date).toLocaleDateString() : 'Baseline'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Outcome Logger Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 text-xs text-slate-200 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Log Ground-Truth Event Outcome
            </h3>
            <p className="text-slate-400 text-[11px]">
              Calibrate an institution's Truth Rating based on post-event geophysical, meteorological, or
              observational corroboration.
            </p>

            <form onSubmit={handleRecordOutcome} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Select Institution</label>
                <select
                  required
                  value={selectedZooId}
                  onChange={(e) => setSelectedZooId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Choose zoo...</option>
                  {ratings.map((r) => (
                    <option key={r.zooId} value={r.zooId}>
                      {r.zooName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Outcome Classification</label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="CORRELATED">CORRELATED (+4% Rating Boost)</option>
                  <option value="FALSE_ALARM">FALSE_ALARM (-6% Penalty)</option>
                  <option value="UNVERIFIED">UNVERIFIED (Neutral Audit)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Physical Event / Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. USGS Mw 4.7 Offshore Anza Fault"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Verification Audit Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Official corroboration source, timeline comparison, or sensor log notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutcomeModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOutcome}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded"
                >
                  {submittingOutcome ? 'Recording...' : 'Update Institutional Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
