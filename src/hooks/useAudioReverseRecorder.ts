import { useState, useRef, useCallback, useEffect } from 'react';
import {
  getAudioContext,
  unlockAudioContext,
  reverseAudioBuffer,
  audioBufferToWav,
  triggerHaptic,
  playSynthesizedSfx,
  requestWakeLock,
  releaseWakeLock,
} from '../utils/audioUtils';

export type RecorderStatus = 'idle' | 'countdown' | 'recording' | 'processing' | 'ready' | 'error';

export interface UseAudioReverseRecorderOptions {
  maxDurationSeconds?: number; // Default 10s
  countdownSeconds?: number; // Default 3s
  onRecordComplete?: (buffers: {
    originalBuffer: AudioBuffer;
    reversedBuffer: AudioBuffer;
  }) => void;
}

export function useAudioReverseRecorder(options: UseAudioReverseRecorderOptions = {}) {
  const { maxDurationSeconds = 10, countdownSeconds = 3, onRecordComplete } = options;

  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(countdownSeconds);
  const [elapsed, setElapsed] = useState<number>(0);

  // Audio outputs
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [reversedBuffer, setReversedBuffer] = useState<AudioBuffer | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [reversedUrl, setReversedUrl] = useState<string | null>(null);

  // Refs for audio graph & recorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up object URLs when unmounting or resetting
  const cleanupUrls = useCallback(() => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (reversedUrl) URL.revokeObjectURL(reversedUrl);
    setOriginalUrl(null);
    setReversedUrl(null);
  }, [originalUrl, reversedUrl]);

  // Stop tracks and release microphone
  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Full reset
  const reset = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    cleanupStream();
    cleanupUrls();
    releaseWakeLock();

    setStatus('idle');
    setErrorMessage(null);
    setElapsed(0);
    setCountdown(countdownSeconds);
    setOriginalBuffer(null);
    setReversedBuffer(null);
  }, [cleanupStream, cleanupUrls, countdownSeconds]);

  // Detect supported MIME type for mobile Safari & Android Chromium
  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; // fallback to browser default
  };

  // Internal actual recording trigger after countdown finishes
  const beginCapture = useCallback(async () => {
    try {
      await unlockAudioContext();
      await requestWakeLock();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      const ctx = getAudioContext();

      // Hook up AnalyserNode for live visualizer
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = getSupportedMimeType();
      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setStatus('processing');
        triggerHaptic([40]);
        playSynthesizedSfx('tap');

        try {
          const rawBlob = new Blob(audioChunksRef.current, {
            type: mimeType || 'audio/webm',
          });

          // Convert blob to ArrayBuffer
          const arrayBuffer = await rawBlob.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuffer);

          // Reverse PCM directly
          const reversed = reverseAudioBuffer(ctx, decoded);

          // Generate standard WAV blobs for maximum playback & download reliability
          const origWavBlob = audioBufferToWav(decoded);
          const revWavBlob = audioBufferToWav(reversed);

          const origUrl = URL.createObjectURL(origWavBlob);
          const revUrl = URL.createObjectURL(revWavBlob);

          setOriginalBuffer(decoded);
          setReversedBuffer(reversed);
          setOriginalUrl(origUrl);
          setReversedUrl(revUrl);
          setStatus('ready');

          if (onRecordComplete) {
            onRecordComplete({
              originalBuffer: decoded,
              reversedBuffer: reversed,
            });
          }
        } catch (err: any) {
          console.error('Audio decoding error:', err);
          setErrorMessage('Could not process audio recording. Please try again.');
          setStatus('error');
        } finally {
          cleanupStream();
          releaseWakeLock();
        }
      };

      recorder.start(100); // 100ms timeslices for smooth buffering
      setStatus('recording');
      triggerHaptic([50]);
      playSynthesizedSfx('countdown-final');

      startTimeRef.current = Date.now();
      setElapsed(0);

      // Elapsed timer & auto-stop at max duration
      timerIntervalRef.current = window.setInterval(() => {
        const timePassed = (Date.now() - startTimeRef.current) / 1000;
        setElapsed(timePassed);

        if (timePassed >= maxDurationSeconds) {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
      }, 50);
    } catch (err: any) {
      console.error('Microphone error:', err);
      cleanupStream();
      releaseWakeLock();
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : 'Could not access microphone: ' + (err.message || 'Unknown error')
      );
      setStatus('error');
    }
  }, [maxDurationSeconds, onRecordComplete, cleanupStream]);

  // Start with 3-2-1 countdown
  const startRecording = useCallback(async () => {
    reset();
    try {
      await unlockAudioContext();
      setStatus('countdown');
      let currentCount = countdownSeconds;
      setCountdown(currentCount);
      playSynthesizedSfx('countdown');
      triggerHaptic(20);

      countdownIntervalRef.current = window.setInterval(() => {
        currentCount -= 1;
        if (currentCount > 0) {
          setCountdown(currentCount);
          playSynthesizedSfx('countdown');
          triggerHaptic(20);
        } else {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setCountdown(0);
          beginCapture();
        }
      }, 1000);
    } catch (e: any) {
      setErrorMessage('Could not initialize audio: ' + e.message);
      setStatus('error');
    }
  }, [countdownSeconds, reset, beginCapture]);

  // Manual stop button
  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Load custom buffer (for demo mode / sample clips)
  const loadCustomBuffer = useCallback((buffer: AudioBuffer) => {
    reset();
    const ctx = getAudioContext();
    const reversed = reverseAudioBuffer(ctx, buffer);

    const origWavBlob = audioBufferToWav(buffer);
    const revWavBlob = audioBufferToWav(reversed);

    setOriginalBuffer(buffer);
    setReversedBuffer(reversed);
    setOriginalUrl(URL.createObjectURL(origWavBlob));
    setReversedUrl(URL.createObjectURL(revWavBlob));
    setStatus('ready');
  }, [reset]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      cleanupStream();
      releaseWakeLock();
    };
  }, [cleanupStream]);

  return {
    status,
    errorMessage,
    countdown,
    elapsed,
    maxDurationSeconds,
    originalBuffer,
    reversedBuffer,
    originalUrl,
    reversedUrl,
    analyserNode: analyserRef.current,
    startRecording,
    stopRecording,
    reset,
    loadCustomBuffer,
  };
}
