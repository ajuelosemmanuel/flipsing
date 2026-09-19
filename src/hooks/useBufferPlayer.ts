import { useState, useRef, useCallback, useEffect } from 'react';
import { getAudioContext, unlockAudioContext } from '../utils/audioUtils';

export interface UseBufferPlayerOptions {
  onEnded?: () => void;
}

export function useBufferPlayer(options: UseBufferPlayerOptions = {}) {
  const { onEnded } = options;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const activeBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Stop playback cleanly
  const stop = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
    pausedAtRef.current = 0;
    setCurrentTime(0);
  }, []);

  // Pause playback
  const pause = useCallback(() => {
    if (!isPlaying) return;
    const ctx = getAudioContext();
    const elapsedSinceStart = (ctx.currentTime - startTimeRef.current) * playbackRate;
    const bufDuration = activeBufferRef.current?.duration || 0;
    pausedAtRef.current = isLooping && bufDuration > 0
      ? (pausedAtRef.current + elapsedSinceStart) % bufDuration
      : Math.min(bufDuration, pausedAtRef.current + elapsedSinceStart);

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(pausedAtRef.current);
  }, [isPlaying, playbackRate, isLooping]);

  // Start / resume playback from an offset
  const play = useCallback(
    async (buffer?: AudioBuffer | null, offsetSeconds?: number) => {
      const targetBuffer = buffer || activeBufferRef.current;
      if (!targetBuffer) return;

      await unlockAudioContext();
      const ctx = getAudioContext();

      // If already playing, stop current source
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.onended = null;
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch (e) {}
        sourceNodeRef.current = null;
      }

      activeBufferRef.current = targetBuffer;
      setDuration(targetBuffer.duration);

      const source = ctx.createBufferSource();
      source.buffer = targetBuffer;
      source.playbackRate.value = playbackRate;
      source.loop = isLooping;

      const offset = typeof offsetSeconds === 'number' ? offsetSeconds : pausedAtRef.current;
      const validOffset = offset >= targetBuffer.duration ? 0 : offset;
      pausedAtRef.current = validOffset;

      source.connect(ctx.destination);
      startTimeRef.current = ctx.currentTime;
      source.start(0, validOffset);
      sourceNodeRef.current = source;
      setIsPlaying(true);

      source.onended = () => {
        if (!source.loop) {
          setIsPlaying(false);
          pausedAtRef.current = 0;
          setCurrentTime(0);
          if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
          }
          if (onEnded) onEnded();
        }
      };

      // Animation frame tracker for smooth playhead cursor
      const trackProgress = () => {
        if (!sourceNodeRef.current || !activeBufferRef.current) return;
        const elapsed = (ctx.currentTime - startTimeRef.current) * playbackRate;
        const total = activeBufferRef.current.duration;
        let cur = pausedAtRef.current + elapsed;

        if (isLooping && total > 0) {
          cur = cur % total;
        } else if (cur > total) {
          cur = total;
        }

        setCurrentTime(cur);
        animFrameRef.current = requestAnimationFrame(trackProgress);
      };

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(trackProgress);
    },
    [playbackRate, isLooping, onEnded]
  );

  // Toggle play/pause
  const togglePlay = useCallback(
    (buffer?: AudioBuffer | null) => {
      if (isPlaying) {
        pause();
      } else {
        play(buffer);
      }
    },
    [isPlaying, pause, play]
  );

  // Seek to specific position
  const seek = useCallback(
    (time: number) => {
      pausedAtRef.current = Math.max(0, Math.min(duration, time));
      setCurrentTime(pausedAtRef.current);
      if (isPlaying) {
        play(activeBufferRef.current, pausedAtRef.current);
      }
    },
    [duration, isPlaying, play]
  );

  // Update playback rate on the fly
  const changePlaybackRate = useCallback(
    (rate: number) => {
      setPlaybackRate(rate);
      if (sourceNodeRef.current) {
        sourceNodeRef.current.playbackRate.value = rate;
      }
    },
    []
  );

  // Toggle loop
  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      const next = !prev;
      if (sourceNodeRef.current) {
        sourceNodeRef.current.loop = next;
      }
      return next;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    isLooping,
    play,
    pause,
    stop,
    seek,
    togglePlay,
    changePlaybackRate,
    toggleLoop,
    setDuration,
  };
}
