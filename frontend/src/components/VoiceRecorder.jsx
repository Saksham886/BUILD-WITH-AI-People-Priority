import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsMicFill, BsStopFill, BsUpload, BsPlay, BsPause } from 'react-icons/bs';
import { FiTrash2 } from 'react-icons/fi';

const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];

function getSupportedMimeType() {
  return SUPPORTED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) || 'audio/webm';
}

export default function VoiceRecorder({ onRecordingReady, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleDiscard = useCallback(() => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setDuration(0);
    onRecordingReady(null);
  }, [onRecordingReady]);

  const handleSubmit = useCallback(() => {
    if (audioBlob) {
      onRecordingReady(audioBlob);
    }
  }, [audioBlob, onRecordingReady]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: '10px', padding: '12px 16px', color: '#f43f5e',
              fontSize: '0.875rem', width: '100%', textAlign: 'center',
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording state */}
      {!audioBlob ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {/* Waveform when recording */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="waveform"
              >
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timer — pops on every tick since the key changes each second */}
          {isRecording && (
            <motion.div
              key={duration}
              initial={{ scale: 1.35, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ color: 'var(--accent-rose)', fontWeight: 700, fontSize: '1.25rem', fontFamily: 'monospace' }}
            >
              🔴 {formatTime(duration)}
            </motion.div>
          )}

          {/* Big mic button, ringed by expanding sonar pulses while recording */}
          <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isRecording && [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 1, opacity: 0.55 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: i * 0.6 }}
                style={{
                  position: 'absolute',
                  width: '80px', height: '80px', borderRadius: '50%',
                  border: '2px solid var(--accent-rose)',
                  pointerEvents: 'none',
                }}
              />
            ))}
            <button
              className={`btn-record ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={disabled}
              id="voice-record-btn"
              title={isRecording ? 'Stop Recording' : 'Start Recording'}
              style={{ position: 'relative', zIndex: 1 }}
            >
              {isRecording ? <BsStopFill /> : <BsMicFill />}
            </button>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {isRecording ? 'Click to stop recording' : 'Click to start recording'}
          </p>
        </div>
      ) : (
        /* Playback state */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: '100%',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '14px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Audio element (hidden) */}
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={togglePlayback}
                id="voice-playback-btn"
                style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'var(--gradient-accent)', border: 'none',
                  color: 'white', fontSize: '1.3rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.2s', flexShrink: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isPlaying ? <BsPause /> : <BsPlay />}
              </button>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Recording ready</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Duration: {formatTime(duration)}
                </div>
              </div>
            </div>

            <button
              onClick={handleDiscard}
              id="voice-discard-btn"
              title="Discard recording"
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)',
                cursor: 'pointer', fontSize: '1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-rose)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
            >
              <FiTrash2 />
            </button>
          </div>

          {/* Submit button */}
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={disabled}
            id="voice-submit-btn"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <BsUpload />
            Analyze Voice Complaint
          </button>
        </motion.div>
      )}
    </div>
  );
}
