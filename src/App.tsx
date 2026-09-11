/**
 * Zombie Core Arena - 3D Survival Wave Video Game
 * WebGL / Three.js - HTML5 Browser, Desktop & Mobile Responsive
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { HUD } from './components/HUD';
import { VirtualJoystick } from './components/VirtualJoystick';
import { LevelUpModal } from './components/LevelUpModal';
import { GameOverModal } from './components/GameOverModal';
import { ShopModal } from './components/ShopModal';
import { SeasonPassModal } from './components/SeasonPassModal';
import { MissionsModal } from './components/MissionsModal';
import { PauseModal } from './components/PauseModal';
import { AdModal } from './components/AdModal';
import { MainMenu } from './components/MainMenu';
import { SkillUpgrade } from './types/game';
import { ShopItem, SeasonPassReward } from './types/economy';
import { StorageService, PlayerSaveData } from './services/storage';
import { sound } from './services/sound';
import { analytics } from './services/analytics';
import { SHOP_ITEMS, SEASON_PASS_TIERS } from './data/gameData';
import { useDeviceInput } from './services/deviceDetector';

export default function App() {
  // Device & Joystick Detection (Mobile vs Computer)
  const { isMobileOrTouch, showJoystick, preference, setPreference } = useDeviceInput();

  // Navigation & Screen View State
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [gameSessionId, setGameSessionId] = useState(0);
  const [activeModal, setActiveModal] = useState<'shop' | 'pass' | 'missions' | 'pause' | null>(null);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Ad Modal State
  const [activeAd, setActiveAd] = useState<{
    rewardTitle: string;
    rewardDescription: string;
    onGranted: () => void;
  } | null>(null);

  // Audio State
  const [isSfxOn, setIsSfxOn] = useState(true);
  const [isMusicOn, setIsMusicOn] = useState(true);

  // Player Saved Data
  const [saveData, setSaveData] = useState<PlayerSaveData>(() => StorageService.load());

  // In-Game Live HUD Stats
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [shield, setShield] = useState(0);
  const [maxShield, setMaxShield] = useState(0);
  const [xp, setXp] = useState(0);
  const [maxXp, setMaxXp] = useState(30);
  const [level, setLevel] = useState(1);
  const [wave, setWave] = useState(1);
  const [waveTimeLeft, setWaveTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [bossInfo, setBossInfo] = useState<{ name: string; currentHp: number; maxHp: number } | null>(null);
  const [activeSkills, setActiveSkills] = useState<{ id: string; tier: number }[]>([]);
  const [vehicleState, setVehicleState] = useState<{
    isDriving: boolean;
    timeLeft: number;
    cooldownLeft: number;
    maxCooldown: number;
    unlocked: boolean;
  }>({
    isDriving: false,
    timeLeft: 0,
    cooldownLeft: 0,
    maxCooldown: 25,
    unlocked: false,
  });

  // End of run stats
  const [runSummary, setRunSummary] = useState<{
    score: number;
    timeSec: number;
    kills: number;
    wave: number;
    level: number;
    bossKills: number;
    scrapEarned: number;
    isNewBestScore: boolean;
    isNewBestTime: boolean;
  } | null>(null);
  const [hasDoubledScrap, setHasDoubledScrap] = useState(false);
  const [hasResurrected, setHasResurrected] = useState(false);

  // Engine instance & Canvas container ref
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const skillTierMapRef = useRef<Map<string, number>>(new Map([['plasma_blaster', 1]]));

  // Update sound settings
  const toggleSfx = () => {
    const next = sound.toggleSfx();
    setIsSfxOn(next);
  };

  const toggleMusic = () => {
    const next = sound.toggleMusic();
    setIsMusicOn(next);
  };

  // Keyboard shortcut for Pause (Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState === 'playing' && !isGameOver && !isLevelUp) {
        if (activeModal === 'pause') {
          handleResumeGame();
        } else if (!activeModal) {
          handlePauseGame();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, isGameOver, isLevelUp, activeModal]);

  // Start a new match
  const handleStartGame = () => {
    sound.playUiClick();
    analytics.logEvent('game_start');
    setIsGameOver(false);
    setIsLevelUp(false);
    setActiveModal(null);
    setRunSummary(null);
    setHasDoubledScrap(false);
    setHasResurrected(false);
    setHp(100);
    setMaxHp(100);
    setShield(0);
    setMaxShield(0);
    setXp(0);
    setMaxXp(30);
    setLevel(1);
    setWave(1);
    setWaveTimeLeft(30);
    setScore(0);
    setKills(0);
    setSurvivalTime(0);
    setBossInfo(null);
    setActiveSkills([{ id: 'plasma_blaster', tier: 1 }]);
    setVehicleState({
      isDriving: false,
      timeLeft: 0,
      cooldownLeft: 0,
      maxCooldown: 25,
      unlocked: false,
    });
    skillTierMapRef.current = new Map([['plasma_blaster', 1]]);
    setGameSessionId((prev) => prev + 1);
    setGameState('playing');
  };

  // Initialize GameEngine inside canvas ref
  useEffect(() => {
    if (gameState !== 'playing' || !gameContainerRef.current) return;

    // Clean up prior instance and DOM container
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    if (gameContainerRef.current) {
      gameContainerRef.current.innerHTML = '';
    }

    const engine = new GameEngine(gameContainerRef.current, {
      onHealthChanged: (current, max, sh, maxSh) => {
        setHp(current);
        setMaxHp(max);
        setShield(sh);
        setMaxShield(maxSh);
      },
      onXpChanged: (current, max, lvl) => {
        setXp(current);
        setMaxXp(max);
        setLevel(lvl);
      },
      onLevelUp: () => {
        setIsLevelUp(true);
      },
      onWaveChanged: (wv, timeLeft) => {
        setWave(wv);
        setWaveTimeLeft(timeLeft);
      },
      onScoreChanged: (sc, k) => {
        setScore(sc);
        setKills(k);
      },
      onBossSpawned: (bossName, currentHp, maxHp) => {
        setBossInfo({ name: bossName, currentHp, maxHp });
      },
      onBossHpChanged: (currentHp, maxHp) => {
        setBossInfo((prev) => (prev ? { ...prev, currentHp, maxHp } : null));
      },
      onBossDefeated: () => {
        setBossInfo(null);
      },
      onVehicleStateChanged: (isDriving, timeLeft, cooldownLeft, maxCooldown, unlocked) => {
        setVehicleState({
          isDriving,
          timeLeft,
          cooldownLeft,
          maxCooldown,
          unlocked,
        });
      },
      onGameOver: (finalScore, timeSec, finalKills, finalWave, finalLevel, bossKills) => {
        analytics.logEvent('game_over', { score: finalScore, timeSec, kills: finalKills, wave: finalWave });

        // Calculate earned scrap (ferraille) - balanced progression
        const earnedScrap = Math.round(finalScore * 0.025 + finalKills * 0.6 + bossKills * 25);
        StorageService.addScrap(earnedScrap);

        const runResult = StorageService.updateRunStats(finalScore, timeSec, finalKills, bossKills, finalLevel);
        setSaveData(runResult.currentSave);

        setRunSummary({
          score: finalScore,
          timeSec,
          kills: finalKills,
          wave: finalWave,
          level: finalLevel,
          bossKills,
          scrapEarned: earnedScrap,
          isNewBestScore: runResult.isNewBestScore,
          isNewBestTime: runResult.isNewBestTime,
        });

        setIsGameOver(true);
      },
    }, {
      skin: (StorageService.load().equippedSkin || saveData.equippedSkin || 'skin_default'),
      weapon: (StorageService.load().equippedWeaponSkin || (StorageService.load() as any).equippedWeapon || saveData.equippedWeaponSkin || (saveData as any).equippedWeapon || 'weapon_plasma'),
      fx: (StorageService.load().equippedFx || saveData.equippedFx || 'fx_cyan'),
      pet: (StorageService.load().equippedPet || saveData.equippedPet || 'none'),
    });

    // Apply equipped cosmetics with full fallback support
    const currentSave = StorageService.load();
    const activeSkin = currentSave.equippedSkin || saveData.equippedSkin || 'skin_default';
    const activeWeapon = currentSave.equippedWeaponSkin || (currentSave as any).equippedWeapon || saveData.equippedWeaponSkin || (saveData as any).equippedWeapon || 'weapon_plasma';
    const activeFx = currentSave.equippedFx || saveData.equippedFx || 'fx_cyan';
    const activePet = currentSave.equippedPet || saveData.equippedPet || 'none';

    engine.setSkin(activeSkin);
    engine.setWeaponSkin(activeWeapon);
    engine.setProjectileFx(activeFx);
    engine.setPet(activePet);

    engineRef.current = engine;
    setActiveSkills(engine.getActiveSkills());

    // Timer sync for survival time
    const timeInterval = window.setInterval(() => {
      if (engineRef.current && !engineRef.current.isPaused) {
        setSurvivalTime(Math.floor(engineRef.current.survivalTime));
      }
    }, 1000);

    const handleResize = () => {
      engine.handleResize();
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && gameContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        engine.handleResize();
      });
      resizeObserver.observe(gameContainerRef.current);
    }

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, [gameState, gameSessionId]);

  // Pause Controls
  const handlePauseGame = () => {
    if (engineRef.current) {
      engineRef.current.isPaused = true;
    }
    setActiveModal('pause');
  };

  const handleResumeGame = () => {
    setActiveModal(null);
    if (engineRef.current && !isLevelUp && !isGameOver) {
      engineRef.current.isPaused = false;
    }
  };

  const handleQuitToMenu = () => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setActiveModal(null);
    setIsGameOver(false);
    setIsLevelUp(false);
    setGameState('menu');
  };

  // Level Up Upgrade Choice
  const handleSelectUpgrade = (skill: SkillUpgrade) => {
    if (engineRef.current) {
      engineRef.current.applySkill(skill);
      if (skill.id === 'bonus_health_scrap') {
        StorageService.addScrap(100);
        setSaveData(StorageService.load());
      } else {
        skillTierMapRef.current.set(skill.id, engineRef.current.getSkillTier(skill.id));
        setActiveSkills(engineRef.current.getActiveSkills());
      }
    }
    setIsLevelUp(false);
  };

  const handleActivateVehicle = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.activateCombatVehicle();
    }
  }, []);

  // Rewarded Ad for Skill Reroll
  const handleWatchAdReroll = () => {
    setActiveAd({
      rewardTitle: 'Relance des 3 compétences',
      rewardDescription: 'Recevez 3 nouvelles options d’améliorations pour votre survivant.',
      onGranted: () => {
        setActiveAd(null);
        // Reroll is allowed
      },
    });
  };

  // Rewarded Ad for Double Scrap after run
  const handleWatchAdDoubleScrap = () => {
    if (!runSummary || hasDoubledScrap) return;
    setActiveAd({
      rewardTitle: 'Doubler la Ferraille de fin de partie',
      rewardDescription: `Obtenez +${runSummary.scrapEarned} Ferraille bonus pour la boutique.`,
      onGranted: () => {
        StorageService.addScrap(runSummary.scrapEarned);
        setSaveData(StorageService.load());
        setHasDoubledScrap(true);
        setActiveAd(null);
      },
    });
  };

  // Shop item purchase
  const handleBuyItem = (item: ShopItem, method: 'scrap' | 'eur') => {
    const updated = { ...saveData };
    if (method === 'scrap') {
      if (updated.scrap < item.testCurrencyPrice) return;
      updated.scrap -= item.testCurrencyPrice;
    }
    if (!updated.ownedItemIds.includes(item.id)) {
      updated.ownedItemIds.push(item.id);
    }
    if (item.category === 'characters') {
      updated.equippedSkin = item.id;
      if (engineRef.current) engineRef.current.setSkin(item.id);
    } else if (item.category === 'weapons') {
      updated.equippedWeaponSkin = item.id;
      (updated as any).equippedWeapon = item.id;
      if (engineRef.current) engineRef.current.setWeaponSkin(item.id);
    } else if (item.category === 'projectiles') {
      updated.equippedFx = item.id;
      if (engineRef.current) engineRef.current.setProjectileFx(item.id);
    } else if (item.category === 'pets') {
      updated.equippedPet = item.id;
      if (engineRef.current) engineRef.current.setPet(item.id);
    }
    if (item.id === 'pack_welcome') {
      updated.welcomePackClaimed = true;
    }
    StorageService.save(updated);
    setSaveData(updated);
  };

  const handleEquipSkin = (itemId: string) => {
    const item = SHOP_ITEMS.find((it) => it.id === itemId);
    const updated = { ...saveData };
    if (item) {
      if (item.category === 'characters') {
        updated.equippedSkin = itemId;
        if (engineRef.current) engineRef.current.setSkin(itemId);
      } else if (item.category === 'weapons') {
        updated.equippedWeaponSkin = itemId;
        (updated as any).equippedWeapon = itemId;
        if (engineRef.current) engineRef.current.setWeaponSkin(itemId);
      } else if (item.category === 'projectiles') {
        updated.equippedFx = itemId;
        if (engineRef.current) engineRef.current.setProjectileFx(itemId);
      } else if (item.category === 'pets') {
        updated.equippedPet = itemId;
        if (engineRef.current) engineRef.current.setPet(itemId);
      }
    } else {
      updated.equippedSkin = itemId;
      if (engineRef.current) engineRef.current.setSkin(itemId);
    }
    StorageService.save(updated);
    setSaveData(updated);
  };

  // Season pass actions
  const handleUnlockPremiumPass = () => {
    sound.playLevelUp();
    const cost = 1800;
    let newScrap = saveData.scrap;
    if (newScrap >= cost) {
      newScrap -= cost;
    }
    const updated = { ...saveData, scrap: newScrap, hasPremiumSeasonPass: true };
    StorageService.save(updated);
    setSaveData(updated);
  };

  const handleClaimPassReward = (tier: number, isPremium: boolean, reward: SeasonPassReward) => {
    const rewardKey = `${isPremium ? 'premium' : 'free'}_${tier}`;
    const updated = StorageService.claimSeasonReward(
      rewardKey,
      reward.amount,
      reward.itemId
    );
    setSaveData(updated);
  };

  const handleClaimAllPassRewards = () => {
    let currentData = StorageService.load();
    for (const tier of SEASON_PASS_TIERS) {
      if (currentData.seasonPassXp >= tier.requiredXp) {
        // Free reward check
        const freeKey = `free_${tier.tier}`;
        if (!currentData.claimedSeasonRewards.includes(freeKey)) {
          currentData = StorageService.claimSeasonReward(
            freeKey,
            tier.freeReward.amount,
            tier.freeReward.itemId
          );
        }
        // Premium reward check
        if (currentData.hasPremiumSeasonPass) {
          const premKey = `premium_${tier.tier}`;
          if (!currentData.claimedSeasonRewards.includes(premKey)) {
            currentData = StorageService.claimSeasonReward(
              premKey,
              tier.premiumReward.amount,
              tier.premiumReward.itemId
            );
          }
        }
      }
    }
    setSaveData(currentData);
  };

  // Missions actions
  const handleClaimMissionReward = (missionId: string) => {
    const result = StorageService.claimMissionReward(missionId);
    if (result.success) {
      sound.playLevelUp();
      setSaveData(result.currentSave);
    }
  };

  // Joystick move callback
  const handleJoystickMove = useCallback((x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.setJoystickVector(x, y);
    }
  }, []);

  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-neutral-950 font-sans text-neutral-100 select-none">
      {/* 1. Main Menu Screen */}
      {gameState === 'menu' && (
        <MainMenu
          saveData={saveData}
          onStartGame={handleStartGame}
          onOpenShop={() => setActiveModal('shop')}
          onOpenPass={() => setActiveModal('pass')}
          onOpenMissions={() => setActiveModal('missions')}
          isSfxOn={isSfxOn}
          isMusicOn={isMusicOn}
          onToggleSfx={toggleSfx}
          onToggleMusic={toggleMusic}
          isMobileOrTouch={isMobileOrTouch}
        />
      )}

      {/* 2. Active 3D Playing Canvas & Overlays */}
      {gameState === 'playing' && (
        <div className="relative w-full h-full">
          {/* 3D WebGL Three.js Container */}
          <div ref={gameContainerRef} className="w-full h-full absolute inset-0 z-0 touch-none select-none" />

          {/* In-game HUD */}
          <HUD
            currentHp={hp}
            maxHp={maxHp}
            shield={shield}
            maxShield={maxShield}
            currentXp={xp}
            maxXp={maxXp}
            level={level}
            wave={wave}
            waveTimeLeft={waveTimeLeft}
            score={score}
            kills={kills}
            survivalTimeSec={survivalTime}
            bossInfo={bossInfo}
            activeSkills={activeSkills}
            vehicleState={vehicleState}
            onActivateVehicle={handleActivateVehicle}
            showJoystick={showJoystick}
            isMobileOrTouch={isMobileOrTouch}
            onPauseClick={handlePauseGame}
          />

          {/* Virtual Joystick Zone - Only rendered when on mobile/touch or forced on */}
          {showJoystick && (
            <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 z-20 pointer-events-auto pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)]">
              <VirtualJoystick onMove={handleJoystickMove} />
            </div>
          )}
        </div>
      )}

      {/* 3. Level Up Modal */}
      {isLevelUp && (
        <LevelUpModal
          currentTierMap={skillTierMapRef.current}
          onSelectUpgrade={handleSelectUpgrade}
          onWatchAdReroll={handleWatchAdReroll}
        />
      )}

      {/* 4. Game Over Modal (7-Step compliant sequence) */}
      {isGameOver && runSummary && (
        <GameOverModal
          score={runSummary.score}
          timeSec={runSummary.timeSec}
          kills={runSummary.kills}
          wave={runSummary.wave}
          level={runSummary.level}
          bossKills={runSummary.bossKills}
          scrapEarned={runSummary.scrapEarned}
          isNewBestScore={runSummary.isNewBestScore}
          isNewBestTime={runSummary.isNewBestTime}
          missions={saveData.dailyMissions}
          onReplay={handleStartGame}
          onOpenShop={() => {
            setIsGameOver(false);
            setGameState('menu');
            setActiveModal('shop');
          }}
          onWatchAdDoubleScrap={handleWatchAdDoubleScrap}
          hasDoubledScrap={hasDoubledScrap}
        />
      )}

      {/* 5. Pause Modal */}
      {activeModal === 'pause' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleStartGame}
          onQuitToMenu={handleQuitToMenu}
          isSfxOn={isSfxOn}
          isMusicOn={isMusicOn}
          onToggleSfx={toggleSfx}
          onToggleMusic={toggleMusic}
          isMobileOrTouch={isMobileOrTouch}
          joystickPreference={preference}
          onSetJoystickPreference={setPreference}
        />
      )}

      {/* 6. Shop Modal */}
      {activeModal === 'shop' && (
        <ShopModal
          userScrap={saveData.scrap}
          ownedItemIds={saveData.ownedItemIds}
          equippedSkin={saveData.equippedSkin}
          equippedWeapon={saveData.equippedWeaponSkin || (saveData as any).equippedWeapon || 'weapon_plasma'}
          equippedFx={saveData.equippedFx}
          equippedPet={saveData.equippedPet}
          welcomePackClaimed={saveData.welcomePackClaimed}
          onClose={() => setActiveModal(null)}
          onBuyItem={handleBuyItem}
          onEquipSkin={handleEquipSkin}
        />
      )}

      {/* 7. Season Pass Modal */}
      {activeModal === 'pass' && (
        <SeasonPassModal
          currentXp={saveData.seasonPassXp}
          hasPremium={saveData.hasPremiumSeasonPass}
          onClose={() => setActiveModal(null)}
          onUnlockPremium={handleUnlockPremiumPass}
          onClaimReward={handleClaimPassReward}
          onClaimAll={handleClaimAllPassRewards}
          claimedRewards={saveData.claimedSeasonRewards || []}
        />
      )}

      {/* 8. Missions Modal */}
      {activeModal === 'missions' && (
        <MissionsModal
          missions={saveData.dailyMissions}
          onClose={() => setActiveModal(null)}
          onClaimMissionReward={handleClaimMissionReward}
        />
      )}

      {/* 9. Rewarded Ad Simulator */}
      {activeAd && (
        <AdModal
          rewardTitle={activeAd.rewardTitle}
          rewardDescription={activeAd.rewardDescription}
          onRewardGranted={activeAd.onGranted}
          onCancel={() => setActiveAd(null)}
        />
      )}
    </main>
  );
}
