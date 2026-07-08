import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { BsFileEarmarkPdf, BsX } from "react-icons/bs";
import { generateLetter, generatePdf } from "../api";

// Stage 2's MasterIncident doesn't retain per-member location/urgency
// separately from the cluster's aggregate values, so every aggregated_detail
// reuses the cluster's dominant urgency/location — the closest available
// approximation of what letter_service's schema expects.
function toLetterServicePayload(incident) {
  return {
    master_incident_id: String(incident.cluster_id),
    title: incident.title,
    category: incident.category,
    total_complaints_count: incident.count,
    priority_score: incident.priority_score,
    aggregated_details: incident.member_summaries.map((summary) => ({
      summary,
      location: incident.location,
      urgency: incident.urgency,
    })),
  };
}

export default function LetterModal({ incident, onClose }) {
  const [status, setStatus] = useState("generating"); // generating | ready | error
  const [letter, setLetter] = useState(null);
  const [constituencyName, setConstituencyName] = useState("");
  const [mpName, setMpName] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("generating");
    generateLetter(toLetterServicePayload(incident))
      .then((data) => {
        if (!cancelled) {
          setLetter(data);
          setStatus("ready");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus("error");
          toast.error(err.message || "Letter generation failed.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [incident]);

  const handleDownload = async () => {
    if (!letter || !constituencyName.trim() || !mpName.trim()) return;
    setDownloading(true);
    try {
      const blob = await generatePdf({
        letterMarkdown: letter.letter_markdown,
        constituencyName: constituencyName.trim(),
        mpName: mpName.trim(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grievance_letter_${incident.cluster_id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Letter PDF downloaded.");
    } catch (err) {
      toast.error(err.message || "PDF generation failed.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(5, 8, 16, 0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="glass-card"
        style={{
          width: "100%", maxWidth: "640px", maxHeight: "85vh", overflowY: "auto",
          padding: "28px", position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          title="Close"
          style={{
            position: "absolute", top: "14px", right: "14px",
            width: "36px", height: "36px", borderRadius: "50%",
            background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-subtle)",
            color: "var(--text-muted)", cursor: "pointer", fontSize: "1.3rem",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <BsX />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <BsFileEarmarkPdf style={{ color: "var(--accent-indigo)", fontSize: "1.4rem" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Generate Grievance Letter</h2>
        </div>

        {status === "generating" && (
          <div className="dot-pulse" style={{ margin: "24px auto", justifyContent: "center" }}>
            <span /><span /><span />
          </div>
        )}

        {status === "error" && (
          <p style={{ color: "var(--accent-rose)", fontSize: "0.9rem" }}>
            Could not generate the letter. Make sure letter_service is running (port 8002).
          </p>
        )}

        {status === "ready" && letter && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  fontSize: "0.75rem", color: "var(--text-muted)",
                  padding: "8px 12px", borderRadius: "8px",
                  background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
                }}
              >
                Routed to: <strong style={{ color: "var(--text-primary)" }}>{letter.department_routed_to}</strong>
              </div>

              <pre
                className="mono"
                style={{
                  background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-subtle)",
                  borderRadius: "10px", padding: "16px", fontSize: "0.8rem",
                  color: "#94a3b8", whiteSpace: "pre-wrap", wordBreak: "break-word",
                  maxHeight: "260px", overflowY: "auto", margin: 0,
                }}
              >
                {letter.letter_markdown}
              </pre>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <input
                  className="form-input"
                  placeholder="Constituency name"
                  value={constituencyName}
                  onChange={(e) => setConstituencyName(e.target.value)}
                  style={{ padding: "13px 16px", fontSize: "0.95rem" }}
                />
                <input
                  className="form-input"
                  placeholder="MP name"
                  value={mpName}
                  onChange={(e) => setMpName(e.target.value)}
                  style={{ padding: "13px 16px", fontSize: "0.95rem" }}
                />
              </div>

              <button
                className="btn-primary"
                disabled={downloading || !constituencyName.trim() || !mpName.trim()}
                onClick={handleDownload}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {downloading ? "Preparing PDF…" : "Download PDF"}
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}
