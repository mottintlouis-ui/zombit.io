import React, { useState, useEffect } from 'react';
import { Video, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { sound } from '../services/sound';
import { analytics } from '../services/analytics';

interface AdModalProps {
  rewardTitle: string;
  rewardDescription: string;
  onRewardGranted: () => void;
  onCancel: () => void;
}

export const AdModal: React.FC<AdModalProps> = ({
  rewardTitle,
  rewardDescription,
  onRewardGranted,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    analytics.logEvent('rewarded_ad_start', { rewardTitle });
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsCompleted(true);
          sound.playLevelUp();
          analytics.logEvent('rewarded_ad_complete', { rewardTitle });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rewardTitle]);

  const handleClaim = () => {
    sound.playUiClick();
    onRewardGranted();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center gap-5">
        <div className="p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <Video className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase font-display">
            SIMULATION PUBLICITÉ RÉCOMPENSÉE (GAMEPIX / GAMEDISTRIBUTION)
          </span>
          <h3 className="text-xl font-extrabold text-white font-display mt-1">
            {rewardTitle}
          </h3>
          <p className="text-xs text-neutral-300 mt-1">{rewardDescription}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-neutral-400 font-mono mb-1.5">
            <span>Diffusion du message partenaire</span>
            <span>{isCompleted ? 'Complété ✓' : `${secondsLeft}s`}</span>
          </div>
          <div className="h-2.5 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-1000"
              style={{ width: `${((4 - secondsLeft) / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2 text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Aucun suivi intrusif. La récompense promise vous sera attribuée immédiatement.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full">
          {!isCompleted ? (
            <button
              onClick={() => {
                sound.playUiClick();
                analytics.logEvent('rewarded_ad_cancel', { rewardTitle });
                onCancel();
              }}
              className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
            >
              Annuler (sans récompense)
            </button>
          ) : (
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-neutral-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 font-display"
            >
              <Sparkles className="w-4 h-4" />
              <span>RÉCUPÉRER LA RÉCOMPENSE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
