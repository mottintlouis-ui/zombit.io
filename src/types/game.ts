export type ZombieType =
  | 'normal'
  | 'runner'
  | 'armored'
  | 'toxic'
  | 'explosive'
  | 'summoner'
  | 'elite'
  | 'boss';

export interface ZombieConfig {
  type: ZombieType;
  name: string;
  color: string;
  size: number;
  baseHp: number;
  baseDmg: number;
  baseSpeed: number;
  xpValue: number;
  description: string;
}

export interface SkillUpgrade {
  id: string;
  name: string;
  category: 'weapon' | 'passive';
  icon: string;
  tier: number;
  maxTier: number;
  title: string;
  description: string;
  statBonus: string;
}

export interface PlayerStats {
  maxHp: number;
  currentHp: number;
  speed: number;
  magnetRadius: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  critChance: number;
  critMultiplier: number;
  shieldMax: number;
  shieldCurrent: number;
  regenRate: number; // HP per sec
}

export interface GameRunStats {
  score: number;
  timeSurvivedSeconds: number;
  zombiesKilled: number;
  waveReached: number;
  levelReached: number;
  scrapEarned: number;
  isNewBestScore: boolean;
  isNewBestTime: boolean;
  bossesDefeated: number;
}

export interface GroundPuddle {
  id: string;
  x: number;
  z: number;
  radius: number;
  durationMs: number;
  damagePerSec: number;
  createdAt: number;
}

export interface ActiveWeaponState {
  id: string;
  tier: number;
  lastFired: number;
}
