import { useState } from 'react';
import { motion } from 'framer-motion';
import { BsCheckCircleFill, BsClipboard, BsClipboardCheck } from 'react-icons/bs';
import { MdAutoAwesome, MdLocationOn } from 'react-icons/md';

export default function ResultCard({ result }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="glass-card result-glow"
      style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <BsCheckCircleFill style={{ color: 'white', fontSize: '1.2rem' }} />
        </motion.div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1rem' }}>
            Canonical Problem Generated
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Normalized & standardized by AI
          </div>
        </div>
      </div>

      {/* Result display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '20px 24px',
        }}
      >
        <div style={{
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--accent-emerald)',
          marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <MdAutoAwesome />
          canonical_problem
        </div>
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3,
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {result.canonical_problem}
        </motion.p>
      </motion.div>

      {/* Location badge */}
      {result.location && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 14px',
            borderRadius: '9px',
            background: 'rgba(16,185,129,0.05)',
            border: '1px solid rgba(16,185,129,0.18)',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
          }}
        >
          <MdLocationOn style={{ color: '#10b981', fontSize: '1rem', flexShrink: 0 }} />
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>Location: </strong>
            {result.location.display}
          </span>
          {result.location.lat != null && (
            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {result.location.lat.toFixed(4)}, {result.location.lon.toFixed(4)}
            </span>
          )}
        </motion.div>
      )}

      {/* JSON output */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '14px 16px',
          position: 'relative',
        }}
      >
        <pre className="mono" style={{ 
          fontSize: '0.85rem', 
          color: '#94a3b8', 
          margin: 0,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          id="copy-result-btn"
          title="Copy JSON"
          style={{
            position: 'absolute', top: '10px', right: '10px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)',
            borderRadius: '7px', padding: '6px 10px', cursor: 'pointer',
            color: copied ? 'var(--accent-emerald)' : 'var(--text-muted)',
            fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px',
            transition: 'all 0.2s',
          }}
        >
          {copied ? <BsClipboardCheck /> : <BsClipboard />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </motion.div>

      {/* Footer info */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 14px', borderRadius: '8px',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.15)',
        fontSize: '0.78rem', color: 'var(--text-muted)',
      }}>
        <span>🔗</span>
        <span>This output is ready for semantic embedding and DBSCAN clustering (Stage 2)</span>
      </div>
    </motion.div>
  );
}
