import { useState } from "react";
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
  const [error, setError] = useState(null);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.summary.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addGrievance({
        ...form,
        location: form.location.trim() || "Unknown",
      });
      setForm(EMPTY);
      onAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        Add a citizen grievance
      </h2>

      <textarea
        value={form.summary}
        onChange={update("summary")}
        placeholder="Summary of the complaint (this text is embedded & clustered)…"
        rows={3}
        className="w-full resize-none rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={form.category}
          onChange={update("category")}
          className="rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-indigo-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={form.urgency}
          onChange={update("urgency")}
          className="rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-indigo-500"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <input
          value={form.location}
          onChange={update("location")}
          placeholder="Location"
          className="rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-indigo-500"
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy || !form.summary.trim()}
        className="mt-3 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Adding…" : "Add & re-cluster"}
      </button>
    </form>
  );
}
