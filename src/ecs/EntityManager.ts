import { ObjectPool } from '../core/ObjectPool';
import {
  EnemyEntity,
  ProjectileEntity,
  GemEntity,
  PickupEntity,
  DamageNumber,
  PlayerComponent,
  GemType,
  PickupType,
} from './Components';
import { HeroConfig } from '../config/heroes';
import { GAME_CONFIG } from '../config/constants';

export class EntityManager {
  // Player
  public playerX: number = 0;
  public playerY: number = 0;
  public playerRadius: number = 14;
  public playerFacingX: number = 1;
  public playerFacingY: number = 0;
  public playerFacingAngle: number = 0;
  public player: PlayerComponent | null = null;
  public godMode: boolean = false;

  // Active Entities
  public enemies: EnemyEntity[] = [];
  public projectiles: ProjectileEntity[] = [];
  public gems: GemEntity[] = [];
  public pickups: PickupEntity[] = [];
  public damageNumbers: DamageNumber[] = [];

  // ID generator
  private nextEntityId: number = 1;

  // Object Pools
  private enemyPool: ObjectPool<EnemyEntity>;
  private projectilePool: ObjectPool<ProjectileEntity>;
  private gemPool: ObjectPool<GemEntity>;
  private pickupPool: ObjectPool<PickupEntity>;
  private damageNumberPool: ObjectPool<DamageNumber>;

  constructor() {
    this.enemyPool = new ObjectPool<EnemyEntity>(
      () => ({
        id: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 16,
        typeId: '',
        behavior: 'chase',
        hp: 10,
        maxHp: 10,
        speed: 50,
        damage: 10,
        xpValue: 1,
        flashTimer: 0,
        knockbackDx: 0,
        knockbackDy: 0,
        knockbackResistance: 0,
        attackTimer: 0,
        dropsChest: false,
        active: false,
      }),
      GAME_CONFIG.MAX_ENEMIES
    );

    this.projectilePool = new ObjectPool<ProjectileEntity>(
      () => ({
        id: 0,
        weaponId: '',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        damage: 10,
        pierceLeft: 1,
        radius: 8,
        duration: 1.0,
        elapsedTime: 0,
        areaScale: 1.0,
        knockback: 10,
        hitEnemyIds: new Set<number>(),
        active: false,
      }),
      GAME_CONFIG.MAX_PROJECTILES,
      (p) => {
        p.id = 0;
        p.weaponId = '';
        p.x = 0;
        p.y = 0;
        p.vx = 0;
        p.vy = 0;
        p.damage = 0;
        p.pierceLeft = 1;
        p.radius = 8;
        p.duration = 1.0;
        p.elapsedTime = 0;
        p.areaScale = 1.0;
        p.knockback = 10;
        p.hitEnemyIds.clear();
        p.orbitAngle = undefined;
        p.orbitSpeed = undefined;
        p.orbitRadius = undefined;
        p.bouncesLeft = undefined;
        p.gravity = undefined;
        p.decelerate = undefined;
        p.initialVx = undefined;
        p.initialVy = undefined;
        p.isPuddle = undefined;
        p.tickTimer = undefined;
        p.active = false;
      }
    );

    this.gemPool = new ObjectPool<GemEntity>(
      () => ({
        id: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 6,
        xpValue: 1,
        gemType: 'blue',
        isMagnetized: false,
        active: false,
      }),
      GAME_CONFIG.MAX_GEMS
    );

    this.pickupPool = new ObjectPool<PickupEntity>(
      () => ({
        id: 0,
        x: 0,
        y: 0,
        radius: 12,
        pickupType: 'coin',
        active: false,
      }),
      50
    );

    this.damageNumberPool = new ObjectPool<DamageNumber>(
      () => ({
        id: 0,
        x: 0,
        y: 0,
        text: '',
        color: '#ffffff',
        alpha: 1.0,
        scale: 1.0,
        vy: -60,
        elapsedTime: 0,
        maxDuration: 0.6,
        active: false,
      }),
      GAME_CONFIG.MAX_DAMAGE_NUMBERS
    );
  }

