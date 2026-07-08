// Thin fetch wrappers around all three pipeline stages, proxied via Vite
// (see vite.config.js) so every call is same-origin.
const BASE = "/api";
const VOICE_BASE = "/voice-api";
const LETTERS_BASE = "/letters-api";

async function request(base, path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

// ── Stage 2: aggregation ──────────────────────────────────────────────
export const getClusters = () => request(BASE, "/get-clusters");

export const getGrievances = () => request(BASE, "/grievances");

export const loadSampleData = () =>
  request(BASE, "/ingest/seed", { method: "POST" });

export const addGrievance = (grievance) =>
  request(BASE, "/ingest", { method: "POST", body: JSON.stringify(grievance) });

export const resetAll = () => request(BASE, "/reset", { method: "DELETE" });

// ── Stage 1: voice_agent intake ───────────────────────────────────────
function buildLocationQuery(location) {
  if (!location) return "";
  const params = new URLSearchParams({
    lat: location.lat,
    lon: location.lon,
    location_display: location.display,
  });
  return `?${params.toString()}`;
}

export async function submitText(text, location = null) {
  return request(VOICE_BASE, `/text${buildLocationQuery(location)}`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function submitVoice(audioBlob, filename = "complaint.webm", location = null) {
  const formData = new FormData();
  formData.append("file", audioBlob, filename);
  const res = await fetch(`${VOICE_BASE}/voice${buildLocationQuery(location)}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const checkVoiceAgentHealth = () => request(VOICE_BASE, "/health");

// ── Stage 3: letter_service ────────────────────────────────────────────
export const generateLetter = (masterIncident) =>
  request(LETTERS_BASE, "/generate-letter", {
    method: "POST",
    body: JSON.stringify(masterIncident),
  });

export async function generatePdf({ letterMarkdown, constituencyName, mpName }) {
  const res = await fetch(`${LETTERS_BASE}/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      letter_markdown: letterMarkdown,
      constituency_name: constituencyName,
      mp_name: mpName,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.blob();
}
