import React from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { RecorderStatus } from '../hooks/useAudioReverseRecorder';

interface RecordButtonProps {
  status: RecorderStatus;
  countdown: number;
  elapsed: number;
  maxDuration: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  status,
  countdown,
  elapsed,
  maxDuration,
  onStart,
  onStop,
  disabled = false,
}) => {
  const isRecording = status === 'recording';
  const isCountdown = status === 'countdown';
  const isProcessing = status === 'processing';

  // SVG Progress Ring calculations
  const size = 96; // 96px diameter
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = isRecording ? Math.min(1, elapsed / maxDuration) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  const handleClick = () => {
    if (disabled || isProcessing) return;
    if (isRecording) {
      onStop();
    } else if (status === 'idle' || status === 'ready' || status === 'error') {
      onStart();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Outer button container with SVG progress ring */}
      <div className="relative flex items-center justify-center">
        {/* Glow effect during recording */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping pointer-events-none scale-125 duration-1000" />
        )}

        {/* SVG Circular Progress Track & Fill */}
        <svg
          width={size}
          height={size}
          className="absolute -rotate-90 pointer-events-none transform"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-800"
            fill="transparent"
          />
          {/* Active progress circle */}
          {isRecording && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#record-grad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-[stroke-dashoffset] duration-75"
            />
          )}
          <defs>
            <linearGradient id="record-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
        </svg>

        {/* Tactile Core Button */}
        <button
          onClick={handleClick}
          disabled={disabled || isProcessing || isCountdown}
          aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-xl ${
            isRecording
              ? 'bg-gradient-to-tr from-rose-600 to-rose-500 shadow-rose-600/50 text-white'
              : isCountdown
              ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/40 text-white scale-105'
              : isProcessing
              ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
              : 'bg-gradient-to-tr from-fuchsia-600 via-pink-600 to-rose-500 hover:from-fuchsia-500 hover:to-rose-400 text-white shadow-fuchsia-600/40'
          }`}
        >
          {isCountdown ? (
            <span className="text-3xl font-black tracking-tighter animate-pulse">
              {countdown}
            </span>
          ) : isRecording ? (
            <Square className="w-8 h-8 fill-current transition-transform duration-150" />
          ) : isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Mic className="w-9 h-9" />
          )}
        </button>
      </div>

      {/* Button Subtitle / Label */}
      <div className="mt-3 text-center">
        {isCountdown ? (
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest animate-pulse">
            Get Ready...
          </p>
        ) : isRecording ? (
          <p className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            Recording ({Math.ceil(maxDuration - elapsed)}s left)
          </p>
        ) : isProcessing ? (
          <p className="text-xs font-medium text-zinc-400">Reversing audio buffer...</p>
        ) : (
          <p className="text-xs font-semibold text-zinc-300">
            Tap to Record (Max {maxDuration}s)
          </p>
        )}
      </div>
    </div>
  );
};
