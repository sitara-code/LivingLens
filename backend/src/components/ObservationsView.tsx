import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Building2,
  UserCheck,
  AlertTriangle,
  Play,
  Maximize2,
  Download,
  Percent,
} from 'lucide-react';
import { Observation, Zoo } from '../types';
import { api } from '../lib/api';

interface ObservationsViewProps {
  observations: Observation[];
  zoos: Zoo[];
  onSelectObservation?: (obs: Observation) => void;
}

export const ObservationsView: React.FC<ObservationsViewProps> = ({ observations, zoos }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZooId, setSelectedZooId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type?: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportMLCSV = async () => {
    try {
      setExporting(true);
      const csvData = await api.exportMLDatasetCSV();
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `zoo_sentinel_ml_dataset_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Failed to export ML CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  const filteredObservations = observations.filter((obs) => {
    if (selectedZooId !== 'ALL' && obs.zooId !== selectedZooId) return false;
    if (selectedCategory !== 'ALL' && obs.behaviourCategory !== selectedCategory) return false;
    if (
      searchQuery &&
      !obs.species.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !obs.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !obs.zooName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold font-mono text-white uppercase tracking-tight flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Verified Animal Anomaly Observation Feed</span>
            </h2>
            <p className="text-xs text-slate-400">
              Authenticated field logs submitted by verified accredited zoological staff
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              id="btn-export-ml-csv"
              onClick={handleExportMLCSV}
              disabled={exporting}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 text-xs font-mono transition-colors disabled:opacity-50"
              title="Download clean, numerical CSV formatted for Random Forest ML training and evaluation"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export ML CSV'}</span>
            </button>
            <span className="text-xs font-mono px-2.5 py-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
              Total Records: <strong className="text-emerald-400">{observations.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-observations"
              type="text"
              placeholder="Search species, description, zoo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <select
              id="filter-obs-zoo"
              value={selectedZooId}
              onChange={(e) => setSelectedZooId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Zoos / Institutions</option>
              {zoos.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="filter-obs-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Behaviour Categories</option>
              <option value="Sudden fleeing">Sudden fleeing</option>
              <option value="Abnormal vocalization">Abnormal vocalization</option>
              <option value="Unusual silence">Unusual silence</option>
              <option value="Repeated agitation">Repeated agitation</option>
              <option value="Burrowing animals emerging">Burrowing animals emerging</option>
              <option value="Abnormal grouping">Abnormal grouping</option>
              <option value="Sudden movement">Sudden movement</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Observations List */}
      {filteredObservations.length === 0 ? (
        <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="font-bold text-white font-mono text-base">No observations yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {observations.length === 0
              ? "The database currently contains no recorded observations. When accredited zookeepers submit reports from inside verified zoo perimeters, they will appear here in real-time."
              : 'No observations matched your active search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredObservations.map((obs) => {
            const isVerified = obs.verificationStatus === 'VERIFIED_IN_GEOFENCE';
            const abnormalityPct =
              obs.abnormalityPercentage !== undefined
                ? obs.abnormalityPercentage
                : obs.totalAnimals && obs.totalAnimals > 0
                ? Number((((obs.animalsShowingBehaviour ?? 0) / obs.totalAnimals) * 100).toFixed(1))
                : null;

            return (
              <div
                key={obs.id}
                id={`obs-card-${obs.id}`}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Species & Verification Status */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white font-mono uppercase tracking-tight">
                        {obs.species}
                      </h3>
                      <span className="text-xs text-emerald-400 font-medium">
                        {obs.behaviourCategory}
                      </span>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center space-x-1 ${
                          isVerified
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : 'bg-rose-950/80 text-rose-300 border-rose-800'
                        }`}
                      >
                        {isVerified ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>GEOFENCE VERIFIED</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>OUT OF GEOFENCE</span>
                          </>
                        )}
                      </span>

                      {abnormalityPct !== null && (
                        <span
                          className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                            abnormalityPct >= 70
                              ? 'bg-rose-600 text-white'
                              : abnormalityPct >= 40
                              ? 'bg-amber-600 text-white'
                              : 'bg-emerald-700 text-white'
                          }`}
                        >
                          ABNORMALITY {abnormalityPct}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Animal Counts & Duration */}
                  <div className="mt-2 text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {obs.totalAnimals !== undefined && (
                      <div className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-950/60 border border-slate-800 text-slate-300">
                        <span className="text-slate-400">Showing:</span>
                        <span className="text-emerald-400 font-bold">
                          {obs.animalsShowingBehaviour ?? 0} / {obs.totalAnimals}
                          {abnormalityPct !== null ? ` (${abnormalityPct}%)` : ''}
                        </span>
                      </div>
                    )}

                    {obs.durationMinutes !== undefined && (
                      <div className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-950/60 border border-slate-800 text-slate-300">
                        <span className="text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-sky-400" />
                          <span>Duration:</span>
                        </span>
                        <span className="text-sky-300 font-bold">
                          {obs.durationMinutes} min
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    "{obs.description}"
                  </p>

                  {/* Media preview if attached */}
                  {obs.mediaUrl && (
                    <div className="mt-3">
                      {obs.mediaType === 'video' ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-700 max-h-48 bg-black">
                          <video src={obs.mediaUrl} controls className="w-full max-h-48" />
                        </div>
                      ) : (
                        <div
                          className="relative rounded-lg overflow-hidden border border-slate-700 max-h-48 cursor-pointer group"
                          onClick={() => setSelectedMedia({ url: obs.mediaUrl!, type: obs.mediaType })}
                        >
                          <img
                            src={obs.mediaUrl}
                            alt="Observation Attachment"
                            className="w-full max-h-48 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs">
                            <Maximize2 className="w-4 h-4 mr-1" /> Click to expand
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Metadata Footer */}
                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>{obs.zooName}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-slate-400">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{obs.zookeeperName}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(obs.observedAt).toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-slate-400">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>
                        [{obs.latitude.toFixed(4)}, {obs.longitude.toFixed(4)}]
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media lightbox modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-slate-900 border border-slate-700">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-slate-950/80 text-white hover:bg-slate-800"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <img src={selectedMedia.url} alt="Expanded Attachment" className="max-h-[85vh] max-w-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