  public initPlayer(hero: HeroConfig, metaStatsBonus: Partial<typeof hero.baseStats> = {}): void {
    this.playerX = 0;
    this.playerY = 0;
    this.playerFacingX = 1;

    const mergedStats = { ...hero.baseStats };
    // Apply meta-progression permanent bonuses
    Object.keys(metaStatsBonus).forEach((key) => {
      const k = key as keyof typeof hero.baseStats;
      if (typeof mergedStats[k] === 'number' && typeof metaStatsBonus[k] === 'number') {
        (mergedStats[k] as number) += metaStatsBonus[k] as number;
      }
    });

    this.player = {
      hero,
      stats: mergedStats,
      currentHp: mergedStats.maxHealth,
      level: 1,
      currentXp: 0,
      xpToNextLevel: 5,
      goldCollected: 0,
      kills: 0,
      survivalTime: 0,
      weapons: [
        {
          id: hero.startingWeaponId,
          level: 1,
          timer: 0,
          lastAngle: 0,
        },
      ],
      passives: [],
      invulnerabilityTimer: 0,
      abilityCooldownTimer: 0,
      abilityMaxCooldown: 12.0,
      abilityActiveTimer: 0,
      abilityName:
        hero.id === 'valerius'
          ? 'Holy Shield Charge'
          : hero.id === 'sylvia'
          ? 'Astral Blink'
          : hero.id === 'ignis'
          ? 'Flame Nova'
          : hero.id === 'kaelen'
          ? 'Shadow Step'
          : hero.id === 'mortimer'
          ? 'Soul Drain & Orbit'
          : hero.id === 'nyx'
          ? 'Weaver Cocoon Web'
          : hero.id === 'malakor'
          ? 'Tectonic Tremor'
          : hero.id === 'morrigan'
          ? 'Sanguine Eruption'
          : 'Gravitational Singularity',
      dashVx: 0,
      dashVy: 0,
      dashDuration: 0,
      critBuffTimer: 0,
      traitCounter: 0,
    };

    this.clearAll();
  }

  public clearAll(): void {
    this.enemies.forEach((e) => this.enemyPool.release(e));
    this.enemies = [];

    this.projectiles.forEach((p) => this.projectilePool.release(p));
    this.projectiles = [];

    this.gems.forEach((g) => this.gemPool.release(g));
    this.gems = [];

    this.pickups.forEach((pk) => this.pickupPool.release(pk));
    this.pickups = [];

    this.damageNumbers.forEach((d) => this.damageNumberPool.release(d));
    this.damageNumbers = [];
  }

  // --- SPAWN METHODS ---

  public spawnEnemy(
    typeId: string,
    x: number,
    y: number,
    hp: number,
    speed: number,
    damage: number,
    xpValue: number,
    radius: number,
    behavior: string,
    knockbackResistance: number,
    dropsChest: boolean = false
  ): EnemyEntity | null {
    if (this.enemies.length >= GAME_CONFIG.MAX_ENEMIES) return null;

    const enemy = this.enemyPool.acquire();
    enemy.id = this.nextEntityId++;
    enemy.x = x;
    enemy.y = y;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.typeId = typeId;
    enemy.hp = hp;
    enemy.maxHp = hp;
    enemy.speed = speed;
    enemy.damage = damage;
    enemy.xpValue = xpValue;
    enemy.radius = radius;
    enemy.behavior = behavior;
    enemy.flashTimer = 0;
    enemy.knockbackDx = 0;
    enemy.knockbackDy = 0;
    enemy.knockbackResistance = knockbackResistance;
    enemy.attackTimer = 0;
    enemy.dropsChest = dropsChest;
    enemy.active = true;

    this.enemies.push(enemy);
    return enemy;
  }

  public removeEnemy(enemy: EnemyEntity, index: number): void {
    enemy.active = false;
    this.enemyPool.release(enemy);
    this.enemies.splice(index, 1);
  }

  public spawnProjectile(
    weaponId: string,
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    pierce: number,
    radius: number,
    duration: number,
    areaScale: number,
    knockback: number,
    extraProps: Partial<ProjectileEntity> = {}
  ): ProjectileEntity | null {
    if (this.projectiles.length >= GAME_CONFIG.MAX_PROJECTILES) return null;

    const proj = this.projectilePool.acquire();
    proj.id = this.nextEntityId++;
    proj.weaponId = weaponId;
    proj.x = x;
    proj.y = y;
    proj.vx = vx;
    proj.vy = vy;
    proj.damage = damage;
    proj.pierceLeft = pierce;
    proj.radius = radius;
    proj.duration = duration;
    proj.elapsedTime = 0;
    proj.areaScale = areaScale;
    proj.knockback = knockback;
    proj.hitEnemyIds.clear();
    proj.active = true;

    // Explicitly reset all optional properties before applying extraProps
    proj.orbitAngle = undefined;
    proj.orbitSpeed = undefined;
    proj.orbitRadius = undefined;
    proj.bouncesLeft = undefined;
    proj.gravity = undefined;
    proj.decelerate = undefined;
    proj.initialVx = undefined;
    proj.initialVy = undefined;
    proj.isPuddle = undefined;
    proj.tickTimer = undefined;

    Object.assign(proj, extraProps);

    this.projectiles.push(proj);
    return proj;
  }

