import { EntityManager } from '../EntityManager';
import { InputManager } from '../../core/InputManager';
import { Camera } from '../../core/Camera';
import { WorldMap } from '../../core/WorldMap';

export class MovementSystem {
  public update(em: EntityManager, input: InputManager, camera: Camera, worldMap: WorldMap, dt: number): void {
    if (!em.player) return;

    // 1. UPDATE PLAYER MOVEMENT
    const playerSpeed = em.player.stats.moveSpeed;
    let speedBonus = 1.0;

    // Kaelen Passive: Under 30% HP, +40% speed
    if (em.player.hero.id === 'kaelen' && em.player.currentHp < em.player.stats.maxHealth * 0.3) {
      speedBonus += 0.4;
    }

    const moveVx = input.moveVector.x * playerSpeed * speedBonus;
    const moveVy = input.moveVector.y * playerSpeed * speedBonus;

    em.playerX += moveVx * dt;
    em.playerY += moveVy * dt;

    // Resolve Player Obstacle & Shrine Collisions
    const pCollision = worldMap.resolveCollision(em.playerX, em.playerY, em.playerRadius);
    em.playerX = pCollision.x;
    em.playerY = pCollision.y;

    em.playerFacingX = input.lastFacingX;
    em.playerFacingY = input.lastFacingY;
    em.playerFacingAngle = input.facingAngle;

    // Update proximity to shrines
    worldMap.update(em);

    // Player HP Recovery per second
    if (em.player.stats.recovery > 0 && em.player.currentHp < em.player.stats.maxHealth) {
      em.player.currentHp = Math.min(
        em.player.stats.maxHealth,
        em.player.currentHp + em.player.stats.recovery * dt
      );
    }

    // Invulnerability timer decay
    if (em.player.invulnerabilityTimer > 0) {
      em.player.invulnerabilityTimer = Math.max(0, em.player.invulnerabilityTimer - dt);
    }

    // 2. UPDATE ENEMIES
    for (let i = 0; i < em.enemies.length; i++) {
      const e = em.enemies[i];
      if (!e.active) continue;

      // Flash timer decay
      if (e.flashTimer > 0) {
        e.flashTimer = Math.max(0, e.flashTimer - dt);
      }

      // Knockback motion decay
      if (Math.abs(e.knockbackDx) > 0.1 || Math.abs(e.knockbackDy) > 0.1) {
        e.x += e.knockbackDx * dt;
        e.y += e.knockbackDy * dt;
        e.knockbackDx *= Math.max(0, 1 - 10 * dt);
        e.knockbackDy *= Math.max(0, 1 - 10 * dt);
      }

      // AI Movement towards player
      const dx = em.playerX - e.x;
      const dy = em.playerY - e.y;
      const dist = Math.hypot(dx, dy);

      if (e.behavior === 'ranged') {
        // Skeleton archer: stops at preferred range ~220px and fires
        const preferredRange = 220;
        e.attackTimer += dt;

        if (dist > preferredRange + 20) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        } else if (dist < preferredRange - 40) {
          // Back away slightly if too close
          e.x -= (dx / dist) * (e.speed * 0.7) * dt;
          e.y -= (dy / dist) * (e.speed * 0.7) * dt;
        }

        // Fire arrow every 3.0 seconds
        if (e.attackTimer >= 3.0 && dist < 450) {
          e.attackTimer = 0;
          const arrowSpeed = 220;
          em.spawnProjectile(
            'enemy_arrow',
            e.x,
            e.y,
            (dx / dist) * arrowSpeed,
            (dy / dist) * arrowSpeed,
            e.damage,
            1,
            6,
            4.0,
            1.0,
            0
          );
        }
      } else {
        // Standard chase / swarm / boss / reaper
        if (dist > 2) {
          e.x += (dx / dist) * e.speed * dt;
          e.y += (dy / dist) * e.speed * dt;
        }
      }

      // Resolve Obstacle Collisions for visible enemies
      if (camera.isVisible(e.x, e.y, e.radius * 2 + 50)) {
        const eCol = worldMap.resolveCollision(e.x, e.y, e.radius);
        e.x = eCol.x;
        e.y = eCol.y;
      }
    }

