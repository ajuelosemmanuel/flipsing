import React, { useState } from 'react';
import { Shuffle, ArrowRight, RotateCcw, Play, Pause, Music, AlertCircle } from 'lucide-react';
import { SONG_PROMPTS, SongPrompt } from '../../utils/presets';
import { WaveformVisualizer } from '../WaveformVisualizer';
import { RecordButton } from '../RecordButton';
import { useBufferPlayer } from '../../hooks/useBufferPlayer';
import { useAudioReverseRecorder } from '../../hooks/useAudioReverseRecorder';
import { playSynthesizedSfx, triggerHaptic } from '../../utils/audioUtils';

interface Singer1RecordScreenProps {
  onComplete: (data: {
    originalBuffer: AudioBuffer;
    reversedBuffer: AudioBuffer;
    promptTitle?: string;
  }) => void;
}

export const Singer1RecordScreen: React.FC<Singer1RecordScreenProps> = ({ onComplete }) => {
  // Random starting prompt
  const [currentPrompt, setCurrentPrompt] = useState<SongPrompt>(() => {
    return SONG_PROMPTS[Math.floor(Math.random() * SONG_PROMPTS.length)];
  });

  const recorder = useAudioReverseRecorder({
    maxDurationSeconds: 10,
    countdownSeconds: 3,
  });

  const player = useBufferPlayer();
  const [playbackMode, setPlaybackMode] = useState<'original' | 'reversed'>('original');

  const shufflePrompt = () => {
    triggerHaptic(15);
    playSynthesizedSfx('tap');
    let next: SongPrompt;
    do {
      next = SONG_PROMPTS[Math.floor(Math.random() * SONG_PROMPTS.length)];
    } while (next.id === currentPrompt.id && SONG_PROMPTS.length > 1);
    setCurrentPrompt(next);
  };

  const handleReviewPlay = (mode: 'original' | 'reversed') => {
    triggerHaptic(15);
    setPlaybackMode(mode);
    const targetBuffer = mode === 'original' ? recorder.originalBuffer : recorder.reversedBuffer;
    player.togglePlay(targetBuffer);
  };

  const handleConfirmAndPass = () => {
    if (!recorder.originalBuffer || !recorder.reversedBuffer) return;
    player.stop();
    playSynthesizedSfx('rewind');
    triggerHaptic([40, 60]);
    onComplete({
      originalBuffer: recorder.originalBuffer,
      reversedBuffer: recorder.reversedBuffer,
      promptTitle: currentPrompt.title,
    });
  };

  const isReady = recorder.status === 'ready' && recorder.originalBuffer;

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full">
      {/* Top Header & Instructions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold uppercase tracking-widest text-pink-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            Turn 1: The Original
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
            Player 1
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
          Sing Your Phrase!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Sing 5–10 seconds of a melody or quote. Make it recognizable!
        </p>

        {/* Song Prompt Card with Shuffle */}
        <div className="mt-3 p-3.5 rounded-2xl glass-panel border border-pink-500/20 relative overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-400 uppercase tracking-wider mb-1">
                <Music className="w-3.5 h-3.5" />
                <span>Idea: {currentPrompt.category}</span>
              </div>
              <div className="text-base font-extrabold text-white leading-snug">
                "{currentPrompt.phrase}"
              </div>
              <div className="text-xs text-zinc-400 mt-1 font-medium">
                {currentPrompt.title} — <span className="text-zinc-500">{currentPrompt.artist}</span>
              </div>
            </div>

            <button
              onClick={shufflePrompt}
              disabled={recorder.status === 'recording'}
              title="Give me another song idea"
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95 shrink-0"
            >
              <Shuffle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle: Waveform / Error Display */}
      <div className="my-auto py-4 space-y-3">
        {recorder.errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <div className="font-bold">Microphone Note</div>
              <div>{recorder.errorMessage}</div>
            </div>
          </div>
        )}

        {/* Waveform Visualizer */}
        <WaveformVisualizer
          buffer={
            playbackMode === 'original'
              ? recorder.originalBuffer
              : recorder.reversedBuffer
          }
          analyserNode={recorder.analyserNode}
          isRecording={recorder.status === 'recording'}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          onSeek={player.seek}
          colorScheme="magenta"
          height={100}
        />

        {/* Post-recording quick review buttons */}
        {isReady && (
          <div className="flex items-center justify-center gap-2 pt-1 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => handleReviewPlay('original')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                playbackMode === 'original' && player.isPlaying
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              {playbackMode === 'original' && player.isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              Play Original
            </button>

            <button
              onClick={() => handleReviewPlay('reversed')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                playbackMode === 'reversed' && player.isPlaying
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'bg-zinc-900 border border-zinc-800 text-cyan-300 hover:text-cyan-200'
              }`}
            >
              {playbackMode === 'reversed' && player.isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              Hear Reversed 🌀
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls Area */}
      <div className="pb-4 space-y-4">
        {!isReady ? (
          <RecordButton
            status={recorder.status}
            countdown={recorder.countdown}
            elapsed={recorder.elapsed}
            maxDuration={recorder.maxDurationSeconds}
            onStart={recorder.startRecording}
            onStop={recorder.stopRecording}
          />
        ) : (
          <div className="space-y-2.5">
            {/* Proceed to Player 2 */}
            <button
              onClick={handleConfirmAndPass}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-500 hover:from-pink-500 hover:to-cyan-400 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 active:scale-[0.98] transition-all"
            >
              <span>Pass Phone to Player 2</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>

            {/* Re-record button */}
            <button
              onClick={() => {
                triggerHaptic(15);
                player.stop();
                recorder.reset();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-record song</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
