/**
 * Notification sound system using Web Audio API.
 * Generates simple tones without external audio files.
 */

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioContext) {
      audioContext = new AudioContext();
    }
    // Resume suspended context (required after user gesture)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch {
    return null;
  }
};

type SoundType = 'messageActive' | 'messageOther' | 'callRing';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  /** Optional second tone for two-tone sounds */
  frequency2?: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  messageActive: {
    frequency: 880,
    duration: 0.08,
    type: 'sine',
    volume: 0.15,
  },
  messageOther: {
    frequency: 660,
    duration: 0.12,
    type: 'sine',
    volume: 0.1,
    frequency2: 880,
  },
  callRing: {
    frequency: 523,
    duration: 0.25,
    type: 'sine',
    volume: 0.2,
    frequency2: 659,
  },
};

const playTone = (config: SoundConfig): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Primary tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = config.type;
  osc1.frequency.setValueAtTime(config.frequency, now);
  gain1.gain.setValueAtTime(config.volume, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + config.duration);

  // Optional second tone (slightly delayed)
  if (config.frequency2) {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = config.type;
    osc2.frequency.setValueAtTime(config.frequency2, now + config.duration * 0.6);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(config.volume, now + config.duration * 0.6);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + config.duration * 1.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + config.duration * 0.6);
    osc2.stop(now + config.duration * 1.6);
  }
};

export const notificationSounds = {
  /** Short blip for new message in the active channel */
  playMessageActive: () => playTone(SOUND_CONFIGS.messageActive),

  /** Two-tone for new message in another channel */
  playMessageOther: () => playTone(SOUND_CONFIGS.messageOther),

  /** Call ring sound - repeats 3 times */
  playCallRing: () => {
    playTone(SOUND_CONFIGS.callRing);
    setTimeout(() => playTone(SOUND_CONFIGS.callRing), 400);
    setTimeout(() => playTone(SOUND_CONFIGS.callRing), 800);
  },
};
