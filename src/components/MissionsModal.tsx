import React, { useState } from 'react';
import { X, Award, CheckCircle2, Coins, Check, Sparkles } from 'lucide-react';
import { DailyMission } from '../types/economy';
import { sound } from '../services/sound';

interface MissionsModalProps {
  missions: DailyMission[];
  onClose: () => void;
  onClaimMissionReward: (missionId: string) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  onClose,
  onClaimMissionReward,
}) => {
  const [justClaimedId, setJustClaimedId] = useState<string | null>(null);

  // Count ready to claim
  const readyToClaimMissions = missions.filter((m) => m.completed && !m.claimed);
  const claimedCount = missions.filter((m) => m.claimed).length;

  const handleClaim = (missionId: string) => {
    setJustClaimedId(missionId);
    onClaimMissionReward(missionId);
    setTimeout(() => {
      setJustClaimedId(null);
    }, 1200);
  };

  const handleClaimAll = () => {
    readyToClaimMissions.forEach((m) => {
      onClaimMissionReward(m.id);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-hidden">
      <div className="w-full max-w-xl max-h-[92dvh] bg-neutral-900 border border-neutral-700/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-extrabold text-white font-display">
                  OBJECTIFS & MISSIONS
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold">
                  {claimedCount}/{missions.length} Terminées
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-neutral-400">
                Complétez des défis réguliers pour amasser de la Ferraille
              </p>
            </div>
          </div>

          <button
            id="missions-close-btn"
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim All Quick Action bar (if multiple completed) */}
        {readyToClaimMissions.length > 1 && (
          <div className="px-4 py-2.5 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              {readyToClaimMissions.length} récompenses prêtes à être récupérées !
            </span>
            <button
              id="claim-all-missions-btn"
              onClick={handleClaimAll}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-lg shadow active:scale-95 transition-all"
            >
              Tout Réclamer
            </button>
          </div>
        )}

        {/* Missions List */}
        <div className="p-3 sm:p-5 space-y-2.5 sm:space-y-3 overflow-y-auto flex-1">
          {missions.map((m) => {
            const progress = Math.min(100, Math.round((m.current / m.target) * 100));
            const isJustClaimed = justClaimedId === m.id;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  m.claimed
                    ? 'bg-neutral-950/40 border-neutral-800/50 opacity-80'
                    : m.completed
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : 'bg-neutral-950/70 border-neutral-800'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                      {m.claimed && <Check className="w-4 h-4 text-emerald-400" />}
                      {m.title}
                    </h4>
                    <span className="text-xs font-mono text-neutral-400">
                      {m.claimed ? `${m.target}/${m.target}` : `${m.current}/${m.target}`}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mb-2.5">{m.description}</p>
                  <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        m.claimed
                          ? 'bg-emerald-700'
                          : m.completed
                          ? 'bg-emerald-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${m.claimed ? 100 : progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-300">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>+{m.rewardScrap}</span>
                  </div>

                  {m.claimed ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-1.5 bg-emerald-950/60 rounded-lg border border-emerald-500/40 select-none">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Réclamé
                    </span>
                  ) : m.completed ? (
                    <button
                      id={`claim-mission-${m.id}`}
                      onClick={() => handleClaim(m.id)}
                      disabled={isJustClaimed}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {isJustClaimed ? 'Récupéré !' : 'Réclamer'}
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-500 font-medium px-2 py-1 bg-neutral-900 rounded border border-neutral-800">
                      En cours
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
