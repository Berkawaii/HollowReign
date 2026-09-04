import { POWER_UPS, calculatePowerUpPrice } from '../config/metaProgression';
import { ACHIEVEMENTS, AchievementConfig } from '../config/achievements';

export interface ScoreRecord {
  heroId: string;
  heroName: string;
  survivalTime: number;
  level: number;
  kills: number;
  gold: number;
  date: string;
}

export interface LifetimeStats {
  totalKills: number;
  totalGoldEarned: number;
  totalRuns: number;
  highestLevel: number;
  highestSurvivalTime: number;
  bossesKilled: Record<string, number>;
  evolutionsMade: number;
}

export interface MetaSaveData {
  version: number;
  gold: number;
  powerUps: Record<string, number>; // powerUpId -> rank
  // Unlock Registries
  unlockedHeroes: string[];
  unlockedWeapons: string[];
  unlockedPassives: string[];
  unlockedStages: string[];
  unlockedAchievements: string[]; // achievement IDs completed
  unlockedAbilities: string[];    // unlocked secondary abilities: ['valerius_2', ...]
  equippedAbilities: Record<string, number>; // heroId -> 1 or 2
  // Lifetime Statistics
  lifetimeStats: LifetimeStats;
  highScores: ScoreRecord[];
  soundMuted: boolean;
  language: string;
}

const STORAGE_KEY = 'BULLET_HEAVEN_SAVE_V2';

export class StorageService {
  private static defaultData: MetaSaveData = {
    version: 2,
    gold: 0,
    powerUps: {},
    unlockedHeroes: ['valerius', 'sylvia'],
    unlockedWeapons: ['whip', 'magic_wand', 'knife', 'fire_wand', 'bible', 'garlic'],
    unlockedPassives: ['hollow_heart', 'empty_tome', 'bracer', 'spinach', 'spellbinder', 'pummarola'],
    unlockedStages: ['stage_forest'],
    unlockedAchievements: [],
    unlockedAbilities: [],
    equippedAbilities: {},
    lifetimeStats: {
      totalKills: 0,
      totalGoldEarned: 0,
      totalRuns: 0,
      highestLevel: 1,
      highestSurvivalTime: 0,
      bossesKilled: {},
      evolutionsMade: 0,
    },
    highScores: [],
    soundMuted: false,
    language: 'en',
  };

