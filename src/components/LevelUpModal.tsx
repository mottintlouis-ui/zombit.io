import React, { useMemo, useState } from 'react';
import { Sparkles, RefreshCw, Zap, Shield, Radio, Bomb, Flame, Wind, Compass, Cpu, Heart, Crosshair, Car } from 'lucide-react';
import { SkillUpgrade } from '../types/game';
import { ALL_SKILLS } from '../data/gameData';
import { sound } from '../services/sound';

interface LevelUpModalProps {
  currentTierMap: Map<string, number>;
  onSelectUpgrade: (skill: SkillUpgrade) => void;
  onWatchAdReroll: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  currentTierMap,
  onSelectUpgrade,
  onWatchAdReroll,
}) => {
  const [rerollsLeft, setRerollsLeft] = useState(1);
  const [seed, setSeed] = useState(0);

  // Pick 3 random eligible skills (with fallback if all maxed out)
  const choices = useMemo(() => {
    const eligible = ALL_SKILLS.filter((s) => {
      const currentTier = currentTierMap.get(s.id) || 0;
      return currentTier < s.maxTier;
    });

    if (eligible.length === 0) {
      return [
        {
          id: 'bonus_health_scrap',
          name: 'Soin d’Urgence & Ferraille',
          description: 'Restaure +60 PV immédiatement et octroie +100 Ferraille bonus.',
          icon: 'Heart',
          category: 'passive' as const,
          maxTier: 999,
          tierEffects: ['+60 PV & +100 Ferraille'],
        },
      ];
    }

    // Shuffle
    const shuffled = [...eligible].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [currentTierMap, seed]);

  const handleReroll = () => {
    if (rerollsLeft > 0) {
      sound.playUiClick();
      setRerollsLeft((prev) => prev - 1);
      setSeed((s) => s + 1);
    } else {
      onWatchAdReroll();
    }
  };

  const getIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6 text-cyan-400' };
    switch (iconName) {
      case 'Crosshair': return <Crosshair {...props} />;
      case 'Radio': return <Radio {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Bomb': return <Bomb {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Shield': return <Shield {...props} />;
      case 'Wind': return <Wind {...props} />;
      case 'Compass': return <Compass {...props} />;
      case 'Cpu': return <Cpu {...props} />;
      case 'Heart': return <Heart {...props} />;
      case 'Car': return <Car {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none overflow-y-auto">
      <div className="w-full max-w-3xl flex flex-col items-center gap-3 sm:gap-6 my-auto max-h-[95dvh]">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-1.5 sm:mb-2">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            NIVEAU SUPÉRIEUR ATTEINT
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white font-display tracking-wide">
            CHOISISSEZ UNE AMÉLIORATION
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 sm:mt-1">
            Optimisez votre survivant pour résister aux hordes émergentes
          </p>
        </div>

        {/* 3 Upgrade Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 w-full overflow-y-auto max-h-[60vh] sm:max-h-none pr-0.5">
          {choices.map((skill) => {
            const currentTier = currentTierMap.get(skill.id) || 0;
            const isNew = currentTier === 0;

            return (
              <button
                key={skill.id}
                id={`upgrade-card-${skill.id}`}
                onClick={() => {
                  sound.playUiClick();
                  onSelectUpgrade(skill);
                }}
                className="group relative flex flex-col items-start text-left p-3 sm:p-4 rounded-xl bg-neutral-900/90 border-2 border-neutral-700/70 hover:border-cyan-400 hover:bg-neutral-800/90 transition-all duration-150 shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] min-h-[48px]"
              >
                {/* Badge Top */}
                <div className="flex items-center justify-between w-full mb-2 sm:mb-3">
                  <div className="p-2 sm:p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 group-hover:border-cyan-500/50 transition-colors">
                    {getIcon(skill.icon)}
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                      isNew
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {isNew ? 'NOUVEAU' : `Rang ${currentTier + 1}/${skill.maxTier}`}
                  </span>
                </div>

                {/* Title & category */}
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-display">
                  {skill.name}
                </h3>
                <span className="text-[10px] sm:text-[11px] text-neutral-400 font-medium capitalize mb-1.5 sm:mb-2">
                  {skill.category === 'weapon' ? 'Module d’Arme' : 'Module Passif'}
                </span>

                {/* Description */}
                <p className="text-[11px] sm:text-xs text-neutral-300 leading-relaxed mb-2 sm:mb-3 flex-1">
                  {skill.description}
                </p>

                {/* Stat Bonus Highlight */}
                <div className="w-full mt-auto pt-2 border-t border-neutral-800 text-[10px] sm:text-[11px] font-semibold text-emerald-400">
                  {skill.statBonus}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer: Reroll Button */}
        <div className="flex items-center gap-3">
          <button
            id="upgrade-reroll-btn"
            onClick={handleReroll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-xs sm:text-sm font-semibold text-neutral-200 transition-colors active:scale-95 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            {rerollsLeft > 0 ? (
              <span>Relancer ({rerollsLeft} gratuit)</span>
            ) : (
              <span>Relancer (Vidéo Récompensée)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
