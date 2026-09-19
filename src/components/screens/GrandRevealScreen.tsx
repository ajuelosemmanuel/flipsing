import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  Sparkles,
  Share2,
  Download,
  RotateCcw,
  Star,
  Layers,
  Check,
  Music2,
  Trophy,
} from 'lucide-react';
import { WaveformVisualizer } from '../WaveformVisualizer';
import { FUNNY_RATINGS, PARTY_REACTIONS } from '../../utils/presets';
import {
  audioBufferToWav,
  getAudioContext,
  unlockAudioContext,
  triggerHaptic,
  playSynthesizedSfx,
} from '../../utils/audioUtils';

interface GrandRevealScreenProps {
  player1OriginalBuffer: AudioBuffer;
  player1SongPrompt?: string;
  player2ReverseReversedBuffer: AudioBuffer;
  onPlayNextRound: () => void;
}

export const GrandRevealScreen: React.FC<GrandRevealScreenProps> = ({
  player1OriginalBuffer,
  player1SongPrompt,
  player2ReverseReversedBuffer,
  onPlayNextRound,
}) => {
  // Playback state
  const [activeTrack, setActiveTrack] = useState<'p1' | 'p2'>('p2'); // Default to hearing Player 2's reverse-reverse
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [rating, setRating] = useState<number>(4);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('🤯');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Web Audio refs for synced A/B hot-swapping
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  const duration = Math.max(
    player1OriginalBuffer.duration,
    player2ReverseReversedBuffer.duration
  );

  // Trigger celebration confetti on mount
  useEffect(() => {
    playSynthesizedSfx('fanfare');
    triggerHaptic([60, 80, 100]);

    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#f43f5e', '#ec4899', '#a855f7'],
    });
    fire(0.2, {
      spread: 60,
      colors: ['#06b6d4', '#3b82f6', '#10b981'],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      colors: ['#eab308', '#f97316'],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });

    return () => {
      stopAudio();
    };
  }, []);

  // Internal audio play helper at specific offset
  const playTrackAtOffset = async (track: 'p1' | 'p2', offset: number) => {
    await unlockAudioContext();
    const ctx = getAudioContext();

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {}
      sourceNodeRef.current = null;
    }

    const targetBuffer =
      track === 'p1' ? player1OriginalBuffer : player2ReverseReversedBuffer;

    if (offset >= targetBuffer.duration) {
      offset = 0;
    }

    const source = ctx.createBufferSource();
    source.buffer = targetBuffer;
    source.connect(ctx.destination);

    pausedAtRef.current = offset;
    startTimeRef.current = ctx.currentTime;
    source.start(0, offset);
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
      pausedAtRef.current = 0;
      setCurrentTime(0);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };

    const trackTime = () => {
      if (!sourceNodeRef.current) return;
      const elapsed = ctx.currentTime - startTimeRef.current;
      const cur = Math.min(duration, pausedAtRef.current + elapsed);
      setCurrentTime(cur);

      if (cur < duration) {
        animFrameRef.current = requestAnimationFrame(trackTime);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(trackTime);
  };

  const stopAudio = () => {
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
  };

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    triggerHaptic(20);
    if (isPlaying) {
      const ctx = getAudioContext();
      pausedAtRef.current = Math.min(
        duration,
        pausedAtRef.current + (ctx.currentTime - startTimeRef.current)
      );
      stopAudio();
    } else {
      playTrackAtOffset(activeTrack, pausedAtRef.current);
    }
  };

  // Hot-swap A/B compare at the exact same timestamp!
  const switchTrack = (targetTrack: 'p1' | 'p2') => {
    triggerHaptic(25);
    setActiveTrack(targetTrack);

    if (isPlaying) {
      const ctx = getAudioContext();
      const currentOffset = Math.min(
        duration,
        pausedAtRef.current + (ctx.currentTime - startTimeRef.current)
      );
      playTrackAtOffset(targetTrack, currentOffset);
    }
  };

  // Seek
  const handleSeek = (time: number) => {
    pausedAtRef.current = time;
    setCurrentTime(time);
    if (isPlaying) {
      playTrackAtOffset(activeTrack, time);
    }
  };

  // Download WAV files
  const downloadAudio = (type: 'p1' | 'p2') => {
    triggerHaptic(20);
    const buf = type === 'p1' ? player1OriginalBuffer : player2ReverseReversedBuffer;
    const wavBlob = audioBufferToWav(buf);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flipsing-${type === 'p1' ? 'original' : 'reverse-reversed'}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Share verdict
  const handleShare = async () => {
    triggerHaptic(20);
    const text = `🎤 We just played FlipSing! ${selectedEmoji}\nPlayer 2 scored ${rating}/5 Stars: "${FUNNY_RATINGS[rating - 1]?.title}"!\nTry the Reverse Singing Challenge!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FlipSing Result',
          text,
        });
        return;
      } catch (e) {}
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {}
  };

  const currentVerdict = FUNNY_RATINGS[rating - 1] || FUNNY_RATINGS[3];

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full">
      {/* Climax Banner */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-cyan-500/20 border border-amber-400/40 text-xs font-black text-amber-300 uppercase tracking-widest mb-1.5 animate-bounce">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          The Grand Reveal
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white leading-tight">
          Did They Nail It?!
        </h2>
        {player1SongPrompt && (
          <p className="text-xs font-medium text-pink-300 mt-0.5">
            Original Song: <span className="text-white font-bold">"{player1SongPrompt}"</span>
          </p>
        )}
      </div>

      {/* Dual Player A/B Hot-Swap Deck */}
      <div className="my-auto py-2 space-y-3">
        {/* Hot-Swap Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => switchTrack('p1')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
              activeTrack === 'p1'
                ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-lg shadow-pink-600/30 scale-[1.02]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>P1 Original</span>
          </button>

          <button
            onClick={() => switchTrack('p2')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
              activeTrack === 'p2'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-zinc-950 shadow-lg shadow-cyan-500/30 scale-[1.02]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>P2 Reverse-Reverse</span>
          </button>
        </div>

        {/* Waveform for currently active track */}
        <div className="relative">
          <WaveformVisualizer
            buffer={
              activeTrack === 'p1'
                ? player1OriginalBuffer
                : player2ReverseReversedBuffer
            }
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            colorScheme={activeTrack === 'p1' ? 'magenta' : 'cyan'}
            height={90}
          />
          <div className="absolute top-2 left-3 pointer-events-none">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                activeTrack === 'p1'
                  ? 'bg-pink-500/30 text-pink-300 border border-pink-500/40'
                  : 'bg-cyan-500/30 text-cyan-200 border border-cyan-500/40'
              }`}
            >
              Showing: {activeTrack === 'p1' ? 'Player 1 (Original)' : 'Player 2 (Reverse-Reversed)'}
            </span>
          </div>
        </div>

        {/* Big Dual Play & A/B Hot-Swap Controller */}
        <div className="flex items-center justify-between gap-2.5">
          <button
            onClick={handleTogglePlay}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-cyan-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/30 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause Audio</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Play & Compare</span>
              </>
            )}
          </button>

          {/* Quick Instant Toggle */}
          <button
            onClick={() => switchTrack(activeTrack === 'p1' ? 'p2' : 'p1')}
            title="Instant A/B switch"
            className="py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Hot-Swap A/B</span>
          </button>
        </div>

        {/* Rating & Reaction Deck */}
        <div className="glass-panel p-3 rounded-2xl border border-zinc-800 space-y-2.5">
          {/* Star Rating */}
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Accuracy Rating:
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => {
                    triggerHaptic(15);
                    setRating(star);
                  }}
                  className="p-1 text-zinc-600 hover:text-amber-400 transition-colors"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Funny Verdict Card */}
          <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800/80 text-center">
            <div className="text-xs font-black text-white flex items-center justify-center gap-1.5">
              <span>{selectedEmoji}</span>
              <span>{currentVerdict.title}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">{currentVerdict.desc}</p>
          </div>

          {/* Party Emoji Reaction Chips */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            {PARTY_REACTIONS.map((item) => (
              <button
                key={item.emoji}
                onClick={() => {
                  triggerHaptic(15);
                  setSelectedEmoji(item.emoji);
                }}
                className={`flex-1 py-1.5 rounded-xl text-lg flex items-center justify-center transition-all ${
                  selectedEmoji === item.emoji
                    ? 'bg-white/10 scale-110 shadow-inner'
                    : 'hover:bg-zinc-800/60 opacity-60 hover:opacity-100'
                }`}
                title={item.label}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Export & Download Chips */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <button
            onClick={() => downloadAudio('p1')}
            className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3 h-3 text-pink-400" />
            <span>Save P1 WAV</span>
          </button>

          <button
            onClick={() => downloadAudio('p2')}
            className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Save P2 WAV</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            {copiedLink ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Share2 className="w-3 h-3 text-fuchsia-400" />
            )}
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Game Loop Action: Next Round / Switch Roles */}
      <div className="pb-4">
        <button
          onClick={() => {
            stopAudio();
            triggerHaptic([30]);
            playSynthesizedSfx('tap');
            onPlayNextRound();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-fuchsia-600/30 active:scale-[0.98] transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Next Round (Switch Roles!)</span>
        </button>
      </div>
    </div>
  );
};
