export type EnemyBehaviorType = 'chase' | 'swarm' | 'ranged' | 'tank' | 'boss' | 'reaper';

export interface EnemyConfig {
  id: string;
  name: string;
  subtitle?: string;
  behavior: EnemyBehaviorType;
  baseHp: number;
  baseSpeed: number; // px per second
  baseDamage: number;
  xpValue: number;
  radius: number;    // Hitbox radius in px
  spriteId: string;
  color: string;
  knockbackResistance: number; // 0 = full knockback, 1 = immune
  dropsChest?: boolean;
}

export const ENEMIES: Record<string, EnemyConfig> = {
  // 1. Swarm Fodder
  bat: {
    id: 'bat',
    name: 'Nightgaunt Parasite',
    behavior: 'swarm',
    baseHp: 18,
    baseSpeed: 115,
    baseDamage: 6,
    xpValue: 1,
    radius: 12,
    spriteId: 'enemy_bat',
    color: '#6366f1',
    knockbackResistance: 0.1,
  },

  // 2. Standard Chaser
  zombie: {
    id: 'zombie',
    name: 'Sunken Husk',
    behavior: 'chase',
    baseHp: 50,
    baseSpeed: 48,
    baseDamage: 10,
    xpValue: 2,
    radius: 16,
    spriteId: 'enemy_zombie',
    color: '#0d9488',
    knockbackResistance: 0.3,
  },

  // 3. Ranged Archer
  skeleton: {
    id: 'skeleton',
    name: 'Void Spawn',
    behavior: 'ranged',
    baseHp: 45,
    baseSpeed: 60,
    baseDamage: 10,
    xpValue: 3,
    radius: 16,
    spriteId: 'enemy_skeleton',
    color: '#8b5cf6',
    knockbackResistance: 0.2,
  },

  // 4. Armored Tank
  knight: {
    id: 'knight',
    name: 'Corrupted Inquisitor',
    behavior: 'tank',
    baseHp: 220,
    baseSpeed: 38,
    baseDamage: 18,
    xpValue: 8,
    radius: 22,
    spriteId: 'enemy_knight',
    color: '#475569',
    knockbackResistance: 0.75,
  },

  // 5. Mini-Boss 1 (Min 5): Leviathan Behemoth
  minotaur_boss: {
    id: 'minotaur_boss',
    name: 'Leviathan Behemoth',
    subtitle: 'Ancient Abyssal Terror',
    behavior: 'boss',
    baseHp: 1400,
    baseSpeed: 65,
    baseDamage: 22,
    xpValue: 80,
    radius: 32,
    spriteId: 'enemy_minotaur_boss',
    color: '#0284c7',
    knockbackResistance: 0.9,
    dropsChest: true,
  },

  // 6. Mini-Boss 2 (Min 10): Spawn of Shub-Niggurath
  gorgon_boss: {
    id: 'gorgon_boss',
    name: 'Spawn of Shub-Niggurath',
    subtitle: 'Scion of the Black Goat',
    behavior: 'boss',
    baseHp: 2400,
    baseSpeed: 55,
    baseDamage: 26,
    xpValue: 120,
    radius: 32,
    spriteId: 'enemy_gorgon_boss',
    color: '#15803d',
    knockbackResistance: 0.9,
    dropsChest: true,
  },

  // 7. Mini-Boss 3 (Min 15): Herald of Nyarlathotep
  vampire_boss: {
    id: 'vampire_boss',
    name: 'Herald of Nyarlathotep',
    subtitle: 'The Crawling Chaos',
    behavior: 'boss',
    baseHp: 3800,
    baseSpeed: 70,
    baseDamage: 30,
    xpValue: 200,
    radius: 32,
    spriteId: 'enemy_vampire_boss',
    color: '#9333ea',
    knockbackResistance: 0.95,
    dropsChest: true,
  },

  // 8. Mini-Boss 4 (Min 20): High Priest of R'lyeh
  necromancer_boss: {
    id: 'necromancer_boss',
    name: "High Priest of R'lyeh",
    subtitle: 'Voice of the Deep Slumber',
    behavior: 'boss',
    baseHp: 5600,
    baseSpeed: 60,
    baseDamage: 36,
    xpValue: 300,
    radius: 34,
    spriteId: 'enemy_necromancer_boss',
    color: '#c026d3',
    knockbackResistance: 0.95,
    dropsChest: true,
  },

  // 9. Minute 30 Inevitable Death: The Ancient One
  reaper: {
    id: 'reaper',
    name: 'The Ancient One (Cthulhu)',
    subtitle: 'Harbinger of Cosmic Oblivion',
    behavior: 'reaper',
    baseHp: 655350,
    baseSpeed: 280,
    baseDamage: 99999,
    xpValue: 0,
    radius: 34,
    spriteId: 'enemy_reaper',
    color: '#10b981',
    knockbackResistance: 1.0,
  },
};

/**
 * Calculates balanced monster HP based on base HP, survival minutes, curse, and player level.
 */
export function calculateSpawnHp(
  enemy: EnemyConfig,
  elapsedMinutes: number,
  curse: number = 1.0,
  playerLevel: number = 1
): number {
  if (enemy.behavior === 'reaper') return enemy.baseHp;

  const timeMultiplier = 1.0 + 0.08 * elapsedMinutes;
  const levelMultiplier = 1.0 + 0.02 * Math.max(0, playerLevel - 1);
  const curseMultiplier = Math.max(1.0, curse);

  return Math.round(enemy.baseHp * timeMultiplier * levelMultiplier * curseMultiplier);
}
