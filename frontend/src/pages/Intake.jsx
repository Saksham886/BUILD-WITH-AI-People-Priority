import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { BsMicFill, BsKeyboard } from "react-icons/bs";
import { TbWaveSine } from "react-icons/tb";
import { MdLanguage } from "react-icons/md";

import VoiceRecorder from "../components/VoiceRecorder";
import TextInput from "../components/TextInput";
import Loader from "../components/Loader";
import ResultCard from "../components/ResultCard";
import LocationBanner from "../components/LocationBanner";
import { submitVoice, submitText, addGrievance } from "../api";

const SUPPORTED_LANGUAGES = [
  "English", "Hindi", "Bengali", "Marathi", "Gujarati",
  "Punjabi", "Tamil", "Telugu", "Kannada", "Malayalam", "Odia", "Urdu",
  "Hinglish", "Benglish", "Minglish", "Gujlish",
  "Punglish", "Tanglish", "Kanglish", "Manglish", "Odlish", "Urlish",
];

// Forward the normalized Stage 1 output into Stage 2's cluster pipeline.
// Stage 1 doesn't classify category/urgency yet, so those fall back to
// Stage 2's own defaults (Uncategorized / Medium).
async function forwardToAggregation(canonicalProblem, location) {
  await addGrievance({
    summary: canonicalProblem,
    location: location?.display || "Unknown",
  });
}

export default function Intake() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("text");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [forwarded, setForwarded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [location, setLocation] = useState(null);

  const handleVoiceReady = useCallback(
    async (blob) => {
      if (!blob) {
        setResult(null);
        return;
      }
      setLoading(true);
      setResult(null);
      setForwarded(false);
      setSubmitError(null);
      try {
        const data = await submitVoice(blob, "complaint.webm", location);
        setResult(data);
        toast.success("Complaint normalized successfully!");
      } catch (err) {
        toast.error(err.message || "Failed to process voice. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [location]
  );

  const handleTextSubmit = useCallback(
    async (text) => {
      setLoading(true);
      setResult(null);
      setForwarded(false);
      setSubmitError(null);
      try {
        const data = await submitText(text, location);
        setResult(data);
        toast.success("Complaint normalized successfully!");
      } catch (err) {
        toast.error(err.message || "Failed to process text. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [location]
  );

  const handleSubmitToAggregation = useCallback(async () => {
    if (!result) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await forwardToAggregation(result.canonical_problem, result.location);
      setForwarded(true);
      toast.success("Sent to Stage 2 for clustering!");
      navigate("/dashboard");
    } catch (err) {
      setSubmitError(err.message || "Failed to forward to Stage 2. Please try again.");
      toast.error("Forwarding to Stage 2 failed.");
    } finally {
      setSubmitting(false);
    }
  }, [result, navigate]);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <section style={{ padding: "72px 24px 48px", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "20px", padding: "6px 16px", marginBottom: "24px",
              fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-indigo)",
              letterSpacing: "0.05em",
            }}
          >
            <TbWaveSine />
            AI-Powered Civic Intelligence · Stage 1
          </motion.div>

          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "20px" }}>
            Multilingual <span className="gradient-text">Grievance</span>
            <br />Normalization
          </h1>

          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: "560px", margin: "0 auto 32px", lineHeight: 1.7 }}>
            Submit a complaint in <strong style={{ color: "var(--text-primary)" }}>any Indian language</strong>.
            Our AI normalizes it into a canonical problem statement, which you can review and submit to
            Stage 2's clustering dashboard.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "16px" }}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <span
                key={lang}
                style={{
                  padding: "4px 12px", borderRadius: "20px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: "0.78rem", color: "var(--text-secondary)",
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px 80px" }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="glass-card"
          style={{ padding: "32px" }}
        >
          <LocationBanner onLocationChange={setLocation} />

          <div className="tab-switcher" style={{ marginBottom: "28px" }}>
            <button
              className={`tab-btn ${mode === "text" ? "active" : ""}`}
              onClick={() => { setMode("text"); setResult(null); }}
              disabled={loading}
            >
              <BsKeyboard /> Text Input
            </button>
            <button
              className={`tab-btn ${mode === "voice" ? "active" : ""}`}
              onClick={() => { setMode("voice"); setResult(null); }}
              disabled={loading}
            >
              <BsMicFill /> Voice Recording
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!loading && (
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "voice" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "voice" ? -20 : 20 }}
                transition={{ duration: 0.25 }}
              >
                {mode === "text" ? (
                  <TextInput onSubmit={handleTextSubmit} disabled={loading} />
                ) : (
                  <VoiceRecorder onRecordingReady={handleVoiceReady} disabled={loading} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>{loading && <Loader mode={mode} />}</AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginTop: "24px" }}>
              <ResultCard
                result={result}
                forwarded={forwarded}
                submitting={submitting}
                submitError={submitError}
                onSubmit={handleSubmitToAggregation}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} style={{ marginTop: "32px" }}>
            <PipelineExplanation mode={mode} />
          </motion.div>
        )}
      </section>
    </div>
  );
}

function PipelineExplanation({ mode }) {
  const voiceSteps = [
    { icon: "🎤", label: "Record / Upload" },
    { icon: "📝", label: "Transcribe (Whisper)" },
    { icon: "🌐", label: "Detect Language" },
    { icon: "🧠", label: "Normalize (Qwen2.5)" },
    { icon: "✅", label: "Forward to Stage 2" },
  ];
  const textSteps = [
    { icon: "⌨️", label: "Enter Complaint" },
    { icon: "🌐", label: "Detect Language" },
    { icon: "🧠", label: "Normalize (Qwen2.5)" },
    { icon: "✅", label: "Forward to Stage 2" },
  ];
  const steps = mode === "voice" ? voiceSteps : textSteps;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px", padding: "20px",
        display: "flex", flexDirection: "column", gap: "12px",
      }}
    >
      <div style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
        <MdLanguage style={{ display: "inline", marginRight: "6px" }} />
        Processing Pipeline
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
        {steps.map((step, i) => (
          <span key={step.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                padding: "5px 12px", borderRadius: "8px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.8rem", color: "var(--text-secondary)",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {step.icon} {step.label}
            </span>
            {i < steps.length - 1 && <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
