import { useState } from "react";
import toast from "react-hot-toast";
import { BsSendFill } from "react-icons/bs";
import { addGrievance } from "../api";

const EMPTY = {
  summary: "",
  category: "Water Supply",
  urgency: "Medium",
  location: "",
};

const CATEGORIES = [
  "Water Supply",
  "Electricity",
  "Sanitation",
  "Roads",
  "Public Safety",
  "Health",
  "Uncategorized",
];

export default function AddGrievanceForm({ onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.summary.trim()) return;
    setBusy(true);
    try {
      await addGrievance({
        ...form,
        location: form.location.trim() || "Unknown",
      });
      setForm(EMPTY);
      onAdded?.();
    } catch (err) {
      toast.error(err.message || "Failed to add grievance.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass-card" style={{ padding: "24px" }}>
      <h2 style={{ marginBottom: "16px", fontSize: "1rem", fontWeight: 700, color: "var(--text-secondary)" }}>
        Add a citizen grievance
      </h2>

      <textarea
        value={form.summary}
        onChange={update("summary")}
        placeholder="Summary of the complaint (this text is embedded & clustered)…"
        rows={3}
        className="complaint-textarea"
        style={{ minHeight: "100px", fontSize: "1rem" }}
      />

      <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <select value={form.category} onChange={update("category")} className="form-input" style={{ fontSize: "0.95rem", padding: "13px 14px" }}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={form.urgency} onChange={update("urgency")} className="form-input" style={{ fontSize: "0.95rem", padding: "13px 14px" }}>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      <input
        value={form.location}
        onChange={update("location")}
        placeholder="Location"
        className="form-input"
        style={{ marginTop: "14px", fontSize: "0.95rem", padding: "13px 14px" }}
      />

      <button
        type="submit"
        className="btn-primary"
        disabled={busy || !form.summary.trim()}
        style={{ marginTop: "18px", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
      >
        <BsSendFill /> {busy ? "Adding…" : "Add & re-cluster"}
      </button>
    </form>
  );
}
