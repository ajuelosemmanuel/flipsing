import React, { useState } from 'react';
import { ArrowRight, RotateCcw, Play, Pause, Sparkles, Volume2, AlertCircle } from 'lucide-react';
import { WaveformVisualizer } from '../WaveformVisualizer';
import { RecordButton } from '../RecordButton';
import { useBufferPlayer } from '../../hooks/useBufferPlayer';
import { useAudioReverseRecorder } from '../../hooks/useAudioReverseRecorder';
import { playSynthesizedSfx, triggerHaptic } from '../../utils/audioUtils';

interface Singer2MimicScreenProps {
  player1ReversedBuffer: AudioBuffer;
  onComplete: (data: {
    player2MimicBuffer: AudioBuffer;
    player2ReverseReversedBuffer: AudioBuffer;
  }) => void;
  onBackToPractice: () => void;
}

export const Singer2MimicScreen: React.FC<Singer2MimicScreenProps> = ({
  player1ReversedBuffer,
  onComplete,
  onBackToPractice,
}) => {
  const recorder = useAudioReverseRecorder({
    maxDurationSeconds: 10,
    countdownSeconds: 3,
  });

  const player = useBufferPlayer();
  const targetAudioPlayer = useBufferPlayer();
  const [playbackMode, setPlaybackMode] = useState<'mimic' | 'reverse-reverse'>('reverse-reverse');

  // Quick audio refresher of Player 1's reversed audio
  const handleHearTarget = () => {
    triggerHaptic(15);
    player.stop();
    targetAudioPlayer.togglePlay(player1ReversedBuffer);
  };

  const handleReviewPlay = (mode: 'mimic' | 'reverse-reverse') => {
    triggerHaptic(15);
    targetAudioPlayer.stop();
    setPlaybackMode(mode);
    const targetBuffer = mode === 'mimic' ? recorder.originalBuffer : recorder.reversedBuffer;
    player.togglePlay(targetBuffer);
  };

  const handleProceedToReveal = () => {
    if (!recorder.originalBuffer || !recorder.reversedBuffer) return;
    player.stop();
    targetAudioPlayer.stop();
    playSynthesizedSfx('fanfare');
    triggerHaptic([40, 40]);
    onComplete({
      player2MimicBuffer: recorder.originalBuffer,
      player2ReverseReversedBuffer: recorder.reversedBuffer,
    });
  };

  const isReady = recorder.status === 'ready' && recorder.originalBuffer;

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Turn 3: Mimic The Sound
          </div>
          <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
            Player 2
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
          Imitate The Gibberish!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Make the exact sounds you just heard. Don't try to guess the real song yet!
        </p>

        {/* Quick Audio Refresher Chip */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleHearTarget}
            disabled={recorder.status === 'recording'}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              targetAudioPlayer.isPlaying
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {targetAudioPlayer.isPlaying ? 'Playing target sound...' : 'Hear target sound again'}
            </span>
          </button>

          <button
            onClick={onBackToPractice}
            disabled={recorder.status === 'recording'}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 underline underline-offset-2 ml-auto"
          >
            Back to booth
          </button>
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
            playbackMode === 'mimic'
              ? recorder.originalBuffer
              : recorder.reversedBuffer
          }
          analyserNode={recorder.analyserNode}
          isRecording={recorder.status === 'recording'}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          onSeek={player.seek}
          colorScheme="cyan"
          height={100}
        />

        {/* Post-recording review preview */}
        {isReady && (
          <div className="flex items-center justify-center gap-2 pt-1 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => handleReviewPlay('mimic')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                playbackMode === 'mimic' && player.isPlaying
                  ? 'bg-zinc-700 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
              }`}
            >
              {playbackMode === 'mimic' && player.isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              Your Mimicry
            </button>

            <button
              onClick={() => handleReviewPlay('reverse-reverse')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                playbackMode === 'reverse-reverse' && player.isPlaying
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 hover:text-emerald-200'
              }`}
            >
              {playbackMode === 'reverse-reverse' && player.isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              Sneak Peek Re-reversed ✨
            </button>
          </div>
        )}
      </div>

      {/* Bottom Recording Button & Next Step */}
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
            <button
              onClick={handleProceedToReveal}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-5 h-5 fill-current" />
              <span>Go to The Grand Reveal!</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>

            <button
              onClick={() => {
                triggerHaptic(15);
                player.stop();
                recorder.reset();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-record mimicry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
