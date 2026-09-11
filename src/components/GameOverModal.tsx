import React from 'react';
import { Trophy, Clock, Skull, Award, Gift, Play, ShoppingBag, Sparkles, Video, CheckCircle2 } from 'lucide-react';
import { DailyMission } from '../types/economy';
import { sound } from '../services/sound';

interface GameOverModalProps {
  score: number;
  timeSec: number;
  kills: number;
  wave: number;
  level: number;
  bossKills: number;
  scrapEarned: number;
  isNewBestScore: boolean;
  isNewBestTime: boolean;
  missions: DailyMission[];
  onReplay: () => void;
  onOpenShop: () => void;
  onWatchAdDoubleScrap: () => void;
  hasDoubledScrap: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  timeSec,
  kills,
  wave,
  level,
  bossKills,
  scrapEarned,
  isNewBestScore,
  isNewBestTime,
  missions,
  onReplay,
  onOpenShop,
  onWatchAdDoubleScrap,
  hasDoubledScrap,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto select-none">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-5 my-auto">
        {/* Title Header */}
        <div className="text-center">
          <span className="text-xs font-bold tracking-widest text-rose-500 uppercase font-display">
            MISSION TERMINÉE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-0.5">
            RAPPORT DE SURVIE
          </h2>
        </div>

        {/* 1. SCORE ET NOUVEAU RECORD */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-semibold uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Score Total</span>
            </div>
            {isNewBestScore && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[11px] font-extrabold border border-amber-500/40 animate-pulse">
                ★ NOUVEAU RECORD PERSONNEL !
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-display">
              {score.toLocaleString()}
            </span>
            <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-medium text-neutral-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                {formatTime(timeSec)} {isNewBestTime && '👑'}
              </span>
              <span className="flex items-center gap-1">
                <Skull className="w-3.5 h-3.5 text-emerald-400" />
                {kills} éliminations
              </span>
              <span className="text-cyan-400 font-bold">Vague {wave}</span>
            </div>
          </div>
        </div>

        {/* 2. PROGRESSION DES MISSIONS */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 uppercase tracking-wide">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Progression des Missions</span>
          </div>
          <div className="flex flex-col gap-2">
            {missions.slice(0, 2).map((m) => {
              const progressPct = Math.min(100, Math.round((m.current / m.target) * 100));
              return (
                <div key={m.id} className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800/80 text-xs">
                  <div className="flex items-center justify-between font-medium mb-1">
                    <span className="text-neutral-200">{m.title}</span>
                    <span className="font-mono text-neutral-400">
                      {m.claimed ? '✓ Réclamé' : m.completed ? '✓ Prête !' : `${m.current}/${m.target} (${progressPct}%)`}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.claimed ? 'bg-emerald-600' : m.completed ? 'bg-emerald-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${m.claimed ? 100 : progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. RÉCOMPENSES GAGNÉES */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-emerald-400" />
            <span className="text-neutral-300 font-bold uppercase tracking-wider">Ferraille Récoltée :</span>
          </div>
          <div className="flex items-center gap-1.5 font-display text-base font-extrabold text-emerald-400">
            <span>+{scrapEarned * (hasDoubledScrap ? 2 : 1)}</span>
            <span className="text-[11px] text-neutral-400 font-normal">Ferraille</span>
          </div>
        </div>

        {/* 4. NOUVEAUX ÉLÉMENTS DÉBLOQUÉS */}
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-cyan-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Pass Saisonnier : +{Math.floor(score * 0.1) + kills * 2} XP de combat</span>
          </div>
          <span className="text-cyan-400 font-bold font-mono">Palier en progression</span>
        </div>

        {/* 5. PUBLICITÉ RÉCOMPENSÉE FACULTATIVE */}
        {!hasDoubledScrap ? (
          <button
            id="gameover-watch-ad-btn"
            onClick={() => {
              sound.playUiClick();
              onWatchAdDoubleScrap();
            }}
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-950/60 to-emerald-950/60 border border-amber-500/50 hover:border-amber-400 text-xs font-semibold text-amber-200 transition-all hover:bg-neutral-800/80 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Video className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-white">Doubler la Ferraille de la manche</div>
                <div className="text-[11px] text-neutral-400">Publicité récompensée facultative (+{scrapEarned} Ferraille)</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-500 text-neutral-950 font-extrabold text-xs">
              ×2 GRATUIT
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Récompense doublée appliquée avec succès !</span>
          </div>
        )}

        {/* 6. BOUTON REJOUER CLAIREMENT VISIBLE */}
        <button
          id="gameover-replay-btn"
          onClick={() => {
            sound.playUiClick();
            onReplay();
          }}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all active:scale-95 font-display"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>REJOUER UNE MANCHE</span>
        </button>

        {/* 7. OFFRE COMMERCIALE DISCRÈTE ET PERTINENTE */}
        <div
          onClick={() => {
            sound.playUiClick();
            onOpenShop();
          }}
          className="cursor-pointer flex items-center justify-between p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 text-xs transition-colors"
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span>Découvrez les nouvelles apparences cosmétiques dans la boutique</span>
          </div>
          <span className="text-cyan-400 font-semibold hover:underline">
            Voir la Boutique →
          </span>
        </div>
      </div>
    </div>
  );
};
