import { EntityManager } from '../EntityManager';
import { InputManager } from '../../core/InputManager';
import { Camera } from '../../core/Camera';
import { WorldMap } from '../../core/WorldMap';
import { sound } from '../../core/AudioEngine';
import { ParticleSystem } from './ParticleSystem';

export class AbilitySystem {
  public update(
    em: EntityManager,
    input: InputManager,
    camera: Camera,
    worldMap: WorldMap,
    dt: number
  ): void {
    if (!em.player) return;
    const p = em.player;

    // 1. Update Timers
    if (p.abilityCooldownTimer > 0) {
      p.abilityCooldownTimer = Math.max(0, p.abilityCooldownTimer - dt);
    }

    if (p.critBuffTimer > 0) {
      p.critBuffTimer = Math.max(0, p.critBuffTimer - dt);
    }

    // 2. Dash Physics Execution
    if (p.dashDuration > 0) {
      p.dashDuration -= dt;
      const moveX = p.dashVx * dt;
      const moveY = p.dashVy * dt;

      const resolved = worldMap.resolveCollision(
        em.playerX + moveX,
        em.playerY + moveY,
        em.playerRadius
      );
      em.playerX = resolved.x;
      em.playerY = resolved.y;

      const particles = ParticleSystem.get();
      if (particles) {
        particles.spawnGhostTrail(em.playerX, em.playerY, p.hero.spriteId, p.hero.accentColor, em.playerFacingX);
      }

      // Valerius holy charge damage during dash
      if (p.hero.id === 'valerius') {
        for (const e of em.enemies) {
          if (!e.active) continue;
          const dx = e.x - em.playerX;
          const dy = e.y - em.playerY;
          if (dx * dx + dy * dy < (em.playerRadius + e.radius + 15) ** 2) {
            const dmg = Math.round(40 + p.stats.might * 25);
            e.hp -= dmg;
            em.spawnDamageNumber(e.x, e.y, dmg, true, '#fbbf24');
            const dist = Math.hypot(dx, dy) || 1;
            e.knockbackDx += (dx / dist) * 450;
            e.knockbackDy += (dy / dist) * 450;
          }
        }
      }
    }

    // 3. Trigger Ability on Space
    if (input.consumeSpaceTrigger()) {
      if (p.abilityCooldownTimer <= 0) {
        this.activateAbility(em, input, camera, worldMap);
      }
    }
  }

