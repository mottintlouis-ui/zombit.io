export type ShopCategory =
  | 'characters'
  | 'weapons'
  | 'projectiles'
  | 'emotes'
  | 'pets'
  | 'music_themes'
  | 'packs'
  | 'season_pass';

export interface ShopItem {
  id: string;
  category: ShopCategory;
  name: string;
  description: string;
  priceEur: number;
  testCurrencyPrice: number; // Ferraille
  isExclusive?: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  thumbnailUrl?: string;
  accentColor: string;
  previewData: {
    color?: string;
    modelType?: 'skin' | 'weapon' | 'fx' | 'pet';
    subtext?: string;
  };
}

export interface SeasonPassReward {
  name: string;
  type: 'scrap' | 'skin' | 'fx' | 'emote' | 'badge' | 'weapon' | 'pets';
  amount?: number;
  itemId?: string;
  icon: string;
}

export interface SeasonPassTier {
  tier: number;
  requiredXp: number;
  freeReward: SeasonPassReward;
  premiumReward: SeasonPassReward;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardScrap: number;
  completed: boolean;
  claimed?: boolean;
  type: 'kills' | 'survival_time' | 'wave' | 'boss_kill' | 'level_ups';
}

export interface EconomyConfig {
  welcomePackPriceEur: number;
  seasonPassPriceEur: number;
  classicSkinPriceEur: number;
  supporterPackPriceEur: number;
  rewardedAdMultiplier: number;
  dailyRewardScrap: number;
}
