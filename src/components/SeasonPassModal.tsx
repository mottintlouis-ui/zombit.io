import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Lock,
  Crown,
  Coins,
  Award,
  Flame,
  Zap,
  User,
  Music,
  Gift,
  CheckCircle2,
} from 'lucide-react';
import { SEASON_PASS_TIERS } from '../data/gameData';
import { SeasonPassReward } from '../types/economy';
import { sound } from '../services/sound';

interface SeasonPassModalProps {
  currentXp: number;
  hasPremium: boolean;
  onClose: () => void;
  onUnlockPremium: () => void;
  onClaimReward: (tier: number, isPremium: boolean, reward: SeasonPassReward) => void;
  onClaimAll?: () => void;
  claimedRewards: string[]; // List of 'free_1', 'premium_1', etc.
}

export const SeasonPassModal: React.FC<SeasonPassModalProps> = ({
  currentXp,
  hasPremium,
  onClose,
  onUnlockPremium,
  onClaimReward,
  onClaimAll,
  claimedRewards,
}) => {
  const [claimToast, setClaimToast] = useState<string | null>(null);

  // Compute available unclaimed rewards count
  let unclaimedCount = 0;
  for (const tier of SEASON_PASS_TIERS) {
    if (currentXp >= tier.requiredXp) {
      if (!claimedRewards.includes(`free_${tier.tier}`)) {
        unclaimedCount++;
      }
      if (hasPremium && !claimedRewards.includes(`premium_${tier.tier}`)) {
        unclaimedCount++;
      }
    }
  }

  // Max tier XP for progress bar
  const maxPassXp = SEASON_PASS_TIERS[SEASON_PASS_TIERS.length - 1]?.requiredXp || 1200;
  const progressPercent = Math.min(100, Math.round((currentXp / maxPassXp) * 100));

  const handleClaim = (tier: number, isPremium: boolean, reward: SeasonPassReward) => {
    sound.playLevelUp();
    onClaimReward(tier, isPremium, reward);
    setClaimToast(`Récompense débloquée : ${reward.name} !`);
    setTimeout(() => {
      setClaimToast(null);
    }, 2800);
  };

  const handleClaimAll = () => {
    if (onClaimAll && unclaimedCount > 0) {
      sound.playLevelUp();
      onClaimAll();
      setClaimToast(`Toutes les récompenses prêtes (${unclaimedCount}) ont été récupérées !`);
      setTimeout(() => {
        setClaimToast(null);
      }, 3000);
    }
  };

  const renderRewardIcon = (iconName: string, isPremium: boolean) => {
    const iconClass = `w-4 h-4 ${isPremium ? 'text-amber-400' : 'text-emerald-400'}`;
    switch (iconName) {
      case 'Coins':
        return <Coins className={iconClass} />;
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'Zap':
        return <Zap className={iconClass} />;
      case 'Award':
        return <Award className={iconClass} />;
      case 'Music':
        return <Music className={iconClass} />;
      case 'User':
        return <User className={iconClass} />;
      case 'Crown':
        return <Crown className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-hidden">
      <div className="w-full max-w-4xl max-h-[92dvh] bg-neutral-900 border border-neutral-700/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative my-auto">
        {/* Toast Notification Banner */}
        {claimToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs shadow-xl shadow-emerald-500/30 flex items-center gap-2 border border-emerald-300 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{claimToast}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-neutral-800 bg-neutral-950/70 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-white font-display truncate">
                  PASS SAISONNIER
                </h2>
                <span className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex-shrink-0">
                  S1
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-400 truncate">
                Éliminez des zombies pour accumuler de l'XP et débloquer des récompenses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {unclaimedCount > 0 && onClaimAll && (
              <button
                id="claim-all-pass-btn"
                onClick={handleClaimAll}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-transform active:scale-95 animate-pulse min-h-[36px]"
              >
                <Gift className="w-3.5 h-3.5" />
                Tout Récupérer ({unclaimedCount})
              </button>
            )}

            <button
              id="pass-close-btn"
              onClick={() => {
                sound.playUiClick();
                onClose();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* XP Progress Bar Summary */}
        <div className="px-5 py-3 bg-neutral-950/40 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-xs">
              <span className="text-neutral-400">Progression : </span>
              <span className="font-extrabold text-cyan-400 font-mono">{currentXp}</span>
              <span className="text-neutral-500 font-mono"> / {maxPassXp} XP</span>
            </div>
            <div className="flex-1 max-w-xs h-2.5 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unclaimedCount > 0 ? (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                {unclaimedCount} récompense{unclaimedCount > 1 ? 's' : ''} prête{unclaimedCount > 1 ? 's' : ''} à récupérer !
              </span>
            ) : (
              <span className="text-xs text-neutral-400">Toutes les récompenses débloquées sont reçues</span>
            )}
          </div>
        </div>

        {/* Premium Banner */}
        {!hasPremium ? (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/70 via-neutral-900 to-amber-950/60 border border-amber-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  DÉBLOQUER LA VOIE PREMIUM (1800 Ferraille / Accès Instantané)
                </span>
                <p className="text-[11px] text-neutral-300">
                  Déverrouillez instantanément toutes les armes exclusives, effets néon et apparences légendaires.
                </p>
              </div>
            </div>
            <button
              id="unlock-premium-pass-btn"
              onClick={() => {
                sound.playUiClick();
                onUnlockPremium();
              }}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-xs shadow-md shadow-amber-500/30 active:scale-95 flex-shrink-0"
            >
              Débloquer Premium
            </button>
          </div>
        ) : (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/40 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">
                Voie Premium Activée — Récupérez vos récompenses exclusives au fur et à mesure de vos paliers !
              </span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
              VIP ACTIF ✓
            </span>
          </div>
        )}

        {/* Tiers List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {SEASON_PASS_TIERS.map((tier) => {
            const isUnlocked = currentXp >= tier.requiredXp;
            const freeKey = `free_${tier.tier}`;
            const premiumKey = `premium_${tier.tier}`;
            const isFreeClaimed = claimedRewards.includes(freeKey);
            const isPremiumClaimed = claimedRewards.includes(premiumKey);

            return (
              <div
                key={tier.tier}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isUnlocked
                    ? 'bg-neutral-950/80 border-cyan-500/40 shadow-sm'
                    : 'bg-neutral-950/40 border-neutral-800'
                }`}
              >
                {/* Tier indicator */}
                <div className="flex items-center gap-3 min-w-[130px]">
                  <div
                    className={`w-11 h-11 rounded-xl font-black flex items-center justify-center font-display text-base border ${
                      isUnlocked
                        ? 'bg-cyan-500 border-cyan-300 text-neutral-950 shadow-md shadow-cyan-500/30'
                        : 'bg-neutral-800/80 border-neutral-700 text-neutral-500'
                    }`}
                  >
                    #{tier.tier}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Palier {tier.tier}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      {tier.requiredXp} XP requis
                    </div>
                  </div>
                </div>

                {/* Free Track Reward */}
                <div className="flex-1 p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0">
                      {renderRewardIcon(tier.freeReward.icon, false)}
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] text-emerald-400/80 uppercase font-semibold tracking-wider block">
                        Voie Gratuite
                      </span>
                      <div className="text-xs font-bold text-neutral-200 truncate">
                        {tier.freeReward.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isUnlocked ? (
                      isFreeClaimed ? (
                        <span className="px-3 py-1.5 rounded-lg bg-neutral-800/80 text-neutral-400 font-bold text-xs flex items-center gap-1 border border-neutral-700/50">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Reçu
                        </span>
                      ) : (
                        <button
                          id={`claim-free-tier-${tier.tier}`}
                          onClick={() => handleClaim(tier.tier, false, tier.freeReward)}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95 transition-transform animate-pulse"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          Récupérer
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3 text-neutral-600" />
                        {tier.requiredXp} XP
                      </span>
                    )}
                  </div>
                </div>

                {/* Premium Track Reward */}
                <div className="flex-1 p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 flex-shrink-0">
                      {renderRewardIcon(tier.premiumReward.icon, true)}
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider block">
                        Voie Premium
                      </span>
                      <div className="text-xs font-bold text-amber-200 truncate">
                        {tier.premiumReward.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!hasPremium ? (
                      <button
                        onClick={() => {
                          sound.playUiClick();
                          onUnlockPremium();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-500/40 transition-colors"
                        title="Débloquer la voie premium pour obtenir cette récompense"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Verrouillé
                      </button>
                    ) : isUnlocked ? (
                      isPremiumClaimed ? (
                        <span className="px-3 py-1.5 rounded-lg bg-amber-950/40 text-amber-300 font-bold text-xs flex items-center gap-1 border border-amber-500/40">
                          <Check className="w-3.5 h-3.5 text-amber-400" /> Reçu
                        </span>
                      ) : (
                        <button
                          id={`claim-premium-tier-${tier.tier}`}
                          onClick={() => handleClaim(tier.tier, true, tier.premiumReward)}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-xs shadow-md shadow-amber-500/30 flex items-center gap-1.5 active:scale-95 transition-transform animate-pulse"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Récupérer
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3 text-neutral-600" />
                        {tier.requiredXp} XP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
