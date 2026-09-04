import { EntityManager } from '../ecs/EntityManager';
import { sound } from './AudioEngine';
import { Camera } from './Camera';
import { ProceduralAssets } from '../utils/ProceduralAssets';
import { STAGES, StageConfig } from '../config/stages';
import { StorageService } from '../services/StorageService';
import { AchievementManager } from './AchievementManager';

export interface WorldObstacle {
  id: string;
  type: 'pillar' | 'wall' | 'tombstone' | 'boulder';
  x: number;
  y: number;
  radius: number;
  spriteId: string;
}

export type ShrineType =
  | 'blood_altar'
  | 'gold_altar'
  | 'healing_font'
  | 'speed_shrine'
  | 'quest_cocoon'
  | 'quest_sarcophagus'
  | 'quest_blood_font';

export interface ActiveQuestEvent {
  type: 'cocoon_siege' | 'sarcophagus_elites';
  title: string;
  remainingTime?: number;
  totalTime?: number;
  spawnTimer?: number;
  eliteIds?: number[];
  shrine: WorldShrine;
}

export interface WorldShrine {
  id: string;
  type: ShrineType;
  x: number;
  y: number;
  radius: number;
  name: string;
  costText: string;
  rewardText: string;
  used: boolean;
  spriteId: string;
}

export class WorldMap {
  private obstacles: Map<string, WorldObstacle[]> = new Map();
  private shrines: Map<string, WorldShrine[]> = new Map();
  public chunkSize: number = 600;
  public nearbyShrine: WorldShrine | null = null;
  public currentStage: StageConfig = STAGES[0];
  public activeQuestEvent: ActiveQuestEvent | null = null;
  public bloodFontStep: number = 0;

