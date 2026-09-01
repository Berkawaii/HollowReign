export interface PowerUpConfig {
  id: string;
  name: string;
  description: string;
  maxRank: number;
  basePrice: number;
  bonusPerRank: number; // Value to add to character stat per level
  statKey: string;
  isPercentage: boolean;
  icon: string;
}

export const POWER_UPS: Record<string, PowerUpConfig> = {
  might: {
    id: 'might',
    name: 'Might',
    description: 'Increases all weapon damage by +5% per rank.',
    maxRank: 5,
    basePrice: 200,
    bonusPerRank: 0.05,
    statKey: 'might',
    isPercentage: true,
    icon: 'Sword',
  },
  armor: {
    id: 'armor',
    name: 'Armor',
    description: 'Reduces damage taken by 1 per rank.',
    maxRank: 3,
    basePrice: 600,
    bonusPerRank: 1,
    statKey: 'armor',
    isPercentage: false,
    icon: 'Shield',
  },
  maxHealth: {
    id: 'maxHealth',
    name: 'Max Health',
    description: 'Increases total health pool by +10% per rank.',
    maxRank: 3,
    basePrice: 200,
    bonusPerRank: 0.10,
    statKey: 'maxHealth',
    isPercentage: true,
    icon: 'Heart',
  },
  cooldown: {
    id: 'cooldown',
    name: 'Cooldown',
    description: 'Reduces weapon attack cooldown by 5% per rank.',
    maxRank: 2,
    basePrice: 900,
    bonusPerRank: 0.05,
    statKey: 'cooldown',
    isPercentage: true,
    icon: 'Clock',
  },
  amount: {
    id: 'amount',
    name: 'Amount',
    description: 'Adds +1 permanent projectile/attack to all weapons.',
    maxRank: 1,
    basePrice: 5000,
    bonusPerRank: 1,
    statKey: 'amount',
    isPercentage: false,
    icon: 'Layers',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'Gains +5% extra XP from collected gems per rank.',
    maxRank: 5,
    basePrice: 900,
    bonusPerRank: 0.05,
    statKey: 'growth',
    isPercentage: true,
    icon: 'TrendingUp',
  },
  moveSpeed: {
    id: 'moveSpeed',
    name: 'Move Speed',
    description: 'Increases character movement speed by +5% per rank.',
    maxRank: 3,
    basePrice: 300,
    bonusPerRank: 0.05,
    statKey: 'moveSpeed',
    isPercentage: true,
    icon: 'Zap',
  },
  magnet: {
    id: 'magnet',
    name: 'Magnet',
    description: 'Expands gem pickup attraction range by +15% per rank.',
    maxRank: 4,
    basePrice: 300,
    bonusPerRank: 0.15,
    statKey: 'magnet',
    isPercentage: true,
    icon: 'Target',
  },
  greed: {
    id: 'greed',
    name: 'Greed',
    description: 'Increases collected gold coins value by +10% per rank.',
    maxRank: 5,
    basePrice: 200,
    bonusPerRank: 0.10,
    statKey: 'greed',
    isPercentage: true,
    icon: 'Coins',
  },
  recovery: {
    id: 'recovery',
    name: 'Recovery',
    description: 'Recovers +0.1 HP per second per rank.',
    maxRank: 5,
    basePrice: 200,
    bonusPerRank: 0.1,
    statKey: 'recovery',
    isPercentage: false,
    icon: 'Activity',
  },
  luck: {
    id: 'luck',
    name: 'Luck',
    description: 'Improves chest quality, crits, and 4-card level-up chances by +10%.',
    maxRank: 3,
    basePrice: 600,
    bonusPerRank: 0.10,
    statKey: 'luck',
    isPercentage: true,
    icon: 'Clover',
  },
  revival: {
    id: 'revival',
    name: 'Revival',
    description: 'Revives once upon death with 50% HP.',
    maxRank: 1,
    basePrice: 10000,
    bonusPerRank: 1,
    statKey: 'revival',
    isPercentage: false,
    icon: 'RefreshCw',
  },
};

/**
 * Vampire Survivors Inflation Pricing Formula:
 * Price = BasePrice * (1 + 0.1 * TotalOtherPurchasedRanks)
 */
export function calculatePowerUpPrice(
  powerUp: PowerUpConfig | string,
  currentRank: number,
  totalRanksPurchased: number
): number {
  const config = typeof powerUp === 'string' ? POWER_UPS[powerUp] : powerUp;
  if (!config || currentRank >= config.maxRank) return 0;
  const inflationMultiplier = 1 + 0.1 * totalRanksPurchased;
  return Math.round(config.basePrice * inflationMultiplier);
}
