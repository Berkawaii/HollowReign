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

    const heroId = p.hero.id;
    const abilityIndex = p.equippedAbilityIndex || 1;
    const activeAbilityConfig = abilityIndex === 2 ? p.hero.ability2 : p.hero.ability1;
    const baseCooldown = activeAbilityConfig ? activeAbilityConfig.cooldown : 12.0;
    const effectiveCooldown = Math.max(5.0, baseCooldown * p.stats.cooldown);
    p.abilityCooldownTimer = effectiveCooldown;
    p.abilityMaxCooldown = effectiveCooldown;

    // 1. VALERIUS
    if (heroId === 'valerius') {
      if (abilityIndex === 1) {
        // Ability 1: Aegis Charge
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
      } else {
        // Ability 2: Abyssal Bastion
        p.invulnerabilityTimer = 1.6;
        const healAmt = 25;
        p.currentHp = Math.min(p.stats.maxHealth, p.currentHp + healAmt);
        em.spawnDamageNumber(em.playerX, em.playerY - 20, healAmt, false, '#22c55e');

        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#818cf8', 180, 0.5);
          particles.spawnBurst(em.playerX, em.playerY, '#fbbf24', 24, 220, 3.5, 'spark');
        }
        camera.addShake(0.5);
        sound.play('explosion');

        // Shockwave damage & huge knockback
        const burstDmg = Math.round(85 * p.stats.might);
        for (const e of em.enemies) {
          if (!e.active) continue;
          const dx = e.x - em.playerX;
          const dy = e.y - em.playerY;
          const distSq = dx * dx + dy * dy;
          if (distSq < 180 * 180) {
            e.hp -= burstDmg;
            em.spawnDamageNumber(e.x, e.y, burstDmg, true, '#818cf8');
            const dist = Math.sqrt(distSq) || 1;
            e.knockbackDx += (dx / dist) * 550;
            e.knockbackDy += (dy / dist) * 550;
          }
        }

        // Holy bastion defensive puddle
        em.spawnProjectile(
          'holy_water',
          em.playerX,
          em.playerY,
          0,
          0,
          Math.round(25 * p.stats.might),
          999,
          75 * p.stats.area,
          4.0,
          p.stats.area,
          0,
          { isPuddle: true, tickTimer: 0.25 }
        );
      }
    }

    // 2. SYLVIA
    else if (heroId === 'sylvia') {
      if (abilityIndex === 1) {
        // Ability 1: Astral Blink
        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#818cf8', 45, 0.35);
          particles.spawnBurst(em.playerX, em.playerY, '#c084fc', 16, 160, 3, 'magic_star');
        }
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
      } else {
        // Ability 2: Cosmic Supernova
        camera.addShake(0.6);
        sound.play('magic_bolt');

        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#c084fc', 220, 0.6);
          particles.spawnBurst(em.playerX, em.playerY, '#67e8f9', 30, 260, 4, 'magic_star');
        }

        // Magnetize all gems
        for (const g of em.gems) {
          if (g.active) g.isMagnetized = true;
        }

        // 4 Starlight Beams
        const beamDmg = Math.round(110 * p.stats.might);
        for (let b = 0; b < 4; b++) {
          const angle = (b / 4) * Math.PI * 2;
          const bx = em.playerX + Math.cos(angle) * 110;
          const by = em.playerY + Math.sin(angle) * 110;
          if (particles) {
            particles.spawnShockwave(bx, by, '#38bdf8', 90, 0.4);
            particles.spawnBurst(bx, by, '#e879f9', 15, 160, 3, 'spark');
          }
          for (const e of em.enemies) {
            if (!e.active) continue;
            const edx = e.x - bx;
            const edy = e.y - by;
            if (edx * edx + edy * edy < 95 * 95) {
              e.hp -= beamDmg;
              em.spawnDamageNumber(e.x, e.y, beamDmg, true, '#67e8f9');
            }
          }
        }
      }
    }

    // 3. IGNIS
    else if (heroId === 'ignis') {
      if (abilityIndex === 1) {
        // Ability 1: Flame Nova
        const novaDamage = Math.round(75 * p.stats.might);
        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#ea580c', 165, 0.45);
          particles.spawnBurst(em.playerX, em.playerY, '#f97316', 30, 240, 3.5, 'ember');
          particles.spawnBurst(em.playerX, em.playerY, '#ef4444', 15, 180, 2.5, 'spark');
        }
        camera.addShake(0.55);
        sound.play('fireball');

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
      } else {
        // Ability 2: Inferno Deathbeam
        camera.addShake(0.65);
        sound.play('fireball');

        let dirX = input.lastFacingX;
        let dirY = input.lastFacingY;
        const len = Math.hypot(dirX, dirY) || 1;
        dirX /= len;
        dirY /= len;

        const beamSpeed = 460;
        for (let k = 0; k < 5; k++) {
          em.spawnProjectile(
            'fire_wand',
            em.playerX + dirX * (k * 40),
            em.playerY + dirY * (k * 40),
            dirX * beamSpeed,
            dirY * beamSpeed,
            Math.round(42 * p.stats.might),
            999,
            24 * p.stats.area,
            1.2,
            p.stats.area,
            60
          );
        }

        for (let pIdx = 1; pIdx <= 3; pIdx++) {
          em.spawnProjectile(
            'holy_water',
            em.playerX + dirX * (pIdx * 90),
            em.playerY + dirY * (pIdx * 90),
            0,
            0,
            Math.round(25 * p.stats.might),
            999,
            55 * p.stats.area,
            3.0,
            p.stats.area,
            0,
            { isPuddle: true, tickTimer: 0.2 }
          );
        }

        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#ef4444', 90, 0.35);
          particles.spawnBurst(em.playerX, em.playerY, '#f97316', 25, 240, 3, 'ember');
        }
      }
    }

    // 4. KAELEN
    else if (heroId === 'kaelen') {
      if (abilityIndex === 1) {
        // Ability 1: Shadow Step
        p.invulnerabilityTimer = 1.4;
        p.critBuffTimer = 3.5;
        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#9333ea', 55, 0.35);
          particles.spawnBurst(em.playerX, em.playerY, '#581c87', 18, 130, 3, 'dust');
          particles.spawnGhostTrail(em.playerX, em.playerY, 'hero_kaelen', '#7c3aed', em.playerFacingX);
        }
        camera.addShake(0.2);
        sound.play('knife');
      } else {
        // Ability 2: Blade Vortex
        p.invulnerabilityTimer = 0.8;
        camera.addShake(0.4);
        sound.play('knife');

        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#34d399', 120, 0.4);
          particles.spawnBurst(em.playerX, em.playerY, '#059669', 24, 200, 3, 'spark');
        }

        const daggersCount = 20;
        const daggerSpeed = 380;
        for (let d = 0; d < daggersCount; d++) {
          const angle = (d / daggersCount) * Math.PI * 2;
          em.spawnProjectile(
            'knife',
            em.playerX,
            em.playerY,
            Math.cos(angle) * daggerSpeed,
            Math.sin(angle) * daggerSpeed,
            Math.round(38 * p.stats.might),
            3,
            12 * p.stats.area,
            1.5,
            p.stats.area,
            25
          );
        }
      }
    }

    // 5. MORTIMER
    else if (heroId === 'mortimer') {
      if (abilityIndex === 1) {
        // Ability 1: Soul Drain
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
            { orbitAngle: angle, orbitSpeed: 3.5, orbitRadius: 75 }
          );
        }
      } else {
        // Ability 2: Plague Cataclysm
        camera.addShake(0.5);
        sound.play('explosion');

        const mouseWorldX = camera.x + input.mouseX;
        const mouseWorldY = camera.y + input.mouseY;
        let tx = mouseWorldX;
        let ty = mouseWorldY;
        const dist = Math.hypot(tx - em.playerX, ty - em.playerY);
        if (dist > 280 || dist < 15) {
          tx = em.playerX + input.lastFacingX * 140;
          ty = em.playerY + input.lastFacingY * 140;
        }

        if (particles) {
          particles.spawnShockwave(tx, ty, '#15803d', 140, 0.5);
          particles.spawnBurst(tx, ty, '#4ade80', 30, 220, 3.5, 'dust');
        }

        p.currentHp = Math.min(p.stats.maxHealth, p.currentHp + 15);
        em.spawnDamageNumber(em.playerX, em.playerY - 15, 15, false, '#22c55e');

        em.spawnProjectile(
          'holy_water',
          tx,
          ty,
          0,
          0,
          Math.round(32 * p.stats.might),
          999,
          90 * p.stats.area,
          6.0,
          p.stats.area,
          0,
          { isPuddle: true, tickTimer: 0.2 }
        );
      }
    }

    // 6. NYX
    else if (heroId === 'nyx') {
      if (abilityIndex === 1) {
        // Ability 1: Spatial Tether & Web
        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#a855f7', 120, 0.45);
          particles.spawnBurst(em.playerX, em.playerY, '#7e22ce', 25, 200, 3, 'spark');
        }
        camera.addShake(0.35);
        sound.play('magic_bolt');

        em.spawnProjectile(
          'holy_water',
          em.playerX,
          em.playerY,
          0,
          0,
          Math.round(28 * p.stats.might),
          999,
          75 * p.stats.area,
          4.0,
          p.stats.area,
          0,
          { isPuddle: true, tickTimer: 0.2 }
        );

        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const speed = 280;
          em.spawnProjectile(
            'void_tendril',
            em.playerX,
            em.playerY,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            Math.round(45 * p.stats.might),
            5,
            14 * p.stats.area,
            1.8,
            p.stats.area,
            35
          );
        }
      } else {
        // Ability 2: Void Singularity
        camera.addShake(0.55);
        sound.play('magic_bolt');

        const sx = em.playerX + input.lastFacingX * 110;
        const sy = em.playerY + input.lastFacingY * 110;

        if (particles) {
          particles.spawnShockwave(sx, sy, '#6b21a8', 150, 0.5);
          particles.spawnBurst(sx, sy, '#c084fc', 25, 200, 3.5, 'magic_star');
        }

        em.spawnProjectile(
          'singularity_orb',
          sx,
          sy,
          input.lastFacingX * 35,
          input.lastFacingY * 35,
          Math.round(45 * p.stats.might),
          999,
          45 * p.stats.area,
          4.5,
          p.stats.area,
          0
        );
      }
    }

    // 7. MALAKOR
    else if (heroId === 'malakor') {
      if (abilityIndex === 1) {
        // Ability 1: Ground Pound
        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#0284c7', 220, 0.5);
          particles.spawnBurst(em.playerX, em.playerY, '#0369a1', 30, 240, 3.5, 'dust');
          particles.spawnBurst(em.playerX, em.playerY, '#f59e0b', 16, 180, 2.5, 'spark');
        }
        camera.addShake(0.7);
        sound.play('explosion');

        const slamDamage = Math.round(95 * p.stats.might);
        for (const e of em.enemies) {
          if (!e.active) continue;
          const dx = e.x - em.playerX;
          const dy = e.y - em.playerY;
          const distSq = dx * dx + dy * dy;
          if (distSq < 220 * 220) {
            e.hp -= slamDamage;
            em.spawnDamageNumber(e.x, e.y, slamDamage, true, '#38bdf8');
            const dist = Math.sqrt(distSq) || 1;
            e.knockbackDx += (dx / dist) * 750;
            e.knockbackDy += (dy / dist) * 750;
          }
        }
      } else {
        // Ability 2: Leviathan's Call
        camera.addShake(0.75);
        sound.play('explosion');

        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#0369a1', 320, 0.6);
          particles.spawnBurst(em.playerX, em.playerY, '#38bdf8', 40, 280, 4, 'dust');
        }

        const chainDmg = Math.round(120 * p.stats.might);
        for (const e of em.enemies) {
          if (!e.active) continue;
          const dx = e.x - em.playerX;
          const dy = e.y - em.playerY;
          if (dx * dx + dy * dy < 340 * 340) {
            e.hp -= chainDmg;
            em.spawnDamageNumber(e.x, e.y, chainDmg, true, '#0284c7');
            e.knockbackDx = 0;
            e.knockbackDy = 0;
            e.flashTimer = 0.5;
          }
        }
      }
    }

    // 8. MORRIGAN
    else if (heroId === 'morrigan') {
      if (abilityIndex === 1) {
        // Ability 1: Sanguine Eruption
        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#ef4444', 180, 0.45);
          particles.spawnBurst(em.playerX, em.playerY, '#b91c1c', 35, 220, 3, 'blood');
        }
        camera.addShake(0.5);
        sound.play('whip_crit');

        const hpDrain = Math.max(5, Math.round(p.currentHp * 0.1));
        p.currentHp = Math.max(1, p.currentHp - hpDrain);

        const eruptionDmg = Math.round(110 * p.stats.might);
        let hitEnemies = 0;
        for (const e of em.enemies) {
          if (!e.active) continue;
          const dx = e.x - em.playerX;
          const dy = e.y - em.playerY;
          if (dx * dx + dy * dy < 200 * 200) {
            e.hp -= eruptionDmg;
            em.spawnDamageNumber(e.x, e.y, eruptionDmg, true, '#ef4444');
            hitEnemies++;
          }
        }

        const healBack = Math.min(Math.round(p.stats.maxHealth * 0.25), hitEnemies * 4 + 8);
        p.currentHp = Math.min(p.stats.maxHealth, p.currentHp + healBack);
        em.spawnDamageNumber(em.playerX, em.playerY - 20, healBack, false, '#22c55e');

        em.spawnProjectile(
          'holy_water',
          em.playerX,
          em.playerY,
          0,
          0,
          Math.round(35 * p.stats.might),
          999,
          65 * p.stats.area,
          3.0,
          p.stats.area,
          0,
          { isPuddle: true, tickTimer: 0.2 }
        );
      } else {
        // Ability 2: Sacrificial Domain
        camera.addShake(0.55);
        sound.play('whip_crit');

        const hpCost = Math.max(5, Math.round(p.currentHp * 0.1));
        p.currentHp = Math.max(1, p.currentHp - hpCost);

        p.critBuffTimer = 5.0; // 5s of empowered attacks!

        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#dc2626', 160, 0.5);
          particles.spawnBurst(em.playerX, em.playerY, '#991b1b', 35, 240, 3.5, 'blood');
        }

        em.spawnProjectile(
          'holy_water',
          em.playerX,
          em.playerY,
          0,
          0,
          Math.round(40 * p.stats.might),
          999,
          95 * p.stats.area,
          5.0,
          p.stats.area,
          0,
          { isPuddle: true, tickTimer: 0.25 }
        );
      }
    }

    // 9. ZEPHYR
    else {
      if (abilityIndex === 1) {
        // Ability 1: Graviton Surge
        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#c084fc', 200, 0.5);
          particles.spawnBurst(em.playerX, em.playerY, '#e879f9', 30, 220, 3, 'magic_star');
        }
        camera.addShake(0.45);
        sound.play('magic_bolt');

        for (const g of em.gems) {
          if (g.active) g.isMagnetized = true;
        }

        const pullDamage = Math.round(75 * p.stats.might);
        for (const e of em.enemies) {
          if (!e.active) continue;
          const dx = em.playerX - e.x;
          const dy = em.playerY - e.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 260 * 260) {
            const dist = Math.sqrt(distSq) || 1;
            e.knockbackDx += (dx / dist) * 450;
            e.knockbackDy += (dy / dist) * 450;
            e.hp -= pullDamage;
            em.spawnDamageNumber(e.x, e.y, pullDamage, false, '#c084fc');
          }
        }
      } else {
        // Ability 2: Chronos Rift
        camera.addShake(0.4);
        sound.play('magic_bolt');

        if (particles) {
          particles.spawnShockwave(em.playerX, em.playerY, '#38bdf8', 350, 0.6);
          particles.spawnBurst(em.playerX, em.playerY, '#818cf8', 30, 240, 4, 'magic_star');
        }

        // Drastically slow all active enemies on screen for 4s
        for (const e of em.enemies) {
          if (!e.active) continue;
          e.speed = Math.max(10, e.speed * 0.25);
          e.flashTimer = 0.3;
        }

        // Slow all enemy projectiles
        for (const proj of em.projectiles) {
          if (proj.weaponId === 'enemy_arrow') {
            proj.vx *= 0.2;
            proj.vy *= 0.2;
          }
        }
      }
    }
  }
}
