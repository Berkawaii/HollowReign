import { EntityManager } from '../ecs/EntityManager';
import { sound } from './AudioEngine';
import { Camera } from './Camera';
import { ProceduralAssets } from '../utils/ProceduralAssets';
import { STAGES, StageConfig } from '../config/stages';

export interface WorldObstacle {
  id: string;
  type: 'pillar' | 'wall' | 'tombstone' | 'boulder';
  x: number;
  y: number;
  radius: number;
  spriteId: string;
}

export type ShrineType = 'blood_altar' | 'gold_altar' | 'healing_font' | 'speed_shrine';

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
          name: '✨ Ancient Healing Fountain',
          costText: 'Free',
          rewardText: 'Restore 100% HP',
          used: false,
          spriteId: 'shrine_healing',
        });
      } else {
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

        // 35% chance to spawn a Power-Up Shrine in this chunk
        const shrineRand = this.pseudoRandom(seedBase + 99);
        if (shrineRand < 0.35) {
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
  public interactWithNearbyShrine(em?: EntityManager): boolean {
    if (!this.nearbyShrine || this.nearbyShrine.used) return false;
    const s = this.nearbyShrine;

    // Get active EntityManager
    const activeEm = em || (window as unknown as { game?: { em: EntityManager } }).game?.em;
    if (!activeEm || !activeEm.player) return false;
    const p = activeEm.player;

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
              : `rgba(6, 182, 212, ${glowPulse * 0.45})`;

            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, shr.radius + 12, 0, Math.PI * 2);
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
