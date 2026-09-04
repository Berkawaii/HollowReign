import { EntityManager } from '../EntityManager';
import { InputManager } from '../../core/InputManager';
import { Camera } from '../../core/Camera';
import { WorldMap } from '../../core/WorldMap';
import { sound } from '../../core/AudioEngine';
import { ParticleSystem } from './ParticleSystem';
import { EnemyEntity } from '../Components';

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
    const activeReaper = em.enemies.find((e) => e.active && e.behavior === 'reaper');

    for (let i = 0; i < em.enemies.length; i++) {
      const e = em.enemies[i];
      if (!e.active) continue;

      // MONSTER TERROR / FLEE AI:
      // When the Grim Reaper arrives, all regular monsters panic and flee off-screen!
      if (activeReaper && e.behavior !== 'reaper') {
        e.fearTimer = (e.fearTimer || 0) + dt;
        const fleeDx = e.x - activeReaper.x;
        const fleeDy = e.y - activeReaper.y;
        const fleeDist = Math.hypot(fleeDx, fleeDy) || 1;
        // Sprint in terror at 2.4x speed away from the Reaper
        e.x += (fleeDx / fleeDist) * e.speed * 2.4 * dt;
        e.y += (fleeDy / fleeDist) * e.speed * 2.4 * dt;

        if (Math.random() < 0.08) e.flashTimer = 0.08;

        // Dissolve into fear ash if off-screen or after 3.2s
        if (!camera.isVisible(e.x, e.y, 80) || e.fearTimer >= 3.2) {
          const particles = ParticleSystem.get();
          if (particles) {
            particles.spawnBurst(e.x, e.y, '#64748b', 6, 80, 1.5, 'dust');
          }
          em.removeEnemy(e, i);
          continue;
        }
        continue;
      }

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
          e.x -= (dx / dist) * e.speed * 0.5 * dt;
          e.y -= (dy / dist) * e.speed * 0.5 * dt;
        }

        // Visual aiming telegraph: 0.5s before shooting, archer flashes
        if (e.attackTimer >= 4.0 && camera.isVisible(e.x, e.y, 60)) {
          e.flashTimer = Math.max(e.flashTimer, 0.08);
        }

        // Fire arrow: 4.5s cooldown, only when visible on screen, max 14 arrows on screen
        if (e.attackTimer >= 4.5 && dist < 420 && camera.isVisible(e.x, e.y, 60)) {
          const currentArrowCount = em.projectiles.filter((p) => p.active && p.weaponId === 'enemy_arrow').length;
          if (currentArrowCount < 14) {
            e.attackTimer = 0;
            const arrowSpeed = 180;
            em.spawnProjectile(
              'enemy_arrow',
              e.x,
              e.y,
              (dx / dist) * arrowSpeed,
              (dy / dist) * arrowSpeed,
              Math.round(e.damage * 0.8),
              1,
              6,
              2.4,
              1.0,
              0
            );
          } else {
            // Delay shot slightly if screen is already arrow heavy
            e.attackTimer = 3.8;
          }
        }
      } else if (e.behavior === 'reaper') {
        // Supreme Reaper Boss AI
        this.updateReaperBehavior(em, e, camera, dt);
      } else if (e.behavior === 'boss') {
        // Boss AI with Skills, Enrage, and Telegraphs
        this.updateBossBehavior(em, e, camera, dt);
      } else {
        // Standard chase / swarm / tank
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
      } else if (p.weaponId === 'singularity_orb' || p.weaponId === 'event_horizon' || p.weaponId === 'apocalypse_horizon') {
        // Drifting Singularity Sphere with gravitational suction
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const pullRadius = p.radius * 2.8;
        const pullRadiusSq = pullRadius * pullRadius;
        const pullForce = (p.weaponId === 'apocalypse_horizon' ? 360 : p.weaponId === 'event_horizon' ? 260 : 160) * dt;

        for (let j = 0; j < em.enemies.length; j++) {
          const e = em.enemies[j];
          if (!e.active) continue;
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < pullRadiusSq && dSq > 16) {
            const dist = Math.sqrt(dSq) || 1;
            e.x += (dx / dist) * pullForce;
            e.y += (dy / dist) * pullForce;
          }
        }
      } else if (p.gravity) {
        // Parabolic gravity (Axe & Abyssal Anchor)
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else if (
        p.isPuddle &&
        (p.weaponId === 'santa_water' ||
          p.weaponId === 'la_borra' ||
          p.weaponId === 'holy_water' ||
          p.weaponId === 'blood_chalice' ||
          p.weaponId === 'primordial_heart')
      ) {
        // Ground Puddle (Santa Water / La Borra / Ability Puddles / Blood Runes)
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
        // Standard straight line projectile (Knife, Fireball, Death Spiral, Arrow, Void Tendril)
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

  /**
   * Advanced Boss AI with distinct skills, warning telegraphs, and enrage transitions.
   */
  private updateBossBehavior(em: EntityManager, e: EnemyEntity, camera: Camera, dt: number): void {
    if (!em.player) return;

    // Enrage phase transition at <50% HP
    if (e.hp < e.maxHp * 0.5 && !e.isEnraged) {
      e.isEnraged = true;
      e.speed *= 1.2;
      camera.addShake(0.5);
      sound.play('explosion');
      em.spawnDamageNumber(e.x, e.y - 30, 0, true, '#ef4444');
      const particles = ParticleSystem.get();
      if (particles) {
        particles.spawnShockwave(e.x, e.y, '#ef4444', 80, 0.4);
        particles.spawnBurst(e.x, e.y, '#f59e0b', 20, 200, 3, 'ember');
      }
    }

    const dx = em.playerX - e.x;
    const dy = em.playerY - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    e.skillTimer = (e.skillTimer || 0) + dt;
    const skillCooldown = e.isEnraged ? 4.5 : 6.0;

    // Phase 0: Regular pursuit
    if (e.skillPhase === 0 || e.skillPhase === undefined) {
      if (dist > 5) {
        e.x += (dx / dist) * e.speed * dt;
        e.y += (dy / dist) * e.speed * dt;
      }

      if (e.skillTimer >= skillCooldown) {
        e.skillTimer = 0;
        e.skillPhase = 1; // Begin telegraph
        e.attackTimer = 0;

        // Choose telegraph & prepare skill
        if (e.typeId === 'minotaur_boss') {
          // Leviathan: Tidal Slam or Charge
          if (Math.random() < 0.5) {
            e.telegraphType = 'circle';
            e.telegraphRadius = 160;
          } else {
            e.telegraphType = 'line';
            e.telegraphAngle = Math.atan2(dy, dx);
            e.telegraphRadius = 320;
          }
        } else if (e.typeId === 'gorgon_boss') {
          // Shub-Niggurath: Petrifying Gaze or Brood Spawn
          if (Math.random() < 0.6) {
            e.telegraphType = 'cone';
            e.telegraphAngle = Math.atan2(dy, dx);
            e.telegraphRadius = 240;
          } else {
            e.telegraphType = 'circle';
            e.telegraphRadius = 120;
          }
        } else if (e.typeId === 'vampire_boss') {
          // Nyarlathotep: Shadow Blink or Chaos Nova
          e.telegraphType = 'circle';
          e.telegraphRadius = 140;
        } else if (e.typeId === 'necromancer_boss') {
          // R'lyeh High Priest: Death Ruptures
          e.telegraphType = 'rupture';
          e.telegraphTargetX = em.playerX;
          e.telegraphTargetY = em.playerY;
          e.telegraphRadius = 75;
        } else {
          e.telegraphType = 'circle';
          e.telegraphRadius = 140;
        }
      }
    } else if (e.skillPhase === 1) {
      // Phase 1: Telegraph wind-up (0.9s duration)
      e.attackTimer += dt;
      const windupDuration = e.isEnraged ? 0.7 : 0.9;
      e.telegraphProgress = Math.min(1, e.attackTimer / windupDuration);

      // Flash during telegraph
      e.flashTimer = 0.08;

      if (e.attackTimer >= windupDuration) {
        // Execute skill!
        e.skillPhase = 0;
        e.skillTimer = 0;
        const executedType = e.telegraphType;
        e.telegraphType = undefined;
        e.telegraphProgress = 0;

        const particles = ParticleSystem.get();

        if (e.typeId === 'minotaur_boss') {
          if (executedType === 'circle') {
            // Tidal Slam
            camera.addShake(0.65);
            sound.play('explosion');
            if (particles) {
              particles.spawnShockwave(e.x, e.y, '#0284c7', 160, 0.45);
              particles.spawnBurst(e.x, e.y, '#38bdf8', 25, 220, 3, 'spark');
            }
            if (dist < 160) {
              const dmg = Math.round(e.damage * 1.3);
              em.player.currentHp = Math.max(1, em.player.currentHp - dmg);
              camera.addShake(0.4);
              sound.play('hit');
              em.spawnDamageNumber(em.playerX, em.playerY, dmg, true, '#ef4444');
            }
          } else {
            // Abyssal Surge (Charge)
            camera.addShake(0.5);
            sound.play('explosion');
            const chargeAngle = e.telegraphAngle || 0;
            e.knockbackDx = Math.cos(chargeAngle) * 550;
            e.knockbackDy = Math.sin(chargeAngle) * 550;
            if (particles) {
              particles.spawnBurst(e.x, e.y, '#0284c7', 20, 180, 2.5, 'dust');
            }
          }
        } else if (e.typeId === 'gorgon_boss') {
          if (executedType === 'cone') {
            // Petrifying Gaze
            sound.play('magic_bolt');
            camera.addShake(0.35);
            if (particles) {
              particles.spawnBurst(e.x, e.y, '#22c55e', 30, 200, 3, 'ember');
            }
            const gazeAngle = e.telegraphAngle || 0;
            const playerAngle = Math.atan2(em.playerY - e.y, em.playerX - e.x);
            let diff = Math.abs(playerAngle - gazeAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;

            if (diff < Math.PI / 6 && dist < 240) {
              // Hit by petrifying gaze: slow player by 40% for 3 seconds!
              em.player.invulnerabilityTimer = 0.3;
              const dmg = Math.round(e.damage * 0.9);
              em.player.currentHp = Math.max(1, em.player.currentHp - dmg);
              em.spawnDamageNumber(em.playerX, em.playerY, dmg, false, '#22c55e');
            }
          } else {
            // Brood Spawn: summon 4 swarmer parasites
            sound.play('explosion');
            for (let b = 0; b < 4; b++) {
              const a = (b / 4) * Math.PI * 2;
              em.spawnEnemy('bat', e.x + Math.cos(a) * 45, e.y + Math.sin(a) * 45, 60, 140, 8, 2, 12, 'swarm', 0.1);
            }
          }
        } else if (e.typeId === 'vampire_boss') {
          // Shadow Blink & Blood Slash
          sound.play('knife');
          camera.addShake(0.4);
          if (particles) {
            particles.spawnGhostTrail(e.x, e.y, 'enemy_vampire_boss', '#9333ea', 1);
            particles.spawnBurst(e.x, e.y, '#a855f7', 20, 160, 2.5, 'spark');
          }
          // Teleport behind player
          const behindAngle = Math.atan2(em.playerFacingY, em.playerFacingX) + Math.PI;
          e.x = em.playerX + Math.cos(behindAngle) * 90;
          e.y = em.playerY + Math.sin(behindAngle) * 90;

          // Fire 8-direction shadow bolts
          for (let s = 0; s < 8; s++) {
            const sa = (s / 8) * Math.PI * 2;
            em.spawnProjectile(
              'enemy_arrow',
              e.x,
              e.y,
              Math.cos(sa) * 160,
              Math.sin(sa) * 160,
              Math.round(e.damage * 0.7),
              1,
              7,
              2.5,
              1.0,
              0
            );
          }
        } else if (e.typeId === 'necromancer_boss') {
          // Death Ruptures
          sound.play('explosion');
          camera.addShake(0.5);
          const rx = e.telegraphTargetX || em.playerX;
          const ry = e.telegraphTargetY || em.playerY;
          if (particles) {
            particles.spawnShockwave(rx, ry, '#c026d3', 90, 0.4);
            particles.spawnBurst(rx, ry, '#e879f9', 24, 180, 3, 'soul');
          }
          const pDist = Math.hypot(em.playerX - rx, em.playerY - ry);
          if (pDist < 90) {
            const dmg = Math.round(e.damage * 1.2);
            em.player.currentHp = Math.max(1, em.player.currentHp - dmg);
            sound.play('hit');
            em.spawnDamageNumber(em.playerX, em.playerY, dmg, true, '#c026d3');
          }
        }
      }
    }
  }

  /**
   * Supreme Reaper AI: Doom Cleaves, Shadow Warping, Soul Vortex, and Inevitable Death.
   */
  private updateReaperBehavior(em: EntityManager, e: EnemyEntity, camera: Camera, dt: number): void {
    if (!em.player) return;

    const dx = em.playerX - e.x;
    const dy = em.playerY - e.y;
    const dist = Math.hypot(dx, dy) || 1;

    // 1. Shadow Warp / Teleport if player is excessively far (> 620px)
    if (dist > 620) {
      const particles = ParticleSystem.get();
      if (particles) {
        particles.spawnShockwave(e.x, e.y, '#10b981', 100, 0.4);
        particles.spawnBurst(e.x, e.y, '#065f46', 20, 180, 3, 'spark');
      }

      // Reappear 180px near player
      const angle = Math.random() * Math.PI * 2;
      e.x = em.playerX + Math.cos(angle) * 180;
      e.y = em.playerY + Math.sin(angle) * 180;

      if (particles) {
        particles.spawnShockwave(e.x, e.y, '#10b981', 120, 0.5);
        particles.spawnBurst(e.x, e.y, '#34d399', 24, 220, 3.5, 'spark');
      }
      camera.addShake(0.45);
      sound.play('explosion');
      return;
    }

    // 2. Soul Vortex Gravitational Pull (< 360px)
    if (dist < 360) {
      const pullForce = 35 * dt;
      em.playerX += ((e.x - em.playerX) / dist) * pullForce;
      em.playerY += ((e.y - em.playerY) / dist) * pullForce;
    }

    // 3. Attacks & Doom Cleave
    e.skillTimer = (e.skillTimer || 0) + dt;
    const cleaveCooldown = 4.2;

    if (e.skillPhase === 0 || e.skillPhase === undefined) {
      // Advance at base reaper speed
      if (dist > 4) {
        e.x += (dx / dist) * e.speed * dt;
        e.y += (dy / dist) * e.speed * dt;
      }

      if (e.skillTimer >= cleaveCooldown) {
        e.skillTimer = 0;
        e.skillPhase = 1; // Begin telegraph
        e.attackTimer = 0;
        e.telegraphType = 'arc';
        e.telegraphRadius = 240;
        e.telegraphAngle = Math.atan2(dy, dx);
        e.telegraphProgress = 0;
      }
    } else if (e.skillPhase === 1) {
      // Telegraph charging for 0.75s
      e.attackTimer += dt;
      const chargeDuration = 0.75;
      e.telegraphProgress = Math.min(1.0, e.attackTimer / chargeDuration);
      e.telegraphAngle = Math.atan2(dy, dx);

      if (e.attackTimer >= chargeDuration) {
        // Execute Doom Cleave!
        e.skillPhase = 0;
        e.telegraphType = undefined;
        camera.addShake(0.7);
        sound.play('axe_throw');
        sound.play('explosion');

        const particles = ParticleSystem.get();
        if (particles) {
          particles.spawnShockwave(e.x, e.y, '#ef4444', 240, 0.4);
          particles.spawnBurst(e.x, e.y, '#10b981', 30, 240, 3.5, 'spark');
        }

        // Damage player if inside cleave arc
        const playerDist = dist;
        if (playerDist <= 240) {
          const playerAngle = Math.atan2(em.playerY - e.y, em.playerX - e.x);
          let angleDiff = Math.abs(playerAngle - (e.telegraphAngle || 0));
          if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
          if (angleDiff <= Math.PI * 0.45) {
            if (em.player.invulnerabilityTimer <= 0) {
              const cleaveDamage = 45;
              em.player.currentHp = Math.max(0, em.player.currentHp - cleaveDamage);
              em.spawnDamageNumber(em.playerX, em.playerY - 20, cleaveDamage, true, '#ef4444');
              em.player.invulnerabilityTimer = 0.8;
              camera.addShake(0.8);
            }
          }
        }
      }
    }
  }
}
