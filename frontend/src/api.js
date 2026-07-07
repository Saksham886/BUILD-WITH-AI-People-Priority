// Thin fetch wrappers around the Stage 2 backend (proxied via /api).
const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

export const getClusters = () => request("/get-clusters");

export const getGrievances = () => request("/grievances");

export const loadSampleData = () =>
  request("/ingest/seed", { method: "POST" });

export const addGrievance = (grievance) =>
  request("/ingest", { method: "POST", body: JSON.stringify(grievance) });

export const resetAll = () => request("/reset", { method: "DELETE" });
