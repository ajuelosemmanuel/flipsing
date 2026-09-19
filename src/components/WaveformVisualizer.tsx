import React, { useRef, useEffect, useCallback } from 'react';

interface WaveformVisualizerProps {
  buffer?: AudioBuffer | null;
  analyserNode?: AnalyserNode | null;
  isRecording?: boolean;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  colorScheme?: 'neon' | 'cyan' | 'magenta' | 'amber';
  height?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  buffer,
  analyserNode,
  isRecording = false,
  currentTime = 0,
  duration = 0,
  onSeek,
  colorScheme = 'neon',
  height = 96,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Colors based on scheme
  const getGradients = (ctx: CanvasRenderingContext2D, h: number) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (colorScheme === 'cyan') {
      grad.addColorStop(0, '#22d3ee');
      grad.addColorStop(1, '#0891b2');
    } else if (colorScheme === 'magenta') {
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, '#c026d3');
    } else if (colorScheme === 'amber') {
      grad.addColorStop(0, '#fbbf24');
      grad.addColorStop(1, '#d97706');
    } else {
      // Neon default (cyan to fuchsia)
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(0.5, '#d946ef');
      grad.addColorStop(1, '#8b5cf6');
    }
    return grad;
  };

  // Live recording visualizer loop
  useEffect(() => {
    if (!isRecording || !analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const drawLive = () => {
      animFrameIdRef.current = requestAnimationFrame(drawLive);
      analyserNode.getByteTimeDomainData(dataArray);

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#22d3ee';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      const sliceWidth = w / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;
    };

    drawLive();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isRecording, analyserNode]);

  // Static / Playback buffer waveform renderer
  const drawBufferWaveform = useCallback(() => {
    if (!canvasRef.current || isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);

    if (!buffer) {
      // Draw subtle placeholder center line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
      return;
    }

    const channelData = buffer.getChannelData(0);
    const totalSamples = channelData.length;
    const barsCount = Math.floor(w / 3.5); // Number of waveform vertical bars
    const samplesPerBar = Math.floor(totalSamples / barsCount);

    const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
    const playedBarIndex = Math.floor(progressRatio * barsCount);

    const activeGrad = getGradients(ctx, h);

    for (let i = 0; i < barsCount; i++) {
      const startIdx = i * samplesPerBar;
      let maxPeak = 0;

      for (let j = 0; j < samplesPerBar; j += 4) {
        const val = Math.abs(channelData[startIdx + j] || 0);
        if (val > maxPeak) maxPeak = val;
      }

      // Minimum visual bar height
      const barHeight = Math.max(4, maxPeak * (h * 0.85));
      const x = i * 3.5 + 1.5;
      const y = (h - barHeight) / 2;

      // Color based on whether played or unplayed
      if (i <= playedBarIndex && duration > 0) {
        ctx.fillStyle = activeGrad;
        ctx.shadowColor = 'rgba(217, 70, 239, 0.4)';
        ctx.shadowBlur = 4;
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.shadowBlur = 0;
      }

      // Rounded pill bar
      const radius = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, 2.2, barHeight, radius);
      ctx.fill();
    }

    // Playback playhead line
    if (duration > 0 && currentTime > 0) {
      const playheadX = progressRatio * w;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(playheadX - 1, 0, 2, h);

      // Playhead top dot
      ctx.beginPath();
      ctx.arc(playheadX, 6, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [buffer, isRecording, currentTime, duration, colorScheme]);

  // Redraw when buffer, time, or size changes
  useEffect(() => {
    drawBufferWaveform();
  }, [drawBufferWaveform]);

  // Responsive canvas resizing
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const container = containerRef.current;
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      drawBufferWaveform();
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [height, drawBufferWaveform]);

  // Click or drag to seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!onSeek || !duration || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleSeek}
      className={`relative w-full overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800/80 p-2 select-none shadow-inner ${
        onSeek ? 'cursor-pointer' : ''
      }`}
      style={{ height: `${height}px` }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {duration > 0 && !isRecording && (
        <div className="absolute bottom-1 right-3 text-[10px] font-mono font-medium text-zinc-400 bg-zinc-950/70 px-1.5 py-0.5 rounded">
          {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
        </div>
      )}
    </div>
  );
};
