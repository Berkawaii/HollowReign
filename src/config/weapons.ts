export interface WeaponLevelStats {
  level: number;
  damage: number;
  cooldown: number;    // seconds
  projectiles: number;
  speed: number;
  area: number;
  duration: number;    // seconds
  piercing: number;    // -1 or 999 = infinite
  knockback: number;
  description: string;
}

export interface WeaponConfig {
  id: string;
  name: string;
  description: string;
  iconId: string;
  spriteId: string;
  maxLevel: number;
  isEvolution: boolean;
  evolutionPartnerPassive?: string;
  evolvedFromWeaponId?: string;
  evolutionWeaponId?: string;
  soundEffect: string;
  levels: WeaponLevelStats[];
}

export const WEAPONS: Record<string, WeaponConfig> = {
  // -------------------------------------------------------------
  // 1. ABYSSAL EDGE & BLOOD CARVER
  // -------------------------------------------------------------
  whip: {
    id: 'whip',
    name: 'Abyssal Edge',
    description: 'Cleaves through reality with sweeping void blade slashes.',
    iconId: 'icon_whip',
    spriteId: 'proj_whip_slash',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'hollow_heart',
    evolutionWeaponId: 'bloody_tear',
    soundEffect: 'whip',
    levels: [
      { level: 1, damage: 24, cooldown: 1.30, projectiles: 1, speed: 0, area: 1.0, duration: 0.22, piercing: 999, knockback: 18, description: 'Sweeping void blade slash.' },
      { level: 2, damage: 32, cooldown: 1.25, projectiles: 1, speed: 0, area: 1.15, duration: 0.22, piercing: 999, knockback: 20, description: 'Damage +8, Area +15%' },
      { level: 3, damage: 40, cooldown: 1.20, projectiles: 2, speed: 0, area: 1.15, duration: 0.22, piercing: 999, knockback: 22, description: 'Double slash! Cleaves behind as well (+1 Attack)' },
      { level: 4, damage: 50, cooldown: 1.15, projectiles: 2, speed: 0, area: 1.25, duration: 0.22, piercing: 999, knockback: 24, description: 'Damage +10, Area +10%' },
      { level: 5, damage: 62, cooldown: 1.10, projectiles: 2, speed: 0, area: 1.35, duration: 0.22, piercing: 999, knockback: 28, description: 'Damage +12, Area +10%' },
      { level: 6, damage: 76, cooldown: 1.05, projectiles: 2, speed: 0, area: 1.45, duration: 0.22, piercing: 999, knockback: 30, description: 'Damage +14, Area +10%' },
      { level: 7, damage: 92, cooldown: 1.00, projectiles: 2, speed: 0, area: 1.55, duration: 0.22, piercing: 999, knockback: 32, description: 'Damage +16, Area +10%' },
      { level: 8, damage: 115, cooldown: 0.90, projectiles: 2, speed: 0, area: 1.70, duration: 0.22, piercing: 999, knockback: 38, description: 'Damage +23, Colossal Blade Sweep!' },
    ],
  },
  bloody_tear: {
    id: 'bloody_tear',
    name: 'Blood Carver',
    description: 'Evolved Greatsword: Colossal crimson void wave that tears flesh and drains life essence.',
    iconId: 'icon_bloody_tear',
    spriteId: 'proj_whip_slash',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'whip',
    soundEffect: 'whip_crit',
    levels: [
      { level: 1, damage: 150, cooldown: 0.80, projectiles: 2, speed: 0, area: 1.9, duration: 0.25, piercing: 999, knockback: 45, description: 'Massive dual crimson slash waves, critical strikes and heals player on hit!' },
    ],
  },

  // -------------------------------------------------------------
  // 2. VOID DARTS & COSMIC RUPTURE
  // -------------------------------------------------------------
  magic_wand: {
    id: 'magic_wand',
    name: 'Void Darts',
    description: 'Hurls homing cosmic void darts seeking the nearest prey.',
    iconId: 'icon_magic_wand',
    spriteId: 'proj_magic_bolt',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'empty_tome',
    evolutionWeaponId: 'holy_wand',
    soundEffect: 'magic_bolt',
    levels: [
      { level: 1, damage: 16, cooldown: 1.2, projectiles: 1, speed: 340, area: 1.0, duration: 2.0, piercing: 1, knockback: 10, description: 'Fires 1 void dart at nearest foe.' },
      { level: 2, damage: 20, cooldown: 1.1, projectiles: 2, speed: 360, area: 1.0, duration: 2.0, piercing: 1, knockback: 10, description: 'Dart Amount +1' },
      { level: 3, damage: 25, cooldown: 1.0, projectiles: 2, speed: 380, area: 1.0, duration: 2.0, piercing: 1, knockback: 12, description: 'Damage +5, Cooldown -10%' },
      { level: 4, damage: 30, cooldown: 0.9, projectiles: 3, speed: 400, area: 1.0, duration: 2.0, piercing: 1, knockback: 12, description: 'Dart Amount +1' },
      { level: 5, damage: 36, cooldown: 0.8, projectiles: 3, speed: 420, area: 1.1, duration: 2.0, piercing: 2, knockback: 15, description: 'Pierce Count +1' },
      { level: 6, damage: 42, cooldown: 0.7, projectiles: 4, speed: 440, area: 1.1, duration: 2.0, piercing: 2, knockback: 15, description: 'Dart Amount +1' },
      { level: 7, damage: 50, cooldown: 0.65, projectiles: 4, speed: 460, area: 1.2, duration: 2.0, piercing: 2, knockback: 18, description: 'Damage +8, Missile Speed +10%' },
      { level: 8, damage: 60, cooldown: 0.6, projectiles: 5, speed: 480, area: 1.2, duration: 2.0, piercing: 3, knockback: 20, description: 'Dart Amount +1, Pierce +1' },
    ],
  },
  holy_wand: {
    id: 'holy_wand',
    name: 'Cosmic Rupture',
    description: 'Evolved Void Darts: Zero cooldown, fires a continuous stream of piercing astral beams.',
    iconId: 'icon_holy_wand',
    spriteId: 'proj_magic_bolt',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'magic_wand',
    soundEffect: 'laser_beam',
    levels: [
      { level: 1, damage: 70, cooldown: 0.12, projectiles: 1, speed: 550, area: 1.4, duration: 1.5, piercing: 5, knockback: 22, description: 'Rapid cosmic barrage with relentless piercing power!' },
    ],
  },

  // -------------------------------------------------------------
  // 3. OBSIDIAN FANGS & ENDLESS MAW
  // -------------------------------------------------------------
  knife: {
    id: 'knife',
    name: 'Obsidian Fangs',
    description: 'Hurls razor-sharp black obsidian fangs in your movement/facing direction.',
    iconId: 'icon_knife',
    spriteId: 'proj_knife',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'bracer',
    evolutionWeaponId: 'thousand_edge',
    soundEffect: 'knife_throw',
    levels: [
      { level: 1, damage: 14, cooldown: 1.0, projectiles: 1, speed: 440, area: 1.0, duration: 1.5, piercing: 1, knockback: 5, description: 'Fires 1 obsidian fang straight.' },
      { level: 2, damage: 18, cooldown: 0.95, projectiles: 2, speed: 460, area: 1.0, duration: 1.5, piercing: 1, knockback: 5, description: 'Fang Amount +1' },
      { level: 3, damage: 22, cooldown: 0.90, projectiles: 3, speed: 480, area: 1.0, duration: 1.5, piercing: 1, knockback: 6, description: 'Fang Amount +1' },
      { level: 4, damage: 26, cooldown: 0.85, projectiles: 3, speed: 500, area: 1.0, duration: 1.5, piercing: 2, knockback: 6, description: 'Pierce Count +1' },
      { level: 5, damage: 32, cooldown: 0.80, projectiles: 4, speed: 520, area: 1.0, duration: 1.5, piercing: 2, knockback: 8, description: 'Fang Amount +1' },
      { level: 6, damage: 38, cooldown: 0.75, projectiles: 5, speed: 540, area: 1.0, duration: 1.5, piercing: 2, knockback: 8, description: 'Fang Amount +1' },
      { level: 7, damage: 45, cooldown: 0.70, projectiles: 5, speed: 570, area: 1.1, duration: 1.5, piercing: 3, knockback: 10, description: 'Damage +7, Pierce +1' },
      { level: 8, damage: 55, cooldown: 0.65, projectiles: 6, speed: 600, area: 1.1, duration: 1.5, piercing: 3, knockback: 12, description: 'Fang Amount +1, Maximum Speed!' },
    ],
  },
  thousand_edge: {
    id: 'thousand_edge',
    name: 'Endless Maw',
    description: 'Evolved Fangs: An unrelenting, breathless tempest of obsidian void blades.',
    iconId: 'icon_thousand_edge',
    spriteId: 'proj_knife',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'knife',
    soundEffect: 'knife_throw',
    levels: [
      { level: 1, damage: 60, cooldown: 0.08, projectiles: 1, speed: 700, area: 1.2, duration: 1.2, piercing: 5, knockback: 15, description: 'Continuous stream of deadly throwing obsidian blades!' },
    ],
  },

  // -------------------------------------------------------------
  // 4. BLACKFIRE ORB & STARFALL ABOMINATION
  // -------------------------------------------------------------
  fire_wand: {
    id: 'fire_wand',
    name: 'Blackfire Orb',
    description: 'Conjures volatile spheres of cursed black flame torn from dead stars.',
    iconId: 'icon_fire_wand',
    spriteId: 'proj_fireball',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'spinach',
    evolutionWeaponId: 'hellfire',
    soundEffect: 'fireball',
    levels: [
      { level: 1, damage: 45, cooldown: 2.2, projectiles: 1, speed: 280, area: 1.0, duration: 2.5, piercing: 1, knockback: 20, description: 'Volatile cursed blackfire orb.' },
      { level: 2, damage: 55, cooldown: 2.1, projectiles: 1, speed: 300, area: 1.1, duration: 2.5, piercing: 1, knockback: 22, description: 'Damage +10, Area +10%' },
      { level: 3, damage: 68, cooldown: 2.0, projectiles: 2, speed: 320, area: 1.1, duration: 2.5, piercing: 1, knockback: 25, description: 'Orb Amount +1' },
      { level: 4, damage: 80, cooldown: 1.9, projectiles: 2, speed: 340, area: 1.2, duration: 2.5, piercing: 2, knockback: 25, description: 'Pierce Count +1' },
      { level: 5, damage: 95, cooldown: 1.8, projectiles: 3, speed: 360, area: 1.3, duration: 2.5, piercing: 2, knockback: 30, description: 'Orb Amount +1' },
      { level: 6, damage: 115, cooldown: 1.7, projectiles: 3, speed: 380, area: 1.4, duration: 2.5, piercing: 2, knockback: 35, description: 'Damage +20, Area +10%' },
      { level: 7, damage: 135, cooldown: 1.6, projectiles: 4, speed: 400, area: 1.5, duration: 2.5, piercing: 3, knockback: 40, description: 'Orb Amount +1, Pierce +1' },
      { level: 8, damage: 165, cooldown: 1.5, projectiles: 4, speed: 420, area: 1.6, duration: 2.5, piercing: 3, knockback: 45, description: 'Catastrophic dark matter flame!' },
    ],
  },
  hellfire: {
    id: 'hellfire',
    name: 'Starfall Abomination',
    description: 'Evolved Blackfire: Fires gigantic cosmic plasma orbs that pierce all monstrosities.',
    iconId: 'icon_hellfire',
    spriteId: 'proj_fireball',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'fire_wand',
    soundEffect: 'explosion',
    levels: [
      { level: 1, damage: 230, cooldown: 1.3, projectiles: 4, speed: 300, area: 2.2, duration: 4.0, piercing: 999, knockback: 50, description: 'Massive infinite-pierce starfall waves!' },
    ],
  },

  // -------------------------------------------------------------
  // 5. TOME OF R'LYEH & GRIMOIRE OF THE DEEP
  // -------------------------------------------------------------
  bible: {
    id: 'bible',
    name: "Tome of R'lyeh",
    description: 'Summons forbidden scripture parchment pages whispering cosmic madness in an orbital ward.',
    iconId: 'icon_bible',
    spriteId: 'proj_bible',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'spellbinder',
    evolutionWeaponId: 'unholy_vespers',
    soundEffect: 'bible_spin',
    levels: [
      { level: 1, damage: 18, cooldown: 3.0, projectiles: 1, speed: 2.5, area: 1.0, duration: 3.0, piercing: 999, knockback: 15, description: '1 forbidden page orbits around you.' },
      { level: 2, damage: 24, cooldown: 2.8, projectiles: 2, speed: 2.8, area: 1.0, duration: 3.2, piercing: 999, knockback: 18, description: 'Page Amount +1' },
      { level: 3, damage: 30, cooldown: 2.6, projectiles: 2, speed: 3.0, area: 1.1, duration: 3.5, piercing: 999, knockback: 20, description: 'Orbit Speed & Duration up' },
      { level: 4, damage: 36, cooldown: 2.4, projectiles: 3, speed: 3.2, area: 1.1, duration: 3.8, piercing: 999, knockback: 22, description: 'Page Amount +1' },
      { level: 5, damage: 45, cooldown: 2.2, projectiles: 3, speed: 3.5, area: 1.2, duration: 4.0, piercing: 999, knockback: 25, description: 'Damage +9, Area +10%' },
      { level: 6, damage: 54, cooldown: 2.0, projectiles: 4, speed: 3.8, area: 1.3, duration: 4.3, piercing: 999, knockback: 28, description: 'Page Amount +1' },
      { level: 7, damage: 65, cooldown: 1.8, projectiles: 4, speed: 4.0, area: 1.4, duration: 4.6, piercing: 999, knockback: 30, description: 'Damage +11, Orbit Speed up' },
      { level: 8, damage: 80, cooldown: 1.5, projectiles: 5, speed: 4.5, area: 1.5, duration: 5.0, piercing: 999, knockback: 35, description: 'Page Amount +1, Near permanent shield!' },
    ],
  },
  unholy_vespers: {
    id: 'unholy_vespers',
    name: 'Grimoire of the Deep',
    description: 'Evolved Tome: Unholy eldritch grimoire pages orbit eternally, shielding against the horde.',
    iconId: 'icon_unholy_vespers',
    spriteId: 'proj_bible',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'bible',
    soundEffect: 'bible_spin',
    levels: [
      { level: 1, damage: 95, cooldown: 0.01, projectiles: 6, speed: 5.0, area: 1.6, duration: 99999, piercing: 999, knockback: 40, description: 'Permanent, unstoppable eldritch barrier!' },
    ],
  },

  // -------------------------------------------------------------
  // 6. ABYSSAL MIASMA & VOID SIPHON
  // -------------------------------------------------------------
  garlic: {
    id: 'garlic',
    name: 'Abyssal Miasma',
    description: 'Emits a noxious eldritch cloud that rots the flesh of all nearby abominations.',
    iconId: 'icon_garlic',
    spriteId: 'proj_garlic_aura',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'pummarola',
    evolutionWeaponId: 'soul_eater',
    soundEffect: 'garlic_pulse',
    levels: [
      { level: 1, damage: 10, cooldown: 1.2, projectiles: 1, speed: 0, area: 1.0, duration: 0.5, piercing: 999, knockback: 8, description: 'Pulsing rot aura.' },
      { level: 2, damage: 15, cooldown: 1.1, projectiles: 1, speed: 0, area: 1.15, duration: 0.5, piercing: 999, knockback: 10, description: 'Area +15%, Damage +5' },
      { level: 3, damage: 20, cooldown: 1.0, projectiles: 1, speed: 0, area: 1.30, duration: 0.5, piercing: 999, knockback: 12, description: 'Area +15%, Damage +5' },
      { level: 4, damage: 26, cooldown: 0.9, projectiles: 1, speed: 0, area: 1.45, duration: 0.5, piercing: 999, knockback: 15, description: 'Knockback increased' },
      { level: 5, damage: 32, cooldown: 0.8, projectiles: 1, speed: 0, area: 1.60, duration: 0.5, piercing: 999, knockback: 18, description: 'Damage +6, Area +15%' },
      { level: 6, damage: 40, cooldown: 0.7, projectiles: 1, speed: 0, area: 1.75, duration: 0.5, piercing: 999, knockback: 20, description: 'Damage +8, Area +15%' },
      { level: 7, damage: 48, cooldown: 0.6, projectiles: 1, speed: 0, area: 1.90, duration: 0.5, piercing: 999, knockback: 22, description: 'Damage +8, Area +15%' },
      { level: 8, damage: 60, cooldown: 0.5, projectiles: 1, speed: 0, area: 2.10, duration: 0.5, piercing: 999, knockback: 25, description: 'Giant swarm rotting miasma!' },
    ],
  },
  soul_eater: {
    id: 'soul_eater',
    name: 'Void Siphon',
    description: 'Evolved Miasma: A colossal singularity aura that devours life essence from fallen foes.',
    iconId: 'icon_soul_eater',
    spriteId: 'proj_garlic_aura',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'garlic',
    soundEffect: 'garlic_pulse',
    levels: [
      { level: 1, damage: 95, cooldown: 0.4, projectiles: 1, speed: 0, area: 2.8, duration: 0.6, piercing: 999, knockback: 45, description: 'Giant singularity aura + lifesteal and heavy knockback!' },
    ],
  },

  // -------------------------------------------------------------
  // 7. CRYPT SHARDS
  // -------------------------------------------------------------
  bone: {
    id: 'bone',
    name: 'Crypt Shards',
    description: 'Hurls cursed bone shards that ricochet wildly between monstrosities.',
    iconId: 'icon_bone',
    spriteId: 'proj_bone',
    maxLevel: 8,
    isEvolution: false,
    soundEffect: 'bone_throw',
    levels: [
      { level: 1, damage: 28, cooldown: 1.5, projectiles: 1, speed: 340, area: 1.0, duration: 3.5, piercing: 4, knockback: 15, description: 'Bouncing bone shards.' },
      { level: 2, damage: 36, cooldown: 1.4, projectiles: 2, speed: 360, area: 1.0, duration: 3.5, piercing: 5, knockback: 18, description: 'Shard Amount +1' },
      { level: 3, damage: 45, cooldown: 1.3, projectiles: 2, speed: 380, area: 1.1, duration: 4.0, piercing: 6, knockback: 20, description: 'Bounces & Duration up' },
      { level: 4, damage: 56, cooldown: 1.2, projectiles: 3, speed: 400, area: 1.1, duration: 4.0, piercing: 7, knockback: 22, description: 'Shard Amount +1' },
      { level: 5, damage: 70, cooldown: 1.1, projectiles: 3, speed: 420, area: 1.2, duration: 4.5, piercing: 8, knockback: 25, description: 'Damage +14, Area +10%' },
      { level: 6, damage: 85, cooldown: 1.0, projectiles: 4, speed: 440, area: 1.2, duration: 4.5, piercing: 9, knockback: 28, description: 'Shard Amount +1' },
      { level: 7, damage: 100, cooldown: 0.9, projectiles: 4, speed: 470, area: 1.3, duration: 5.0, piercing: 10, knockback: 30, description: 'Bounce Count +2' },
      { level: 8, damage: 125, cooldown: 0.8, projectiles: 5, speed: 500, area: 1.3, duration: 5.5, piercing: 12, knockback: 35, description: 'Shard Amount +1, Devastating Bounces!' },
    ],
  },

  // -------------------------------------------------------------
  // 8. ELDER WARD & COSMIC BRAND
  // -------------------------------------------------------------
  cross: {
    id: 'cross',
    name: 'Elder Ward',
    description: 'Casts a star-shaped eldritch sigil that boomerangs through the abyss.',
    iconId: 'icon_cross',
    spriteId: 'proj_cross',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'clover',
    evolutionWeaponId: 'heaven_sword',
    soundEffect: 'knife_throw',
    levels: [
      { level: 1, damage: 30, cooldown: 1.8, projectiles: 1, speed: 400, area: 1.0, duration: 2.2, piercing: 999, knockback: 18, description: 'Boomerang eldritch ward sigil.' },
      { level: 2, damage: 38, cooldown: 1.7, projectiles: 1, speed: 420, area: 1.1, duration: 2.2, piercing: 999, knockback: 20, description: 'Damage +8, Area +10%' },
      { level: 3, damage: 46, cooldown: 1.6, projectiles: 2, speed: 440, area: 1.1, duration: 2.4, piercing: 999, knockback: 22, description: 'Ward Amount +1' },
      { level: 4, damage: 55, cooldown: 1.5, projectiles: 2, speed: 460, area: 1.2, duration: 2.4, piercing: 999, knockback: 24, description: 'Damage +9, Area +10%' },
      { level: 5, damage: 68, cooldown: 1.4, projectiles: 3, speed: 480, area: 1.2, duration: 2.6, piercing: 999, knockback: 26, description: 'Ward Amount +1' },
      { level: 6, damage: 82, cooldown: 1.3, projectiles: 3, speed: 500, area: 1.3, duration: 2.6, piercing: 999, knockback: 28, description: 'Damage +14, Speed +10%' },
      { level: 7, damage: 98, cooldown: 1.2, projectiles: 4, speed: 520, area: 1.3, duration: 2.8, piercing: 999, knockback: 30, description: 'Ward Amount +1' },
      { level: 8, damage: 120, cooldown: 1.1, projectiles: 4, speed: 550, area: 1.4, duration: 3.0, piercing: 999, knockback: 35, description: 'Devastating Boomerang Power!' },
    ],
  },
  heaven_sword: {
    id: 'heaven_sword',
    name: 'Cosmic Brand',
    description: 'Evolved Sigil: Colossal spinning eldritch star brands dealing guaranteed devastating crits.',
    iconId: 'icon_heaven_sword',
    spriteId: 'proj_cross',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'cross',
    soundEffect: 'whip_crit',
    levels: [
      { level: 1, damage: 220, cooldown: 0.9, projectiles: 4, speed: 520, area: 2.0, duration: 3.2, piercing: 999, knockback: 45, description: 'Giant spinning brands and guaranteed critical strikes!' },
    ],
  },

  // -------------------------------------------------------------
  // 9. COSMIC WRATH & ASTRAL CATACLYSM
  // -------------------------------------------------------------
  lightning_ring: {
    id: 'lightning_ring',
    name: 'Cosmic Wrath',
    description: 'Summons deep-space cosmic lightning tearing downward from the torn sky.',
    iconId: 'icon_lightning_ring',
    spriteId: 'proj_lightning',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'duplicator',
    evolutionWeaponId: 'thunder_loop',
    soundEffect: 'magic_bolt',
    levels: [
      { level: 1, damage: 40, cooldown: 2.4, projectiles: 2, speed: 0, area: 1.0, duration: 0.3, piercing: 999, knockback: 10, description: 'Strikes 2 foes with cosmic lightning.' },
      { level: 2, damage: 50, cooldown: 2.2, projectiles: 2, speed: 0, area: 1.1, duration: 0.3, piercing: 999, knockback: 12, description: 'Damage +10, Area +10%' },
      { level: 3, damage: 62, cooldown: 2.0, projectiles: 3, speed: 0, area: 1.1, duration: 0.3, piercing: 999, knockback: 14, description: 'Lightning Strikes +1' },
      { level: 4, damage: 75, cooldown: 1.8, projectiles: 3, speed: 0, area: 1.2, duration: 0.3, piercing: 999, knockback: 16, description: 'Damage +13, Area +10%' },
      { level: 5, damage: 90, cooldown: 1.7, projectiles: 4, speed: 0, area: 1.2, duration: 0.3, piercing: 999, knockback: 18, description: 'Lightning Strikes +1' },
      { level: 6, damage: 110, cooldown: 1.5, projectiles: 4, speed: 0, area: 1.3, duration: 0.3, piercing: 999, knockback: 20, description: 'Damage +20, Cooldown -10%' },
      { level: 7, damage: 130, cooldown: 1.4, projectiles: 5, speed: 0, area: 1.3, duration: 0.3, piercing: 999, knockback: 22, description: 'Lightning Strikes +1' },
      { level: 8, damage: 160, cooldown: 1.2, projectiles: 6, speed: 0, area: 1.4, duration: 0.3, piercing: 999, knockback: 25, description: 'Wrath of the cosmic storm!' },
    ],
  },
  thunder_loop: {
    id: 'thunder_loop',
    name: 'Astral Cataclysm',
    description: 'Evolved Wrath: Double cosmic lightning strikes erupting in shockwaves of pure void.',
    iconId: 'icon_thunder_loop',
    spriteId: 'proj_lightning',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'lightning_ring',
    soundEffect: 'explosion',
    levels: [
      { level: 1, damage: 240, cooldown: 0.85, projectiles: 8, speed: 0, area: 1.8, duration: 0.4, piercing: 999, knockback: 35, description: 'Double lightning strikes with expanding shockwaves!' },
    ],
  },

  // -------------------------------------------------------------
  // 10. CURSED SCYTHE & REAPER OF R'LYEH
  // -------------------------------------------------------------
  axe: {
    id: 'axe',
    name: 'Cursed Scythe',
    description: 'Lobs heavy curved bone scythes overhead in high punishing arcs.',
    iconId: 'icon_axe',
    spriteId: 'proj_axe',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'candelabrador',
    evolutionWeaponId: 'death_spiral',
    soundEffect: 'knife_throw',
    levels: [
      { level: 1, damage: 35, cooldown: 2.0, projectiles: 1, speed: 380, area: 1.0, duration: 2.0, piercing: 999, knockback: 20, description: 'High curving scythe lob.' },
      { level: 2, damage: 45, cooldown: 1.9, projectiles: 1, speed: 400, area: 1.1, duration: 2.0, piercing: 999, knockback: 22, description: 'Damage +10, Area +10%' },
      { level: 3, damage: 56, cooldown: 1.8, projectiles: 2, speed: 420, area: 1.1, duration: 2.0, piercing: 999, knockback: 24, description: 'Scythe Amount +1' },
      { level: 4, damage: 70, cooldown: 1.7, projectiles: 2, speed: 440, area: 1.2, duration: 2.0, piercing: 999, knockback: 26, description: 'Damage +14, Area +10%' },
      { level: 5, damage: 85, cooldown: 1.6, projectiles: 3, speed: 460, area: 1.2, duration: 2.0, piercing: 999, knockback: 28, description: 'Scythe Amount +1' },
      { level: 6, damage: 105, cooldown: 1.5, projectiles: 3, speed: 480, area: 1.3, duration: 2.0, piercing: 999, knockback: 30, description: 'Damage +20, Area +10%' },
      { level: 7, damage: 125, cooldown: 1.4, projectiles: 4, speed: 500, area: 1.3, duration: 2.0, piercing: 999, knockback: 32, description: 'Scythe Amount +1' },
      { level: 8, damage: 155, cooldown: 1.3, projectiles: 5, speed: 520, area: 1.4, duration: 2.0, piercing: 999, knockback: 36, description: 'Scythe rain storm!' },
    ],
  },
  death_spiral: {
    id: 'death_spiral',
    name: "Reaper of R'lyeh",
    description: 'Evolved Scythe: A 360-degree outward explosion of colossal spinning reaper blades.',
    iconId: 'icon_death_spiral',
    spriteId: 'proj_scythe',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'axe',
    soundEffect: 'whip_crit',
    levels: [
      { level: 1, damage: 190, cooldown: 1.2, projectiles: 9, speed: 380, area: 1.8, duration: 3.5, piercing: 999, knockback: 40, description: '360-degree outward ring of giant death scythes!' },
    ],
  },

  // -------------------------------------------------------------
  // 11. ICHOR FLASK & PRIMORDIAL SLIME
  // -------------------------------------------------------------
  santa_water: {
    id: 'santa_water',
    name: 'Ichor Flask',
    description: 'Hurls flasks of bubbling primordial abyssal ichor that dissolves ground zones.',
    iconId: 'icon_santa_water',
    spriteId: 'proj_holy_water',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'attractorb',
    evolutionWeaponId: 'la_borra',
    soundEffect: 'explosion',
    levels: [
      { level: 1, damage: 25, cooldown: 2.5, projectiles: 1, speed: 200, area: 1.0, duration: 3.0, piercing: 999, knockback: 5, description: 'Creates 1 bubbling ichor pool.' },
      { level: 2, damage: 32, cooldown: 2.3, projectiles: 1, speed: 220, area: 1.15, duration: 3.2, piercing: 999, knockback: 5, description: 'Area +15%, Duration +10%' },
      { level: 3, damage: 40, cooldown: 2.1, projectiles: 2, speed: 240, area: 1.15, duration: 3.5, piercing: 999, knockback: 6, description: 'Ichor Pool Amount +1' },
      { level: 4, damage: 50, cooldown: 2.0, projectiles: 2, speed: 260, area: 1.30, duration: 3.8, piercing: 999, knockback: 6, description: 'Damage +10, Area +15%' },
      { level: 5, damage: 62, cooldown: 1.8, projectiles: 3, speed: 280, area: 1.30, duration: 4.0, piercing: 999, knockback: 7, description: 'Ichor Pool Amount +1' },
      { level: 6, damage: 75, cooldown: 1.7, projectiles: 3, speed: 300, area: 1.45, duration: 4.3, piercing: 999, knockback: 7, description: 'Damage +13, Area +15%' },
      { level: 7, damage: 90, cooldown: 1.5, projectiles: 4, speed: 320, area: 1.45, duration: 4.6, piercing: 999, knockback: 8, description: 'Ichor Pool Amount +1' },
      { level: 8, damage: 110, cooldown: 1.4, projectiles: 5, speed: 340, area: 1.60, duration: 5.0, piercing: 999, knockback: 10, description: 'Expansive abyssal ichor lakes!' },
    ],
  },
  la_borra: {
    id: 'la_borra',
    name: 'Primordial Slime',
    description: 'Evolved Ichor: Expanding pools of sentient eldritch ooze that follow the player.',
    iconId: 'icon_la_borra',
    spriteId: 'proj_holy_water',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'santa_water',
    soundEffect: 'explosion',
    levels: [
      { level: 1, damage: 160, cooldown: 0.9, projectiles: 6, speed: 80, area: 2.4, duration: 6.0, piercing: 999, knockback: 20, description: 'Sentient eldritch slime pools tracking the player!' },
    ],
  },

  // -------------------------------------------------------------
  // 12. ULTRA UNIFIED WEAPONS (2 Max Weapons -> 1 Ultra Weapon)
  // -------------------------------------------------------------
  cosmic_blaze: {
    id: 'cosmic_blaze',
    name: 'Cosmic Blaze',
    description: 'Ultra Unification: Homing cosmic meteors that explode into celestial flame lakes on impact!',
    iconId: 'icon_hellfire',
    spriteId: 'proj_fireball',
    maxLevel: 1,
    isEvolution: true,
    soundEffect: 'fireball',
    levels: [
      { level: 1, damage: 240, cooldown: 0.65, projectiles: 6, speed: 520, area: 2.2, duration: 3.5, piercing: 999, knockback: 45, description: 'Fires 6 homing cosmic meteors that explode into burning flame fields!' },
    ],
  },

  vampiric_guillotine: {
    id: 'vampiric_guillotine',
    name: 'Vampiric Guillotine',
    description: 'Ultra Unification: Infinite whirlwind of obsidian blood daggers with +2 HP lifesteal on hit!',
    iconId: 'icon_bloody_tear',
    spriteId: 'proj_knife',
    maxLevel: 1,
    isEvolution: true,
    soundEffect: 'knife',
    levels: [
      { level: 1, damage: 135, cooldown: 0.32, projectiles: 8, speed: 720, area: 1.8, duration: 1.2, piercing: 6, knockback: 35, description: 'Cyclone of blood daggers slicing outward in 8 directions with +2 HP lifesteal!' },
    ],
  },

  holy_maelstrom: {
    id: 'holy_maelstrom',
    name: 'Abyssal Maelstrom',
    description: 'Ultra Unification: Orbiting eldritch scripture barrier firing rapid-fire homing void beams!',
    iconId: 'icon_holy_wand',
    spriteId: 'proj_bible',
    maxLevel: 1,
    isEvolution: true,
    soundEffect: 'magic_bolt',
    levels: [
      { level: 1, damage: 180, cooldown: 0.38, projectiles: 8, speed: 580, area: 2.2, duration: 1.2, piercing: 4, knockback: 30, description: 'Permanent barrier of 8 holy scriptures firing rapid homing light beams!' },
    ],
  },

  // -------------------------------------------------------------
  // 14. VOID TENDRILS & LEVIATHAN'S GRASP
  // -------------------------------------------------------------
  void_tendril: {
    id: 'void_tendril',
    name: 'Void Tendrils',
    description: 'Eldritch tentacles lash out from the void, thrashing nearby enemies and slowing their movement.',
    iconId: 'icon_void_tendril',
    spriteId: 'proj_void_tendril',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'spellbinder',
    evolutionWeaponId: 'leviathans_grasp',
    soundEffect: 'whip',
    levels: [
      { level: 1, damage: 28, cooldown: 1.4, projectiles: 1, speed: 0, area: 1.0, duration: 0.35, piercing: 999, knockback: 15, description: 'Lashes 1 tentacle at closest cluster of horrors.' },
      { level: 2, damage: 36, cooldown: 1.3, projectiles: 1, speed: 0, area: 1.15, duration: 0.35, piercing: 999, knockback: 18, description: 'Damage +8, Area +15%' },
      { level: 3, damage: 45, cooldown: 1.25, projectiles: 2, speed: 0, area: 1.15, duration: 0.35, piercing: 999, knockback: 20, description: 'Tentacle Amount +1 (Strikes in 2 directions)' },
      { level: 4, damage: 56, cooldown: 1.15, projectiles: 2, speed: 0, area: 1.30, duration: 0.35, piercing: 999, knockback: 24, description: 'Damage +11, Area +15%' },
      { level: 5, damage: 68, cooldown: 1.10, projectiles: 3, speed: 0, area: 1.30, duration: 0.35, piercing: 999, knockback: 26, description: 'Tentacle Amount +1' },
      { level: 6, damage: 82, cooldown: 1.00, projectiles: 3, speed: 0, area: 1.45, duration: 0.35, piercing: 999, knockback: 30, description: 'Damage +14, Area +15%' },
      { level: 7, damage: 98, cooldown: 0.95, projectiles: 4, speed: 0, area: 1.45, duration: 0.35, piercing: 999, knockback: 32, description: 'Tentacle Amount +1 (Surrounding thrash)' },
      { level: 8, damage: 125, cooldown: 0.85, projectiles: 4, speed: 0, area: 1.65, duration: 0.40, piercing: 999, knockback: 40, description: 'Damage +27, Giant Tentacle Surge!' },
    ],
  },
  leviathans_grasp: {
    id: 'leviathans_grasp',
    name: "Leviathan's Grasp",
    description: "Evolved Void Tendrils: Massive shadowy tentacles thrash across reality, crushing foes and pulling distant XP gems.",
    iconId: 'icon_leviathans_grasp',
    spriteId: 'proj_void_tendril',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'void_tendril',
    soundEffect: 'whip_crit',
    levels: [
      { level: 1, damage: 175, cooldown: 0.75, projectiles: 6, speed: 0, area: 2.1, duration: 0.45, piercing: 999, knockback: 50, description: 'Colossal eldritch tentacles sweep the entire battlefield, drawing faraway gems!' },
    ],
  },

  // -------------------------------------------------------------
  // 15. ABYSSAL ANCHOR & WORLDBREAKER ANCHOR
  // -------------------------------------------------------------
  abyssal_anchor: {
    id: 'abyssal_anchor',
    name: 'Abyssal Anchor',
    description: 'Hurls a colossal rusted anchor that crashes into the ground, causing a devastating seismic shockwave.',
    iconId: 'icon_abyssal_anchor',
    spriteId: 'proj_abyssal_anchor',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'void_carapace',
    evolutionWeaponId: 'worldbreaker_anchor',
    soundEffect: 'explosion',
    levels: [
      { level: 1, damage: 45, cooldown: 2.2, projectiles: 1, speed: 280, area: 1.0, duration: 0.8, piercing: 999, knockback: 35, description: 'Hurls 1 heavy anchor creating a crater impact.' },
      { level: 2, damage: 60, cooldown: 2.1, projectiles: 1, speed: 300, area: 1.2, duration: 0.8, piercing: 999, knockback: 40, description: 'Damage +15, Shockwave Area +20%' },
      { level: 3, damage: 78, cooldown: 2.0, projectiles: 2, speed: 310, area: 1.2, duration: 0.8, piercing: 999, knockback: 45, description: 'Anchor Amount +1 (Dual bombard)' },
      { level: 4, damage: 98, cooldown: 1.9, projectiles: 2, speed: 330, area: 1.35, duration: 0.8, piercing: 999, knockback: 50, description: 'Damage +20, Impact Area +15%' },
      { level: 5, damage: 120, cooldown: 1.8, projectiles: 3, speed: 340, area: 1.35, duration: 0.8, piercing: 999, knockback: 55, description: 'Anchor Amount +1' },
      { level: 6, damage: 145, cooldown: 1.7, projectiles: 3, speed: 360, area: 1.50, duration: 0.8, piercing: 999, knockback: 60, description: 'Damage +25, Shockwave Area +15%' },
      { level: 7, damage: 175, cooldown: 1.6, projectiles: 4, speed: 380, area: 1.50, duration: 0.8, piercing: 999, knockback: 65, description: 'Anchor Amount +1' },
      { level: 8, damage: 220, cooldown: 1.4, projectiles: 4, speed: 400, area: 1.80, duration: 0.9, piercing: 999, knockback: 75, description: 'Cataclysmic impact with colossal tremors!' },
    ],
  },
  worldbreaker_anchor: {
    id: 'worldbreaker_anchor',
    name: 'Worldbreaker Anchor',
    description: 'Evolved Abyssal Anchor: Ground impacts fracture reality, sending out 4 directional fissure shockwaves.',
    iconId: 'icon_worldbreaker_anchor',
    spriteId: 'proj_abyssal_anchor',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'abyssal_anchor',
    soundEffect: 'explosion',
    levels: [
      { level: 1, damage: 320, cooldown: 1.2, projectiles: 4, speed: 420, area: 2.2, duration: 1.1, piercing: 999, knockback: 90, description: 'Seismic tremors fracture the ground in 4 directions, crushing armies!' },
    ],
  },

  // -------------------------------------------------------------
  // 16. SINGULARITY SPHERE & EVENT HORIZON
  // -------------------------------------------------------------
  singularity_orb: {
    id: 'singularity_orb',
    name: 'Singularity Sphere',
    description: 'Fires a drifting gravitational vortex that pulls enemies inwards while dealing continuous damage.',
    iconId: 'icon_singularity_orb',
    spriteId: 'proj_singularity',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'astral_prism',
    evolutionWeaponId: 'event_horizon',
    soundEffect: 'magic_bolt',
    levels: [
      { level: 1, damage: 18, cooldown: 1.8, projectiles: 1, speed: 120, area: 1.0, duration: 3.0, piercing: 999, knockback: -8, description: 'Launches 1 gravity vortex pulling foes inwards.' },
      { level: 2, damage: 24, cooldown: 1.7, projectiles: 1, speed: 130, area: 1.2, duration: 3.2, piercing: 999, knockback: -10, description: 'Damage +6, Vortex Area +20%' },
      { level: 3, damage: 32, cooldown: 1.6, projectiles: 2, speed: 135, area: 1.2, duration: 3.4, piercing: 999, knockback: -12, description: 'Orb Amount +1' },
      { level: 4, damage: 40, cooldown: 1.5, projectiles: 2, speed: 140, area: 1.4, duration: 3.6, piercing: 999, knockback: -14, description: 'Damage +8, Gravitational Radius +20%' },
      { level: 5, damage: 50, cooldown: 1.4, projectiles: 3, speed: 145, area: 1.4, duration: 3.8, piercing: 999, knockback: -16, description: 'Orb Amount +1' },
      { level: 6, damage: 62, cooldown: 1.3, projectiles: 3, speed: 150, area: 1.6, duration: 4.0, piercing: 999, knockback: -18, description: 'Damage +12, Area +20%' },
      { level: 7, damage: 76, cooldown: 1.2, projectiles: 4, speed: 155, area: 1.6, duration: 4.2, piercing: 999, knockback: -20, description: 'Orb Amount +1' },
      { level: 8, damage: 95, cooldown: 1.0, projectiles: 4, speed: 160, area: 1.9, duration: 4.5, piercing: 999, knockback: -25, description: 'Massive gravitational suction with intense collapse damage!' },
    ],
  },
  event_horizon: {
    id: 'event_horizon',
    name: 'Event Horizon',
    description: 'Evolved Singularity Sphere: Supermassive black hole that swallows non-boss enemies and implodes in a supernova.',
    iconId: 'icon_event_horizon',
    spriteId: 'proj_singularity',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'singularity_orb',
    soundEffect: 'explosion',
    levels: [
      { level: 1, damage: 180, cooldown: 0.9, projectiles: 3, speed: 160, area: 2.5, duration: 5.0, piercing: 999, knockback: -35, description: 'Irresistible gravitational collapse exploding in cosmic shockwaves!' },
    ],
  },

  // -------------------------------------------------------------
  // 17. SANGUINE CHALICE & PRIMORDIAL HEART
  // -------------------------------------------------------------
  blood_chalice: {
    id: 'blood_chalice',
    name: 'Sanguine Chalice',
    description: 'Etches dark blood runes on the battlefield that burst into barbed crimson thorns when enemies step over them.',
    iconId: 'icon_blood_chalice',
    spriteId: 'proj_blood_chalice',
    maxLevel: 8,
    isEvolution: false,
    evolutionPartnerPassive: 'madness_grimoire',
    evolutionWeaponId: 'primordial_heart',
    soundEffect: 'magic_bolt',
    levels: [
      { level: 1, damage: 22, cooldown: 1.6, projectiles: 2, speed: 0, area: 1.0, duration: 4.0, piercing: 10, knockback: 12, description: 'Places 2 blood runes that burst into crimson thorns.' },
      { level: 2, damage: 30, cooldown: 1.5, projectiles: 2, speed: 0, area: 1.2, duration: 4.2, piercing: 12, knockback: 14, description: 'Damage +8, Rune Area +20%' },
      { level: 3, damage: 38, cooldown: 1.4, projectiles: 3, speed: 0, area: 1.2, duration: 4.5, piercing: 14, knockback: 16, description: 'Rune Amount +1' },
      { level: 4, damage: 48, cooldown: 1.3, projectiles: 3, speed: 0, area: 1.35, duration: 4.8, piercing: 16, knockback: 18, description: 'Damage +10, Thorn Radius +15%' },
      { level: 5, damage: 60, cooldown: 1.2, projectiles: 4, speed: 0, area: 1.35, duration: 5.0, piercing: 18, knockback: 20, description: 'Rune Amount +1' },
      { level: 6, damage: 74, cooldown: 1.1, projectiles: 4, speed: 0, area: 1.50, duration: 5.2, piercing: 20, knockback: 22, description: 'Damage +14, Rune Area +15%' },
      { level: 7, damage: 90, cooldown: 1.0, projectiles: 5, speed: 0, area: 1.50, duration: 5.5, piercing: 22, knockback: 25, description: 'Rune Amount +1' },
      { level: 8, damage: 115, cooldown: 0.85, projectiles: 5, speed: 0, area: 1.75, duration: 6.0, piercing: 28, knockback: 30, description: 'Vast field of crimson runes leeching health on kill!' },
    ],
  },
  primordial_heart: {
    id: 'primordial_heart',
    name: 'Primordial Heart',
    description: 'Evolved Sanguine Chalice: Pulsing crimson vortex that drains life continuously and transforms killed enemies into seeking blood bats.',
    iconId: 'icon_primordial_heart',
    spriteId: 'proj_blood_chalice',
    maxLevel: 1,
    isEvolution: true,
    evolvedFromWeaponId: 'blood_chalice',
    soundEffect: 'whip_crit',
    levels: [
      { level: 1, damage: 160, cooldown: 0.7, projectiles: 6, speed: 360, area: 2.2, duration: 6.5, piercing: 999, knockback: 35, description: 'Continuous sanguine vortex leeching life and releasing seeking blood bats!' },
    ],
  },

  // -------------------------------------------------------------
  // 18. LEGENDARY UNIFICATIONS
  // -------------------------------------------------------------
  apocalypse_horizon: {
    id: 'apocalypse_horizon',
    name: 'Apocalypse Horizon',
    description: 'Fusion of Event Horizon + Cosmic Blaze: A flaming black hole discharging dark cosmic lightning and solar flares.',
    iconId: 'icon_singularity_orb',
    spriteId: 'proj_singularity',
    maxLevel: 1,
    isEvolution: true,
    soundEffect: 'explosion',
    levels: [
      { level: 1, damage: 350, cooldown: 0.6, projectiles: 4, speed: 200, area: 3.0, duration: 5.5, piercing: 999, knockback: -50, description: 'Catastrophic flaming cosmic vortex devastating entire screens!' },
    ],
  },
  blood_tide: {
    id: 'blood_tide',
    name: "Leviathan's Blood Tide",
    description: "Fusion of Leviathan's Grasp + Primordial Heart: A crimson sea of thrashing appendages with continuous lifesteal.",
    iconId: 'icon_leviathans_grasp',
    spriteId: 'proj_void_tendril',
    maxLevel: 1,
    isEvolution: true,
    soundEffect: 'whip_crit',
    levels: [
      { level: 1, damage: 320, cooldown: 0.5, projectiles: 8, speed: 400, area: 2.8, duration: 0.6, piercing: 999, knockback: 65, description: 'Infinite blood tentacle frenzy with absolute life leech!' },
    ],
  },
};

