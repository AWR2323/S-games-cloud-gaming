import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, FastForward } from 'lucide-react';
import { soundFX } from '../lib/sound';

interface SGamesBootScreenProps {
  onComplete: () => void;
}

export const SGamesBootScreen: React.FC<SGamesBootScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('SYSTEM INITIALIZING...');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Play sci-fi boot sound effect
    soundFX.playBootSequence();

    const logMessages = [
      { at: 15, text: '[SYS_OK] 2608moon Quantum Runtime Initialized', status: 'LOADING CLOUD STREAM...' },
      { at: 35, text: '[NET_OK] Tokyo Edge Streaming Cluster Connected (Latency: 9ms)', status: 'CONNECTING HIGH-SPEED NODES...' },
      { at: 55, text: '[ENG_OK] InPlay 60FPS Hardware Acceleration Synced', status: 'INITIALIZING INPLAY ENGINE...' },
      { at: 75, text: '[SEC_OK] Classroom Stealth Disguise Engine Armed (ESC Shortcut Ready)', status: 'ARMING STEALTH SUBSYSTEM...' },
      { at: 90, text: '[AI_OK] S AI Game Creator Studio Model Loaded', status: 'LOADING USER ASSETS...' },
      { at: 100, text: '[READY] S GAMES SYSTEM ONLINE - WELCOME PILOT', status: 'LAUNCHING S GAMES...' },
    ];

    const startTime = Date.now();
    const duration = 2200; // 2.2 seconds for full cinematic experience

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentPct);

      logMessages.forEach((msg) => {
        if (currentPct >= msg.at) {
          setCurrentStatus(msg.status);
          setLogs((prev) => (prev.includes(msg.text) ? prev : [...prev, msg.text]));
        }
      });

      if (currentPct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 350);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#060814] flex flex-col items-center justify-between p-6 overflow-hidden select-none font-sans text-white">
      {/* Background Animated Neon Gradients & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.22),rgba(255,255,255,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.18),transparent_50%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Header with Skip Button */}
      <div className="w-full max-w-5xl flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-full">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="tracking-widest uppercase">BOOT SEQUENCE // v2.6.8</span>
        </div>

        <button
          onClick={() => {
            soundFX.playKeyClick();
            onComplete();
          }}
          className="group flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-cyan-950/60 border border-zinc-700/60 hover:border-cyan-500/50 px-3.5 py-1.5 rounded-full transition-all cursor-pointer backdrop-blur-md"
        >
          <span>スキップ</span>
          <FastForward className="h-3.5 w-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Center Cinematic Emblem & Logo */}
      <div className="relative z-10 flex flex-col items-center my-auto text-center max-w-lg">
        {/* Glowing Insignia Ring */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Rotating ambient glow ring */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-30 blur-xl animate-pulse" />
          
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-br from-[#0e1630] via-[#111936] to-[#1c1236] border-2 border-cyan-400/50 p-1 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex items-center justify-center">
            {/* Inner S Letter with cyber styling */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-5xl font-black tracking-tighter bg-gradient-to-br from-white via-cyan-200 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(6,182,212,0.8)]">
                S
              </span>
              <span className="text-[9px] font-mono tracking-widest text-cyan-400 font-bold -mt-1">
                GAMES
              </span>
            </div>

            {/* Corner Tech Accents */}
            <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-cyan-300" />
            <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-300" />
            <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-300" />
            <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-cyan-300" />
          </div>
        </div>

        {/* Title and Branding */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-indigo-200 bg-clip-text text-transparent">
          S games
        </h1>
        <p className="mt-1 text-xs sm:text-sm font-mono tracking-wider text-cyan-300/80">
          2608moon NEXT-GEN CLOUD GAMING
        </p>

        {/* Progress Bar */}
        <div className="w-full mt-7 bg-zinc-900/90 border border-zinc-800 rounded-full h-2.5 overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full transition-all duration-75 relative shadow-[0_0_15px_rgba(6,182,212,0.6)]"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Percentage & Current Status */}
        <div className="w-full flex items-center justify-between text-xs font-mono mt-2 text-zinc-400">
          <span className="text-cyan-400 font-semibold">{currentStatus}</span>
          <span className="text-white font-bold">{progress}%</span>
        </div>
      </div>

      {/* Bottom Console Terminal Telemetry Logs */}
      <div className="w-full max-w-2xl bg-black/60 border border-zinc-800/80 rounded-xl p-3 backdrop-blur-md relative z-10 text-left">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 mb-1.5 border-b border-zinc-800/60 pb-1">
          <Terminal className="h-3 w-3 text-cyan-400" />
          <span>INITIALIZATION_TELEMETRY.LOG</span>
        </div>
        <div className="space-y-0.5 font-mono text-[11px] text-zinc-300 h-14 overflow-hidden flex flex-col justify-end">
          {logs.slice(-3).map((log, idx) => (
            <div key={idx} className="truncate text-cyan-300/90 animate-fadeIn">
              <span className="text-zinc-500 mr-1.5">&gt;</span>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
