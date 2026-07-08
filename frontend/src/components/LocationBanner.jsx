import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdLocationOn, MdLocationOff, MdMyLocation, MdRefresh } from 'react-icons/md';

/**
 * LocationBanner — requests the browser's Geolocation API and reverse-geocodes
 * the coordinates using the free Nominatim (OpenStreetMap) API.
 *
 * Props:
 *   onLocationChange(locationObj | null) — called whenever the resolved location changes.
 *   locationObj = { lat, lon, display, city, state, country }
 */
export default function LocationBanner({ onLocationChange }) {
  const [status, setStatus] = useState('idle'); // idle | requesting | resolving | ok | denied | error
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const resolveLocation = useCallback(async (lat, lon) => {
    setStatus('resolving');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Nominatim request failed');
      const data = await res.json();

      const addr = data.address || {};
      const parts = [
        addr.neighbourhood || addr.suburb || addr.village || addr.hamlet,
        addr.city || addr.town || addr.county,
        addr.state,
      ].filter(Boolean);

      const display = parts.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      const locationObj = {
        lat,
        lon,
        display,
        city: addr.city || addr.town || addr.county || '',
        state: addr.state || '',
        country: addr.country || 'India',
        raw: data.display_name,
      };

      setLocation(locationObj);
      setStatus('ok');
      onLocationChange(locationObj);
    } catch (err) {
      // Geocoding failed — still return coordinates
      const locationObj = {
        lat,
        lon,
        display: `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        city: '',
        state: '',
        country: '',
        raw: '',
      };
      setLocation(locationObj);
      setStatus('ok');
      onLocationChange(locationObj);
    }
  }, [onLocationChange]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('Geolocation is not supported by your browser.');
      onLocationChange(null);
      return;
    }
    setStatus('requesting');
    setLocation(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolveLocation(coords.latitude, coords.longitude),
      (err) => {
        setStatus('denied');
        setErrorMsg(
          err.code === 1
            ? 'Location access denied. Your complaint will be submitted without location.'
            : 'Unable to get location. Please try again.'
        );
        onLocationChange(null);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [resolveLocation, onLocationChange]);

  // Auto-request on mount
  useEffect(() => {
    requestLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bannerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '0.82rem',
    marginBottom: '16px',
    transition: 'all 0.3s ease',
  };

  return (
    <AnimatePresence mode="wait">
      {status === 'requesting' || status === 'resolving' ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            ...bannerStyle,
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: 'var(--text-secondary)',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          >
            <MdMyLocation style={{ fontSize: '1rem', color: 'var(--accent-indigo)' }} />
          </motion.div>
          <span>
            {status === 'requesting' ? 'Requesting your location…' : 'Resolving address…'}
          </span>
        </motion.div>
      ) : status === 'ok' && location ? (
        <motion.div
          key="ok"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            ...bannerStyle,
            background: 'rgba(16,185,129,0.07)',
            border: '1px solid rgba(16,185,129,0.22)',
            color: 'var(--text-secondary)',
          }}
        >
          <MdLocationOn style={{ fontSize: '1.1rem', color: '#10b981', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Location detected: </strong>
            {location.display}
          </span>
          <button
            onClick={requestLocation}
            title="Refresh location"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: '8px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <MdRefresh style={{ fontSize: '1.1rem' }} />
          </button>
        </motion.div>
      ) : status === 'denied' || status === 'error' ? (
        <motion.div
          key="denied"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            ...bannerStyle,
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: 'var(--text-secondary)',
          }}
        >
          <MdLocationOff style={{ fontSize: '1.1rem', color: '#f59e0b', flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{errorMsg}</span>
          <button
            onClick={requestLocation}
            style={{
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '8px', padding: '7px 16px', cursor: 'pointer',
              color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0,
            }}
          >
            Retry
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