    // 3. UPDATE PROJECTILES
    for (let i = em.projectiles.length - 1; i >= 0; i--) {
      const p = em.projectiles[i];
      if (!p.active) continue;

      p.elapsedTime += dt;

      // Expire duration
      if (p.elapsedTime >= p.duration || p.pierceLeft <= 0) {
        em.removeProjectile(p, i);
        continue;
      }

      if (p.weaponId === 'bible' || p.weaponId === 'unholy_vespers' || p.weaponId === 'holy_maelstrom') {
        // Orbiting weapon
        p.orbitAngle = (p.orbitAngle || 0) + (p.orbitSpeed || 3.0) * dt;
        const radius = p.orbitRadius || 95;
        p.x = em.playerX + Math.cos(p.orbitAngle) * radius;
        p.y = em.playerY + Math.sin(p.orbitAngle) * radius;
      } else if (p.weaponId === 'garlic' || p.weaponId === 'soul_eater') {
        // Centered aura
        p.x = em.playerX;
        p.y = em.playerY;
      } else if (p.weaponId === 'whip' || p.weaponId === 'bloody_tear') {
        // Attached slash offset
        // Handled in combat system directly
      } else if (p.weaponId === 'magic_wand' || p.weaponId === 'holy_wand') {
        // Homing projectile: steer smoothly towards closest unhit enemy
        let nearestDistSq = 350 * 350;
        let nearestX = 0;
        let nearestY = 0;
        let foundTarget = false;

        const maxScan = Math.min(60, em.enemies.length);
        for (let j = 0; j < maxScan; j++) {
          const e = em.enemies[j];
          if (!e.active || p.hitEnemyIds.has(e.id)) continue;
          const dSq = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
          if (dSq < nearestDistSq) {
            nearestDistSq = dSq;
            nearestX = e.x;
            nearestY = e.y;
            foundTarget = true;
          }
        }

        if (foundTarget) {
          const currentSpeed = Math.hypot(p.vx, p.vy) || 360;
          const targetDx = nearestX - p.x;
          const targetDy = nearestY - p.y;
          const targetDist = Math.hypot(targetDx, targetDy) || 1;

          const steerFactor = 10.0 * dt;
          p.vx += ((targetDx / targetDist) * currentSpeed - p.vx) * Math.min(1.0, steerFactor);
          p.vy += ((targetDy / targetDist) * currentSpeed - p.vy) * Math.min(1.0, steerFactor);

          const newLen = Math.hypot(p.vx, p.vy) || 1;
          p.vx = (p.vx / newLen) * currentSpeed;
          p.vy = (p.vy / newLen) * currentSpeed;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else if (p.weaponId === 'bone') {
        // Bouncing bone
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Screen boundary bounces
        const margin = 50;
        const minX = camera.x - camera.viewportWidth / 2 - margin;
        const maxX = camera.x + camera.viewportWidth / 2 + margin;
        const minY = camera.y - camera.viewportHeight / 2 - margin;
        const maxY = camera.y + camera.viewportHeight / 2 + margin;

        if (p.x <= minX || p.x >= maxX) p.vx = -p.vx;
        if (p.y <= minY || p.y >= maxY) p.vy = -p.vy;
      } else if (p.weaponId === 'cross' || p.weaponId === 'heaven_sword') {
        // Boomerang physics: slows down and accelerates backwards through player
        if (p.initialVx !== undefined && p.initialVy !== undefined) {
          p.vx -= p.initialVx * 1.4 * dt;
          p.vy -= p.initialVy * 1.4 * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else if (p.gravity) {
        // Parabolic gravity (Axe)
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else if (p.isPuddle && (p.weaponId === 'santa_water' || p.weaponId === 'la_borra' || p.weaponId === 'holy_water')) {
        // Ground Puddle (Santa Water / La Borra / Ability Puddles)
        if (p.weaponId === 'la_borra' && em.player) {
          // La Borra: creeps towards player and grows
          const pdx = em.playerX - p.x;
          const pdy = em.playerY - p.y;
          const pdist = Math.hypot(pdx, pdy) || 1;
          if (pdist > 10) {
            p.x += (pdx / pdist) * 65 * dt;
            p.y += (pdy / pdist) * 65 * dt;
          }
          p.radius = Math.min(90, p.radius + 6 * dt);
        }
      } else {
        // Standard straight line projectile (Knife, Fireball, Death Spiral, Arrow)
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }

    // 4. UPDATE DAMAGE NUMBERS
    for (let i = em.damageNumbers.length - 1; i >= 0; i--) {
      const d = em.damageNumbers[i];
      if (!d.active) continue;

      d.elapsedTime += dt;
      d.y += d.vy * dt;
      d.alpha = Math.max(0, 1 - d.elapsedTime / d.maxDuration);

      if (d.elapsedTime >= d.maxDuration) {
        d.active = false;
        em.damageNumbers.splice(i, 1);
      }
    }
  }
}