export interface WeaponUnificationRecipe {
  id: string;
  weapon1Id: string;
  weapon2Id: string;
  resultWeaponId: string;
  name: string;
  description: string;
}

export const WEAPON_UNIFICATIONS: WeaponUnificationRecipe[] = [
  {
    id: 'unify_cosmic_blaze',
    weapon1Id: 'fire_wand',
    weapon2Id: 'magic_wand',
    resultWeaponId: 'cosmic_blaze',
    name: 'Cosmic Blaze',
    description: 'Combines Fire Wand + Magic Wand: Homing cosmic meteors explode on impact into burning novas!',
  },
  {
    id: 'unify_vampiric_guillotine',
    weapon1Id: 'bloody_tear',
    weapon2Id: 'thousand_edge',
    resultWeaponId: 'vampiric_guillotine',
    name: 'Vampiric Guillotine',
    description: 'Combines Bloody Tear + Thousand Edge: An infinite cyclone of blood blades with continuous lifesteal!',
  },
  {
    id: 'unify_holy_maelstrom',
    weapon1Id: 'holy_wand',
    weapon2Id: 'unholy_vespers',
    resultWeaponId: 'holy_maelstrom',
    name: 'Holy Maelstrom',
    description: 'Combines Holy Wand + Unholy Vespers: Celestial book ring firing constant homing lasers at all nearby foes!',
  },
  {
    id: 'unify_apocalypse_horizon',
    weapon1Id: 'event_horizon',
    weapon2Id: 'cosmic_blaze',
    resultWeaponId: 'apocalypse_horizon',
    name: 'Apocalypse Horizon',
    description: 'Combines Event Horizon + Cosmic Blaze: A flaming black hole discharging dark cosmic lightning and solar flares!',
  },
  {
    id: 'unify_blood_tide',
    weapon1Id: 'leviathans_grasp',
    weapon2Id: 'primordial_heart',
    resultWeaponId: 'blood_tide',
    name: "Leviathan's Blood Tide",
    description: "Combines Leviathan's Grasp + Primordial Heart: A crimson sea of thrashing appendages with continuous lifesteal!",
  },
];
