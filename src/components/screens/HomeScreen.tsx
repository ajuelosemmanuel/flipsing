import React, { useState } from 'react';
import { Play, Sparkles, HelpCircle, ArrowRight, Mic, Shuffle, Volume2 } from 'lucide-react';
import { unlockAudioContext, playSynthesizedSfx, triggerHaptic } from '../../utils/audioUtils';

interface HomeScreenProps {
  onStartPassAndPlay: () => void;
  onStartDemoMode: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartPassAndPlay,
  onStartDemoMode,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  const handleStartPassAndPlay = async () => {
    triggerHaptic([30]);
    await unlockAudioContext();
    playSynthesizedSfx('tap');
    onStartPassAndPlay();
  };

  const handleStartDemo = async () => {
    triggerHaptic([20]);
    await unlockAudioContext();
    playSynthesizedSfx('fanfare');
    onStartDemoMode();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full">
      {/* Top Hero Section */}
      <div className="pt-4 text-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-500/10 via-pink-500/10 to-cyan-500/10 border border-fuchsia-500/30 text-xs font-semibold text-fuchsia-300 mb-4 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          The Reverse Singing Challenge
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-3">
          <span className="text-white">Flip</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-400">
            Sing
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-300 px-2 font-medium">
          Sing forward. Reverse it. Mimic the backwards gibberish, then flip it again to hear the magic!
        </p>
      </div>

      {/* 3-Step Visual Guide */}
      <div className="my-6 space-y-2.5">
        <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3.5 border border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 font-black text-lg">
            1
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-pink-400">Singer 1</div>
            <p className="text-xs text-zinc-200 font-medium">
              Record a 10s song or phrase. The app instantly reverses it!
            </p>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3.5 border border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 font-black text-lg">
            2
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">Singer 2 (Practice)</div>
            <p className="text-xs text-zinc-200 font-medium">
              Listen to the reversed sounds (slow-mo & loop) and mimic the alien syllables!
            </p>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3.5 border border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 font-black text-lg">
            3
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-violet-400">The Grand Reveal</div>
            <p className="text-xs text-zinc-200 font-medium">
              We reverse Singer 2’s mimicry. If accurate, the original song magically reappears!
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA Area (Thumb-Friendly) */}
      <div className="space-y-3 pb-4">
        {/* Main Pass & Play Button */}
        <button
          onClick={handleStartPassAndPlay}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white font-extrabold text-lg flex items-center justify-center gap-3 shadow-lg shadow-fuchsia-600/30 active:scale-[0.98] transition-transform"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Start Pass & Play</span>
          <ArrowRight className="w-5 h-5 ml-auto opacity-70" />
        </button>

        {/* Demo Mode Button (Instant test without mic) */}
        <button
          onClick={handleStartDemo}
          className="w-full py-3 px-5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-colors"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Quick Demo Mode (Instant Sample)</span>
        </button>

        {/* Tips / Rules button */}
        <div className="flex items-center justify-center pt-2">
          <button
            onClick={() => setShowHowToPlay(!showHowToPlay)}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHowToPlay ? 'Hide party tips' : 'View party tips & secrets'}</span>
          </button>
        </div>

        {/* Collapsible Party Tips */}
        {showHowToPlay && (
          <div className="glass-panel p-4 rounded-2xl text-xs text-zinc-300 space-y-2 border border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <span>💡 Party Master Tips:</span>
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-zinc-400">
              <li>Keep it short (5 to 8 seconds). Famous nursery rhymes or iconic pop choruses work best.</li>
              <li>Singer 2: Pay attention to the consonants! A reversed "T" sounds like a soft "D", and "S" has a sharp hiss.</li>
              <li>Use the 0.8x and 0.6x slow-motion toggles in the practice booth to break down tricky sounds.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
