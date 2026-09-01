export interface CharacterStats {
  might: number;        // % damage bonus (1.0 = 100%)
  armor: number;        // flat physical damage reduction
  maxHealth: number;    // maximum HP
  recovery: number;     // HP per second
  cooldown: number;     // attack cooldown multiplier (0.9 = 10% faster)
  area: number;         // AoE scale multiplier (1.0 = 100%)
  speed: number;        // projectile speed multiplier
  duration: number;     // projectile active duration multiplier
  amount: number;       // extra projectile count
  moveSpeed: number;    // character movement speed in px/s
  magnet: number;       // pickup attraction range in px
  luck: number;         // chance for 4th card, crits, better chests
  growth: number;       // XP multiplier (1.0 = 100%)
  greed: number;        // Gold multiplier (1.0 = 100%)
  curse: number;        // Enemy HP/speed multiplier
  revival: number;      // Extra lives
  rerolls: number;      // Level-up card reroll count
}

export interface HeroConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  startingWeaponId: string;
  baseStats: CharacterStats;
  traitDescription: string;
  color: string;
  accentColor: string;
  spriteId: string;
}

export const HEROES: HeroConfig[] = [
  {
    id: 'valerius',
    name: 'Valerius',
    title: 'Abyssal Warden',
    description: 'Heavy armor and iron will, tainted by the deep void. Wields the Abyssal Edge.',
    startingWeaponId: 'whip',
    traitDescription: 'Gains +1 permanent Void Armor every 10 levels.',
    color: '#4f46e5',
    accentColor: '#818cf8',
    spriteId: 'hero_valerius',
    baseStats: {
      might: 1.0,
      armor: 1,
      maxHealth: 120,
      recovery: 0.5,
      cooldown: 1.0,
      area: 1.0,
      speed: 1.0,
      duration: 1.0,
      amount: 0,
      moveSpeed: 145,
      magnet: 80,
      luck: 1.0,
      growth: 1.0,
      greed: 1.0,
      curse: 1.0,
      revival: 0,
      rerolls: 1,
    },
  },
  {
    id: 'sylvia',
    name: 'Sylvia',
    title: 'Astral Occultist',
    description: 'Communes with outer cosmic entities to cast piercing void darts.',
    startingWeaponId: 'magic_wand',
    traitDescription: 'Adds +1 Void Projectile Amount to all weapons every 20 levels.',
    color: '#06b6d4',
    accentColor: '#67e8f9',
    spriteId: 'hero_sylvia',
    baseStats: {
      might: 1.0,
      armor: 0,
      maxHealth: 90,
      recovery: 0,
      cooldown: 0.85,
      area: 1.2,
      speed: 1.0,
      duration: 1.0,
      amount: 0,
      moveSpeed: 150,
      magnet: 90,
      luck: 1.1,
      growth: 1.05,
      greed: 1.0,
      curse: 1.0,
      revival: 0,
      rerolls: 2,
    },
  },
  {
    id: 'ignis',
    name: 'Ignis',
    title: 'Blackfire Pyromancer',
    description: 'Harnesses cursed blackfire from dead stars to incinerate cosmic horrors.',
    startingWeaponId: 'fire_wand',
    traitDescription: 'Critical strikes ignite monstrosities with abyssal blackfire (+50% burn).',
    color: '#c026d3',
    accentColor: '#e879f9',
    spriteId: 'hero_ignis',
    baseStats: {
      might: 1.2,
      armor: 0,
      maxHealth: 100,
      recovery: 0,
      cooldown: 1.1,
      area: 1.15,
      speed: 0.9,
      duration: 1.0,
      amount: 0,
      moveSpeed: 140,
      magnet: 75,
      luck: 1.15,
      growth: 1.0,
      greed: 1.0,
      curse: 1.0,
      revival: 0,
      rerolls: 1,
    },
  },
  {
    id: 'kaelen',
    name: 'Kaelen',
    title: 'Void Stalker',
    description: 'Cultist rogue slipping through spatial rifts with deadly obsidian fangs.',
    startingWeaponId: 'knife',
    traitDescription: 'Slips into the void gaining +40% Movement Speed when below 30% health.',
    color: '#059669',
    accentColor: '#34d399',
    spriteId: 'hero_kaelen',
    baseStats: {
      might: 0.9,
      armor: 0,
      maxHealth: 85,
      recovery: 0,
      cooldown: 0.9,
      area: 0.9,
      speed: 1.3,
      duration: 1.0,
      amount: 1,
      moveSpeed: 175,
      magnet: 85,
      luck: 1.2,
      growth: 1.0,
      greed: 1.1,
      curse: 1.0,
      revival: 0,
      rerolls: 2,
    },
  },
  {
    id: 'mortimer',
    name: 'Mortimer',
    title: 'Necro-Alchemist',
    description: 'Former scholar of Miskatonic delving into forbidden resurrection arts.',
    startingWeaponId: 'bone',
    traitDescription: 'Infuses projectiles with cosmic inertia (+20% projectile duration).',
    color: '#7c3aed',
    accentColor: '#c084fc',
    spriteId: 'hero_mortimer',
    baseStats: {
      might: 1.0,
      armor: 0,
      maxHealth: 95,
      recovery: 0.2,
      cooldown: 1.0,
      area: 1.0,
      speed: 1.0,
      duration: 1.2,
      amount: 0,
      moveSpeed: 148,
      magnet: 100,
      luck: 1.0,
      growth: 1.1,
      greed: 1.15,
      curse: 1.05,
      revival: 1,
      rerolls: 1,
    },
  },
];
