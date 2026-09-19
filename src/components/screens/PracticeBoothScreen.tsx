import React, { useEffect } from 'react';
import { Play, Pause, Repeat, Zap, ArrowRight, Mic2, Sparkles, FastForward } from 'lucide-react';
import { WaveformVisualizer } from '../WaveformVisualizer';
import { useBufferPlayer } from '../../hooks/useBufferPlayer';
import { triggerHaptic, playSynthesizedSfx } from '../../utils/audioUtils';

interface PracticeBoothScreenProps {
  player1ReversedBuffer: AudioBuffer;
  onReadyToMimic: () => void;
}

export const PracticeBoothScreen: React.FC<PracticeBoothScreenProps> = ({
  player1ReversedBuffer,
  onReadyToMimic,
}) => {
  const player = useBufferPlayer();

  // Set buffer duration on mount
  useEffect(() => {
    if (player1ReversedBuffer) {
      player.setDuration(player1ReversedBuffer.duration);
    }
  }, [player1ReversedBuffer]);

  const handleTogglePlay = () => {
    triggerHaptic(20);
    player.togglePlay(player1ReversedBuffer);
  };

  const handleSpeedChange = (speed: number) => {
    triggerHaptic(15);
    playSynthesizedSfx('tap');
    player.changePlaybackRate(speed);
  };

  const handleToggleLoop = () => {
    triggerHaptic(20);
    playSynthesizedSfx('tap');
    player.toggleLoop();
  };

  const handleProceed = () => {
    player.stop();
    triggerHaptic([30, 30]);
    playSynthesizedSfx('tap');
    onReadyToMimic();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full">
      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Turn 2: Practice Booth
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
            Player 2
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
          Learn The Gibberish!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Listen to Player 1's backwards audio. Slow it down and loop it until you can mimic the exact sounds.
        </p>
      </div>

      {/* Waveform & Scrub Area */}
      <div className="my-auto space-y-4 py-4">
        {/* Waveform Display */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400">
            <span className="font-semibold text-cyan-400">Player 1 Backwards Clip</span>
            <span>Tap waveform to scrub</span>
          </div>

          <WaveformVisualizer
            buffer={player1ReversedBuffer}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            onSeek={player.seek}
            colorScheme="cyan"
            height={110}
          />
        </div>

        {/* Practice Deck Controls (Speed & Loop) */}
        <div className="glass-panel p-3.5 rounded-2xl border border-zinc-800 space-y-3">
          {/* Main Play / Pause & Loop Bar */}
          <div className="flex items-center justify-between gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-transform"
            >
              {player.isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Sound</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Backwards</span>
                </>
              )}
            </button>

            {/* Loop Toggle Button */}
            <button
              onClick={handleToggleLoop}
              className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border ${
                player.isLooping
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Repeat className={`w-3.5 h-3.5 ${player.isLooping ? 'animate-spin' : ''}`} />
              <span>{player.isLooping ? 'Looping ON' : 'Loop'}</span>
            </button>
          </div>

          {/* Speed Selector (1.0x, 0.8x, 0.6x) */}
          <div className="pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <FastForward className="w-3 h-3 text-cyan-400" />
                Playback Speed:
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {player.playbackRate}x
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Normal (1.0x)', speed: 1.0 },
                { label: 'Practice (0.8x)', speed: 0.8 },
                { label: 'Slow (0.6x)', speed: 0.6 },
              ].map((item) => {
                const isActive = player.playbackRate === item.speed;
                return (
                  <button
                    key={item.speed}
                    onClick={() => handleSpeedChange(item.speed)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-zinc-950 border-cyan-400 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Practice Tip Card */}
        <div className="p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-400 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-zinc-200">Pro tip:</strong> Vocalize the vowels phonetically! Speak the backwards sound out loud before recording.
          </p>
        </div>
      </div>

      {/* Bottom Action: Proceed to Record */}
      <div className="pb-4">
        <button
          onClick={handleProceed}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all"
        >
          <Mic2 className="w-5 h-5 fill-current" />
          <span>I'm Ready to Mimic!</span>
          <ArrowRight className="w-5 h-5 ml-auto" />
        </button>
      </div>
    </div>
  );
};
