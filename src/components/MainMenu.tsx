import React from 'react';
import { Play, ShoppingBag, Crown, Award, Volume2, VolumeX, Shield, Trophy, Clock, Skull, Coins, Sparkles, Keyboard, Smartphone } from 'lucide-react';
import { GAME_ASSETS } from '../assets/assets';
import { sound } from '../services/sound';
import { PlayerSaveData } from '../services/storage';

interface MainMenuProps {
  saveData: PlayerSaveData;
  onStartGame: () => void;
  onOpenShop: () => void;
  onOpenPass: () => void;
  onOpenMissions: () => void;
  isSfxOn: boolean;
  isMusicOn: boolean;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  isMobileOrTouch?: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onStartGame,
  onOpenShop,
  onOpenPass,
  onOpenMissions,
  isSfxOn,
  isMusicOn,
  onToggleSfx,
  onToggleMusic,
  isMobileOrTouch = false,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const unclaimedMissionsCount = saveData.dailyMissions?.filter((m) => m.completed && !m.claimed).length || 0;

  return (
    <div className="relative w-full h-[100dvh] min-h-[100dvh] bg-neutral-950 flex flex-col items-center justify-between p-3 sm:p-6 overflow-y-auto select-none pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pl-[max(0.75rem,env(safe-area-inset-left,0px))] pr-[max(0.75rem,env(safe-area-inset-right,0px))]">
      {/* Background Graphic with overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <img
          src={GAME_ASSETS.coverArt}
          alt="Zombie Core Arena Art"
          className="w-full h-full object-cover filter blur-sm scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-neutral-950/60" />
      </div>

      {/* Top Bar: Currencies, Stats & Audio */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between gap-2 sm:gap-3">
        {/* Currencies */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[11px] sm:text-xs font-bold text-amber-300 shadow backdrop-blur-md">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span>{saveData.scrap.toLocaleString()} <span className="hidden xs:inline">Ferraille</span></span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-[11px] sm:text-xs font-bold text-cyan-300 shadow backdrop-blur-md">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
            <span>Noyaux : {saveData.powerCores}</span>
          </div>
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => {
              sound.playUiClick();
              onToggleSfx();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            title="Effets Sonores"
          >
            {isSfxOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              onToggleMusic();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            title="Musique Ambiante"
          >
            {isMusicOn ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>
        </div>
      </div>

      {/* Center Hero: Title & Big Play Action */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-xl py-3 sm:py-6">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-2 sm:mb-3">
          <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>JEU 3D SURVIVAL WAVE .IO</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 font-display tracking-tight leading-tight drop-shadow-md">
          ZOMBIE CORE ARENA
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-neutral-300 mt-2 max-w-xs sm:max-w-md leading-relaxed">
          Affrontez des vagues infinies de zombies stylisés dans une arène urbaine 3D.
          Équipez des armes plasma, éliminez les boss et créez des combos surpuissants !
        </p>

        {/* Big Start Button */}
        <button
          id="main-menu-play-btn"
          onClick={() => {
            sound.playUiClick();
            onStartGame();
          }}
          className="mt-4 sm:mt-6 px-7 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-base sm:text-lg tracking-wider flex items-center gap-2.5 sm:gap-3 shadow-xl shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 font-display min-h-[48px]"
        >
          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
          <span>LANCER L'ARÈNE</span>
        </button>

        {/* Device & Controls Indicator Badge */}
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-[10px] sm:text-[11px] text-neutral-400">
          {isMobileOrTouch ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contrôle détecté : <strong className="text-neutral-200">Joystick virtuel</strong></span>
            </>
          ) : (
            <>
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contrôle détecté : <strong className="text-neutral-200">Clavier ZQSD / Flèches</strong></span>
            </>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3 w-full mt-5 sm:mt-8 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-neutral-900/80 border border-neutral-800/90 backdrop-blur-md">
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-[11px] text-neutral-400 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> Record
            </span>
            <span className="text-sm sm:text-base font-extrabold text-amber-400 font-mono">
              {saveData.highScore.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-neutral-800 px-1 sm:px-2">
            <span className="text-[10px] sm:text-[11px] text-neutral-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> <span className="hidden sm:inline">Meilleur</span> Temps
            </span>
            <span className="text-sm sm:text-base font-extrabold text-white font-mono">
              {formatTime(saveData.bestTimeSeconds)}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-[11px] text-neutral-400 flex items-center gap-1">
              <Skull className="w-3 h-3 text-emerald-400" /> Kills
            </span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
              {saveData.totalKills.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Menu Navigation Bar */}
      <div className="relative z-10 w-full max-w-2xl grid grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-6">
        <button
          id="main-nav-shop-btn"
          onClick={() => {
            sound.playUiClick();
            onOpenShop();
          }}
          className="p-2 sm:p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 flex flex-col items-center gap-0.5 sm:gap-1 transition-all hover:border-cyan-500/40 active:scale-95 min-h-[56px] sm:min-h-[64px]"
        >
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          <span className="text-[11px] sm:text-xs font-bold text-white font-display">Boutique</span>
          <span className="text-[9px] sm:text-[10px] text-neutral-400 hidden xs:inline">Skins & Effets</span>
        </button>

        <button
          id="main-nav-pass-btn"
          onClick={() => {
            sound.playUiClick();
            onOpenPass();
          }}
          className="p-2 sm:p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 flex flex-col items-center gap-0.5 sm:gap-1 transition-all hover:border-amber-500/40 active:scale-95 min-h-[56px] sm:min-h-[64px]"
        >
          <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <span className="text-[11px] sm:text-xs font-bold text-white font-display">Pass Saison</span>
          <span className="text-[9px] sm:text-[10px] text-neutral-400 hidden xs:inline">Saison 1</span>
        </button>

        <button
          id="main-nav-missions-btn"
          onClick={() => {
            sound.playUiClick();
            onOpenMissions();
          }}
          className="relative p-2 sm:p-3 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 flex flex-col items-center gap-0.5 sm:gap-1 transition-all hover:border-emerald-500/40 active:scale-95 min-h-[56px] sm:min-h-[64px]"
        >
          {unclaimedMissionsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-neutral-950 font-black text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-md shadow-emerald-500/50">
              {unclaimedMissionsCount}
            </span>
          )}
          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <span className="text-[11px] sm:text-xs font-bold text-white font-display">Missions</span>
          <span className="text-[9px] sm:text-[10px] text-neutral-400 hidden xs:inline">Défis & Gains</span>
        </button>
      </div>
    </div>
  );
};
