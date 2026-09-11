import React from 'react';
import { Pause, Shield, Heart, Skull, Clock, Trophy, Car, Zap } from 'lucide-react';
import { ALL_SKILLS } from '../data/gameData';

interface HUDProps {
  currentHp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  currentXp: number;
  maxXp: number;
  level: number;
  wave: number;
  waveTimeLeft: number;
  score: number;
  kills: number;
  survivalTimeSec: number;
  bossInfo: { name: string; currentHp: number; maxHp: number } | null;
  activeSkills: { id: string; tier: number }[];
  vehicleState?: {
    isDriving: boolean;
    timeLeft: number;
    cooldownLeft: number;
    maxCooldown: number;
    unlocked: boolean;
  };
  onActivateVehicle?: () => void;
  showJoystick?: boolean;
  isMobileOrTouch?: boolean;
  onPauseClick: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  currentHp,
  maxHp,
  shield,
  maxShield,
  currentXp,
  maxXp,
  level,
  wave,
  waveTimeLeft,
  score,
  kills,
  survivalTimeSec,
  bossInfo,
  activeSkills,
  vehicleState,
  onActivateVehicle,
  showJoystick = false,
  isMobileOrTouch = false,
  onPauseClick,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const shieldPercent = maxShield > 0 ? Math.max(0, Math.min(100, (shield / maxShield) * 100)) : 0;
  const xpPercent = Math.max(0, Math.min(100, (currentXp / maxXp) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 md:p-5 select-none overflow-hidden pt-[max(0.6rem,env(safe-area-inset-top,0px))] pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] pl-[max(0.6rem,env(safe-area-inset-left,0px))] pr-[max(0.6rem,env(safe-area-inset-right,0px))]">
      {/* Top Header Row */}
      <div className="flex flex-col gap-2 w-full">
        {/* Main top bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 w-full">
          {/* Left: Vitals (Health & Shield & Level) */}
          <div className="flex flex-col gap-1 sm:gap-1.5 w-40 sm:w-56 md:w-64 pointer-events-auto">
            {/* Level & XP bar */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="px-1.5 sm:px-2 py-0.5 bg-cyan-600 text-white rounded font-black text-[10px] sm:text-xs tracking-wider border border-cyan-400/50 shadow flex-shrink-0 font-display">
                NIV. {level}
              </div>
              <div className="flex-1 h-2 sm:h-2.5 bg-neutral-900/90 rounded-full overflow-hidden border border-neutral-700/60 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-200"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-cyan-300 font-semibold flex-shrink-0">
                {Math.floor(currentXp)}/{maxXp}
              </span>
            </div>

            {/* HP Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1 min-w-[52px] sm:min-w-[60px] text-[10px] sm:text-xs font-semibold text-rose-400 flex-shrink-0">
                <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-rose-500 text-rose-500" />
                <span>{Math.ceil(currentHp)}/{maxHp}</span>
              </div>
              <div className="flex-1 h-2.5 sm:h-3 bg-neutral-900/90 rounded-full overflow-hidden border border-neutral-700/60 p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-emerald-500 rounded-full transition-all duration-150"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Shield Bar if active */}
            {maxShield > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1 min-w-[52px] sm:min-w-[60px] text-[10px] sm:text-xs font-semibold text-cyan-400 flex-shrink-0">
                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-cyan-400 text-cyan-400" />
                  <span>{Math.ceil(shield)}/{maxShield}</span>
                </div>
                <div className="flex-1 h-2 sm:h-2.5 bg-neutral-900/90 rounded-full overflow-hidden border border-neutral-700/60 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-full transition-all duration-150"
                    style={{ width: `${shieldPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Center: Wave Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-neutral-900/90 border border-neutral-700/80 shadow-lg backdrop-blur-md flex-shrink-0">
            <span className="text-[10px] sm:text-xs tracking-widest text-neutral-400 font-bold uppercase">
              VAGUE
            </span>
            <span className="text-sm sm:text-base font-extrabold text-amber-400 font-display">
              {wave}
            </span>
            <span className="text-neutral-600">|</span>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-neutral-300">
              {waveTimeLeft}s
            </span>
          </div>

          {/* Right: Stats (Desktop) & Pause button */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto flex-shrink-0">
            {/* Stats pill (hidden on ultra small, visible sm and up) */}
            <div className="hidden sm:flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-neutral-900/85 border border-neutral-800 backdrop-blur-sm text-xs font-semibold">
              <div className="flex items-center gap-1 text-neutral-300" title="Zombies éliminés">
                <Skull className="w-3.5 h-3.5 text-emerald-400" />
                <span>{kills}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-300" title="Score">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{score}</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-400" title="Temps de survie">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{formatTime(survivalTimeSec)}</span>
              </div>
            </div>

            {/* Pause button */}
            <button
              id="hud-pause-btn"
              onClick={onPauseClick}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition-colors shadow-md active:scale-95 min-h-[44px] min-w-[44px]"
              title="Pause"
            >
              <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Stats Sub-row (Only visible on small screens < sm) */}
        <div className="flex sm:hidden items-center justify-end gap-2 px-2 py-0.5 text-[10px] font-semibold text-neutral-300">
          <div className="flex items-center gap-1 bg-neutral-950/70 px-2 py-0.5 rounded border border-neutral-800/80">
            <Skull className="w-3 h-3 text-emerald-400" />
            <span>{kills}</span>
          </div>
          <div className="flex items-center gap-1 bg-neutral-950/70 px-2 py-0.5 rounded border border-neutral-800/80 text-amber-300">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>{score}</span>
          </div>
          <div className="flex items-center gap-1 bg-neutral-950/70 px-2 py-0.5 rounded border border-neutral-800/80 font-mono text-neutral-400">
            <Clock className="w-3 h-3" />
            <span>{formatTime(survivalTimeSec)}</span>
          </div>
        </div>

        {/* Boss Alert Banner */}
        {bossInfo && (
          <div className="self-center w-full max-w-sm sm:max-w-md bg-red-950/90 border border-red-500/80 rounded-lg p-2 shadow-xl shadow-red-950/50 backdrop-blur-md flex flex-col gap-1 pointer-events-auto animate-pulse">
            <div className="flex justify-between items-center text-[11px] sm:text-xs font-bold text-red-200">
              <span className="uppercase tracking-wider font-display truncate">
                ⚠️ BOSS : {bossInfo.name}
              </span>
              <span className="font-mono flex-shrink-0 ml-2">
                {Math.ceil(bossInfo.currentHp)}/{bossInfo.maxHp}
              </span>
            </div>
            <div className="h-2 sm:h-2.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-red-800">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-100"
                style={{ width: `${Math.max(0, (bossInfo.currentHp / bossInfo.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Active Combat Vehicle Banner (10s Drive Mode) */}
        {vehicleState?.isDriving && (
          <div className="self-center w-full max-w-sm sm:max-w-md bg-gradient-to-r from-cyan-950/95 via-blue-950/95 to-cyan-950/95 border-2 border-cyan-400 rounded-xl p-2.5 shadow-2xl shadow-cyan-500/40 backdrop-blur-md flex flex-col gap-1.5 pointer-events-auto animate-pulse">
            <div className="flex justify-between items-center text-xs sm:text-sm font-black text-cyan-300">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-300" />
                <span className="uppercase tracking-wider font-display">
                  🚗 BLINDÉ DE COMBAT ACTIF !
                </span>
              </div>
              <span className="font-mono text-cyan-200 text-sm sm:text-base font-bold">
                {Math.max(0, vehicleState.timeLeft).toFixed(1)}s
              </span>
            </div>
            <div className="h-2.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-cyan-500/50 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 rounded-full transition-all duration-75"
                style={{ width: `${Math.max(0, (vehicleState.timeLeft / 10.0) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-cyan-200/90 font-semibold px-1">
              <span>⚡ INVULNÉRABILITÉ TOTALE</span>
              <span>💥 ÉCRASEZ LES ZOMBIES</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Area: Controls, Vehicle Button & Active Skills badges */}
      <div className="flex items-end justify-between w-full pointer-events-none gap-3">
        {/* Desktop Controls hint (only when joystick is hidden) */}
        {!showJoystick ? (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-sm text-[10px] sm:text-[11px] text-neutral-300 pointer-events-auto">
            <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200 border border-neutral-700 font-bold">ZQSD</span>
            <span className="text-neutral-500">/</span>
            <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200 border border-neutral-700 font-bold">WASD</span>
            <span className="text-neutral-500">/</span>
            <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-200 border border-neutral-700 font-bold">Flèches</span>
            <span className="text-cyan-400 font-semibold hidden sm:inline ml-1">• [E] Piloter</span>
          </div>
        ) : (
          <div className="w-1" />
        )}

        {/* Combat Vehicle Action Button */}
        {vehicleState?.unlocked && (
          <div className="pointer-events-auto">
            {vehicleState.isDriving ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-950/90 border-2 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/20 backdrop-blur-sm animate-pulse">
                <Car className="w-5 h-5 text-cyan-300" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-400">PILOTAGE EN COURS</span>
                  <span className="font-mono text-sm font-black text-white">{vehicleState.timeLeft.toFixed(1)}s</span>
                </div>
              </div>
            ) : vehicleState.cooldownLeft > 0 ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900/90 border border-neutral-700/80 text-neutral-400 shadow-md backdrop-blur-sm">
                <Car className="w-5 h-5 text-neutral-500" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[10px] uppercase font-semibold text-neutral-500">RECHARGE BLINDÉ</span>
                  <span className="font-mono text-sm font-bold text-neutral-300">{Math.ceil(vehicleState.cooldownLeft)}s</span>
                </div>
              </div>
            ) : (
              <button
                id="hud-vehicle-drive-btn"
                onClick={onActivateVehicle}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-cyan-500/30 border-2 border-cyan-300 active:scale-95 transition-all animate-pulse"
                title="Piloter le blindé pendant 10 secondes (Touche E ou Espace)"
              >
                <Car className="w-5 h-5 text-cyan-100" />
                <div className="flex flex-col text-left leading-none">
                  <span className="font-display uppercase tracking-wider text-white text-xs sm:text-sm">PILOTER (10s)</span>
                  <span className="text-[9px] text-cyan-100/90 font-mono mt-0.5">[E] ou [ESPACE]</span>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Active skills list placed at the right so it doesn't block the bottom-left joystick */}
        <div className="ml-auto flex flex-wrap justify-end gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-lg bg-neutral-950/80 border border-neutral-800/80 backdrop-blur-sm max-w-[210px] sm:max-w-md pointer-events-auto">
          {activeSkills.map((sk) => {
            const skillDef = ALL_SKILLS.find((s) => s.id === sk.id);
            if (!skillDef) return null;
            return (
              <div
                key={sk.id}
                className="relative px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-neutral-900 border border-cyan-500/30 flex items-center gap-1 text-[10px] sm:text-[11px]"
                title={`${skillDef.name} (Rang ${sk.tier})`}
              >
                <span className="text-cyan-300 font-medium truncate max-w-[65px] sm:max-w-[100px]">
                  {skillDef.name}
                </span>
                <span className="px-1 bg-cyan-950 text-cyan-400 font-bold rounded text-[9px] sm:text-[10px] border border-cyan-800">
                  R{sk.tier}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
