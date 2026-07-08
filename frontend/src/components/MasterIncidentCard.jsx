import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdLocationOn } from "react-icons/md";
import { BsChatSquareTextFill, BsFileEarmarkPdf } from "react-icons/bs";

const URGENCY_BADGE = {
  High: "rose",
  Medium: "amber",
  Low: "emerald",
};

function Badge({ children, variant = "slate" }) {
  return <span className={`status-badge ${variant}`}>{children}</span>;
}

export default function MasterIncidentCard({ incident, rank, delay = 0, onGenerateLetter }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ delay, duration: 0.3 }}
      className="glass-card"
      style={{ padding: "20px" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: "8px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>#{rank}</span>
            <Badge variant="slate">{incident.category}</Badge>
            <Badge variant={URGENCY_BADGE[incident.urgency] || "slate"}>{incident.urgency}</Badge>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <MdLocationOn /> {incident.location}
            </span>
          </div>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, lineHeight: 1.4, color: "var(--text-primary)" }}>
            {incident.title}
          </h3>
        </div>

        <div style={{ display: "flex", flexShrink: 0, flexDirection: "column", alignItems: "flex-end" }}>
          <span className="gradient-text" style={{ fontSize: "1.9rem", fontWeight: 800, lineHeight: 1 }}>
            {incident.priority_score}
          </span>
          <span style={{ marginTop: "4px", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
            priority
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px",
        }}
      >
        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <BsChatSquareTextFill style={{ color: "var(--accent-indigo)" }} />
          {incident.count} {incident.count === 1 ? "complaint" : "complaints"}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <button
            onClick={() => setOpen((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, color: "var(--accent-indigo)", padding: "10px 4px" }}
          >
            {open ? "Hide" : "View"} statements
          </button>
          <button
            onClick={() => onGenerateLetter(incident)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "10px", padding: "10px 18px", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-indigo)",
            }}
          >
            <BsFileEarmarkPdf /> Generate Letter
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: "12px", padding: "12px", borderRadius: "10px",
              background: "rgba(255,255,255,0.03)", listStyle: "none", overflow: "hidden",
              display: "flex", flexDirection: "column", gap: "8px",
            }}
          >
            {incident.member_summaries.map((s, i) => (
              <li key={i} style={{ display: "flex", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--text-muted)" }}>•</span>
                <span>{s}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
