import { CharacterStats, HeroConfig } from '../config/heroes';

export type EntityType = 'PLAYER' | 'ENEMY' | 'PROJECTILE' | 'GEM' | 'PICKUP' | 'DAMAGE_NUMBER';

export interface EquippedWeapon {
  id: string;
  level: number;
  timer: number;
  lastAngle: number;
}

export interface EquippedPassive {
  id: string;
  level: number;
}

export interface PlayerComponent {
  hero: HeroConfig;
  stats: CharacterStats;
  currentHp: number;
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  goldCollected: number;
  kills: number;
  survivalTime: number;
  weapons: EquippedWeapon[];
  passives: EquippedPassive[];
  invulnerabilityTimer: number;
  // Active Special Ability & Dash
  abilityCooldownTimer: number;
  abilityMaxCooldown: number;
  abilityActiveTimer: number;
  abilityName: string;
  dashVx: number;
  dashVy: number;
  dashDuration: number;
  critBuffTimer: number;
  // Specific hero trait counters
  traitCounter: number;
}

export interface EnemyEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  typeId: string;
  behavior: string;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpValue: number;
  flashTimer: number; // for white hit flash
  knockbackDx: number;
  knockbackDy: number;
  knockbackResistance: number;
  attackTimer: number;
  dropsChest?: boolean;
  active: boolean;
}

export interface ProjectileEntity {
  id: number;
  weaponId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  pierceLeft: number;
  radius: number;
  duration: number;
  elapsedTime: number;
  areaScale: number;
  knockback: number;
  hitEnemyIds: Set<number>;
  orbitAngle?: number;
  orbitSpeed?: number;
  orbitRadius?: number;
  bouncesLeft?: number;
  gravity?: number;
  decelerate?: number;
  initialVx?: number;
  initialVy?: number;
  isPuddle?: boolean;
  tickTimer?: number;
  active: boolean;
}

export type GemType = 'blue' | 'green' | 'red' | 'gold';
export type PickupType = 'coin' | 'chest' | 'magnet' | 'rosary' | 'meat';

export interface GemEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  xpValue: number;
  gemType: GemType;
  isMagnetized: boolean;
  active: boolean;
}

export interface PickupEntity {
  id: number;
  x: number;
  y: number;
  radius: number;
  pickupType: PickupType;
  active: boolean;
}

export interface DamageNumber {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
  elapsedTime: number;
  maxDuration: number;
  active: boolean;
}
