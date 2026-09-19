/**
 * FlipSing Audio Utilities
 * Client-side Web Audio API manipulation: zero-latency PCM reversal,
 * iOS Safari unlocking, WAV encoding, and sound synthesis.
 */

// Singleton AudioContext reference
let sharedAudioContext: AudioContext | null = null;
let wakeLockSentinel: any = null;

/**
 * Returns a singleton AudioContext instance and ensures it's created cleanly
 */
export function getAudioContext(): AudioContext {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioContext = new AudioCtxClass({
      latencyHint: 'interactive',
    });
  }
  return sharedAudioContext;
}

/**
 * Unlocks AudioContext on user gesture (mandatory on iOS Safari & mobile browsers)
 */
export async function unlockAudioContext(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  // Play a silent 1ms buffer to prime the hardware output on iOS
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (e) {
    // Ignore silent prime errors
  }
  return ctx;
}

/**
 * High-performance Float32Array PCM audio buffer reversal
 */
export function reverseAudioBuffer(audioCtx: AudioContext, sourceBuffer: AudioBuffer): AudioBuffer {
  const numChannels = sourceBuffer.numberOfChannels;
  const length = sourceBuffer.length;
  const sampleRate = sourceBuffer.sampleRate;

  const reversedBuffer = audioCtx.createBuffer(numChannels, length, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = sourceBuffer.getChannelData(channel);
    const reversedData = reversedBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      reversedData[i] = channelData[length - 1 - i];
    }
  }

  return reversedBuffer;
}

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // 1 = PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length;
  const dataByteLength = length * blockAlign;
  const headerByteLength = 44;
  const totalLength = headerByteLength + dataByteLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true);

  // Interleave and write 16-bit PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i];
      // Clamp between -1 and 1
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer (-32768 to 32767)
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Mobile Haptic feedback trigger
 */
export function triggerHaptic(pattern: number | number[] = 30) {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Haptics not allowed or unsupported
    }
  }
}

/**
 * Screen Wake Lock API to prevent mobile screen sleep during recording/gameplay
 */
export async function requestWakeLock() {
  if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    } catch (err) {
      // Wake lock request failed (e.g. low battery)
    }
  }
}

export function releaseWakeLock() {
  if (wakeLockSentinel) {
    try {
      wakeLockSentinel.release();
    } catch (e) {}
    wakeLockSentinel = null;
  }
}

/**
 * Client-Side Sound Synthesis for game SFX without network assets
 */
export function playSynthesizedSfx(
  type:
    | 'countdown'
    | 'countdown-final'
    | 'rewind'
    | 'fanfare'
    | 'tap'
    | 'ding'
    | 'airhorn'
    | 'applause'
    | 'buzzer'
    | 'rimshot'
) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    if (type === 'tap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'countdown') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'countdown-final') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'rewind') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.45);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'fanfare') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.28, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.4);
      });
    } else if (type === 'ding') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'airhorn') {
      // Classic DJ Air Horn sound: 3 blast hits of dual sawtooth tones
      [0, 0.12, 0.24].forEach((delay) => {
        const blastTime = now + delay;
        [466.16, 622.25].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, blastTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.05, blastTime + 0.08);

          gain.gain.setValueAtTime(0.25, blastTime);
          gain.gain.exponentialRampToValueAtTime(0.01, blastTime + 0.1);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(blastTime);
          osc.stop(blastTime + 0.1);
        });
      });
    } else if (type === 'applause') {
      // Synthesized crowd cheer & clap burst using filtered white noise
      const bufferSize = ctx.sampleRate * 1.2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.Q.setValueAtTime(2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + 1.2);
    } else if (type === 'buzzer') {
      // Low comedic fail buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.setValueAtTime(110, now + 0.15);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'rimshot') {
      // Snare hit + cymbal tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {
    // Audio context not ready
  }
}

/**
 * Synthesizes a sample singing phrase ("Ha-ppy-Birth-day-To-You")
 * for the instant offline demo mode!
 */
export function generateDemoSongBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 4.2; // seconds
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Notes: G4, G4, A4, G4, C5, B4 (Happy Birthday melody)
  const notes = [
    { freq: 392.00, start: 0.1, len: 0.45, syllable: 'Hap' },
    { freq: 392.00, start: 0.6, len: 0.45, syllable: 'py' },
    { freq: 440.00, start: 1.1, len: 0.8, syllable: 'Birth' },
    { freq: 392.00, start: 2.0, len: 0.8, syllable: 'day' },
    { freq: 523.25, start: 2.9, len: 0.6, syllable: 'to' },
    { freq: 493.88, start: 3.6, len: 0.5, syllable: 'you' },
  ];

  for (const note of notes) {
    const startSample = Math.floor(note.start * sampleRate);
    const noteSamples = Math.floor(note.len * sampleRate);

    for (let i = 0; i < noteSamples; i++) {
      const idx = startSample + i;
      if (idx >= totalSamples) break;

      const t = i / sampleRate;
      // Formant synthesis for voice-like timbre
      const fundamental = Math.sin(2 * Math.PI * note.freq * t);
      const harmonic2 = 0.5 * Math.sin(4 * Math.PI * note.freq * t);
      const harmonic3 = 0.25 * Math.sin(6 * Math.PI * note.freq * t);
      const vibrato = 1 + 0.03 * Math.sin(2 * Math.PI * 5 * t);

      // Envelope: gentle attack, sustain, decay
      const attack = Math.min(1, i / (0.05 * sampleRate));
      const decay = Math.max(0, 1 - i / noteSamples);
      const env = attack * Math.pow(decay, 0.5);

      data[idx] = (fundamental + harmonic2 + harmonic3) * 0.35 * env * vibrato;
    }
  }

  return buffer;
}
