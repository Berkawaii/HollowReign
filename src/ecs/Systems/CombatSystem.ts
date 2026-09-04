import { EntityManager } from '../EntityManager';
import { WEAPONS, WeaponConfig, WeaponLevelStats } from '../../config/weapons';
import { sound } from '../../core/AudioEngine';
import { ParticleSystem } from './ParticleSystem';

export class CombatSystem {
  public update(em: EntityManager, dt: number): void {
    if (!em.player) return;

    for (let i = 0; i < em.player.weapons.length; i++) {
      const eqWeapon = em.player.weapons[i];
      const config = WEAPONS[eqWeapon.id];
      if (!config) continue;

      const lvlIdx = Math.min(eqWeapon.level - 1, config.levels.length - 1);
      const stats = config.levels[lvlIdx];

      eqWeapon.timer -= dt;

      // Handle persistent orbiting weapons (Bible) and Auras (Garlic)
      if (eqWeapon.id === 'bible' || eqWeapon.id === 'unholy_vespers' || eqWeapon.id === 'holy_maelstrom') {
        this.maintainOrbitingBooks(em, eqWeapon, config, stats);
      } else if (eqWeapon.id === 'garlic' || eqWeapon.id === 'soul_eater') {
        this.maintainAura(em, eqWeapon, config, stats);
      }

      if (eqWeapon.timer <= 0) {
        // Effective cooldown reduced by player cooldown stat
        const effectiveCooldown = stats.cooldown * em.player.stats.cooldown;
        eqWeapon.timer = Math.max(0.05, effectiveCooldown);

        this.fireWeapon(em, eqWeapon, config, stats);
      }
    }
  }

  private fireWeapon(
    em: EntityManager,
    _eqWeapon: { id: string; level: number; lastAngle: number },
    config: WeaponConfig,
    stats: WeaponLevelStats
  ): void {
    if (!em.player) return;

    const baseDamage = stats.damage * em.player.stats.might;
    const totalProjectiles = stats.projectiles + em.player.stats.amount;
    const totalArea = stats.area * em.player.stats.area;
    const totalSpeed = stats.speed * em.player.stats.speed;
    const totalDuration = stats.duration * em.player.stats.duration;

    // 1. ROYAL SWORD / BLOOD CLEAVER
    if (config.id === 'whip' || config.id === 'bloody_tear') {
      sound.play(config.id === 'bloody_tear' ? 'whip_crit' : 'whip');
      const facing = em.playerFacingX;
      const slashRadius = 42 * totalArea;

      // Front slash wrapping around knight
      em.spawnProjectile(
        config.id,
        em.playerX + facing * 18 * totalArea,
        em.playerY,
        0,
        0,
        baseDamage,
        stats.piercing,
        slashRadius,
        stats.duration,
        totalArea,
        stats.knockback,
        { initialVx: facing }
      );

      // Spawn blade cutting sparks along arc
      const particles = ParticleSystem.get();
      if (particles) {
        const sparkColor = config.id === 'bloody_tear' ? '#ef4444' : '#fde047';
        for (let s = 0; s < 4; s++) {
          const sparkAngle = (Math.random() - 0.5) * 1.1;
          const sx = em.playerX + facing * Math.cos(sparkAngle) * slashRadius * 0.95;
          const sy = em.playerY + Math.sin(sparkAngle) * slashRadius * 0.95;
          particles.spawn(
            sx,
            sy,
            facing * 60 + (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 50,
            sparkColor,
            2,
            0.2,
            'spark'
          );
        }
      }

      // Back slash if amount > 1
      if (totalProjectiles > 1) {
        em.spawnProjectile(
          config.id,
          em.playerX - facing * 18 * totalArea,
          em.playerY,
          0,
          0,
          baseDamage,
          stats.piercing,
          slashRadius,
          stats.duration,
          totalArea,
          stats.knockback,
          { initialVx: -facing }
        );
      }
    }

    // 2. MAGIC WAND / HOLY WAND (Auto-Targets Nearest Enemies)
    else if (config.id === 'magic_wand' || config.id === 'holy_wand') {
      sound.play('magic_bolt');
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let angle: number;

        if (targets[i]) {
          angle = Math.atan2(targets[i].y - em.playerY, targets[i].x - em.playerX);
        } else if (targets[0]) {
          const spread = (i - (totalProjectiles - 1) / 2) * 0.08;
          angle = Math.atan2(targets[0].y - em.playerY, targets[0].x - em.playerX) + spread;
        } else {
          angle = em.playerFacingAngle + (i - (totalProjectiles - 1) / 2) * 0.1;
        }

        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          config.id,
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          8 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback
        );
      }
    }

