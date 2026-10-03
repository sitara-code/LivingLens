import React from 'react';
import {
  ShieldAlert,
  Activity,
  Compass,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Flame,
  CloudRain,
  Wind,
  Zap,
} from 'lucide-react';
import { RiskAnalysis } from '../types';

interface RiskAnalysisViewProps {
  riskAnalysis: RiskAnalysis | null;
}

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({ riskAnalysis }) => {
  if (!riskAnalysis || riskAnalysis.observationCount === 0) {
    return (
      <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <Activity className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
        <h3 className="text-base font-bold font-mono text-white">
          Insufficient verified observations for risk analysis.
        </h3>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          The biological early warning system evaluates real-time geospatial clusters as verified
          observations are logged by authenticated zookeepers within verified perimeter boundaries.
          A cluster requires ≥ 2 verified observations within 15 km and 2 hours.
        </p>
      </div>
    );
  }

  const { factors } = riskAnalysis;

  return (
    <div className="space-y-6">
      {/* Top Threat Banner */}
      <div
        className={`p-6 rounded-xl border shadow-xl ${
          riskAnalysis.riskScore >= 60
            ? 'bg-rose-950/40 border-rose-800/80 text-rose-100'
            : riskAnalysis.riskScore >= 35
            ? 'bg-amber-950/40 border-amber-800/80 text-amber-100'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/50">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold font-mono uppercase tracking-tight text-white">
                MODEL-ESTIMATED RISK ASSESSMENT
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Probabilistic Multi-Zoo Biological Precursor Modeling Engine
            </p>
          </div>

          <div className="flex items-center space-x-3 font-mono">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">MODEL-ESTIMATED RISK</span>
              <span
                className={`text-3xl font-black ${
                  riskAnalysis.riskScore >= 60
                    ? 'text-rose-400'
                    : riskAnalysis.riskScore >= 35
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {riskAnalysis.riskScore}%
              </span>
            </div>
            <div className="px-3 py-1 rounded bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Confidence</span>
              <span className="text-xs font-bold text-white uppercase">
                {riskAnalysis.confidence}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block uppercase font-mono">
              Potential Event Category
            </span>
            <span className="text-base font-bold text-white font-mono uppercase">
              {riskAnalysis.eventType}
            </span>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block uppercase font-mono">
              Estimated Time Window
            </span>
            <span className="text-sm font-semibold text-amber-300 block">
              {riskAnalysis.estimatedTimeWindow}
            </span>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block uppercase font-mono">
              Estimated Affected Radius
            </span>
            <span className="text-base font-bold text-sky-400 font-mono">
              {riskAnalysis.estimatedRadiusKm} km
            </span>
          </div>
        </div>
      </div>

      {/* Factor Breakdown Section (Exact Formula Weights) */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Mathematical Factor Breakdown
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Base Weights + Cross-Species Validation - Uncertainty Deduction
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <FactorCard
            title="Temporal Clustering"
            value={factors.temporalClustering}
            max={25}
            description="High frequency of observations within a narrow rolling time window (sub-3 hours)."
          />
          <FactorCard
            title="Spatial Density"
            value={factors.spatialClustering}
            max={20}
            description="Geospatial proximity and dispersion across participating verified facilities."
          />
          <FactorCard
            title="Cross-Species Agreement"
            value={factors.crossSpeciesAgreement}
            max={25}
            description="Multiple distinct biological taxa (e.g. pachyderms + avians + fossorial) exhibiting synchronized distress."
          />
          <FactorCard
            title="Observer Severity"
            value={factors.observationSeverity}
            max={15}
            description="Normalized distress level (1-5 scale) assessed by accredited zookeepers."
          />
          <FactorCard
            title="Institutional Independence"
            value={factors.independentZoos}
            max={15}
            description="Independent corroboration across geographically distinct registered institutions."
          />
          <FactorCard
            title="Uncertainty Deduction"
            value={factors.uncertaintyDeduction}
            max={20}
            isDeduction
            description="Penalty applied for single-institution reporting, single species, or low observation sample size."
          />
        </div>
      </div>

      {/* Hazard Specific Diagnostics */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          Potential Hazard Analysis Profiles
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <HazardCard
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            name="Earthquake"
            selected={riskAnalysis.eventType.includes('Earthquake')}
            indicators="Subterranean/burrowing animals emerging, elephant low-frequency infrasound stomping, herd agitation (giraffes, deer), mass fleeing."
          />
          <HazardCard
            icon={<CloudRain className="w-5 h-5 text-sky-400" />}
            name="Severe Storm"
            selected={riskAnalysis.eventType.includes('Storm')}
            indicators="Aviary silence, sudden flocking, atmospheric barometric pressure sensitivity, rapid shelter-seeking."
          />
          <HazardCard
            icon={<Wind className="w-5 h-5 text-cyan-400" />}
            name="Cyclone / Tsunami"
            selected={riskAnalysis.eventType.includes('Cyclone')}
            indicators="Coastal aviary agitation, marine mammal distress vocalizations, intense directional movement inland."
          />
          <HazardCard
            icon={<Flame className="w-5 h-5 text-rose-400" />}
            name="Wildfire"
            selected={riskAnalysis.eventType.includes('Wildfire')}
            indicators="Early volatile organic compound & smoke olfactory detection, uniform directional flight away from windward front."
          />
        </div>
      </div>

      {/* Explainability Engine Feed */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <Info className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
            Detailed Decision Explainability
          </h3>
        </div>

        <ul className="space-y-2 text-xs">
          {riskAnalysis.explanation.map((item, idx) => (
            <li
              key={idx}
              className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-start space-x-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const FactorCard: React.FC<{
  title: string;
  value: number;
  max: number;
  description: string;
  isDeduction?: boolean;
}> = ({ title, value, max, description, isDeduction }) => {
  const pct = Math.min(100, Math.round((Math.abs(value) / max) * 100));

  return (
    <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-200">{title}</span>
        <span
          className={`font-mono font-bold ${
            isDeduction ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {isDeduction ? `-${value}` : `+${value}`} / {max}
        </span>
      </div>

      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full ${isDeduction ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
};

const HazardCard: React.FC<{
  icon: React.ReactNode;
  name: string;
  selected: boolean;
  indicators: string;
}> = ({ icon, name, selected, indicators }) => (
  <div
    className={`p-3.5 rounded-lg border transition-all ${
      selected
        ? 'bg-slate-800/80 border-amber-500 shadow-md shadow-amber-950/50'
        : 'bg-slate-950 border-slate-800 opacity-75'
    }`}
  >
    <div className="flex items-center space-x-2 mb-2">
      {icon}
      <span className="font-bold text-white font-mono">{name}</span>
      {selected && (
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
          Dominant
        </span>
      )}
    </div>
    <p className="text-[11px] text-slate-400 leading-relaxed">{indicators}</p>
  </div>
);
