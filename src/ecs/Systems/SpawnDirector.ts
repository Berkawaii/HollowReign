import { EntityManager } from '../EntityManager';
import { ENEMIES, EnemyConfig, calculateSpawnHp } from '../../config/enemies';
import { GAME_CONFIG } from '../../config/constants';
import { sound } from '../../core/AudioEngine';
import { STAGES, StageConfig } from '../../config/stages';

export class SpawnDirector {
  private spawnTimer: number = 0;
  private triggeredEvents: Set<string> = new Set();
  private bossSpawned5m: boolean = false;
  private bossSpawned10m: boolean = false;
  private bossSpawned15m: boolean = false;
  private bossSpawned20m: boolean = false;
  private bossSpawned25m: boolean = false;
  private reaperSpawned: boolean = false;
  public currentStage: StageConfig = STAGES[0];

  public reset(stage?: StageConfig): void {
    this.spawnTimer = 0;
    this.triggeredEvents.clear();
    this.bossSpawned5m = false;
    this.bossSpawned10m = false;
    this.bossSpawned15m = false;
    this.bossSpawned20m = false;
    this.bossSpawned25m = false;
    this.reaperSpawned = false;
    this.currentStage = stage || STAGES[0];
  }

  public update(em: EntityManager, dt: number): void {
    if (!em.player) return;

    em.player.survivalTime += dt;
    const elapsedMinutes = em.player.survivalTime / 60;

    // 1. TIMED SPECIAL ATTACKS & SWARMS
    // Min 2:00 & 6:00 & 11:00 & 17:00 & 23:00 - Fast Swarm Stampede Rush
    if (elapsedMinutes >= 2 && !this.triggeredEvents.has('swarm_2m')) {
      this.triggeredEvents.add('swarm_2m');
      this.spawnSwarmRush(em, 60);
    }
    if (elapsedMinutes >= 6 && !this.triggeredEvents.has('swarm_6m')) {
      this.triggeredEvents.add('swarm_6m');
      this.spawnSwarmRush(em, 80);
    }
    if (elapsedMinutes >= 11 && !this.triggeredEvents.has('swarm_11m')) {
      this.triggeredEvents.add('swarm_11m');
      this.spawnSwarmRush(em, 100);
    }
    if (elapsedMinutes >= 17 && !this.triggeredEvents.has('swarm_17m')) {
      this.triggeredEvents.add('swarm_17m');
      this.spawnSwarmRush(em, 120);
    }

    // Min 3:00 & 7:00 & 13:00 & 21:00 - Tight Circle Encirclement Ring
    if (elapsedMinutes >= 3 && !this.triggeredEvents.has('ring_3m')) {
      this.triggeredEvents.add('ring_3m');
      this.spawnCircleRing(em, 32, 340, ENEMIES.zombie);
    }
    if (elapsedMinutes >= 7 && !this.triggeredEvents.has('ring_7m')) {
      this.triggeredEvents.add('ring_7m');
      this.spawnCircleRing(em, 38, 350, ENEMIES.skeleton);
    }
    if (elapsedMinutes >= 13 && !this.triggeredEvents.has('ring_13m')) {
      this.triggeredEvents.add('ring_13m');
      this.spawnCircleRing(em, 44, 360, ENEMIES.knight);
    }
    if (elapsedMinutes >= 21 && !this.triggeredEvents.has('ring_21m')) {
      this.triggeredEvents.add('ring_21m');
      this.spawnCircleRing(em, 48, 380, ENEMIES.knight);
    }

    // Min 9:00 & 19:00 - Pincer Wall Wave
    if (elapsedMinutes >= 9 && !this.triggeredEvents.has('wall_9m')) {
      this.triggeredEvents.add('wall_9m');
      this.spawnPincerWall(em, 40, ENEMIES.zombie);
    }
    if (elapsedMinutes >= 19 && !this.triggeredEvents.has('wall_19m')) {
      this.triggeredEvents.add('wall_19m');
      this.spawnPincerWall(em, 50, ENEMIES.knight);
    }

    // 2. TIMED BOSS SPAWNS
    if (elapsedMinutes >= 5 && !this.bossSpawned5m) {
      this.bossSpawned5m = true;
      this.spawnAtAnnulus(em, ENEMIES.minotaur_boss, elapsedMinutes);
    }
    if (elapsedMinutes >= 10 && !this.bossSpawned10m) {
      this.bossSpawned10m = true;
      this.spawnAtAnnulus(em, ENEMIES.gorgon_boss, elapsedMinutes);
    }
    if (elapsedMinutes >= 15 && !this.bossSpawned15m) {
      this.bossSpawned15m = true;
      this.spawnAtAnnulus(em, ENEMIES.vampire_boss, elapsedMinutes);
    }
    if (elapsedMinutes >= 20 && !this.bossSpawned20m) {
      this.bossSpawned20m = true;
      this.spawnAtAnnulus(em, ENEMIES.necromancer_boss, elapsedMinutes);
    }
    if (elapsedMinutes >= 25 && !this.bossSpawned25m) {
      this.bossSpawned25m = true;
      this.spawnAtAnnulus(em, ENEMIES.minotaur_boss, elapsedMinutes);
      this.spawnAtAnnulus(em, ENEMIES.gorgon_boss, elapsedMinutes);
    }
    if (elapsedMinutes >= 30 && !this.reaperSpawned) {
      this.reaperSpawned = true;
      this.spawnAtAnnulus(em, ENEMIES.reaper, elapsedMinutes);
    }

    // 3. CONTINUOUS WAVE SPAWNING
    this.spawnTimer += dt;
    const spawnInterval = Math.max(0.12, 0.75 - elapsedMinutes * 0.025);

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWaveGroup(em, elapsedMinutes);
    }
  }

  /**
   * Spawns a closed circle of high-HP enemies tightly surrounding the player.
   */
  public spawnCircleRing(
    em: EntityManager,
    count: number = 36,
    radius: number = 340,
    enemyConfig: EnemyConfig = ENEMIES.zombie
  ): void {
    if (!em.player) return;
    sound.play('explosion');

    const elapsedMinutes = em.player.survivalTime / 60;
    const baseCalculatedHp = calculateSpawnHp(
      enemyConfig,
      elapsedMinutes,
      em.player.stats.curse,
      em.player.level
    );
    // Ring enemies have 1.5x bonus HP to form a threatening barricade
    const ringHp = Math.round(baseCalculatedHp * 1.5);

    for (let i = 0; i < count; i++) {
      if (em.enemies.length >= GAME_CONFIG.MAX_ENEMIES) break;

      const angle = (i / count) * Math.PI * 2;
      const spawnX = em.playerX + Math.cos(angle) * radius;
      const spawnY = em.playerY + Math.sin(angle) * radius;

      em.spawnEnemy(
        enemyConfig.id,
        spawnX,
        spawnY,
        ringHp,
        enemyConfig.baseSpeed * 0.85,
        enemyConfig.baseDamage,
        enemyConfig.xpValue * 2,
        enemyConfig.radius,
        'chase',
        enemyConfig.knockbackResistance,
        false
      );
    }
  }

  /**
   * Spawns a fast rushing stampede wave crossing the screen at high speed.
   */
  public spawnSwarmRush(
    em: EntityManager,
    count: number = 70,
    enemyConfig: EnemyConfig = ENEMIES.bat
  ): void {
    if (!em.player) return;
    sound.play('magic_bolt');

    const elapsedMinutes = em.player.survivalTime / 60;
    const hp = calculateSpawnHp(
      enemyConfig,
      elapsedMinutes,
      em.player.stats.curse,
      em.player.level
    );

    // Pick a side (left, right, top, bottom)
    const side = Math.floor(Math.random() * 4);
    const rushSpeed = 190;

    for (let i = 0; i < count; i++) {
      if (em.enemies.length >= GAME_CONFIG.MAX_ENEMIES) break;

      let spawnX = em.playerX;
      let spawnY = em.playerY;
      const spread = (Math.random() - 0.5) * 800;

      if (side === 0) { // from Left
        spawnX = em.playerX - 600 - Math.random() * 200;
        spawnY = em.playerY + spread;
      } else if (side === 1) { // from Right
        spawnX = em.playerX + 600 + Math.random() * 200;
        spawnY = em.playerY + spread;
      } else if (side === 2) { // from Top
        spawnX = em.playerX + spread;
        spawnY = em.playerY - 450 - Math.random() * 200;
      } else { // from Bottom
        spawnX = em.playerX + spread;
        spawnY = em.playerY + 450 + Math.random() * 200;
      }

      em.spawnEnemy(
        enemyConfig.id,
        spawnX,
        spawnY,
        hp,
        rushSpeed,
        enemyConfig.baseDamage,
        enemyConfig.xpValue,
        enemyConfig.radius,
        'swarm',
        0.05,
        false
      );
    }
  }

  /**
   * Spawns top and bottom marching walls.
   */
  public spawnPincerWall(
    em: EntityManager,
    countPerWall: number = 30,
    enemyConfig: EnemyConfig = ENEMIES.zombie
  ): void {
    if (!em.player) return;
    sound.play('explosion');

    const elapsedMinutes = em.player.survivalTime / 60;
    const hp = calculateSpawnHp(
      enemyConfig,
      elapsedMinutes,
      em.player.stats.curse,
      em.player.level
    );

    const spanWidth = 900;
    const step = spanWidth / countPerWall;

    for (let i = 0; i < countPerWall; i++) {
      if (em.enemies.length >= GAME_CONFIG.MAX_ENEMIES) break;

      const offsetX = -spanWidth / 2 + i * step;
      // Top line
      em.spawnEnemy(
        enemyConfig.id,
        em.playerX + offsetX,
        em.playerY - 420,
        hp,
        enemyConfig.baseSpeed * 0.9,
        enemyConfig.baseDamage,
        enemyConfig.xpValue,
        enemyConfig.radius,
        'chase',
        enemyConfig.knockbackResistance,
        false
      );

      // Bottom line
      em.spawnEnemy(
        enemyConfig.id,
        em.playerX + offsetX,
        em.playerY + 420,
        hp,
        enemyConfig.baseSpeed * 0.9,
        enemyConfig.baseDamage,
        enemyConfig.xpValue,
        enemyConfig.radius,
        'chase',
        enemyConfig.knockbackResistance,
        false
      );
    }
  }

  private spawnWaveGroup(em: EntityManager, elapsedMinutes: number): void {
    if (em.enemies.length >= GAME_CONFIG.MAX_ENEMIES) return;

    let candidatePool: { enemy: EnemyConfig; weight: number }[] = [];

    if (elapsedMinutes < 2.5) {
      candidatePool = [
        { enemy: ENEMIES.bat, weight: 65 },
        { enemy: ENEMIES.zombie, weight: 35 },
      ];
    } else if (elapsedMinutes < 6) {
      candidatePool = [
        { enemy: ENEMIES.bat, weight: 35 },
        { enemy: ENEMIES.zombie, weight: 45 },
        { enemy: ENEMIES.skeleton, weight: 20 },
      ];
    } else if (elapsedMinutes < 12) {
      candidatePool = [
        { enemy: ENEMIES.zombie, weight: 35 },
        { enemy: ENEMIES.skeleton, weight: 40 },
        { enemy: ENEMIES.knight, weight: 25 },
      ];
    } else if (elapsedMinutes < 20) {
      candidatePool = [
        { enemy: ENEMIES.skeleton, weight: 35 },
        { enemy: ENEMIES.knight, weight: 45 },
        { enemy: ENEMIES.bat, weight: 20 },
      ];
    } else {
      candidatePool = [
        { enemy: ENEMIES.knight, weight: 55 },
        { enemy: ENEMIES.skeleton, weight: 30 },
        { enemy: ENEMIES.zombie, weight: 15 },
      ];
    }

    const batchCount = Math.min(
      GAME_CONFIG.MAX_ENEMIES - em.enemies.length,
      Math.floor(1 + elapsedMinutes * 0.2)
    );

    for (let i = 0; i < batchCount; i++) {
      const selected = this.weightedSelect(candidatePool);
      if (selected) {
        this.spawnAtAnnulus(em, selected, elapsedMinutes);
      }
    }
  }

  private weightedSelect(pool: { enemy: EnemyConfig; weight: number }[]): EnemyConfig | null {
    const totalWeight = pool.reduce((acc, item) => acc + item.weight, 0);
    let rand = Math.random() * totalWeight;

    for (const item of pool) {
      if (rand < item.weight) return item.enemy;
      rand -= item.weight;
    }
    return pool[0]?.enemy || null;
  }

  private spawnAtAnnulus(em: EntityManager, enemyConfig: EnemyConfig, elapsedMinutes: number): void {
    if (!em.player) return;

    const angle = Math.random() * Math.PI * 2;
    const distance =
      GAME_CONFIG.ANNULUS_INNER_RADIUS +
      Math.random() * (GAME_CONFIG.ANNULUS_OUTER_RADIUS - GAME_CONFIG.ANNULUS_INNER_RADIUS);

    const spawnX = em.playerX + Math.cos(angle) * distance;
    const spawnY = em.playerY + Math.sin(angle) * distance;

    const calculatedHp = calculateSpawnHp(
      enemyConfig,
      elapsedMinutes,
      em.player.stats.curse,
      em.player.level
    );

    em.spawnEnemy(
      enemyConfig.id,
      spawnX,
      spawnY,
      calculatedHp,
      enemyConfig.baseSpeed,
      enemyConfig.baseDamage,
      enemyConfig.xpValue,
      enemyConfig.radius,
      enemyConfig.behavior,
      enemyConfig.knockbackResistance,
      enemyConfig.dropsChest
    );
  }
}
