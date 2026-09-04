import { EntityManager } from '../EntityManager';
import { Camera } from '../../core/Camera';
import { InputManager } from '../../core/InputManager';
import { ProceduralAssets } from '../../utils/ProceduralAssets';
import { WorldMap } from '../../core/WorldMap';
import { ParticleSystem } from './ParticleSystem';

export class RenderSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: false })!;
    this.ctx.imageSmoothingEnabled = false;
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
  }

  public render(
    em: EntityManager,
    camera: Camera,
    input: InputManager,
    worldMap: WorldMap,
    particleSystem: ParticleSystem
  ): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#0a0a10';
    ctx.fillRect(0, 0, width, height);

    // 1. DRAW INFINITE TILED MAP
    this.renderTiles(camera, width, height, worldMap);

    // 2. DRAW MAP OBSTACLES & POWER-UP SHRINES
    worldMap.render(ctx, camera);

    // 3. DRAW GROUND DECALS & PUDDLES (Santa Water, La Borra, Astral Vortex)
    this.renderGroundDecalsAndPuddles(em, camera, particleSystem);

    // 4. DRAW PICKUPS & GEMS (With shadows and floating bob)
    this.renderPickupsAndGems(em, camera);

    // 5. DRAW GHOST TRAILS (Behind player & enemies)
    // Handled inside particleSystem

    // 6. DRAW ENEMIES (With shadows & walk wobble)
    this.renderEnemies(em, camera);

    // 7. DRAW PLAYER (With shadows, walk squish/stretch, and hero aura)
    this.renderPlayer(em, camera, input, particleSystem);

    // 8. DRAW FLYING PROJECTILES & WEAPON TRAILS
    this.renderProjectiles(em, camera, particleSystem);

    // 9. DRAW PARTICLES & SHOCKWAVES
    particleSystem.render(ctx, camera);

    // 10. DRAW DAMAGE NUMBERS
    this.renderDamageNumbers(em, camera);

    // 11. DRAW VIRTUAL TOUCH JOYSTICK (IF ACTIVE)
    this.renderJoystick(input);
  }

  private renderDropShadow(x: number, y: number, radiusX: number, radiusY: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderTiles(camera: Camera, width: number, height: number, worldMap: WorldMap): void {
    const ctx = this.ctx;
    const tileSize = 64;
    const tileKey =
      worldMap.currentStage.id === 'stage_molten'
        ? 'tile_molten'
        : worldMap.currentStage.id === 'stage_library'
        ? 'tile_library'
        : 'tile_grass';
    const tile = ProceduralAssets.get(tileKey);

    const startX = Math.floor((camera.x - width / 2) / tileSize) * tileSize;
    const endX = Math.ceil((camera.x + width / 2) / tileSize) * tileSize;
    const startY = Math.floor((camera.y - height / 2) / tileSize) * tileSize;
    const endY = Math.ceil((camera.y + height / 2) / tileSize) * tileSize;

    for (let wx = startX; wx <= endX; wx += tileSize) {
      for (let wy = startY; wy <= endY; wy += tileSize) {
        const screenPos = camera.worldToScreen(wx, wy);
        ctx.drawImage(tile, screenPos.x, screenPos.y, tileSize, tileSize);
      }
    }

    // Soft atmospheric vignette overlay on ground (softens tiling, eliminates eye strain)
    ctx.save();
    const vigGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.32,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.72
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(3, 5, 10, 0.45)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  private renderGroundDecalsAndPuddles(
    em: EntityManager,
    camera: Camera,
    particleSystem: ParticleSystem
  ): void {
    const ctx = this.ctx;
    const now = performance.now();

    for (let i = 0; i < em.projectiles.length; i++) {
      const p = em.projectiles[i];
      if (!p.active || !p.isPuddle) continue;
      if (!camera.isVisible(p.x, p.y, p.radius * 2 + 20)) continue;

      const screenPos = camera.worldToScreen(p.x, p.y);
      const isBorra = p.weaponId === 'la_borra';
      const isHoly = p.weaponId === 'santa_water' || isBorra || p.weaponId === 'holy_water';
      const isBlood = p.weaponId === 'blood_chalice' || p.weaponId === 'primordial_heart';

      ctx.save();
      // Outer Glowing Ring
      const pulse = 1 + Math.sin(now * 0.005 + p.x) * 0.06;
      const r = p.radius * pulse;

      const grad = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, r);
      if (isBlood) {
        // Sanguine Pool: Boiling dark crimson & ruby blood rune
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
        grad.addColorStop(0.6, 'rgba(153, 27, 27, 0.35)');
        grad.addColorStop(1, 'rgba(69, 10, 10, 0)');
      } else if (isBorra) {
        // Primordial Slime: Bubbling cosmic violet & emerald ooze pool
        grad.addColorStop(0, 'rgba(124, 58, 237, 0.55)');
        grad.addColorStop(0.6, 'rgba(16, 185, 129, 0.35)');
        grad.addColorStop(1, 'rgba(5, 46, 22, 0)');
      } else if (isHoly) {
        // Ichor Flask: Acidic bioluminescent teal & emerald pool
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
        grad.addColorStop(0.6, 'rgba(6, 182, 212, 0.3)');
        grad.addColorStop(1, 'rgba(8, 145, 178, 0)');
      } else {
        // Cosmic Blaze / Astral Vortex
        grad.addColorStop(0, 'rgba(192, 132, 252, 0.45)');
        grad.addColorStop(0.6, 'rgba(124, 58, 237, 0.25)');
        grad.addColorStop(1, 'rgba(59, 7, 100, 0)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Rotating decorative eldritch rune boundary
      ctx.strokeStyle = isBlood ? '#ef4444' : isBorra ? '#10b981' : isHoly ? '#06b6d4' : '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, r * 0.85, (now * 0.001) % (Math.PI * 2), (now * 0.001 + Math.PI * 2) % (Math.PI * 2));
      ctx.stroke();
      ctx.restore();

      // Spawn rising bubbling vapor particles
      if (Math.random() < 0.18) {
        const offsetAngle = Math.random() * Math.PI * 2;
        const offsetDist = Math.random() * p.radius * 0.7;
        const px = p.x + Math.cos(offsetAngle) * offsetDist;
        const py = p.y + Math.sin(offsetAngle) * offsetDist;
        const pColor = isBorra ? '#a7f3d0' : isHoly ? '#67e8f9' : '#e879f9';
        particleSystem.spawn(px, py, (Math.random() - 0.5) * 10, -25 - Math.random() * 20, pColor, 2, 0.4, 'ember');
      }
    }
  }

  private renderPickupsAndGems(em: EntityManager, camera: Camera): void {
    const ctx = this.ctx;
    const now = performance.now();

    // Pickups (Coins, Chests, Meat, etc.)
    for (let i = 0; i < em.pickups.length; i++) {
      const p = em.pickups[i];
      if (!p.active) continue;
      if (!camera.isVisible(p.x, p.y, p.radius * 2)) continue;

      const screenPos = camera.worldToScreen(p.x, p.y);
      const bob = Math.sin(now * 0.006 + p.id * 1.5) * 3;

      // Drop shadow
      this.renderDropShadow(screenPos.x, screenPos.y + p.radius * 0.6, p.radius * 0.8, p.radius * 0.35);

      const sprite = ProceduralAssets.get(`pickup_${p.pickupType}`);
      const size = p.radius * 2;
      ctx.drawImage(sprite, screenPos.x - size / 2, screenPos.y - size / 2 + bob, size, size);
    }

    // XP Gems
    for (let i = 0; i < em.gems.length; i++) {
      const g = em.gems[i];
      if (!g.active) continue;
      if (!camera.isVisible(g.x, g.y, g.radius * 2)) continue;

      const screenPos = camera.worldToScreen(g.x, g.y);
      const bob = Math.sin(now * 0.007 + g.id * 2.1) * 2;

      // Drop shadow
      this.renderDropShadow(screenPos.x, screenPos.y + g.radius * 0.5, g.radius * 0.7, g.radius * 0.3);

      const sprite = ProceduralAssets.get(`gem_${g.gemType}`);
      const size = g.radius * 2;
      ctx.drawImage(sprite, screenPos.x - size / 2, screenPos.y - size / 2 + bob, size, size);
    }
  }

  private renderEnemies(em: EntityManager, camera: Camera): void {
    const ctx = this.ctx;
    const now = performance.now();

    for (let i = 0; i < em.enemies.length; i++) {
      const e = em.enemies[i];
      if (!e.active) continue;
      if (!camera.isVisible(e.x, e.y, e.radius * 2 + 10)) continue;

      const screenPos = camera.worldToScreen(e.x, e.y);
      const sprite = ProceduralAssets.get(`enemy_${e.typeId}`);
      const size = e.radius * 2;

      // Drop shadow under enemy feet
      this.renderDropShadow(screenPos.x, screenPos.y + e.radius * 0.7, e.radius * 0.85, e.radius * 0.4);

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);

      // Walk wobble rotation based on speed and time
      const wobble = Math.sin(now * 0.01 + e.id) * 0.07;
      ctx.rotate(wobble);

      // Face direction towards player
      if (e.x > em.playerX) {
        ctx.scale(-1, 1);
      }

      // White hit flash
      if (e.flashTimer > 0) {
        ctx.filter = 'brightness(300%) contrast(200%)';
      }

      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();

      // Boss or Heavy Enemy Health Bar
      if (e.behavior === 'boss' || e.behavior === 'tank' || e.hp < e.maxHp) {
        const barWidth = Math.max(24, e.radius * 2);
        const barHeight = 4;
        const hpPct = Math.max(0, e.hp / e.maxHp);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y - e.radius - 8, barWidth, barHeight);

        ctx.fillStyle = e.behavior === 'boss' ? '#ef4444' : '#22c55e';
        ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y - e.radius - 8, barWidth * hpPct, barHeight);
      }
    }
  }

  private renderPlayer(
    em: EntityManager,
    camera: Camera,
    input: InputManager,
    particleSystem: ParticleSystem
  ): void {
    if (!em.player) return;

    const ctx = this.ctx;
    const p = em.player;
    const now = performance.now();
    const screenPos = camera.worldToScreen(em.playerX, em.playerY);
    const sprite = ProceduralAssets.get(p.hero.spriteId);
    const size = 36;

    // Movement state
    const isMoving = input.moveVector.x !== 0 || input.moveVector.y !== 0;
    const walkTime = now * 0.015;
    const bobY = isMoving ? -Math.abs(Math.sin(walkTime)) * 3.5 : 0;
    const squashX = isMoving ? 1 + Math.sin(walkTime * 2) * 0.06 : 1;
    const squashY = isMoving ? 1 - Math.sin(walkTime * 2) * 0.06 : 1;
    const tilt = isMoving ? input.moveVector.x * 0.08 : 0;

    // 1. Drop shadow under player feet
    this.renderDropShadow(screenPos.x, screenPos.y + 14, 15, 7);

    // 2. Footstep dust puffs when running
    if (isMoving && Math.random() < 0.22) {
      particleSystem.spawn(
        em.playerX - em.playerFacingX * 8 + (Math.random() - 0.5) * 6,
        em.playerY + 12 + Math.random() * 4,
        (Math.random() - 0.5) * 20,
        -10 - Math.random() * 15,
        'rgba(148, 163, 184, 0.45)',
        Math.random() * 3 + 2,
        0.3,
        'dust'
      );
    }

    // 3. Hero Ambient Aura
    ctx.save();
    const auraPulse = Math.sin(now * 0.005) * 0.15 + 0.85;

    if (p.hero.id === 'valerius') {
      // Abyssal Warden: Void Shield Barrier Shimmer
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.4 * auraPulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y + 2, 22 * auraPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(124, 58, 237, ${0.25 * auraPulse})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y + 2, 26 * auraPulse, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.hero.id === 'sylvia') {
      // Astral Occultist: Cosmic cyan & amethyst starlight
      if (Math.random() < 0.18) {
        particleSystem.spawn(
          em.playerX + (Math.random() - 0.5) * 28,
          em.playerY + (Math.random() - 0.5) * 28,
          0,
          -15,
          Math.random() < 0.5 ? '#06b6d4' : '#c084fc',
          2.5,
          0.35,
          'magic_star'
        );
      }
    } else if (p.hero.id === 'ignis') {
      // Blackfire Pyromancer: Cursed emerald & violet blackfire embers
      if (Math.random() < 0.25) {
        particleSystem.spawn(
          em.playerX + (Math.random() - 0.5) * 22,
          em.playerY + (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 15,
          -35 - Math.random() * 20,
          Math.random() < 0.5 ? '#10b981' : '#a855f7',
          2.5,
          0.3,
          'ember'
        );
      }
    } else if (p.hero.id === 'kaelen') {
      // Void Stalker: Spatial void smoke & teal dust
      if (Math.random() < 0.2) {
        particleSystem.spawn(
          em.playerX + (Math.random() - 0.5) * 16,
          em.playerY + 8,
          (Math.random() - 0.5) * 10,
          -12,
          Math.random() < 0.5 ? '#064e3b' : '#06b6d4',
          3,
          0.35,
          'dust'
        );
      }
    } else if (p.hero.id === 'mortimer') {
      // Necro-Alchemist: Amethyst soul wisps
      if (Math.random() < 0.15) {
        particleSystem.spawn(
          em.playerX + (Math.random() - 0.5) * 26,
          em.playerY + (Math.random() - 0.5) * 26,
          (Math.random() - 0.5) * 12,
          -18,
          '#c084fc',
          2.5,
          0.4,
          'soul'
        );
      }
    } else if (p.hero.id === 'nyx') {
      // Eldritch Weaver: Void spider silk embers
      if (Math.random() < 0.2) {
        particleSystem.spawn(
          em.playerX + (Math.random() - 0.5) * 20,
          em.playerY + (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10,
          -15,
          '#a855f7',
          2.5,
          0.3,
          'magic_star'
        );
      }
    } else if (p.hero.id === 'malakor') {
      // Drowned Inquisitor: Oceanic abyssal cyan bubbles
      if (Math.random() < 0.2) {
        particleSystem.spawn(
          em.playerX + (Math.random() - 0.5) * 24,
          em.playerY + 8,
          (Math.random() - 0.5) * 8,
          -22,
          '#0284c7',
          3,
          0.35,
          'dust'
        );
      }
    } else if (p.hero.id === 'morrigan') {
      // Sanguine Priestess: Boiling crimson blood vapors
      if (Math.random() < 0.25) {
        particleSystem.spawn(
          em.playerX + (Math.random() - 0.5) * 20,
          em.playerY + (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 14,
          -20,
          '#ef4444',
          2.5,
          0.3,
          'blood'
        );
      }
    } else if (p.hero.id === 'zephyr') {
      // Astral Astromancer: Stellar starlight motes
      if (Math.random() < 0.25) {
        particleSystem.spawn(
          em.playerX + (Math.random() - 0.5) * 26,
          em.playerY + (Math.random() - 0.5) * 26,
          (Math.random() - 0.5) * 10,
          -15,
          '#e879f9',
          2.5,
          0.4,
          'spark'
        );
      }
    }
    ctx.restore();

    // 4. Render Player Sprite with Bobbing, Squish & Tilt
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y + bobY);
    ctx.rotate(tilt);
    ctx.scale(squashX, squashY);

    // Invulnerability Flashing
    if (p.invulnerabilityTimer > 0) {
      const flashPeriod = Math.sin(now * 0.035);
      if (flashPeriod > 0) {
        ctx.globalAlpha = 0.5;
      }
    }

    // Direction flip
    if (em.playerFacingX < 0) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  private renderProjectiles(
    em: EntityManager,
    camera: Camera,
    particleSystem: ParticleSystem
  ): void {
    const ctx = this.ctx;
    const now = performance.now();

    for (let i = 0; i < em.projectiles.length; i++) {
      const p = em.projectiles[i];
      if (!p.active || p.isPuddle) continue; // Puddles rendered in ground layer
      if (!camera.isVisible(p.x, p.y, p.radius * 2 + 50)) continue;

      const screenPos = camera.worldToScreen(p.x, p.y);

      // 1. Garlic / Soul Eater Aura Barrier
      if (p.weaponId === 'garlic' || p.weaponId === 'soul_eater') {
        const isSoul = p.weaponId === 'soul_eater';
        ctx.save();
        const auraPulse = 1 + Math.sin(now * 0.008) * 0.05;
        const auraRadius = p.radius * auraPulse;

        // Radiant glow gradient
        const grad = ctx.createRadialGradient(screenPos.x, screenPos.y, auraRadius * 0.7, screenPos.x, screenPos.y, auraRadius);
        grad.addColorStop(0, isSoul ? 'rgba(168, 85, 247, 0)' : 'rgba(250, 204, 21, 0)');
        grad.addColorStop(0.8, isSoul ? 'rgba(168, 85, 247, 0.25)' : 'rgba(250, 204, 21, 0.2)');
        grad.addColorStop(1, isSoul ? 'rgba(147, 51, 234, 0.5)' : 'rgba(234, 179, 8, 0.4)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isSoul ? '#c084fc' : '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, auraRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
        continue;
      }

      // 2. Royal Sword / Blood Cleaver (Sweeping Crescent Arc)
      if (p.weaponId === 'whip' || p.weaponId === 'bloody_tear') {
        const isBloody = p.weaponId === 'bloody_tear';
        const facing = p.initialVx !== undefined ? p.initialVx : em.playerFacingX;
        const progress = Math.min(1, p.elapsedTime / Math.max(0.01, p.duration));

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);

        // Direction flip
        if (facing < 0) {
          ctx.scale(-1, 1);
        }

        // Sweeping crescent blade geometry
        const sweepAngle = Math.PI * 0.72; // ~130 degree arc
        const startA = -sweepAngle / 2;
        const endA = sweepAngle / 2;

        const expand = 0.85 + 0.3 * progress;
        const outerR = p.radius * 1.35 * expand;
        const innerR = p.radius * 0.42 * expand;

        // Dynamic fade: quick entry, smooth dissipation
        const alpha = Math.max(0, 1 - progress ** 1.3);
        ctx.globalAlpha = alpha;

        // Radiant energy blade gradient
        const grad = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
        if (isBloody) {
          grad.addColorStop(0, 'rgba(69, 10, 10, 0)');
          grad.addColorStop(0.25, 'rgba(153, 27, 27, 0.55)');
          grad.addColorStop(0.7, 'rgba(239, 68, 68, 0.9)');
          grad.addColorStop(0.92, '#ffffff'); // Razor sharp white edge
          grad.addColorStop(1.0, 'rgba(254, 202, 202, 0)');
        } else {
          // Abyssal Edge: Deep void purple to bioluminescent cyan cutting edge
          grad.addColorStop(0, 'rgba(15, 23, 42, 0)');
          grad.addColorStop(0.25, 'rgba(124, 58, 237, 0.5)');
          grad.addColorStop(0.7, 'rgba(6, 182, 212, 0.85)');
          grad.addColorStop(0.92, '#ffffff'); // Piercing cosmic razor edge
          grad.addColorStop(1.0, 'rgba(103, 232, 249, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, outerR, startA, endA);
        ctx.arc(innerR * 0.25, 0, innerR, endA, startA, true);
        ctx.closePath();
        ctx.fill();

        // White luminous razor cutting edge
        ctx.shadowColor = isBloody ? '#ef4444' : '#06b6d4';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, outerR * 0.95, startA + 0.08, endA - 0.08);
        ctx.stroke();

        // Trailing inner energy speedlines
        ctx.strokeStyle = isBloody ? 'rgba(252, 165, 165, 0.6)' : 'rgba(167, 139, 250, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, (outerR + innerR) * 0.52, startA + 0.2, endA - 0.2);
        ctx.stroke();

        ctx.restore();
        continue;
      }

      // 3. Orbiting Weapons (Tome of R'lyeh, Grimoire of the Deep, Abyssal Maelstrom)
      if (p.orbitAngle !== undefined) {
        // Draw faint celestial orbital guide ring once
        if (i === 0 || p.orbitAngle < 0.2) {
          ctx.save();
          const playerScreen = camera.worldToScreen(em.playerX, em.playerY);
          ctx.strokeStyle = p.weaponId === 'holy_maelstrom' ? 'rgba(168, 85, 247, 0.45)' : 'rgba(6, 182, 212, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.arc(playerScreen.x, playerScreen.y, p.orbitRadius || 90, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Orbit particle sparkle
        if (Math.random() < 0.2) {
          particleSystem.spawn(p.x, p.y, 0, 0, p.weaponId === 'holy_maelstrom' ? '#c084fc' : '#22d3ee', 2.5, 0.2, 'magic_star');
        }
      }

      // 4. Flying Projectile Trails
      // Blackfire Orb / Starfall / Cosmic Blaze Trails
      if (p.weaponId === 'fire_wand' || p.weaponId === 'hellfire' || p.weaponId === 'cosmic_blaze') {
        if (Math.random() < 0.45) {
          particleSystem.spawn(
            p.x + (Math.random() - 0.5) * 10,
            p.y + (Math.random() - 0.5) * 10,
            -p.vx * 0.15 + (Math.random() - 0.5) * 20,
            -p.vy * 0.15 + (Math.random() - 0.5) * 20,
            p.weaponId === 'cosmic_blaze' ? '#c084fc' : '#10b981',
            3,
            0.25,
            'ember'
          );
        }
      }

      // Void Darts / Cosmic Rupture Trails
      if (p.weaponId === 'magic_wand' || p.weaponId === 'holy_wand') {
        if (Math.random() < 0.4) {
          particleSystem.spawn(
            p.x,
            p.y,
            -p.vx * 0.1,
            -p.vy * 0.1,
            p.weaponId === 'holy_wand' ? '#c084fc' : '#06b6d4',
            2.5,
            0.22,
            'magic_star'
          );
        }
      }

      // Standard Rotating / Flying Projectiles
      let spriteId = `proj_${p.weaponId}`;
      if (p.weaponId === 'magic_wand' || p.weaponId === 'holy_wand') spriteId = 'proj_magic_bolt';
      else if (p.weaponId === 'fire_wand' || p.weaponId === 'hellfire' || p.weaponId === 'cosmic_blaze') spriteId = 'proj_fireball';
      else if (p.weaponId === 'knife' || p.weaponId === 'thousand_edge' || p.weaponId === 'vampiric_guillotine') spriteId = 'proj_knife';
      else if (p.weaponId === 'bible' || p.weaponId === 'unholy_vespers' || p.weaponId === 'holy_maelstrom') spriteId = 'proj_bible';
      else if (p.weaponId === 'cross' || p.weaponId === 'heaven_sword') spriteId = 'proj_cross';
      else if (p.weaponId === 'lightning_ring' || p.weaponId === 'thunder_loop') spriteId = 'proj_lightning';
      else if (p.weaponId === 'axe') spriteId = 'proj_axe';
      else if (p.weaponId === 'death_spiral') spriteId = 'proj_scythe';
      else if (p.weaponId === 'enemy_arrow') spriteId = 'proj_arrow';
      else if (p.weaponId === 'void_tendril' || p.weaponId === 'leviathans_grasp' || p.weaponId === 'blood_tide') spriteId = 'proj_void_tendril';
      else if (p.weaponId === 'abyssal_anchor' || p.weaponId === 'worldbreaker_anchor') spriteId = 'proj_abyssal_anchor';
      else if (p.weaponId === 'singularity_orb' || p.weaponId === 'event_horizon' || p.weaponId === 'apocalypse_horizon') spriteId = 'proj_singularity';
      else if (p.weaponId === 'blood_chalice' || p.weaponId === 'primordial_heart') spriteId = 'proj_blood_chalice';

      const sprite = ProceduralAssets.get(spriteId);
      const size = p.radius * 2;

      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);

      // Obsidian Fangs Motion Blur Trail
      if (p.weaponId === 'knife' || p.weaponId === 'thousand_edge' || p.weaponId === 'vampiric_guillotine') {
        ctx.strokeStyle = p.weaponId === 'vampiric_guillotine' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const angle = Math.atan2(p.vy, p.vx);
        ctx.moveTo(-Math.cos(angle) * 18, -Math.sin(angle) * 18);
        ctx.lineTo(0, 0);
        ctx.stroke();
      }

      // Angle calculation & dynamic spinning
      if (p.orbitAngle !== undefined) {
        ctx.rotate(p.orbitAngle + Math.PI / 2);
      } else if (
        p.weaponId === 'cross' ||
        p.weaponId === 'heaven_sword' ||
        p.weaponId === 'axe' ||
        p.weaponId === 'death_spiral'
      ) {
        ctx.rotate(p.elapsedTime * 14);
      } else if (p.vx !== 0 || p.vy !== 0) {
        ctx.rotate(Math.atan2(p.vy, p.vx));
      }

      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  private renderDamageNumbers(em: EntityManager, camera: Camera): void {
    const ctx = this.ctx;

    for (let i = 0; i < em.damageNumbers.length; i++) {
      const d = em.damageNumbers[i];
      if (!d.active) continue;

      const screenPos = camera.worldToScreen(d.x, d.y);
      ctx.save();
      ctx.globalAlpha = d.alpha;
      ctx.font = `bold ${Math.round(14 * d.scale)}px 'Courier New', monospace`;
      ctx.fillStyle = d.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(d.text, screenPos.x, screenPos.y);
      ctx.fillText(d.text, screenPos.x, screenPos.y);
      ctx.restore();
    }
  }

  private renderJoystick(input: InputManager): void {
    const visual = input.getJoystickVisual();
    if (!visual) return;

    const ctx = this.ctx;

    // Outer circle
    ctx.beginPath();
    ctx.arc(visual.origin.x, visual.origin.y, 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner stick
    ctx.beginPath();
    ctx.arc(visual.current.x, visual.current.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
  }
}