  public static load(): MetaSaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Attempt legacy V1 migration if present
        const legacyRaw = localStorage.getItem('BULLET_HEAVEN_SAVE_V1');
        if (legacyRaw) {
          const parsed = JSON.parse(legacyRaw);
          const migrated: MetaSaveData = {
            ...this.defaultData,
            gold: parsed.gold || 0,
            powerUps: parsed.powerUps || {},
            highScores: parsed.highScores || [],
            soundMuted: !!parsed.soundMuted,
          };
          this.save(migrated);
          return migrated;
        }
        return { ...this.defaultData };
      }

      const parsed = JSON.parse(raw);
      const data: MetaSaveData = {
        ...this.defaultData,
        ...parsed,
        lifetimeStats: {
          ...this.defaultData.lifetimeStats,
          ...(parsed.lifetimeStats || {}),
        },
      };

      // Ensure starter heroes & stage are always unlocked
      if (!data.unlockedHeroes.includes('valerius')) data.unlockedHeroes.push('valerius');
      if (!data.unlockedHeroes.includes('sylvia')) data.unlockedHeroes.push('sylvia');
      if (!data.unlockedStages.includes('stage_forest')) data.unlockedStages.push('stage_forest');

      // Normalize any old hero_ prefixed IDs in storage
      data.unlockedHeroes = data.unlockedHeroes.map((h) => h.replace('hero_', ''));
      if (!Array.isArray(data.unlockedAbilities)) data.unlockedAbilities = [];
      if (!data.equippedAbilities || typeof data.equippedAbilities !== 'object') data.equippedAbilities = {};

      return data;
    } catch {
      return { ...this.defaultData };
    }
  }

  public static save(data: MetaSaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  public static addGold(amount: number): number {
    const data = this.load();
    data.gold += amount;
    data.lifetimeStats.totalGoldEarned += amount;
    this.save(data);
    return data.gold;
  }

  public static getLanguage(): string {
    return this.load().language || 'en';
  }

  public static setLanguage(lang: string): void {
    const data = this.load();
    data.language = lang;
    this.save(data);
  }

  public static saveRunScore(record: ScoreRecord): void {
    const data = this.load();
    data.highScores.push(record);
    data.highScores.sort((a, b) => b.survivalTime - a.survivalTime);
    data.highScores = data.highScores.slice(0, 50);

    data.lifetimeStats.totalRuns += 1;
    data.lifetimeStats.totalKills += record.kills;
    data.lifetimeStats.highestLevel = Math.max(data.lifetimeStats.highestLevel, record.level);
    data.lifetimeStats.highestSurvivalTime = Math.max(
      data.lifetimeStats.highestSurvivalTime,
      record.survivalTime
    );

    this.save(data);
  }

  public static recordBossKill(bossKey: string): void {
    const data = this.load();
    data.lifetimeStats.bossesKilled[bossKey] = (data.lifetimeStats.bossesKilled[bossKey] || 0) + 1;
    this.save(data);
  }

  public static recordEvolution(): void {
    const data = this.load();
    data.lifetimeStats.evolutionsMade = (data.lifetimeStats.evolutionsMade || 0) + 1;
    this.save(data);
  }

  /* =========================================================================
     ACHIEVEMENT & UNLOCK METHODS
     ========================================================================= */

  public static isAchievementUnlocked(achievementId: string): boolean {
    const data = this.load();
    return data.unlockedAchievements.includes(achievementId);
  }

  public static unlockAchievement(achievementId: string): AchievementConfig | null {
    const data = this.load();
    if (data.unlockedAchievements.includes(achievementId)) {
      return null; // Already unlocked
    }

    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!ach) return null;

    data.unlockedAchievements.push(achievementId);

    // Apply Reward
    const cleanRewardId = ach.rewardId.replace('hero_', '');
    if (ach.rewardType === 'hero') {
      if (!data.unlockedHeroes.includes(cleanRewardId)) {
        data.unlockedHeroes.push(cleanRewardId);
      }
    } else if (ach.rewardType === 'weapon') {
      if (!data.unlockedWeapons.includes(ach.rewardId)) {
        data.unlockedWeapons.push(ach.rewardId);
      }
    } else if (ach.rewardType === 'passive') {
      if (!data.unlockedPassives.includes(ach.rewardId)) {
        data.unlockedPassives.push(ach.rewardId);
      }
    } else if (ach.rewardType === 'stage') {
      if (!data.unlockedStages.includes(ach.rewardId)) {
        data.unlockedStages.push(ach.rewardId);
      }
    } else if (ach.rewardType === 'gold') {
      data.gold += 500;
      data.lifetimeStats.totalGoldEarned += 500;
    }

    this.save(data);
    return ach;
  }

  public static isHeroUnlocked(heroId: string): boolean {
    const cleanId = heroId.replace('hero_', '');
    if (cleanId === 'valerius' || cleanId === 'sylvia') {
      return true; // Starter heroes are always unlocked!
    }
    const data = this.load();
    return data.unlockedHeroes.includes(cleanId) || data.unlockedHeroes.includes(`hero_${cleanId}`);
  }

  public static isWeaponUnlocked(weaponId: string): boolean {
    const data = this.load();
    // Starter weapons are always available
    const starters = ['whip', 'magic_wand', 'knife', 'fire_wand', 'bible', 'garlic'];
    if (starters.includes(weaponId)) return true;
    return data.unlockedWeapons.includes(weaponId);
  }

  public static isPassiveUnlocked(passiveId: string): boolean {
    const data = this.load();
    // Starter passives are always available
    const starters = ['hollow_heart', 'empty_tome', 'bracer', 'spinach', 'spellbinder', 'pummarola'];
    if (starters.includes(passiveId)) return true;
    return data.unlockedPassives.includes(passiveId);
  }

  public static isStageUnlocked(stageId: string): boolean {
    if (stageId === 'stage_forest') return true; // Starter stage is always unlocked!
    const data = this.load();
    return data.unlockedStages.includes(stageId);
  }

  public static getMaxWeaponSlots(): number {
    let slots = 3;
    if (this.isAchievementUnlocked('ach_slot_4')) slots++;
    if (this.isAchievementUnlocked('ach_slot_5')) slots++;
    if (this.isAchievementUnlocked('ach_slot_6')) slots++;
    return Math.min(6, slots);
  }

  public static getMaxPassiveSlots(): number {
    let slots = 3;
    if (this.isAchievementUnlocked('ach_slot_4')) slots++;
    if (this.isAchievementUnlocked('ach_slot_5')) slots++;
    if (this.isAchievementUnlocked('ach_slot_6')) slots++;
    return Math.min(6, slots);
  }

  public static isAbilityUnlocked(heroId: string, abilityIndex: number): boolean {
    if (abilityIndex === 1) return true; // Primary ability is always unlocked!
    const cleanId = heroId.replace('hero_', '');
    const data = this.load();
    return data.unlockedAbilities.includes(`${cleanId}_${abilityIndex}`);
  }

  public static unlockAbility(heroId: string, abilityIndex: number, cost: number): boolean {
    const cleanId = heroId.replace('hero_', '');
    const abilityKey = `${cleanId}_${abilityIndex}`;
    const data = this.load();
    if (data.unlockedAbilities.includes(abilityKey)) return true;
    if (data.gold < cost) return false;

    data.gold -= cost;
    data.unlockedAbilities.push(abilityKey);
    this.save(data);
    return true;
  }

  public static getEquippedAbility(heroId: string): number {
    const cleanId = heroId.replace('hero_', '');
    const data = this.load();
    const equipped = data.equippedAbilities[cleanId];
    if (equipped === 2 && this.isAbilityUnlocked(cleanId, 2)) {
      return 2;
    }
    return 1;
  }

  public static setEquippedAbility(heroId: string, abilityIndex: number): void {
    const cleanId = heroId.replace('hero_', '');
    const data = this.load();
    data.equippedAbilities[cleanId] = abilityIndex;
    this.save(data);
  }

  /* =========================================================================
     META POWER-UPS SHOP LOGIC
     ========================================================================= */

  public static refundPowerUps(): number {
    const data = this.load();
    let refundedGold = 0;
    let totalPurchased = 0;

    Object.keys(data.powerUps).forEach((key) => {
      const rank = data.powerUps[key] || 0;
      const config = POWER_UPS[key];
      if (config) {
        for (let r = 0; r < rank; r++) {
          const price = calculatePowerUpPrice(config, r, totalPurchased);
          refundedGold += price;
          totalPurchased++;
        }
      }
    });

    data.gold += refundedGold;
    data.powerUps = {};
    this.save(data);
    return refundedGold;
  }

  public static buyPowerUp(powerUpId: string): boolean {
    const data = this.load();
    const config = POWER_UPS[powerUpId];
    if (!config) return false;

    const currentRank = data.powerUps[powerUpId] || 0;
    if (currentRank >= config.maxRank) return false;

    const totalPurchased = Object.values(data.powerUps).reduce((a, b) => a + b, 0);
    const price = calculatePowerUpPrice(config, currentRank, totalPurchased);

    if (data.gold >= price) {
      data.gold -= price;
      data.powerUps[powerUpId] = currentRank + 1;
      this.save(data);
      return true;
    }
    return false;
  }

  public static getActiveMetaStatBonuses(): Record<string, number> {
    const data = this.load();
    const bonuses: Record<string, number> = {};

    Object.keys(data.powerUps).forEach((key) => {
      const rank = data.powerUps[key] || 0;
      const config = POWER_UPS[key];
      if (config && rank > 0) {
        bonuses[config.statKey] = rank * config.bonusPerRank;
      }
    });

    return bonuses;
  }
}
