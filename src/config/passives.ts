export interface PassiveLevelEffect {
  level: number;
  description: string;
  statChanges: {
    maxHealthPct?: number;
    cooldownReduction?: number;
    speedPct?: number;
    mightPct?: number;
    durationPct?: number;
    recoveryFlat?: number;
    areaPct?: number;
    magnetPct?: number;
    luckPct?: number;
    amountFlat?: number;
  };
}

export interface PassiveConfig {
  id: string;
  name: string;
  description: string;
  iconId: string;
  maxLevel: number;
  evolutionPartnerFor: string; // Base weapon ID it evolves
  levels: PassiveLevelEffect[];
}

export const PASSIVES: Record<string, PassiveConfig> = {
  hollow_heart: {
    id: 'hollow_heart',
    name: 'Hollow Heart',
    description: 'Increases max health by 20%.',
    iconId: 'icon_hollow_heart',
    maxLevel: 5,
    evolutionPartnerFor: 'whip',
    levels: [
      { level: 1, description: 'Max Health +20%', statChanges: { maxHealthPct: 0.20 } },
      { level: 2, description: 'Max Health +20%', statChanges: { maxHealthPct: 0.20 } },
      { level: 3, description: 'Max Health +20%', statChanges: { maxHealthPct: 0.20 } },
      { level: 4, description: 'Max Health +20%', statChanges: { maxHealthPct: 0.20 } },
      { level: 5, description: 'Max Health +20%', statChanges: { maxHealthPct: 0.20 } },
    ],
  },
  empty_tome: {
    id: 'empty_tome',
    name: 'Empty Tome',
    description: 'Reduces weapon cooldown by 8%.',
    iconId: 'icon_empty_tome',
    maxLevel: 5,
    evolutionPartnerFor: 'magic_wand',
    levels: [
      { level: 1, description: 'Cooldown -8%', statChanges: { cooldownReduction: 0.08 } },
      { level: 2, description: 'Cooldown -8%', statChanges: { cooldownReduction: 0.08 } },
      { level: 3, description: 'Cooldown -8%', statChanges: { cooldownReduction: 0.08 } },
      { level: 4, description: 'Cooldown -8%', statChanges: { cooldownReduction: 0.08 } },
      { level: 5, description: 'Cooldown -8%', statChanges: { cooldownReduction: 0.08 } },
    ],
  },
  bracer: {
    id: 'bracer',
    name: 'Bracer',
    description: 'Increases projectile and attack speed by 10%.',
    iconId: 'icon_bracer',
    maxLevel: 5,
    evolutionPartnerFor: 'knife',
    levels: [
      { level: 1, description: 'Projectile Speed +10%', statChanges: { speedPct: 0.10 } },
      { level: 2, description: 'Projectile Speed +10%', statChanges: { speedPct: 0.10 } },
      { level: 3, description: 'Projectile Speed +10%', statChanges: { speedPct: 0.10 } },
      { level: 4, description: 'Projectile Speed +10%', statChanges: { speedPct: 0.10 } },
      { level: 5, description: 'Projectile Speed +10%', statChanges: { speedPct: 0.10 } },
    ],
  },
  spinach: {
    id: 'spinach',
    name: 'Spinach',
    description: 'Raises weapon damage (Might) by 10%.',
    iconId: 'icon_spinach',
    maxLevel: 5,
    evolutionPartnerFor: 'fire_wand',
    levels: [
      { level: 1, description: 'Damage +10%', statChanges: { mightPct: 0.10 } },
      { level: 2, description: 'Damage +10%', statChanges: { mightPct: 0.10 } },
      { level: 3, description: 'Damage +10%', statChanges: { mightPct: 0.10 } },
      { level: 4, description: 'Damage +10%', statChanges: { mightPct: 0.10 } },
      { level: 5, description: 'Damage +10%', statChanges: { mightPct: 0.10 } },
    ],
  },
  spellbinder: {
    id: 'spellbinder',
    name: 'Spellbinder',
    description: 'Increases attack and spell duration by 10%.',
    iconId: 'icon_spellbinder',
    maxLevel: 5,
    evolutionPartnerFor: 'bible',
    levels: [
      { level: 1, description: 'Effect Duration +10%', statChanges: { durationPct: 0.10 } },
      { level: 2, description: 'Effect Duration +10%', statChanges: { durationPct: 0.10 } },
      { level: 3, description: 'Effect Duration +10%', statChanges: { durationPct: 0.10 } },
      { level: 4, description: 'Effect Duration +10%', statChanges: { durationPct: 0.10 } },
      { level: 5, description: 'Effect Duration +10%', statChanges: { durationPct: 0.10 } },
    ],
  },
  pummarola: {
    id: 'pummarola',
    name: 'Pummarola',
    description: 'Character recovers +0.2 HP per second.',
    iconId: 'icon_pummarola',
    maxLevel: 5,
    evolutionPartnerFor: 'garlic',
    levels: [
      { level: 1, description: 'HP Recovery +0.2/s', statChanges: { recoveryFlat: 0.2 } },
      { level: 2, description: 'HP Recovery +0.2/s', statChanges: { recoveryFlat: 0.2 } },
      { level: 3, description: 'HP Recovery +0.2/s', statChanges: { recoveryFlat: 0.2 } },
      { level: 4, description: 'HP Recovery +0.2/s', statChanges: { recoveryFlat: 0.2 } },
      { level: 5, description: 'HP Recovery +0.2/s', statChanges: { recoveryFlat: 0.2 } },
    ],
  },
  clover: {
    id: 'clover',
    name: 'Clover',
    description: 'Increases Luck by 10% (Crit chance, better chests & 4-card rolls).',
    iconId: 'icon_clover',
    maxLevel: 5,
    evolutionPartnerFor: 'cross',
    levels: [
      { level: 1, description: 'Luck +10%', statChanges: { luckPct: 0.10 } },
      { level: 2, description: 'Luck +10%', statChanges: { luckPct: 0.10 } },
      { level: 3, description: 'Luck +10%', statChanges: { luckPct: 0.10 } },
      { level: 4, description: 'Luck +10%', statChanges: { luckPct: 0.10 } },
      { level: 5, description: 'Luck +10%', statChanges: { luckPct: 0.10 } },
    ],
  },
  duplicator: {
    id: 'duplicator',
    name: 'Duplicator',
    description: 'Adds +1 extra Projectile Amount to all weapons.',
    iconId: 'icon_duplicator',
    maxLevel: 2,
    evolutionPartnerFor: 'lightning_ring',
    levels: [
      { level: 1, description: 'Projectile Amount +1', statChanges: { amountFlat: 1 } },
      { level: 2, description: 'Projectile Amount +1', statChanges: { amountFlat: 1 } },
    ],
  },
  candelabrador: {
    id: 'candelabrador',
    name: 'Candelabrador',
    description: 'Increases attack and explosion area of effect by 10%.',
    iconId: 'icon_candelabrador',
    maxLevel: 5,
    evolutionPartnerFor: 'axe',
    levels: [
      { level: 1, description: 'Area of Effect +10%', statChanges: { areaPct: 0.10 } },
      { level: 2, description: 'Area of Effect +10%', statChanges: { areaPct: 0.10 } },
      { level: 3, description: 'Area of Effect +10%', statChanges: { areaPct: 0.10 } },
      { level: 4, description: 'Area of Effect +10%', statChanges: { areaPct: 0.10 } },
      { level: 5, description: 'Area of Effect +10%', statChanges: { areaPct: 0.10 } },
    ],
  },
  attractorb: {
    id: 'attractorb',
    name: 'Attractorb',
    description: 'Increases gem and pickup attraction magnet range by 25%.',
    iconId: 'icon_attractorb',
    maxLevel: 5,
    evolutionPartnerFor: 'santa_water',
    levels: [
      { level: 1, description: 'Magnet Range +25%', statChanges: { magnetPct: 0.25 } },
      { level: 2, description: 'Magnet Range +25%', statChanges: { magnetPct: 0.25 } },
      { level: 3, description: 'Magnet Range +25%', statChanges: { magnetPct: 0.25 } },
      { level: 4, description: 'Magnet Range +25%', statChanges: { magnetPct: 0.25 } },
      { level: 5, description: 'Magnet Range +25%', statChanges: { magnetPct: 0.25 } },
    ],
  },
};
