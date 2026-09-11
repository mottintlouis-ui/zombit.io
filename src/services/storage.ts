import { DailyMission } from '../types/economy';

export interface PlayerSaveData {
  scrap: number; // Ferraille
  powerCores: number;
  highScore: number;
  bestTimeSeconds: number;
  totalKills: number;
  totalGamesPlayed: number;
  equippedSkin: string;
  equippedWeaponSkin: string;
  equippedFx: string;
  equippedPet: string;
  ownedItemIds: string[];
  welcomePackClaimed: boolean;
  seasonPassXp: number;
  hasPremiumSeasonPass: boolean;
  claimedSeasonRewards: string[]; // List of keys like 'free_1', 'premium_1'
  dailyMissions: DailyMission[];
  lastDailyReset: number;
}

const STORAGE_KEY = 'zombie_core_arena_save_v1';

export const INITIAL_MISSIONS: DailyMission[] = [
  {
    id: 'm1',
    title: 'Purge Urbaine',
    description: 'Éliminer 100 zombies dans les arènes',
    target: 100,
    current: 0,
    rewardScrap: 150,
    completed: false,
    claimed: false,
    type: 'kills',
  },
  {
    id: 'm2',
    title: 'Survie d’Élite',
    description: 'Survivre au moins 3 minutes (180s) en une manche',
    target: 180,
    current: 0,
    rewardScrap: 200,
    completed: false,
    claimed: false,
    type: 'survival_time',
  },
  {
    id: 'm3',
    title: 'Chasseur de Colosse',
    description: 'Vaincre un Boss de vague (Vague 5 ou supérieure)',
    target: 1,
    current: 0,
    rewardScrap: 300,
    completed: false,
    claimed: false,
    type: 'boss_kill',
  },
  {
    id: 'm4',
    title: 'Arsenal Technologique',
    description: 'Obtenir 8 améliorations de compétences au cours d’une manche',
    target: 8,
    current: 0,
    rewardScrap: 120,
    completed: false,
    claimed: false,
    type: 'level_ups',
  },
];

const DEFAULT_SAVE: PlayerSaveData = {
  scrap: 120,
  powerCores: 10,
  highScore: 0,
  bestTimeSeconds: 0,
  totalKills: 0,
  totalGamesPlayed: 0,
  equippedSkin: 'skin_default',
  equippedWeaponSkin: 'weapon_plasma',
  equippedFx: 'fx_cyan',
  equippedPet: 'none',
  ownedItemIds: ['skin_default', 'weapon_plasma', 'fx_cyan'],
  welcomePackClaimed: false,
  seasonPassXp: 280,
  hasPremiumSeasonPass: false,
  claimedSeasonRewards: [],
  dailyMissions: INITIAL_MISSIONS,
  lastDailyReset: Date.now(),
};

export class StorageService {
  public static load(): PlayerSaveData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return DEFAULT_SAVE;
      const parsed = JSON.parse(data);

      // Check for daily reset (24 hours)
      const lastReset = parsed.lastDailyReset || Date.now();
      const isNewDay = Date.now() - lastReset > 24 * 60 * 60 * 1000;

      let dailyMissions: DailyMission[];
      if (isNewDay || !Array.isArray(parsed.dailyMissions) || parsed.dailyMissions.length === 0) {
        dailyMissions = INITIAL_MISSIONS.map((m) => ({ ...m, current: 0, completed: false, claimed: false }));
        parsed.lastDailyReset = Date.now();
      } else {
        dailyMissions = parsed.dailyMissions.map((m: DailyMission) => ({
          ...m,
          claimed: !!m.claimed,
          completed: m.completed || m.current >= m.target,
        }));
      }

      return {
        ...DEFAULT_SAVE,
        ...parsed,
        dailyMissions,
        claimedSeasonRewards: Array.isArray(parsed.claimedSeasonRewards) ? parsed.claimedSeasonRewards : [],
      };
    } catch {
      return DEFAULT_SAVE;
    }
  }

  public static save(data: PlayerSaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  public static claimMissionReward(missionId: string): { success: boolean; rewardScrap: number; currentSave: PlayerSaveData } {
    const data = this.load();
    const mission = data.dailyMissions.find((m) => m.id === missionId);

    // Strictly check: must exist, must be completed, and must NOT be already claimed!
    if (!mission || !mission.completed || mission.claimed) {
      return { success: false, rewardScrap: 0, currentSave: data };
    }

    mission.claimed = true;
    data.scrap += mission.rewardScrap;
    this.save(data);
    return { success: true, rewardScrap: mission.rewardScrap, currentSave: data };
  }

  public static claimSeasonReward(rewardKey: string, scrapAmount?: number, itemId?: string): PlayerSaveData {
    const data = this.load();
    if (!data.claimedSeasonRewards.includes(rewardKey)) {
      data.claimedSeasonRewards.push(rewardKey);
    }
    if (scrapAmount && scrapAmount > 0) {
      data.scrap += scrapAmount;
    }
    if (itemId && !data.ownedItemIds.includes(itemId)) {
      data.ownedItemIds.push(itemId);
    }
    this.save(data);
    return data;
  }

  public static addScrap(amount: number): number {
    const data = this.load();
    data.scrap = Math.max(0, data.scrap + amount);
    this.save(data);
    return data.scrap;
  }

  public static updateRunStats(score: number, timeSec: number, kills: number, bossKills: number, levelUps: number) {
    const data = this.load();
    const isNewBestScore = score > data.highScore;
    const isNewBestTime = timeSec > data.bestTimeSeconds;

    if (isNewBestScore) data.highScore = score;
    if (isNewBestTime) data.bestTimeSeconds = timeSec;

    data.totalKills += kills;
    data.totalGamesPlayed += 1;
    data.seasonPassXp += Math.floor(score * 0.1) + kills * 2;

    // Update daily missions
    data.dailyMissions.forEach((mission) => {
      if (mission.completed || mission.claimed) return;
      if (mission.type === 'kills') {
        mission.current = Math.min(mission.target, mission.current + kills);
      } else if (mission.type === 'survival_time') {
        mission.current = Math.max(mission.current, timeSec);
      } else if (mission.type === 'boss_kill') {
        mission.current = Math.min(mission.target, mission.current + bossKills);
      } else if (mission.type === 'level_ups') {
        mission.current = Math.max(mission.current, levelUps);
      }

      if (mission.current >= mission.target) {
        mission.completed = true;
      }
    });

    this.save(data);
    return { isNewBestScore, isNewBestTime, currentSave: data };
  }
}
