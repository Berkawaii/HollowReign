export interface StageConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  unlockCondition: string;
  achievementId?: string;
  theme: {
    bgColor: string;
    gridColor: string;
    obstacleColor: string;
    pillarColor: string;
    ambientParticleColor: string;
    musicTheme: string;
  };
  enemyPalette: {
    basic: string;
    swarmer: string;
    fast: string;
    tank: string;
    elite: string;
    ranged: string;
  };
  bossNames: {
    minute8: string;
    minute15: string;
    minute25: string;
    minute30: string;
  };
  environmentalHazards: string[];
}

export const STAGES: StageConfig[] = [
  {
    id: 'stage_forest',
    name: "Sunken Ruins of R'lyeh",
    title: 'Stage 1: The Flooded Metropolis',
    description: 'Ancient sunken basalt monoliths rising from the black sea, crawling with nightgaunts and deep-sea husks.',
    unlockCondition: 'Unlocked by default',
    theme: {
      bgColor: '#0a0e16',
      gridColor: '#0e1420',
      obstacleColor: '#1e293b',
      pillarColor: '#0e7490',
      ambientParticleColor: 'rgba(6, 182, 212, 0.12)',
      musicTheme: 'forest',
    },
    enemyPalette: {
      basic: '#0d9488', // sunken husk
      swarmer: '#6366f1', // nightgaunt
      fast: '#06b6d4', // deep crawler
      tank: '#475569', // corrupted inquisitor
      elite: '#f43f5e', // crimson horror
      ranged: '#8b5cf6', // void spawn
    },
    bossNames: {
      minute8: 'Leviathan Behemoth',
      minute15: 'Spawn of Shub-Niggurath',
      minute25: 'Herald of Nyarlathotep',
      minute30: 'The Ancient One (Cthulhu)',
    },
    environmentalHazards: ['Submerged basalt ruins and eldritch monoliths', 'Nightgaunt swarms descending at minute 5 and 12'],
  },
  {
    id: 'stage_molten',
    name: 'Abyssal Trench',
    title: 'Stage 2: The Sunken Pit',
    description: 'A crushing deep-sea trench where volcanic hydrothermal vents spew eldritch magma and leviathans hunt.',
    unlockCondition: "Survive 10 minutes in Sunken Ruins of R'lyeh",
    achievementId: 'survive_forest_10',
    theme: {
      bgColor: '#080811',
      gridColor: '#1a102b',
      obstacleColor: '#4c1d95',
      pillarColor: '#7c3aed',
      ambientParticleColor: 'rgba(192, 132, 252, 0.35)',
      musicTheme: 'molten',
    },
    enemyPalette: {
      basic: '#ea580c', // magma spawn
      swarmer: '#dc2626', // blood parasite
      fast: '#f97316', // abyssal stalker
      tank: '#581c87', // void titan
      elite: '#fbbf24', // elder champion
      ranged: '#c026d3', // tentacle caster
    },
    bossNames: {
      minute8: 'Abyssal Colossus',
      minute15: 'Leviathan Chimera',
      minute25: "Dagon's Chosen",
      minute30: 'Crimson Void Reaper',
    },
    environmentalHazards: [
      'Violent hydrothermal vents and non-Euclidean abyssal cliffs',
      '+15% Enemy Damage and enraged horror swarms',
    ],
  },
  {
    id: 'stage_library',
    name: 'Miskatonic Void Spire',
    title: 'Stage 3: Forbidden Cosmic Archive',
    description: 'An impossible non-Euclidean astral spire peering directly into the outer cosmic madness.',
    unlockCondition: 'Defeat Leviathan Behemoth or Spawn of Shub-Niggurath in Abyssal Trench',
    achievementId: 'boss_molten_gorgon',
    theme: {
      bgColor: '#08050e',
      gridColor: '#180d2b',
      obstacleColor: '#3b0764',
      pillarColor: '#a855f7',
      ambientParticleColor: 'rgba(217, 70, 239, 0.35)',
      musicTheme: 'library',
    },
    enemyPalette: {
      basic: '#818cf8', // living forbidden grimoire
      swarmer: '#c084fc', // cosmic wisp
      fast: '#67e8f9', // astral phantom
      tank: '#4f46e5', // void sentinel
      elite: '#ec4899', // nyarlathotep avatar
      ranged: '#a78bfa', // elder herald
    },
    bossNames: {
      minute8: "Keeper of R'lyeh",
      minute15: 'Astral All-Seeing Eye',
      minute25: 'Faceless Phantasm',
      minute30: 'Azathoth Harbinger',
    },
    environmentalHazards: [
      'Shifting spatial rifts and whispering cosmic madness',
      '+20% Enemy Density and devastating void barrages',
    ],
  },
];
