import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutes — LLM can be slow on CPU
});

/**
 * Build query-string params from a location object.
 * @param {object|null} location
 * @returns {object} params suitable for axios `params`
 */
function buildLocationParams(location) {
  if (!location) return {};
  return {
    lat: location.lat,
    lon: location.lon,
    location_display: location.display,
  };
}

/**
 * Submit a voice recording blob for normalization.
 * @param {Blob} audioBlob - The recorded audio blob
 * @param {string} filename - Filename with extension (e.g. "complaint.webm")
 * @param {object|null} location - Optional location object from LocationBanner
 * @returns {Promise<{canonical_problem: string, location: object}>}
 */
export async function submitVoice(audioBlob, filename = 'complaint.webm', location = null) {
  const formData = new FormData();
  formData.append('file', audioBlob, filename);

  const response = await api.post('/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: buildLocationParams(location),
  });

  return response.data;
}

/**
 * Submit a text complaint for normalization.
 * @param {string} text - Raw complaint text in any language
 * @param {object|null} location - Optional location object from LocationBanner
 * @returns {Promise<{canonical_problem: string, location: object}>}
 */
export async function submitText(text, location = null) {
  const response = await api.post('/text', { text }, {
    params: buildLocationParams(location),
  });
  return response.data;
}

/**
 * Health check — returns service status.
 * @returns {Promise<{status: string, ollama_reachable: boolean, whisper_loaded: boolean}>}
 */
export async function checkHealth() {
  const response = await api.get('/health');
  return response.data;
}

export default api;

