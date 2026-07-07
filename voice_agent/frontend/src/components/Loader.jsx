import { motion, AnimatePresence } from 'framer-motion';
import { BsCheckCircleFill } from 'react-icons/bs';
import { MdCircle } from 'react-icons/md';

const PIPELINE_STEPS = [
  { id: 'recording',   icon: '🎤', label: 'Processing Input' },
  { id: 'transcribing', icon: '📝', label: 'Transcribing Audio' },
  { id: 'detecting',  icon: '🌐', label: 'Detecting Language' },
  { id: 'analyzing',  icon: '🧠', label: 'Understanding Complaint' },
  { id: 'generating', icon: '✅', label: 'Generating Canonical Problem' },
];

export default function Loader({ mode = 'voice' }) {
  // Animate through steps with stagger
  const steps = mode === 'text'
    ? PIPELINE_STEPS.filter((s) => s.id !== 'transcribing')
    : PIPELINE_STEPS;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="glass-card"
      style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="dot-pulse">
          <span /><span /><span />
        </div>
        <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-secondary)' }}>
          AI Pipeline Running...
        </span>
      </div>

      {/* Pipeline steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.4, duration: 0.4 }}
            className="pipeline-step active"
          >
            {/* Step icon */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ delay: index * 0.4, duration: 0.4 }}
              style={{ fontSize: '1.25rem', minWidth: '28px', textAlign: 'center' }}
            >
              {step.icon}
            </motion.div>

            {/* Label */}
            <span style={{ fontSize: '0.9rem', fontWeight: 500, flex: 1 }}>
              {step.label}
            </span>

            {/* Spinner or check */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.4 + 0.2 }}
            >
              {index < steps.length - 1 ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid rgba(99,102,241,0.3)',
                    borderTopColor: 'var(--accent-indigo)',
                  }}
                />
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.4 + 0.3, type: 'spring' }}
                >
                  <BsCheckCircleFill style={{ color: 'var(--accent-emerald)', fontSize: '1rem' }} />
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Hint */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        This may take 15–60 seconds depending on your hardware
      </p>
    </motion.div>
  );
}
