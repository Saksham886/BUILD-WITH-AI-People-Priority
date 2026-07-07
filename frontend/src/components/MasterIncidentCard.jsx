import { useState } from "react";

const URGENCY_STYLES = {
  High: "bg-red-100 text-red-700 ring-red-600/20",
  Medium: "bg-amber-100 text-amber-700 ring-amber-600/20",
  Low: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
};

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

export default function MasterIncidentCard({ incident, rank }) {
  const [open, setOpen] = useState(false);
  const urgencyStyle =
    URGENCY_STYLES[incident.urgency] || "bg-slate-100 text-slate-700 ring-slate-600/20";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">#{rank}</span>
            <Badge className="bg-slate-100 text-slate-700 ring-slate-600/20">
              {incident.category}
            </Badge>
            <Badge className={urgencyStyle}>{incident.urgency}</Badge>
            <span className="text-xs text-slate-500">📍 {incident.location}</span>
          </div>
          <h3 className="text-base font-semibold leading-snug text-slate-900">
            {incident.title}
          </h3>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span className="text-3xl font-bold leading-none text-indigo-600">
            {incident.priority_score}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
            priority
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-sm font-medium text-slate-600">
          🗣️ {incident.count} {incident.count === 1 ? "complaint" : "complaints"}
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {open ? "Hide" : "View"} citizen statements
        </button>
      </div>

      {open && (
        <ul className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
          {incident.member_summaries.map((s, i) => (
            <li
              key={i}
              className="flex gap-2 text-sm text-slate-700"
            >
              <span className="text-slate-400">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
