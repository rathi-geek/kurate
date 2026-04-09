let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * Play a short, subtle notification chime using Web Audio API.
 * Two-tone rising ding — similar to LinkedIn's message sound.
 * No external audio file needed.
 */
export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser autoplay policy)
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;

  // Gain envelope — quick fade in/out for a clean "ding"
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  // First tone — C6 (1047 Hz)
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(1047, now);
  osc1.connect(gain);
  osc1.start(now);
  osc1.stop(now + 0.15);

  // Second tone — E6 (1319 Hz), slightly delayed for a rising feel
  const gain2 = ctx.createGain();
  gain2.connect(ctx.destination);
  gain2.gain.setValueAtTime(0, now + 0.08);
  gain2.gain.linearRampToValueAtTime(0.12, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(1319, now + 0.08);
  osc2.connect(gain2);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.35);
}
