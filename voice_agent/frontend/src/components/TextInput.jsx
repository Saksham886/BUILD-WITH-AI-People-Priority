import { useState } from 'react';
import { motion } from 'framer-motion';
import { BsSendFill } from 'react-icons/bs';
import { MdTranslate } from 'react-icons/md';

// Detect script from character unicode ranges
function detectScript(text) {
  if (!text) return null;
  if (/[\u0900-\u097F]/.test(text)) return { name: 'Hindi / Devanagari', flag: '🇮🇳' };
  if (/[\u0C80-\u0CFF]/.test(text)) return { name: 'Kannada', flag: '🏴' };
  if (/[\u0C00-\u0C7F]/.test(text)) return { name: 'Telugu', flag: '🏴' };
  if (/[\u0B80-\u0BFF]/.test(text)) return { name: 'Tamil', flag: '🏴' };
  if (/[\u0600-\u06FF]/.test(text)) return { name: 'Urdu', flag: '🇵🇰' };
  if (/[\u0A00-\u0A7F]/.test(text)) return { name: 'Punjabi', flag: '🏴' };
  if (/[\u0980-\u09FF]/.test(text)) return { name: 'Bengali', flag: '🇧🇩' };
  if (/[a-zA-Z]/.test(text)) return { name: 'Latin / Romanized', flag: '🌐' };
  return null;
}

export default function TextInput({ onSubmit, disabled }) {
  const [text, setText] = useState('');
  const script = detectScript(text);
  const charCount = text.length;
  const maxChars = 1000;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed) onSubmit(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Detected script badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <MdTranslate />
          <span>Any Indian language or code-mix accepted</span>
        </div>
        {script && text.length > 3 && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              fontSize: '0.75rem', fontWeight: 600,
              padding: '3px 10px', borderRadius: '20px',
              background: 'rgba(99,102,241,0.15)',
              color: 'var(--accent-indigo)',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            {script.flag} {script.name}
          </motion.span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        id="text-complaint-input"
        className="complaint-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={maxChars}
        placeholder="Describe your problem in any Indian language...&#10;&#10;Examples:&#10;• Kal se paani nahi aa raha hai&#10;• ನೀರು ಬರುತ್ತಿಲ್ಲ&#10;• Road has many potholes&#10;• Bijli nahi hai do din se"
        disabled={disabled}
        rows={6}
      />

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.75rem',
          color: charCount > maxChars * 0.9 ? 'var(--accent-amber)' : 'var(--text-muted)'
        }}>
          {charCount}/{maxChars}
        </span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Ctrl+Enter to submit
        </span>
      </div>

      {/* Submit button */}
      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        id="text-submit-btn"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <BsSendFill />
        Analyze Complaint
      </button>
    </div>
  );
}