  constructor() {
    // Listen for [E] key for quick interaction with shrines
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') {
        this.interactWithNearbyShrine();
      }
    });
  }

  public reset(stage?: StageConfig): void {
    this.obstacles.clear();
    this.shrines.clear();
    this.nearbyShrine = null;
    this.activeQuestEvent = null;
    this.bloodFontStep = 0;
    this.currentStage = stage || STAGES[0];
  }

  private getChunkKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  private pseudoRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Generates or retrieves obstacles and shrines for a given chunk.
   */
  public ensureChunk(cx: number, cy: number): { obstacles: WorldObstacle[]; shrines: WorldShrine[] } {
    const key = this.getChunkKey(cx, cy);

    if (!this.obstacles.has(key)) {
      const chunkObstacles: WorldObstacle[] = [];
      const chunkShrines: WorldShrine[] = [];

      // Chunk center in world coordinates
      const startX = cx * this.chunkSize;
      const startY = cy * this.chunkSize;

      // Don't spawn obstacles at starting spawn chunk (0, 0)
      if (cx === 0 && cy === 0) {
        // Just place one friendly healing font nearby
        chunkShrines.push({
          id: `shrine_${cx}_${cy}_0`,
          type: 'healing_font',
          x: startX + 180,
          y: startY + 120,
          radius: 28,
          name: '[Astral Well] Ancient Healing Fountain',
          costText: 'Free',
          rewardText: 'Restore 100% HP',
          used: false,
          spriteId: 'shrine_healing',
        });
      } else {
        // Deterministic Map Quest Shrine Spawns
        let spawnedQuestShrine = false;

        // 1. Nyx: Weaver's Cocoon in Stage 1 (Forest) at chunk (2, -2)
        if (this.currentStage.id === 'stage_forest' && cx === 2 && cy === -2 && !StorageService.isHeroUnlocked('nyx')) {
          chunkShrines.push({
            id: 'shrine_quest_cocoon',
            type: 'quest_cocoon',
            x: startX + 300,
            y: startY + 300,
            radius: 34,
            name: "[Weaver's Cocoon] Nyx's Prison",
            costText: 'Touch Cocoon [E]',
            rewardText: 'Survive 40s Void Siege to unlock Nyx',
            used: false,
            spriteId: 'shrine_cocoon',
          });
          spawnedQuestShrine = true;
        }

        // 2. Malakor: Sunken Sarcophagus in Stage 2 (Molten) at chunk (-2, 2)
        if (this.currentStage.id === 'stage_molten' && cx === -2 && cy === 2 && !StorageService.isHeroUnlocked('malakor')) {
          chunkShrines.push({
            id: 'shrine_quest_sarcophagus',
            type: 'quest_sarcophagus',
            x: startX + 300,
            y: startY + 300,
            radius: 34,
            name: '[Sunken Sarcophagus] Tomb of Malakor',
            costText: 'Break Seal [E]',
            rewardText: 'Slay Twin Juggernauts to unlock Malakor',
            used: false,
            spriteId: 'shrine_sarcophagus',
          });
          spawnedQuestShrine = true;
        }

        // 3. Morrigan: Crimson Blood Font in chunk (2, 2) on any stage
        if (cx === 2 && cy === 2 && !StorageService.isHeroUnlocked('morrigan')) {
          chunkShrines.push({
            id: 'shrine_quest_blood_font',
            type: 'quest_blood_font',
            x: startX + 300,
            y: startY + 300,
            radius: 34,
            name: '[Sanguine Font] Morrigan Communion',
            costText: 'Offer 20% HP [E] (Step 1/3)',
            rewardText: 'Perform 3 Blood Sacrifices to unlock Morrigan',
            used: false,
            spriteId: 'shrine_blood_font',
          });
          spawnedQuestShrine = true;
        }

        const seedBase = cx * 73856093 ^ cy * 19349663;
        const obstacleCount = Math.floor(this.pseudoRandom(seedBase) * 3) + 1; // 1 to 3 obstacles

        for (let i = 0; i < obstacleCount; i++) {
          const rX = this.pseudoRandom(seedBase + i * 17) * (this.chunkSize - 120) + 60;
          const rY = this.pseudoRandom(seedBase + i * 31) * (this.chunkSize - 120) + 60;
          const typeRand = this.pseudoRandom(seedBase + i * 53);

          let type: WorldObstacle['type'] = 'pillar';
          let radius = 22;
          let spriteId = 'obstacle_pillar';

          if (typeRand < 0.35) {
            type = 'pillar';
            radius = 20;
            spriteId = 'obstacle_pillar';
          } else if (typeRand < 0.65) {
            type = 'boulder';
            radius = 24;
            spriteId = 'obstacle_boulder';
          } else if (typeRand < 0.85) {
            type = 'tombstone';
            radius = 18;
            spriteId = 'obstacle_tombstone';
          } else {
            type = 'wall';
            radius = 26;
            spriteId = 'obstacle_ruin_wall';
          }

          chunkObstacles.push({
            id: `obs_${cx}_${cy}_${i}`,
            type,
            x: startX + rX,
            y: startY + rY,
            radius,
            spriteId,
          });
        }

        // 35% chance to spawn a Power-Up Shrine in this chunk (if not a quest shrine chunk)
        const shrineRand = this.pseudoRandom(seedBase + 99);
        if (!spawnedQuestShrine && shrineRand < 0.35) {
          const sX = this.pseudoRandom(seedBase + 101) * (this.chunkSize - 160) + 80;
          const sY = this.pseudoRandom(seedBase + 103) * (this.chunkSize - 160) + 80;
          const sTypeRand = this.pseudoRandom(seedBase + 107);

          let sType: ShrineType = 'blood_altar';
          let sName = '[Ichor Altar] Primordial Font';
          let sCost = 'Sacrifice 25% HP';
          let sReward = '+15% Eldritch Might';
          let sSprite = 'shrine_blood';

          if (sTypeRand < 0.30) {
            sType = 'blood_altar';
            sName = '[Ichor Altar] Primordial Font';
            sCost = 'Sacrifice 25% HP';
            sReward = '+15% Eldritch Might (Damage)';
            sSprite = 'shrine_blood';
          } else if (sTypeRand < 0.60) {
            sType = 'gold_altar';
            sName = "[Relic Coffer] R'lyeh Cache";
            sCost = 'Offer 75 Gold';
            sReward = '+1 Cosmic Insight (Level Up)';
            sSprite = 'shrine_gold';
          } else if (sTypeRand < 0.85) {
            sType = 'speed_shrine';
            sName = '[Void Rift] Spatial Obelisk';
            sCost = 'Offer 50 Gold';
            sReward = '+15% Spatial Move Speed';
            sSprite = 'shrine_speed';
          } else {
            sType = 'healing_font';
            sName = '[Astral Well] Vitality Spring';
            sCost = 'Free';
            sReward = 'Restore 100% HP';
            sSprite = 'shrine_healing';
          }

          chunkShrines.push({
            id: `shrine_${cx}_${cy}_0`,
            type: sType,
            x: startX + sX,
            y: startY + sY,
            radius: 28,
            name: sName,
            costText: sCost,
            rewardText: sReward,
            used: false,
            spriteId: sSprite,
          });
        }
      }

      this.obstacles.set(key, chunkObstacles);
      this.shrines.set(key, chunkShrines);
    }

    return {
      obstacles: this.obstacles.get(key)!,
      shrines: this.shrines.get(key)!,
    };
  }

  /**
   * Resolves obstacle collision pushing the entity smoothly out of solid geometry.
   */
  public resolveCollision(x: number, y: number, radius: number): { x: number; y: number; hit: boolean } {
    const minCx = Math.floor((x - radius - 60) / this.chunkSize);
    const maxCx = Math.floor((x + radius + 60) / this.chunkSize);
    const minCy = Math.floor((y - radius - 60) / this.chunkSize);
    const maxCy = Math.floor((y + radius + 60) / this.chunkSize);

    let curX = x;
    let curY = y;
    let hit = false;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const { obstacles, shrines } = this.ensureChunk(cx, cy);

        // Check Obstacles
        for (let i = 0; i < obstacles.length; i++) {
          const obs = obstacles[i];
          const dx = curX - obs.x;
          const dy = curY - obs.y;
          const distSq = dx * dx + dy * dy;
          const minDist = radius + obs.radius;

          if (distSq < minDist * minDist) {
            hit = true;
            const dist = Math.sqrt(distSq) || 1;
            const overlap = minDist - dist;
            curX += (dx / dist) * overlap;
            curY += (dy / dist) * overlap;
          }
        }

        // Shrines also have physical collision
        for (let i = 0; i < shrines.length; i++) {
          const shr = shrines[i];
          const dx = curX - shr.x;
          const dy = curY - shr.y;
          const distSq = dx * dx + dy * dy;
          const minDist = radius + shr.radius;

          if (distSq < minDist * minDist) {
            hit = true;
            const dist = Math.sqrt(distSq) || 1;
            const overlap = minDist - dist;
            curX += (dx / dist) * overlap;
            curY += (dy / dist) * overlap;
          }
        }
      }
    }

    return { x: curX, y: curY, hit };
  }

  /**
   * Updates shrine proximity check around player.
   */
  public update(em: EntityManager): void {
    if (!em.player) {
      this.nearbyShrine = null;
      return;
    }

    const minCx = Math.floor((em.playerX - 100) / this.chunkSize);
    const maxCx = Math.floor((em.playerX + 100) / this.chunkSize);
    const minCy = Math.floor((em.playerY - 100) / this.chunkSize);
    const maxCy = Math.floor((em.playerY + 100) / this.chunkSize);

    let closest: WorldShrine | null = null;
    let closestDistSq = 55 * 55;

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const { shrines } = this.ensureChunk(cx, cy);
        for (let i = 0; i < shrines.length; i++) {
          const s = shrines[i];
          if (s.used) continue;

          const dx = em.playerX - s.x;
          const dy = em.playerY - s.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < closestDistSq) {
            closestDistSq = dSq;
            closest = s;
          }
        }
      }
    }

    this.nearbyShrine = closest;
  }

  /**
   * Interacts with the currently proximate shrine.
   */
  public interactWithNearbyShrine(em?: EntityManager, achievementManager?: AchievementManager): boolean {
    if (!this.nearbyShrine || this.nearbyShrine.used) return false;
    const s = this.nearbyShrine;

    // Get active EntityManager & AchievementManager
    const activeEm = em || (window as unknown as { game?: { em: EntityManager; achievementManager: AchievementManager } }).game?.em;
    const activeAm = achievementManager || (window as unknown as { game?: { achievementManager: AchievementManager } }).game?.achievementManager;
    if (!activeEm || !activeEm.player) return false;
    const p = activeEm.player;

    // 1. Weaver's Cocoon Quest (Nyx)
    if (s.type === 'quest_cocoon') {
      if (this.activeQuestEvent) return false;
      this.activeQuestEvent = {
        type: 'cocoon_siege',
        title: "Weaver's Siege",
        remainingTime: 40,
        totalTime: 40,
        spawnTimer: 0,
        shrine: s,
      };
      s.costText = 'Siege in progress...';
      s.rewardText = 'Survive the 40s Void Horde!';
      sound.play('explosion');
      activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 25, 0, true, '#a855f7');
      return true;
    }

    // 2. Sunken Sarcophagus Quest (Malakor)
    if (s.type === 'quest_sarcophagus') {
      if (this.activeQuestEvent) return false;
      // Spawn 2 elite juggernauts
      const elite1 = activeEm.spawnEnemy('crawler_spider', s.x - 70, s.y, 4500, 75, 20, 50, 26, 'boss', 0.8, true);
      const elite2 = activeEm.spawnEnemy('crawler_spider', s.x + 70, s.y, 4500, 75, 20, 50, 26, 'boss', 0.8, true);
      const eliteIds: number[] = [];
      if (elite1) eliteIds.push(elite1.id);
      if (elite2) eliteIds.push(elite2.id);

      this.activeQuestEvent = {
        type: 'sarcophagus_elites',
        title: 'Twin Juggernauts',
        eliteIds,
        shrine: s,
      };
      s.costText = 'Guardians Awakened!';
      s.rewardText = 'Defeat both Juggernauts';
      sound.play('explosion');
      activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 25, 0, true, '#3b82f6');
      return true;
    }

    // 3. Crimson Blood Font Quest (Morrigan - 3-stage sacrifice)
    if (s.type === 'quest_blood_font') {
      if (this.bloodFontStep === 0) {
        const hpCost = Math.round(p.stats.maxHealth * 0.20);
        if (p.currentHp <= hpCost + 5) {
          activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 20, 0, false, '#f87171');
          return false;
        }
        p.currentHp -= hpCost;
        this.bloodFontStep = 1;
        s.costText = 'Offer 25% HP [E] (Step 2/3)';
        s.rewardText = 'Blood Boiling...';
        sound.play('hit');
        activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 25, hpCost, true, '#ef4444');
        return true;
      } else if (this.bloodFontStep === 1) {
        const hpCost = Math.round(p.stats.maxHealth * 0.25);
        if (p.currentHp <= hpCost + 5) {
          activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 20, 0, false, '#f87171');
          return false;
        }
        p.currentHp -= hpCost;
        this.bloodFontStep = 2;
        s.costText = 'Offer 30% HP [E] (Final Step)';
        s.rewardText = 'The Pact Awakens...';
        sound.play('hit');
        activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 25, hpCost, true, '#ef4444');
        return true;
      } else if (this.bloodFontStep === 2) {
        const hpCost = Math.round(p.stats.maxHealth * 0.30);
        if (p.currentHp <= hpCost + 5) {
          activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 20, 0, false, '#f87171');
          return false;
        }
        p.currentHp -= hpCost;
        this.bloodFontStep = 3;
        s.used = true;
        s.costText = 'Communion Sealed';
        s.rewardText = 'Morrigan Unlocked!';
        sound.play('level_up');
        activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 25, hpCost, true, '#ef4444');

        if (activeAm) {
          activeAm.onMapQuestComplete('blood_font_trial');
        }
        activeEm.spawnPickup(s.x, s.y, 'chest');
        activeEm.spawnPickup(s.x + 20, s.y, 'coin');
        activeEm.spawnPickup(s.x - 20, s.y, 'coin');
        return true;
      }
      return false;
    }

    if (s.type === 'blood_altar') {
      const hpCost = Math.round(p.stats.maxHealth * 0.25);
      if (p.currentHp <= hpCost + 10) {
        // Can't sacrifice if too low HP
        activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 20, 0, false, '#f87171');
        return false;
      }
      p.currentHp -= hpCost;
      p.stats.might += 0.15;
      s.used = true;
      sound.play('explosion');
      activeEm.spawnDamageNumber(activeEm.playerX, activeEm.playerY - 25, 15, true, '#ef4444');
      return true;
    }

    if (s.type === 'gold_altar') {
      const goldCost = 75;
      if (p.goldCollected < goldCost) {
        return false;
      }
      p.goldCollected -= goldCost;
      p.level += 1;
      s.used = true;
      sound.play('level_up');
      return true;
    }

    if (s.type === 'healing_font') {
      p.currentHp = p.stats.maxHealth;
      p.stats.recovery += 0.5;
      s.used = true;
      sound.play('coin');
      return true;
    }

    if (s.type === 'speed_shrine') {
      const goldCost = 50;
      if (p.goldCollected < goldCost) {
        return false;
      }
      p.goldCollected -= goldCost;
      p.stats.speed += 0.15;
      s.used = true;
      sound.play('coin');
      return true;
    }

    return false;
  }

  /**
   * Updates real-time in-game quest events (Siege defense, Elite hunt).
   */
  public updateQuestEvents(em: EntityManager, achievementManager: AchievementManager, dt: number): void {
    if (!this.activeQuestEvent) return;

    if (this.activeQuestEvent.type === 'cocoon_siege') {
      if (this.activeQuestEvent.remainingTime !== undefined) {
        this.activeQuestEvent.remainingTime -= dt;
        this.activeQuestEvent.spawnTimer = (this.activeQuestEvent.spawnTimer || 0) + dt;

        // Spawn spiders every 1.2s
        if (this.activeQuestEvent.spawnTimer >= 1.2) {
          this.activeQuestEvent.spawnTimer = 0;
          const s = this.activeQuestEvent.shrine;
          for (let k = 0; k < 2; k++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 220 + Math.random() * 80;
            em.spawnEnemy('crawler_spider', s.x + Math.cos(angle) * r, s.y + Math.sin(angle) * r, 120, 140, 10, 3, 14, 'swarm', 0.2);
          }
        }

        if (this.activeQuestEvent.remainingTime <= 0) {
          const s = this.activeQuestEvent.shrine;
          s.used = true;
          s.costText = 'Awakened';
          s.rewardText = 'Nyx Unlocked!';
          achievementManager.onMapQuestComplete('cocoon_siege');
          em.spawnPickup(s.x, s.y, 'chest');
          em.spawnPickup(s.x + 20, s.y, 'coin');
          em.spawnPickup(s.x - 20, s.y, 'coin');
          sound.play('level_up');
          this.activeQuestEvent = null;
        }
      }
    } else if (this.activeQuestEvent.type === 'sarcophagus_elites') {
      const eliteIds = this.activeQuestEvent.eliteIds || [];
      const anyAlive = eliteIds.some((id) => em.enemies.some((e) => e.active && e.id === id));
      if (!anyAlive) {
        const s = this.activeQuestEvent.shrine;
        s.used = true;
        s.costText = 'Banished';
        s.rewardText = 'Malakor Unlocked!';
        achievementManager.onMapQuestComplete('sarcophagus_elites');
        em.spawnPickup(s.x, s.y, 'chest');
        em.spawnPickup(s.x + 20, s.y, 'coin');
        em.spawnPickup(s.x - 20, s.y, 'coin');
        sound.play('level_up');
        this.activeQuestEvent = null;
      }
    }
  }

  /**
   * Locates the nearest locked quest shrine for the player's navigation compass.
   */
  public getNearestLockedQuest(
    playerX: number,
    playerY: number
  ): { x: number; y: number; name: string; dist: number; directionLabel: string; angle: number } | null {
    let closest: WorldShrine | null = null;
    let closestDist = Infinity;

    for (const list of this.shrines.values()) {
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        if (s.used) continue;
        if (s.type === 'quest_cocoon' || s.type === 'quest_sarcophagus' || s.type === 'quest_blood_font') {
          const dist = Math.hypot(s.x - playerX, s.y - playerY);
          if (dist < closestDist) {
            closestDist = dist;
            closest = s;
          }
        }
      }
    }

    if (!closest) return null;

    const dx = closest.x - playerX;
    const dy = closest.y - playerY;
    const angle = Math.atan2(dy, dx);
    const deg = ((angle * 180) / Math.PI + 360) % 360;

    let dir = 'E';
    if (deg >= 337.5 || deg < 22.5) dir = 'E';
    else if (deg >= 22.5 && deg < 67.5) dir = 'SE';
    else if (deg >= 67.5 && deg < 112.5) dir = 'S';
    else if (deg >= 112.5 && deg < 157.5) dir = 'SW';
    else if (deg >= 157.5 && deg < 202.5) dir = 'W';
    else if (deg >= 202.5 && deg < 247.5) dir = 'NW';
    else if (deg >= 247.5 && deg < 292.5) dir = 'N';
    else if (deg >= 292.5 && deg < 337.5) dir = 'NE';

    return {
      x: closest.x,
      y: closest.y,
      name: closest.name,
      dist: closestDist,
      directionLabel: dir,
      angle,
    };
  }

  /**
   * Renders all visible obstacles and shrines on screen with shadows.
   */
  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const minCx = Math.floor((camera.x - camera.viewportWidth / 2 - 100) / this.chunkSize);
    const maxCx = Math.floor((camera.x + camera.viewportWidth / 2 + 100) / this.chunkSize);
    const minCy = Math.floor((camera.y - camera.viewportHeight / 2 - 100) / this.chunkSize);
    const maxCy = Math.floor((camera.y + camera.viewportHeight / 2 + 100) / this.chunkSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const { obstacles, shrines } = this.ensureChunk(cx, cy);

        // 1. Render Obstacles
        for (let i = 0; i < obstacles.length; i++) {
          const obs = obstacles[i];
          if (!camera.isVisible(obs.x, obs.y, obs.radius * 2)) continue;

          const screenPos = camera.worldToScreen(obs.x, obs.y);
          const sprite = ProceduralAssets.get(obs.spriteId);
          const size = obs.radius * 2 + 10;

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(screenPos.x, screenPos.y + obs.radius * 0.6, obs.radius * 0.9, obs.radius * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.drawImage(sprite, screenPos.x - size / 2, screenPos.y - size / 2 - 4, size, size);
        }

        // 2. Render Shrines
        for (let i = 0; i < shrines.length; i++) {
          const shr = shrines[i];
          if (!camera.isVisible(shr.x, shr.y, shr.radius * 2 + 40)) continue;

          const screenPos = camera.worldToScreen(shr.x, shr.y);
          const sprite = ProceduralAssets.get(shr.spriteId);
          const size = shr.radius * 2 + 16;

          // Glowing aura if unused
          if (!shr.used) {
            const glowPulse = Math.sin(performance.now() * 0.005) * 0.2 + 0.5;
            ctx.fillStyle = shr.type === 'blood_altar'
              ? `rgba(153, 27, 27, ${glowPulse * 0.45})`
              : shr.type === 'gold_altar'
              ? `rgba(217, 119, 6, ${glowPulse * 0.4})`
              : shr.type === 'speed_shrine'
              ? `rgba(16, 185, 129, ${glowPulse * 0.45})`
              : shr.type === 'quest_cocoon'
              ? `rgba(168, 85, 247, ${glowPulse * 0.65})`
              : shr.type === 'quest_sarcophagus'
              ? `rgba(59, 130, 246, ${glowPulse * 0.65})`
              : shr.type === 'quest_blood_font'
              ? `rgba(239, 68, 68, ${glowPulse * 0.65})`
              : `rgba(6, 182, 212, ${glowPulse * 0.45})`;

            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, shr.radius + 14, 0, Math.PI * 2);
            ctx.fill();
          }

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.beginPath();
          ctx.ellipse(screenPos.x, screenPos.y + shr.radius * 0.6, shr.radius * 1.1, shr.radius * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          if (shr.used) {
            ctx.filter = 'grayscale(80%) brightness(50%)';
          }
          ctx.drawImage(sprite, screenPos.x - size / 2, screenPos.y - size / 2 - 8, size, size);
          ctx.restore();
        }
      }
    }
  }
}
