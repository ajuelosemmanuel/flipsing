import React from 'react';
import { RotateCcw, Volume2, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/audioUtils';

interface HeaderProps {
  roundNumber?: number;
  modeLabel?: string;
  onRestart?: () => void;
  showRestart?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  roundNumber = 1,
  modeLabel = 'Pass & Play',
  onRestart,
  showRestart = true,
}) => {
  const handleRestart = () => {
    triggerHaptic(20);
    if (onRestart) onRestart();
  };

  return (
    <header className="w-full flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Brand logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-cyan-400 flex items-center justify-center shadow-md shadow-fuchsia-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-300 to-cyan-400">
            FlipSing
          </h1>
          <div className="text-[10px] font-medium text-zinc-400 -mt-0.5 tracking-wider uppercase">
            Reverse Challenge
          </div>
        </div>
      </div>

      {/* Mode / Round Pill & Restart button */}
      <div className="flex items-center gap-2">
        <div className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-200">Round {roundNumber}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 hidden sm:inline">{modeLabel}</span>
        </div>

        {showRestart && onRestart && (
          <button
            onClick={handleRestart}
            title="Start new game"
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/80 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
