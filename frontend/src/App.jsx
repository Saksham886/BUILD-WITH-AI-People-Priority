import { useCallback, useEffect, useState } from "react";
import {
  getClusters,
  loadSampleData,
  resetAll,
} from "./api";
import MasterIncidentCard from "./components/MasterIncidentCard";
import AddGrievanceForm from "./components/AddGrievanceForm";
import Toolbar from "./components/Toolbar";

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setIncidents(await getClusters());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSeed = async () => {
    setBusy(true);
    setError(null);
    try {
      await loadSampleData();
      await refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    setError(null);
    try {
      await resetAll();
      await refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const totalComplaints = incidents.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white">
              STAGE 2
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              Aggregation — Master Incidents
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Semantic clustering of citizen grievances · priority = complaints ×
            urgency
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: controls */}
          <aside className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <Stat label="Master Incidents" value={incidents.length} />
                <Stat label="Total Complaints" value={totalComplaints} />
              </div>
              <div className="mt-4">
                <Toolbar
                  onSeed={handleSeed}
                  onRefresh={refresh}
                  onReset={handleReset}
                  busy={busy}
                />
              </div>
            </div>

            <AddGrievanceForm onAdded={refresh} />
          </aside>

          {/* Right: incident list */}
          <section className="lg:col-span-2">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {incidents.length === 0 && !busy ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-slate-500">
                  No incidents yet. Click{" "}
                  <span className="font-medium text-indigo-600">
                    Load sample data
                  </span>{" "}
                  or add a grievance to see clustering in action.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident, idx) => (
                  <MasterIncidentCard
                    key={incident.cluster_id}
                    incident={incident}
                    rank={idx + 1}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
