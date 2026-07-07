import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineStatusOnline } from 'react-icons/hi';
import { TbBrain } from 'react-icons/tb';
import { checkHealth } from '../services/api';

export default function Navbar() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', ollama_reachable: false, whisper_loaded: false }));
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10, 15, 30, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TbBrain style={{ color: 'white', fontSize: '1.2rem' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              CivicAI
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Grievance Platform
            </div>
          </div>
        </div>

        {/* Status indicators */}
        {health && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`status-badge ${health.ollama_reachable ? 'online' : 'offline'}`}>
              <span className="status-dot" />
              Ollama {health.ollama_reachable ? 'Online' : 'Offline'}
            </span>
            <span className={`status-badge ${health.whisper_loaded ? 'online' : 'offline'}`}>
              <span className="status-dot" />
              Whisper {health.whisper_loaded ? 'Ready' : 'Loading'}
            </span>
          </div>
        )}
      </div>
    </motion.nav>
  );
}
