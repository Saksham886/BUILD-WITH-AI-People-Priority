import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { TbBrain } from "react-icons/tb";
import { checkVoiceAgentHealth, getGrievances } from "../api";

const NAV_LINK_STYLE = ({ isActive }) => ({
  padding: "9px 18px",
  borderRadius: "9px",
  fontSize: "0.9rem",
  fontWeight: 600,
  color: isActive ? "white" : "var(--text-secondary)",
  background: isActive ? "var(--gradient-accent)" : "transparent",
  textDecoration: "none",
  transition: "all 0.2s ease",
});

export default function Navbar() {
  const [voiceOnline, setVoiceOnline] = useState(null);
  const [aggOnline, setAggOnline] = useState(null);

  useEffect(() => {
    checkVoiceAgentHealth()
      .then(() => setVoiceOnline(true))
      .catch(() => setVoiceOnline(false));
    getGrievances()
      .then(() => setAggOnline(true))
      .catch(() => setAggOnline(false));
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(10, 15, 30, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <TbBrain style={{ color: "white", fontSize: "1.2rem" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em" }}>CivicAI</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Grievance Platform
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <NavLink to="/" end style={NAV_LINK_STYLE}>
            Intake
          </NavLink>
          <NavLink to="/dashboard" style={NAV_LINK_STYLE}>
            Dashboard
          </NavLink>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {voiceOnline !== null && (
            <span className={`status-badge ${voiceOnline ? "online" : "offline"}`}>
              <span className="status-dot" />
              Stage 1
            </span>
          )}
          {aggOnline !== null && (
            <span className={`status-badge ${aggOnline ? "online" : "offline"}`}>
              <span className="status-dot" />
              Stage 2
            </span>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
