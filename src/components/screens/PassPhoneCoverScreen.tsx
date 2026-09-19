import React from 'react';
import { EyeOff, Smartphone, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { triggerHaptic, playSynthesizedSfx } from '../../utils/audioUtils';

interface PassPhoneCoverScreenProps {
  onPlayer2Ready: () => void;
  player1SongPrompt?: string;
}

export const PassPhoneCoverScreen: React.FC<PassPhoneCoverScreenProps> = ({
  onPlayer2Ready,
}) => {
  const handleReady = () => {
    triggerHaptic([40]);
    playSynthesizedSfx('ding');
    onPlayer2Ready();
  };

  return (
    <div className="flex-1 flex flex-col justify-between items-center p-6 max-w-md mx-auto w-full text-center select-none">
      {/* Top Suspense Indicator */}
      <div className="pt-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest animate-pulse">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Strictly Secret!
        </div>
      </div>

      {/* Middle Phone Passing Graphic & Comic Warning */}
      <div className="my-auto space-y-5">
        <div className="relative mx-auto w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10 shadow-2xl animate-neon-pulse">
          <Smartphone className="w-12 h-12 text-zinc-100 animate-bounce" />
          <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-rose-600 text-white">
            <EyeOff className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-white">
            Hand Over The Phone!
          </h2>
          <p className="text-sm text-zinc-300 max-w-xs mx-auto leading-relaxed">
            <strong className="text-rose-400">Player 2 must not see</strong> the song title or hear the forward recording!
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl max-w-xs mx-auto text-xs text-zinc-300 border border-zinc-800 space-y-1">
          <p className="font-semibold text-white">Player 2's Mission:</p>
          <p className="text-zinc-400">
            You will only hear Player 1's voice <span className="text-cyan-400 font-bold">in reverse</span>. Master the backwards gibberish!
          </p>
        </div>
      </div>

      {/* Bottom Unlock Button for Player 2 */}
      <div className="w-full pb-4">
        <button
          onClick={handleReady}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-5 h-5 fill-current" />
          <span>I'm Player 2 — Let's Hear It!</span>
          <ArrowRight className="w-5 h-5 ml-auto" />
        </button>
      </div>
    </div>
  );
};