  private activateAbility(
    em: EntityManager,
    input: InputManager,
    camera: Camera,
    worldMap: WorldMap
  ): void {
    if (!em.player) return;
    const p = em.player;
    const particles = ParticleSystem.get();

    // Cooldown Formula: 12s base, scaled by player cooldown stat, hard-capped at 6.0s min
    const baseCooldown = 12.0;
    const effectiveCooldown = Math.max(6.0, baseCooldown * p.stats.cooldown);
    p.abilityCooldownTimer = effectiveCooldown;
    p.abilityMaxCooldown = effectiveCooldown;

    const heroId = p.hero.id;

    // 1. VALERIUS: Holy Shield Charge
    if (heroId === 'valerius') {
      let dirX = input.moveVector.x;
      let dirY = input.moveVector.y;
      if (dirX === 0 && dirY === 0) {
        dirX = input.lastFacingX;
        dirY = input.lastFacingY;
      }
      const len = Math.hypot(dirX, dirY) || 1;
      dirX /= len;
      dirY /= len;

      p.dashDuration = 0.35;
      p.dashVx = dirX * 650;
      p.dashVy = dirY * 650;
      p.invulnerabilityTimer = 0.9;

      if (particles) {
        particles.spawnShockwave(em.playerX, em.playerY, '#f59e0b', 55, 0.3);
        particles.spawnBurst(em.playerX, em.playerY, '#fbbf24', 12, 180, 3, 'spark');
      }

      camera.addShake(0.4);
      sound.play('explosion');
    }

    // 2. SYLVIA: Astral Blink
    else if (heroId === 'sylvia') {
      if (particles) {
        particles.spawnShockwave(em.playerX, em.playerY, '#818cf8', 45, 0.35);
        particles.spawnBurst(em.playerX, em.playerY, '#c084fc', 16, 160, 3, 'magic_star');
      }
      // Spawn lingering astral vortex at current location
      em.spawnProjectile(
        'holy_water',
        em.playerX,
        em.playerY,
        0,
        0,
        Math.round(18 * p.stats.might),
        999,
        50 * p.stats.area,
        3.5,
        p.stats.area,
        0,
        { isPuddle: true, tickTimer: 0.25 }
      );

      // Blink toward mouse pointer or facing direction
      const mouseWorldX = camera.x + input.mouseX;
      const mouseWorldY = camera.y + input.mouseY;
      let dx = mouseWorldX - em.playerX;
      let dy = mouseWorldY - em.playerY;
      let dist = Math.hypot(dx, dy);

      if (dist < 10) {
        dx = input.lastFacingX;
        dy = input.lastFacingY;
        dist = 1;
      }

      const blinkDist = Math.min(dist, 190);
      const targetX = em.playerX + (dx / dist) * blinkDist;
      const targetY = em.playerY + (dy / dist) * blinkDist;

      const resolved = worldMap.resolveCollision(targetX, targetY, em.playerRadius);
      em.playerX = resolved.x;
      em.playerY = resolved.y;

      p.invulnerabilityTimer = 0.6;
      camera.addShake(0.25);
      sound.play('magic_bolt');
    }

    // 3. IGNIS: Flame Nova
    else if (heroId === 'ignis') {
      const novaDamage = Math.round(75 * p.stats.might);
      if (particles) {
        particles.spawnShockwave(em.playerX, em.playerY, '#ea580c', 165, 0.45);
        particles.spawnBurst(em.playerX, em.playerY, '#f97316', 30, 240, 3.5, 'ember');
        particles.spawnBurst(em.playerX, em.playerY, '#ef4444', 15, 180, 2.5, 'spark');
      }
      camera.addShake(0.55);
      sound.play('fireball');

      // Clear enemy projectiles nearby
      for (let i = em.projectiles.length - 1; i >= 0; i--) {
        const proj = em.projectiles[i];
        if (proj.weaponId === 'enemy_arrow') {
          const dSq = (proj.x - em.playerX) ** 2 + (proj.y - em.playerY) ** 2;
          if (dSq < 220 * 220) {
            proj.active = false;
            em.removeProjectile(proj, i);
          }
        }
      }

      // Damage all enemies in radial burst
      for (const e of em.enemies) {
        if (!e.active) continue;
        const dx = e.x - em.playerX;
        const dy = e.y - em.playerY;
        const distSq = dx * dx + dy * dy;
        if (distSq < 160 * 160) {
          e.hp -= novaDamage;
          em.spawnDamageNumber(e.x, e.y, novaDamage, true, '#f97316');
          const dist = Math.sqrt(distSq) || 1;
          e.knockbackDx += (dx / dist) * 350;
          e.knockbackDy += (dy / dist) * 350;
        }
      }

      // Spawn fiery puddle
      em.spawnProjectile(
        'holy_water',
        em.playerX,
        em.playerY,
        0,
        0,
        Math.round(20 * p.stats.might),
        999,
        60 * p.stats.area,
        2.5,
        p.stats.area,
        0,
        { isPuddle: true, tickTimer: 0.25 }
      );
    }

    // 4. KAELEN: Shadow Step
    else if (heroId === 'kaelen') {
      p.invulnerabilityTimer = 1.4;
      p.critBuffTimer = 3.5; // Next 3.5s guarantees critical hits!
      if (particles) {
        particles.spawnShockwave(em.playerX, em.playerY, '#9333ea', 55, 0.35);
        particles.spawnBurst(em.playerX, em.playerY, '#581c87', 18, 130, 3, 'dust');
        particles.spawnGhostTrail(em.playerX, em.playerY, 'hero_kaelen', '#7c3aed', em.playerFacingX);
      }
      camera.addShake(0.2);
      sound.play('knife');
    }

    // 5. MORTIMER: Soul Drain & Spirit Orbit
    else {
      if (particles) {
        particles.spawnShockwave(em.playerX, em.playerY, '#22c55e', 75, 0.4);
        particles.spawnBurst(em.playerX, em.playerY, '#4ade80', 20, 160, 3, 'soul');
      }
      camera.addShake(0.4);
      sound.play('whip');

      let drainedCount = 0;
      for (const e of em.enemies) {
        if (!e.active) continue;
        const dx = e.x - em.playerX;
        const dy = e.y - em.playerY;
        if (dx * dx + dy * dy < 250 * 250) {
          const dmg = Math.round(35 * p.stats.might);
          e.hp -= dmg;
          em.spawnDamageNumber(e.x, e.y, dmg, false, '#a855f7');
          drainedCount++;
          if (drainedCount >= 8) break;
        }
      }

      if (drainedCount > 0) {
        const healAmt = Math.min(20, drainedCount * 3);
        p.currentHp = Math.min(p.stats.maxHealth, p.currentHp + healAmt);
        em.spawnDamageNumber(em.playerX, em.playerY - 15, healAmt, false, '#22c55e');
      }

      // Spawn 3 orbiting spectral spirits for 6 seconds
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        em.spawnProjectile(
          'bible',
          em.playerX + Math.cos(angle) * 75,
          em.playerY + Math.sin(angle) * 75,
          0,
          0,
          Math.round(30 * p.stats.might),
          999,
          16 * p.stats.area,
          6.0,
          p.stats.area,
          20,
          {
            orbitAngle: angle,
            orbitSpeed: 3.5,
            orbitRadius: 75,
          }
        );
      }
    }
  }
}
