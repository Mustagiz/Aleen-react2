/**
 * Aleen Atelier POS Audio & Voice Synthesis Engine
 * 100% Zero-API: Uses Native Web Audio API + Web Speech API (window.speechSynthesis)
 * Provides crisp audio chimes and natural voice confirmations for double-scan protection,
 * stock warnings, and payment confirmations.
 */

// Global AudioContext singleton to avoid browser limits
let sharedAudioCtx = null;
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

// Auto-unlock audio and speech on first user interaction (click, keypress, touch)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if ('speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

// Check if voice synthesis is supported
export const isVoiceSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
};

// Preferences management
export const getVoiceSettings = () => {
  try {
    const soundEnabled = localStorage.getItem('aleen_pos_sound_enabled');
    const voiceEnabled = localStorage.getItem('aleen_pos_voice_enabled');
    const volume = localStorage.getItem('aleen_pos_voice_volume');
    return {
      soundEnabled: soundEnabled !== null ? soundEnabled === 'true' : true,
      voiceEnabled: voiceEnabled !== null ? voiceEnabled === 'true' : true,
      volume: volume ? parseFloat(volume) : 0.95,
    };
  } catch {
    return { soundEnabled: true, voiceEnabled: true, volume: 0.95 };
  }
};

export const setVoiceSettings = (settings) => {
  try {
    if (typeof settings.soundEnabled === 'boolean') {
      localStorage.setItem('aleen_pos_sound_enabled', String(settings.soundEnabled));
    }
    if (typeof settings.voiceEnabled === 'boolean') {
      localStorage.setItem('aleen_pos_voice_enabled', String(settings.voiceEnabled));
    }
    if (typeof settings.volume === 'number') {
      localStorage.setItem('aleen_pos_voice_volume', String(settings.volume));
    }
  } catch (err) {
    console.warn('Failed to save POS voice settings:', err);
  }
};

/**
 * Crisp synthesized audio chimes using pure Web Audio API oscillators
 * Types:
 * - 'scan': Crisp dual-chime (A6 -> E7) for new item scan
 * - 'duplicate': Soft musical double-pip (C6 -> G6) when quantity increments
 * - 'warning': Resonant minor chord chime for low stock
 * - 'error': Low frequency double-buzz for item not found
 * - 'success': Cash register triumphant harmonic chord on bill settlement
 */
export const playLuxuryChime = (type = 'success') => {
  const settings = getVoiceSettings();
  if (!settings.soundEnabled) return;

  // Sound on valid barcode ('scan' -> ting), unrecognized barcode ('error' -> buzz), and bill settlement ('success' -> paid chord)
  if (type !== 'success' && type !== 'scan' && type !== 'error') return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const executeSound = () => {
      try {
        const gainNode = ctx.createGain();
        gainNode.connect(ctx.destination);
        const now = ctx.currentTime;

        if (type === 'scan') {
          // Crisp Atelier dual chime: A6 (1760Hz) -> E7 (2637Hz)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          osc1.connect(gainNode);
          osc2.connect(gainNode);

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(1760, now);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(2637, now + 0.035);

          gainNode.gain.setValueAtTime(0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc1.start(now);
          osc1.stop(now + 0.045);
          osc2.start(now + 0.035);
          osc2.stop(now + 0.15);
        } else if (type === 'duplicate') {
          // Double tap chime indicating quantity +1 on double scan
          const osc = ctx.createOscillator();
          osc.connect(gainNode);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1318, now); // E6
          osc.frequency.setValueAtTime(1567, now + 0.06); // G6

          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === 'warning') {
          // Amber tone for low stock
          const osc = ctx.createOscillator();
          osc.connect(gainNode);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, now); // A4
          osc.frequency.setValueAtTime(392, now + 0.09); // G4

          gainNode.gain.setValueAtTime(0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

          osc.start(now);
          osc.stop(now + 0.28);
        } else if (type === 'error') {
          // Low buzz
          const osc = ctx.createOscillator();
          osc.connect(gainNode);
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(220, now);
          gainNode.gain.setValueAtTime(0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'success') {
          // Triumphant luxury triad chord: C6 (1046Hz), E6 (1318Hz), G6 (1567Hz), C7 (2093Hz)
          const freqs = [1046.5, 1318.5, 1567.98, 2093];
          freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.connect(oscGain);
            oscGain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            oscGain.gain.setValueAtTime(0.2, now + idx * 0.05);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.start(now + idx * 0.05);
            osc.stop(now + 0.5);
          });
        }
      } catch (err) {
        console.warn('Audio node execution error:', err);
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(executeSound).catch(executeSound);
    } else {
      executeSound();
    }
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
};

/**
 * Text-to-Speech Engine using window.speechSynthesis
 */
let lastSpeakTimestamp = 0;
let activeUtterances = [];

export const speakVoice = (text, options = {}) => {
  const settings = getVoiceSettings();
  if (!settings.voiceEnabled || !isVoiceSupported()) return;

  try {
    const synth = window.speechSynthesis;
    if (synth.paused) {
      synth.resume();
    }
    // Cancel ongoing speech if rapid scanning to avoid huge queue delay
    const now = Date.now();
    if (now - lastSpeakTimestamp < 1500) {
      synth.cancel();
    }
    lastSpeakTimestamp = now;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = typeof settings.volume === 'number' ? settings.volume : 0.95;
    utterance.rate = options.rate || 1.05; // Brisk and clear
    utterance.pitch = options.pitch || 1.0;

    // Retain in memory to prevent Chrome/Safari garbage-collection speech silence bug
    activeUtterances.push(utterance);
    utterance.onend = () => {
      activeUtterances = activeUtterances.filter(u => u !== utterance);
    };
    utterance.onerror = () => {
      activeUtterances = activeUtterances.filter(u => u !== utterance);
    };

    // Pick a natural English voice if available (e.g. Samantha, Karen, Google UK, etc.)
    const voices = synth.getVoices();
    if (voices && voices.length > 0) {
      const preferred = voices.find(
        (v) =>
          (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Siri') || v.name.includes('Samantha') || v.name.includes('Google')))
      ) || voices.find((v) => v.lang.startsWith('en'));
      if (preferred) {
        utterance.voice = preferred;
      }
    }

    synth.speak(utterance);
  } catch (err) {
    console.warn('Web Speech synthesis error:', err);
  }
};

/**
 * High-level POS Voice actions
 */
export const speakItemScan = (item, options = {}) => {
  // Silent: sound only when the bill is paid
};

export const speakItemNotFound = (barcode) => {
  // Silent: sound only when the bill is paid
};

export const speakBillSettlement = (amount) => {
  playLuxuryChime('success');
  const formatted = Math.round(amount || 0).toLocaleString('en-IN');
  speakVoice(`Bill settled. Total rupees ${formatted}`);
};
