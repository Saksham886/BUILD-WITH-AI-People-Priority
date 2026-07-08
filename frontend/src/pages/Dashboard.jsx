import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getClusters, loadSampleData, resetAll } from "../api";
import MasterIncidentCard from "../components/MasterIncidentCard";
import AddGrievanceForm from "../components/AddGrievanceForm";
import Toolbar from "../components/Toolbar";
import LetterModal from "../components/LetterModal";

const POLL_INTERVAL_MS = 5000;

export default function Dashboard() {
  const [incidents, setIncidents] = useState([]);
  const [busy, setBusy] = useState(false);
  const [letterIncident, setLetterIncident] = useState(null);
  const pollingRef = useRef(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      setIncidents(await getClusters());
    } catch (err) {
      toast.error(err.message || "Failed to load master incidents.");
    } finally {
      setBusy(false);
    }
  }, []);

  // Background poll: same data as refresh(), but never toggles `busy` so the
  // list updates without a loading flicker every tick.
  const pollRefresh = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      setIncidents(await getClusters());
    } catch {
      // Silent — a transient poll failure shouldn't toast every 5s.
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(pollRefresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [pollRefresh]);

  const handleSeed = async () => {
    setBusy(true);
    try {
      await loadSampleData();
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to load sample data.");
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      await resetAll();
      await refresh();
    } catch (err) {
      toast.error(err.message || "Failed to reset.");
      setBusy(false);
    }
  };

  const totalComplaints = incidents.reduce((sum, i) => sum + i.count, 0);

  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 80px" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: "28px" }}>
        <span className="status-badge indigo" style={{ marginBottom: "10px" }}>STAGE 2 · AGGREGATION</span>
        <h1 style={{ marginTop: "10px", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Master Incidents
        </h1>
        <p style={{ marginTop: "4px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
          Semantic clustering of citizen grievances · priority = complaints × urgency
        </p>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 320px) 1fr", gap: "24px", alignItems: "flex-start" }}>
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <Stat label="Master Incidents" value={incidents.length} />
              <Stat label="Total Complaints" value={totalComplaints} />
            </div>
            <div style={{ marginTop: "18px" }}>
              <Toolbar onSeed={handleSeed} onRefresh={refresh} onReset={handleReset} busy={busy} />
            </div>
          </div>

          <AddGrievanceForm onAdded={refresh} />
        </motion.aside>

        <section>
          {incidents.length === 0 && !busy ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card"
              style={{ padding: "48px 24px", textAlign: "center" }}
            >
              <p style={{ color: "var(--text-secondary)" }}>
                No incidents yet. Click{" "}
                <span style={{ color: "var(--accent-indigo)", fontWeight: 600 }}>Load sample data</span>{" "}
                or add a grievance to see clustering in action.
              </p>
            </motion.div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <AnimatePresence>
                {incidents.map((incident, idx) => (
                  <MasterIncidentCard
                    key={incident.cluster_id}
                    incident={incident}
                    rank={idx + 1}
                    delay={Math.min(idx, 8) * 0.05}
                    onGenerateLetter={setLetterIncident}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {letterIncident && <LetterModal incident={letterIncident} onClose={() => setLetterIncident(null)} />}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ borderRadius: "12px", background: "rgba(255,255,255,0.03)", padding: "16px 12px", textAlign: "center" }}>
      <div className="gradient-text" style={{ fontSize: "1.9rem", fontWeight: 800 }}>{value}</div>
      <div style={{ marginTop: "2px", fontSize: "0.78rem", color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