    // 3. KNIFE / THOUSAND EDGE (Fires in Player's Movement/Facing Direction)
    else if (config.id === 'knife' || config.id === 'thousand_edge') {
      sound.play('knife_throw');
      const facingAngle = em.playerFacingAngle;

      for (let i = 0; i < totalProjectiles; i++) {
        const spread = (i - (totalProjectiles - 1) / 2) * 0.12;
        const angle = facingAngle + spread;
        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          config.id,
          em.playerX + Math.cos(angle) * 15,
          em.playerY + Math.sin(angle) * 15,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          6 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback
        );
      }
    }

    // 4. FIRE WAND / HELLFIRE (Targets Closest Monsters with Explosive Fireballs)
    else if (config.id === 'fire_wand' || config.id === 'hellfire') {
      sound.play(config.id === 'hellfire' ? 'explosion' : 'fireball');
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let angle: number;

        if (targets[i]) {
          angle = Math.atan2(targets[i].y - em.playerY, targets[i].x - em.playerX);
        } else if (targets[0]) {
          const spread = (i - (totalProjectiles - 1) / 2) * 0.15;
          angle = Math.atan2(targets[0].y - em.playerY, targets[0].x - em.playerX) + spread;
        } else {
          angle = em.playerFacingAngle + (i - (totalProjectiles - 1) / 2) * 0.2;
        }

        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          config.id,
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          config.id === 'hellfire' ? 24 * totalArea : 12 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback
        );
      }
    }

    // 5. BONE (Aims towards Closest Monsters, then Bounces)
    else if (config.id === 'bone') {
      sound.play('knife_throw');
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let angle: number;

        if (targets[i]) {
          angle = Math.atan2(targets[i].y - em.playerY, targets[i].x - em.playerX);
        } else if (targets[0]) {
          const spread = (i - (totalProjectiles - 1) / 2) * 0.25;
          angle = Math.atan2(targets[0].y - em.playerY, targets[0].x - em.playerX) + spread;
        } else {
          angle = em.playerFacingAngle + (i - (totalProjectiles - 1) / 2) * 0.3;
        }

        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          config.id,
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          8 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          { bouncesLeft: 8 }
        );
      }
    }

    // 6. CROSS & HEAVEN SWORD (Boomerang Weapon)
    else if (config.id === 'cross' || config.id === 'heaven_sword') {
      sound.play(config.id === 'heaven_sword' ? 'whip_crit' : 'knife_throw');
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let angle: number;
        if (targets[i]) {
          angle = Math.atan2(targets[i].y - em.playerY, targets[i].x - em.playerX);
        } else if (targets[0]) {
          const spread = (i - (totalProjectiles - 1) / 2) * 0.2;
          angle = Math.atan2(targets[0].y - em.playerY, targets[0].x - em.playerX) + spread;
        } else {
          angle = em.playerFacingAngle + (i - (totalProjectiles - 1) / 2) * 0.2;
        }

        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;
        const isHeaven = config.id === 'heaven_sword';

        em.spawnProjectile(
          config.id,
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          (isHeaven ? 18 : 12) * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          {
            initialVx: vx,
            initialVy: vy,
            decelerate: totalSpeed * 1.5,
          }
        );
      }
    }

    // 7. LIGHTNING RING & THUNDER LOOP (Strikes from Sky)
    else if (config.id === 'lightning_ring' || config.id === 'thunder_loop') {
      sound.play(config.id === 'thunder_loop' ? 'explosion' : 'magic_bolt');
      const isThunder = config.id === 'thunder_loop';
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let strikeX = em.playerX + (Math.random() * 400 - 200);
        let strikeY = em.playerY + (Math.random() * 400 - 200);

        if (targets[i]) {
          strikeX = targets[i].x;
          strikeY = targets[i].y;
        } else if (targets[0]) {
          strikeX = targets[0].x + (Math.random() * 60 - 30);
          strikeY = targets[0].y + (Math.random() * 60 - 30);
        }

        em.spawnProjectile(
          config.id,
          strikeX,
          strikeY,
          0,
          0,
          baseDamage,
          stats.piercing,
          (isThunder ? 32 : 20) * totalArea,
          stats.duration,
          totalArea,
          stats.knockback
        );
      }
    }

    // 8. AXE & DEATH SPIRAL
    else if (config.id === 'axe') {
      sound.play('knife_throw');
      for (let i = 0; i < totalProjectiles; i++) {
        const side = (i % 2 === 0 ? 1 : -1);
        const vx = side * (70 + (i * 35));
        const vy = -460; // toss upwards

        em.spawnProjectile(
          config.id,
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          14 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          { gravity: 850 }
        );
      }
    } else if (config.id === 'death_spiral') {
      sound.play('whip_crit');
      const count = 9;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          config.id,
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          20 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback
        );
      }
    }

    // 9. SANTA WATER & LA BORRA (Ground Puddles)
    else if (config.id === 'santa_water' || config.id === 'la_borra') {
      sound.play('explosion');
      const isBorra = config.id === 'la_borra';
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let puddleX = em.playerX + (Math.random() * 260 - 130);
        let puddleY = em.playerY + (Math.random() * 260 - 130);

        if (targets[i]) {
          puddleX = targets[i].x;
          puddleY = targets[i].y;
        } else if (targets[0]) {
          puddleX = targets[0].x + (Math.random() * 80 - 40);
          puddleY = targets[0].y + (Math.random() * 80 - 40);
        }

        em.spawnProjectile(
          config.id,
          puddleX,
          puddleY,
          0,
          0,
          baseDamage,
          9999,
          (isBorra ? 45 : 28) * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          {
            isPuddle: true,
            tickTimer: 0.25,
          }
        );
      }
    }

    // 10. COSMIC BLAZE (Ultra Unification: Homing Meteors + Fire Lakes)
    else if (config.id === 'cosmic_blaze') {
      sound.play('fireball');
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let angle: number;
        if (targets[i]) {
          angle = Math.atan2(targets[i].y - em.playerY, targets[i].x - em.playerX);
        } else if (targets[0]) {
          const spread = (i - (totalProjectiles - 1) / 2) * 0.15;
          angle = Math.atan2(targets[0].y - em.playerY, targets[0].x - em.playerX) + spread;
        } else {
          angle = (i / totalProjectiles) * Math.PI * 2;
        }

        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          'hellfire',
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          26 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback
        );
      }
    }

    // 11. VAMPIRIC GUILLOTINE (Ultra Unification: 8-Direction Blood Dagger Cyclone)
    else if (config.id === 'vampiric_guillotine') {
      sound.play('knife_throw');
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + (Math.random() * 0.1 - 0.05);
        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          'vampiric_guillotine',
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          14 * totalArea,
          1.2,
          totalArea,
          stats.knockback
        );
      }
    }

    // 12. HOLY MAELSTROM (Ultra Unification: Rapid Homing Celestial Light Rays)
    else if (config.id === 'holy_maelstrom') {
      sound.play('magic_bolt');
      const raysCount = 4;
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, raysCount);

      for (let i = 0; i < raysCount; i++) {
        let angle: number;
        if (targets[i]) {
          angle = Math.atan2(targets[i].y - em.playerY, targets[i].x - em.playerX);
        } else {
          angle = (i / raysCount) * Math.PI * 2;
        }

        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          'holy_wand',
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          12 * totalArea,
          1.2,
          totalArea,
          stats.knockback
        );
      }
    }

    // 13. VOID TENDRIL & LEVIATHAN'S GRASP
    else if (config.id === 'void_tendril' || config.id === 'leviathans_grasp') {
      sound.play(config.id === 'leviathans_grasp' ? 'whip_crit' : 'whip');
      const isEvo = config.id === 'leviathans_grasp';
      const facingAngle = em.playerFacingAngle;
      const count = isEvo ? totalProjectiles * 2 : totalProjectiles;
      const tendrilSpeed = Math.max(300, totalSpeed);

      if (isEvo) {
        // Leviathan's Grasp: Pull nearby XP gems towards player
        for (const g of em.gems) {
          if (g.active && !g.isMagnetized) {
            const dx = em.playerX - g.x;
            const dy = em.playerY - g.y;
            if (dx * dx + dy * dy < 280 * 280) {
              g.isMagnetized = true;
            }
          }
        }
      }

      for (let i = 0; i < count; i++) {
        const spread = isEvo
          ? (i / count) * Math.PI * 2
          : facingAngle + (i - (count - 1) / 2) * 0.28;
        const vx = Math.cos(spread) * tendrilSpeed;
        const vy = Math.sin(spread) * tendrilSpeed;

        em.spawnProjectile(
          config.id,
          em.playerX + Math.cos(spread) * 25,
          em.playerY + Math.sin(spread) * 25,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          (isEvo ? 26 : 18) * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          { initialVx: vx, initialVy: vy }
        );
      }
    }

    // 14. ABYSSAL ANCHOR & WORLDBREAKER ANCHOR
    else if (config.id === 'abyssal_anchor' || config.id === 'worldbreaker_anchor') {
      sound.play('explosion');
      const isEvo = config.id === 'worldbreaker_anchor';
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let targetX = em.playerX + (i % 2 === 0 ? 1 : -1) * (140 + i * 40);

        if (targets[i]) {
          targetX = targets[i].x;
        } else if (targets[0]) {
          targetX = targets[0].x + (Math.random() * 80 - 40);
        }

        const dx = targetX - em.playerX;
        const timeToTarget = 0.9;
        const vx = dx / timeToTarget;
        const vy = -460;

        em.spawnProjectile(
          config.id,
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          (isEvo ? 24 : 16) * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          { gravity: 850 }
        );
      }
    }

    // 15. SINGULARITY SPHERE & EVENT HORIZON
    else if (config.id === 'singularity_orb' || config.id === 'event_horizon') {
      sound.play('magic_bolt');
      const isEvo = config.id === 'event_horizon';
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let angle: number;
        if (targets[i]) {
          angle = Math.atan2(targets[i].y - em.playerY, targets[i].x - em.playerX);
        } else {
          angle = em.playerFacingAngle + (i - (totalProjectiles - 1) / 2) * 0.35;
        }

        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          config.id,
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          stats.piercing,
          (isEvo ? 28 : 16) * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          { tickTimer: 0.2 }
        );
      }
    }

    // 16. SANGUINE CHALICE & PRIMORDIAL HEART
    else if (config.id === 'blood_chalice' || config.id === 'primordial_heart') {
      sound.play('whip_crit');
      const isEvo = config.id === 'primordial_heart';
      const targets = this.getClosestEnemies(em, em.playerX, em.playerY, totalProjectiles);

      for (let i = 0; i < totalProjectiles; i++) {
        let runeX = em.playerX + (Math.random() * 300 - 150);
        let runeY = em.playerY + (Math.random() * 300 - 150);

        if (targets[i]) {
          runeX = targets[i].x;
          runeY = targets[i].y;
        } else if (targets[0]) {
          runeX = targets[0].x + (Math.random() * 60 - 30);
          runeY = targets[0].y + (Math.random() * 60 - 30);
        }

        em.spawnProjectile(
          config.id,
          runeX,
          runeY,
          0,
          0,
          baseDamage,
          9999,
          (isEvo ? 45 : 28) * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          {
            isPuddle: true,
            tickTimer: 0.25,
          }
        );
      }
    }

    // 17. APOCALYPSE HORIZON (Legendary Unification)
    else if (config.id === 'apocalypse_horizon') {
      sound.play('explosion');
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + (Math.random() * 0.2);
        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          'apocalypse_horizon',
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          999,
          36 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          { tickTimer: 0.15 }
        );
      }
    }

    // 18. BLOOD TIDE (Legendary Unification)
    else if (config.id === 'blood_tide') {
      sound.play('whip_crit');
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const vx = Math.cos(angle) * totalSpeed;
        const vy = Math.sin(angle) * totalSpeed;

        em.spawnProjectile(
          'blood_tide',
          em.playerX,
          em.playerY,
          vx,
          vy,
          baseDamage,
          999,
          22 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback
        );
      }

      for (let j = 0; j < 3; j++) {
        const offsetAngle = Math.random() * Math.PI * 2;
        const offsetDist = Math.random() * 120;
        em.spawnProjectile(
          'primordial_heart',
          em.playerX + Math.cos(offsetAngle) * offsetDist,
          em.playerY + Math.sin(offsetAngle) * offsetDist,
          0,
          0,
          baseDamage * 0.8,
          9999,
          48 * totalArea,
          totalDuration,
          totalArea,
          stats.knockback,
          { isPuddle: true, tickTimer: 0.2 }
        );
      }
    }
  }

  private maintainOrbitingBooks(
    em: EntityManager,
    _eqWeapon: { id: string; level: number },
    config: WeaponConfig,
    stats: WeaponLevelStats
  ): void {
    if (!em.player) return;

    const totalProjectiles = stats.projectiles + em.player.stats.amount;
    const existingBooks = em.projectiles.filter(
      (p) => p.active && (p.weaponId === 'bible' || p.weaponId === 'unholy_vespers' || p.weaponId === 'holy_maelstrom')
    );

    if (existingBooks.length < totalProjectiles) {
      const needed = totalProjectiles - existingBooks.length;
      const baseDamage = stats.damage * em.player.stats.might;
      const totalArea = stats.area * em.player.stats.area;
      const totalSpeed = stats.speed * em.player.stats.speed;

      for (let i = 0; i < needed; i++) {
        const index = existingBooks.length + i;
        const angle = (index / totalProjectiles) * Math.PI * 2;
        const orbitRadius = 90 * totalArea;

        em.spawnProjectile(
          config.id,
          em.playerX + Math.cos(angle) * orbitRadius,
          em.playerY + Math.sin(angle) * orbitRadius,
          0,
          0,
          baseDamage,
          stats.piercing,
          10 * totalArea,
          (config.id === 'unholy_vespers' || config.id === 'holy_maelstrom') ? 99999 : stats.duration * em.player.stats.duration,
          totalArea,
          stats.knockback,
          {
            orbitAngle: angle,
            orbitSpeed: totalSpeed,
            orbitRadius: orbitRadius,
          }
        );
      }
    }
  }

  private maintainAura(
    em: EntityManager,
    _eqWeapon: { id: string; level: number },
    config: WeaponConfig,
    stats: WeaponLevelStats
  ): void {
    if (!em.player) return;

    const existingAura = em.projectiles.find(
      (p) => p.active && (p.weaponId === 'garlic' || p.weaponId === 'soul_eater')
    );

    const baseDamage = stats.damage * em.player.stats.might;
    const totalArea = stats.area * em.player.stats.area;
    const auraRadius = (config.id === 'soul_eater' ? 120 : 65) * totalArea;

    if (!existingAura) {
      em.spawnProjectile(
        config.id,
        em.playerX,
        em.playerY,
        0,
        0,
        baseDamage,
        9999,
        auraRadius,
        0.5,
        totalArea,
        stats.knockback
      );
    }
  }

  private getClosestEnemies(
    em: EntityManager,
    x: number,
    y: number,
    count: number
  ): { x: number; y: number }[] {
    return em.enemies
      .filter((e) => e.active)
      .map((e) => ({ x: e.x, y: e.y, distSq: (e.x - x) ** 2 + (e.y - y) ** 2 }))
      .sort((a, b) => a.distSq - b.distSq)
      .slice(0, count);
  }
}