  public removeProjectile(proj: ProjectileEntity, index: number): void {
    proj.active = false;
    proj.isPuddle = undefined;
    proj.hitEnemyIds.clear();
    this.projectilePool.release(proj);
    this.projectiles.splice(index, 1);
  }

  public spawnGem(x: number, y: number, xpValue: number): GemEntity | null {
    if (this.gems.length >= GAME_CONFIG.MAX_GEMS) {
      this.aggregateGems();
    }

    let gemType: GemType = 'blue';
    if (xpValue >= 50) gemType = 'gold';
    else if (xpValue >= 20) gemType = 'red';
    else if (xpValue >= 5) gemType = 'green';

    const gem = this.gemPool.acquire();
    gem.id = this.nextEntityId++;
    gem.x = x;
    gem.y = y;
    gem.vx = 0;
    gem.vy = 0;
    gem.radius = gemType === 'gold' ? 10 : gemType === 'red' ? 8 : 6;
    gem.xpValue = xpValue;
    gem.gemType = gemType;
    gem.isMagnetized = false;
    gem.active = true;

    this.gems.push(gem);
    return gem;
  }

  public removeGem(gem: GemEntity, index: number): void {
    gem.active = false;
    this.gemPool.release(gem);
    this.gems.splice(index, 1);
  }

  public spawnPickup(x: number, y: number, pickupType: PickupType): PickupEntity {
    const pickup = this.pickupPool.acquire();
    pickup.id = this.nextEntityId++;
    pickup.x = x;
    pickup.y = y;
    pickup.radius = pickupType === 'chest' ? 16 : 10;
    pickup.pickupType = pickupType;
    pickup.active = true;

    this.pickups.push(pickup);
    return pickup;
  }

  public removePickup(pickup: PickupEntity, index: number): void {
    pickup.active = false;
    this.pickupPool.release(pickup);
    this.pickups.splice(index, 1);
  }

  public spawnDamageNumber(
    x: number,
    y: number,
    damage: number,
    isCrit: boolean = false,
    colorOverride?: string
  ): void {
    if (this.damageNumbers.length >= GAME_CONFIG.MAX_DAMAGE_NUMBERS) {
      const oldest = this.damageNumbers.shift();
      if (oldest) this.damageNumberPool.release(oldest);
    }

    const d = this.damageNumberPool.acquire();
    d.id = this.nextEntityId++;
    d.x = x + (Math.random() * 16 - 8);
    d.y = y - 10 + (Math.random() * 8 - 4);
    d.text = Math.round(damage).toString();
    d.color = colorOverride || (isCrit ? '#facc15' : '#ffffff');
    d.scale = isCrit ? 1.5 : 1.0;
    d.alpha = 1.0;
    d.vy = isCrit ? -80 : -50;
    d.elapsedTime = 0;
    d.maxDuration = isCrit ? 0.8 : 0.55;
    d.active = true;

    this.damageNumbers.push(d);
  }

  /**
   * Distance-based Gem Aggregation:
   * When on-screen gems become too numerous, combines nearby small gems into large high-value gold gems.
   */
  public aggregateGems(): void {
    if (this.gems.length < GAME_CONFIG.GEM_AGGREGATION_THRESHOLD) return;

    const remainingGems: GemEntity[] = [];
    const radiusSq = GAME_CONFIG.GEM_AGGREGATION_RADIUS * GAME_CONFIG.GEM_AGGREGATION_RADIUS;

    for (let i = 0; i < this.gems.length; i++) {
      const g1 = this.gems[i];
      if (!g1.active) continue;

      let combinedXp = g1.xpValue;
      let count = 1;

      for (let j = i + 1; j < this.gems.length; j++) {
        const g2 = this.gems[j];
        if (!g2.active) continue;

        const dx = g1.x - g2.x;
        const dy = g1.y - g2.y;
        if (dx * dx + dy * dy <= radiusSq) {
          combinedXp += g2.xpValue;
          g2.active = false;
          this.gemPool.release(g2);
          count++;
          if (count >= 8) break; // bundle up to 8 gems
        }
      }

      g1.xpValue = combinedXp;
      g1.gemType = combinedXp >= 50 ? 'gold' : combinedXp >= 20 ? 'red' : 'green';
      g1.radius = g1.gemType === 'gold' ? 10 : 8;
      remainingGems.push(g1);
    }

    this.gems = remainingGems;
  }
}
