import React, { useState } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './components/screens/HomeScreen';
import { Singer1RecordScreen } from './components/screens/Singer1RecordScreen';
import { PassPhoneCoverScreen } from './components/screens/PassPhoneCoverScreen';
import { PracticeBoothScreen } from './components/screens/PracticeBoothScreen';
import { Singer2MimicScreen } from './components/screens/Singer2MimicScreen';
import { GrandRevealScreen } from './components/screens/GrandRevealScreen';
import {
  getAudioContext,
  unlockAudioContext,
  generateDemoSongBuffer,
  reverseAudioBuffer,
} from './utils/audioUtils';

type GameStep =
  | 'home'
  | 'singer1'
  | 'pass-phone'
  | 'practice-booth'
  | 'singer2'
  | 'grand-reveal';

export const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<GameStep>('home');
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [gameMode, setGameMode] = useState<'Pass & Play' | 'Demo Mode'>('Pass & Play');

  // Stored session audio buffers
  const [player1OriginalBuffer, setPlayer1OriginalBuffer] = useState<AudioBuffer | null>(null);
  const [player1ReversedBuffer, setPlayer1ReversedBuffer] = useState<AudioBuffer | null>(null);
  const [player1SongPrompt, setPlayer1SongPrompt] = useState<string>('');

  const [player2MimicBuffer, setPlayer2MimicBuffer] = useState<AudioBuffer | null>(null);
  const [player2ReverseReversedBuffer, setPlayer2ReverseReversedBuffer] = useState<AudioBuffer | null>(null);

  // Restart whole game
  const handleRestart = () => {
    setCurrentStep('home');
    setPlayer1OriginalBuffer(null);
    setPlayer1ReversedBuffer(null);
    setPlayer1SongPrompt('');
    setPlayer2MimicBuffer(null);
    setPlayer2ReverseReversedBuffer(null);
  };

  // Start fresh Pass & Play
  const handleStartPassAndPlay = () => {
    setGameMode('Pass & Play');
    setCurrentStep('singer1');
  };

  // Start Demo Mode with pre-synthesized vocal melody
  const handleStartDemoMode = async () => {
    setGameMode('Demo Mode');
    await unlockAudioContext();
    const ctx = getAudioContext();

    // Generate vocal sample (Happy Birthday melody)
    const demoOriginal = generateDemoSongBuffer(ctx);
    const demoReversed = reverseAudioBuffer(ctx, demoOriginal);

    setPlayer1OriginalBuffer(demoOriginal);
    setPlayer1ReversedBuffer(demoReversed);
    setPlayer1SongPrompt('Happy Birthday To You (Demo Melody)');

    // Jump straight to the practice booth
    setCurrentStep('practice-booth');
  };

  // Singer 1 finishes recording
  const handleSinger1Complete = (data: {
    originalBuffer: AudioBuffer;
    reversedBuffer: AudioBuffer;
    promptTitle?: string;
  }) => {
    setPlayer1OriginalBuffer(data.originalBuffer);
    setPlayer1ReversedBuffer(data.reversedBuffer);
    if (data.promptTitle) {
      setPlayer1SongPrompt(data.promptTitle);
    }
    setCurrentStep('pass-phone');
  };

  // Player 2 unlocks screen
  const handlePlayer2Ready = () => {
    setCurrentStep('practice-booth');
  };

  // Player 2 finishes practice
  const handleReadyToMimic = () => {
    setCurrentStep('singer2');
  };

  // Singer 2 finishes recording
  const handleSinger2Complete = (data: {
    player2MimicBuffer: AudioBuffer;
    player2ReverseReversedBuffer: AudioBuffer;
  }) => {
    setPlayer2MimicBuffer(data.player2MimicBuffer);
    setPlayer2ReverseReversedBuffer(data.player2ReverseReversedBuffer);
    setCurrentStep('grand-reveal');
  };

  // Next round
  const handlePlayNextRound = () => {
    setRoundNumber((r) => r + 1);
    setPlayer1OriginalBuffer(null);
    setPlayer1ReversedBuffer(null);
    setPlayer1SongPrompt('');
    setPlayer2MimicBuffer(null);
    setPlayer2ReverseReversedBuffer(null);
    setCurrentStep('singer1');
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-0 lg:p-6 xl:p-8 relative">
      {/* Ambient background glows for larger screens */}
      <div className="hidden lg:block fixed top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="hidden lg:block fixed bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

      {/* Central Game Console (Mobile view on phone, sleek floating console on desktop) */}
      <div className="w-full max-w-md xl:max-w-lg min-h-[100dvh] lg:min-h-[780px] lg:max-h-[880px] bg-zinc-950/90 lg:bg-zinc-950/85 backdrop-blur-xl lg:rounded-[36px] border-0 lg:border lg:border-zinc-800/80 desktop-console-shell flex flex-col overflow-hidden shadow-2xl relative">
        {/* Universal Game Header */}
        <Header
          roundNumber={roundNumber}
          modeLabel={gameMode}
          onRestart={handleRestart}
          showRestart={currentStep !== 'home'}
        />

        {/* Main Game Screen Viewport */}
        <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden">
          {currentStep === 'home' && (
            <HomeScreen
              onStartPassAndPlay={handleStartPassAndPlay}
              onStartDemoMode={handleStartDemoMode}
            />
          )}

          {currentStep === 'singer1' && (
            <Singer1RecordScreen onComplete={handleSinger1Complete} />
          )}

          {currentStep === 'pass-phone' && (
            <PassPhoneCoverScreen
              onPlayer2Ready={handlePlayer2Ready}
              player1SongPrompt={player1SongPrompt}
            />
          )}

          {currentStep === 'practice-booth' && player1ReversedBuffer && (
            <PracticeBoothScreen
              player1ReversedBuffer={player1ReversedBuffer}
              onReadyToMimic={handleReadyToMimic}
            />
          )}

          {currentStep === 'singer2' && player1ReversedBuffer && (
            <Singer2MimicScreen
              player1ReversedBuffer={player1ReversedBuffer}
              onComplete={handleSinger2Complete}
              onBackToPractice={() => setCurrentStep('practice-booth')}
            />
          )}

          {currentStep === 'grand-reveal' &&
            player1OriginalBuffer &&
            player2ReverseReversedBuffer && (
              <GrandRevealScreen
                player1OriginalBuffer={player1OriginalBuffer}
                player1SongPrompt={player1SongPrompt}
                player2ReverseReversedBuffer={player2ReverseReversedBuffer}
                onPlayNextRound={handlePlayNextRound}
              />
            )}
        </main>
      </div>
    </div>
  );
};

export default App;
