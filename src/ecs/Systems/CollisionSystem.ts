import { EntityManager } from '../EntityManager';
import { SpatialHashGrid } from '../../core/SpatialHashGrid';
import { Camera } from '../../core/Camera';
import { sound } from '../../core/AudioEngine';
import { EnemyEntity } from '../Components';
import { ParticleSystem } from './ParticleSystem';

export class CollisionSystem {
  private enemyGrid: SpatialHashGrid<EnemyEntity>;

  constructor() {
    this.enemyGrid = new SpatialHashGrid<EnemyEntity>(64);
  }

  public update(
    em: EntityManager,
    camera: Camera,
    onPlayerDeath: () => void,
    onBossKill: (bossKey: string) => void,
    dt: number
  ): void {
    if (!em.player) return;

    // 1. POPULATE SPATIAL HASH GRID WITH ALL ACTIVE ENEMIES
    this.enemyGrid.clear();
    for (let i = 0; i < em.enemies.length; i++) {
      const e = em.enemies[i];
      if (e.active) {
        this.enemyGrid.insert(e);
      }
    }

    // 2. PROJECTILE VS ENEMY COLLISIONS
    for (let i = em.projectiles.length - 1; i >= 0; i--) {
      const p = em.projectiles[i];
      if (!p.active) continue;

      // Enemy arrows only damage the player
      if (p.weaponId === 'enemy_arrow') {
        const dx = em.playerX - p.x;
        const dy = em.playerY - p.y;
        if (dx * dx + dy * dy <= (em.playerRadius + p.radius) ** 2) {
          this.damagePlayer(em, p.damage, camera, onPlayerDeath);
          p.active = false;
          em.removeProjectile(p, i);
        }
        continue;
      }

      if (p.isPuddle && (p.weaponId === 'santa_water' || p.weaponId === 'la_borra' || p.weaponId === 'holy_water')) {
        p.tickTimer = (p.tickTimer || 0.25) - dt;
        if (p.tickTimer <= 0) {
          p.tickTimer = 0.25;
          p.hitEnemyIds.clear();
        }
      }

      // Query nearby enemies within projectile radius
      const nearbyEnemies = this.enemyGrid.queryRadius(p.x, p.y, p.radius);

      for (let j = 0; j < nearbyEnemies.length; j++) {
        const enemy = nearbyEnemies[j];
        if (!enemy.active) continue;
        if (p.hitEnemyIds.has(enemy.id)) continue;

        // Register hit
        p.hitEnemyIds.add(enemy.id);

        // Calculate Critical Strike
        const critBonus = p.weaponId === 'heaven_sword' ? 0.6 : 0;
        const critBuff = em.player.critBuffTimer > 0 ? 1.0 : 0;
        const critChance = 0.08 * em.player.stats.luck + critBonus + critBuff;
        const isCrit = Math.random() < critChance;
        const finalDamage = Math.round(isCrit ? p.damage * (p.weaponId === 'heaven_sword' ? 2.5 : 2.0) : p.damage);

        // Apply Damage & Hit Effects
        enemy.hp -= finalDamage;
        enemy.flashTimer = 0.1; // White flash
        sound.play('hit');

        // Particle FX on Hit
        const particles = ParticleSystem.get();
        if (particles) {
          if (isCrit) {
            particles.spawnShockwave(enemy.x, enemy.y, '#f59e0b', 32, 0.22);
            particles.spawnBurst(enemy.x, enemy.y, '#fbbf24', 8, 160, 3, 'spark');
            camera.addShake(0.12);
          } else if (p.weaponId.includes('fire') || p.weaponId.includes('hellfire') || p.weaponId.includes('cosmic')) {
            particles.spawnBurst(enemy.x, enemy.y, '#ea580c', 5, 120, 2.5, 'ember');
          } else if (p.weaponId.includes('wand') || p.weaponId.includes('holy')) {
            particles.spawnBurst(enemy.x, enemy.y, '#38bdf8', 5, 110, 2.5, 'magic_star');
          } else if (p.weaponId.includes('lightning')) {
            particles.spawnBurst(enemy.x, enemy.y, '#fde047', 7, 150, 2, 'spark');
          } else {
            particles.spawnBurst(enemy.x, enemy.y, '#e2e8f0', 3, 90, 2, 'spark');
          }
          // Blood / hit puff
          particles.spawnBurst(enemy.x, enemy.y, '#dc2626', 3, 80, 2, 'blood');
        }

        // Hero Ignis Trait: Crits ignite extra burn damage
        if (em.player.hero.id === 'ignis' && isCrit) {
          enemy.hp -= Math.round(p.damage * 0.5);
          em.spawnDamageNumber(enemy.x, enemy.y - 12, Math.round(p.damage * 0.5), false, '#f97316');
        }

        // Bloody Tear, Vampiric Guillotine & Soul Eater Life Steal
        if (p.weaponId === 'bloody_tear' || p.weaponId === 'vampiric_guillotine') {
          em.player.currentHp = Math.min(
            em.player.stats.maxHealth,
            em.player.currentHp + (p.weaponId === 'vampiric_guillotine' ? 2.0 : 1.5)
          );
        } else if (p.weaponId === 'soul_eater' && Math.random() < 0.25) {
          em.player.currentHp = Math.min(
            em.player.stats.maxHealth,
            em.player.currentHp + 1.0
          );
        }

        // Spawn Damage Number
        em.spawnDamageNumber(enemy.x, enemy.y, finalDamage, isCrit);

        // Apply Knockback
        if (p.knockback > 0) {
          const kx = enemy.x - p.x;
          const ky = enemy.y - p.y;
          const kDist = Math.hypot(kx, ky) || 1;
          const effectiveKnockback = p.knockback * (1 - enemy.knockbackResistance);
          enemy.knockbackDx += (kx / kDist) * effectiveKnockback * 25;
          enemy.knockbackDy += (ky / kDist) * effectiveKnockback * 25;
        }

        // Check Enemy Death
        if (enemy.hp <= 0) {
          this.killEnemy(em, enemy, camera, onBossKill);
        }

        p.pierceLeft--;
        if (p.pierceLeft <= 0) {
          p.active = false;
          em.removeProjectile(p, i);
          break;
        }
      }
    }

    // 3. ENEMY VS PLAYER COLLISIONS
    if (em.player.invulnerabilityTimer <= 0) {
      const nearbyEnemiesToPlayer = this.enemyGrid.queryRadius(
        em.playerX,
        em.playerY,
        em.playerRadius
      );

      for (let i = 0; i < nearbyEnemiesToPlayer.length; i++) {
        const enemy = nearbyEnemiesToPlayer[i];
        if (!enemy.active) continue;

        const dx = em.playerX - enemy.x;
        const dy = em.playerY - enemy.y;
        if (dx * dx + dy * dy <= (em.playerRadius + enemy.radius) ** 2) {
          this.damagePlayer(em, enemy.damage, camera, onPlayerDeath);
          break;
        }
      }
    }
  }

  private damagePlayer(
    em: EntityManager,
    rawDamage: number,
    camera: Camera,
    onPlayerDeath: () => void
  ): void {
    if (!em.player || em.player.invulnerabilityTimer > 0 || em.godMode) return;

    // Apply Armor reduction
    const effectiveDamage = Math.max(1, rawDamage - em.player.stats.armor);
    em.player.currentHp -= effectiveDamage;
    em.player.invulnerabilityTimer = 0.45; // 450ms invulnerability

    sound.play('hit');
    camera.addShake(0.35);
    em.spawnDamageNumber(em.playerX, em.playerY, effectiveDamage, false, '#ef4444');

    // Check Player Death
    if (em.player.currentHp <= 0) {
      if (em.player.stats.revival > 0) {
        // Use Revival
        em.player.stats.revival--;
        em.player.currentHp = Math.round(em.player.stats.maxHealth * 0.5);
        em.player.invulnerabilityTimer = 2.0;
        camera.addShake(0.8);
        sound.play('level_up');
        // Clear nearby enemies
        for (const enemy of em.enemies) {
          const distSq = (enemy.x - em.playerX) ** 2 + (enemy.y - em.playerY) ** 2;
          if (distSq < 300 * 300) {
            enemy.hp -= 200;
            if (enemy.hp <= 0) this.killEnemy(em, enemy, camera);
          }
        }
      } else {
        em.player.currentHp = 0;
        onPlayerDeath();
      }
    }
  }

  private killEnemy(
    em: EntityManager,
    enemy: EnemyEntity,
    camera: Camera,
    onBossKill?: (bossKey: string) => void
  ): void {
    if (!em.player) return;

    // Death Burst FX
    const particles = ParticleSystem.get();
    if (particles) {
      if (enemy.behavior === 'boss') {
        particles.spawnShockwave(enemy.x, enemy.y, '#f59e0b', 75, 0.45);
        particles.spawnBurst(enemy.x, enemy.y, '#ef4444', 24, 220, 3.5, 'spark');
        particles.spawnBurst(enemy.x, enemy.y, '#fbbf24', 20, 180, 3, 'ember');
        camera.addShake(0.5);
      } else if (enemy.typeId.includes('skeleton')) {
        particles.spawnBurst(enemy.x, enemy.y, '#f1f5f9', 9, 140, 3.5, 'bone');
        particles.spawnBurst(enemy.x, enemy.y, '#cbd5e1', 5, 90, 2, 'dust');
      } else if (enemy.typeId.includes('bat')) {
        particles.spawnBurst(enemy.x, enemy.y, '#c084fc', 8, 120, 2.5, 'spark');
      } else {
        particles.spawnShockwave(enemy.x, enemy.y, '#f87171', 18, 0.18);
        particles.spawnBurst(enemy.x, enemy.y, '#b91c1c', 10, 130, 2.5, 'blood');
      }
    }

    // Check Boss Kill Event
    if (onBossKill) {
      if (enemy.typeId === 'enemy_minotaur_boss') onBossKill('minotaur');
      else if (enemy.typeId === 'enemy_gorgon_boss') onBossKill('gorgon');
      else if (enemy.typeId === 'enemy_vampire_boss') onBossKill('vampire');
      else if (enemy.typeId === 'enemy_necromancer_boss') onBossKill('necromancer');
      else if (enemy.typeId === 'enemy_reaper') onBossKill('reaper');
    }

    // Soul Eater heal on kill
    const hasSoulEater = em.player.weapons.some((w) => w.id === 'soul_eater');
    if (hasSoulEater && Math.random() < 0.1) {
      em.player.currentHp = Math.min(em.player.stats.maxHealth, em.player.currentHp + 1);
    }

    // Hero Mortimer Trait: Shockwave every 500 kills
    if (em.player.hero.id === 'mortimer') {
      em.player.traitCounter++;
      if (em.player.traitCounter >= 500) {
        em.player.traitCounter = 0;
        camera.addShake(0.7);
        sound.play('explosion');
        for (const e of em.enemies) {
          if (e.active) {
            e.hp -= 400;
            em.spawnDamageNumber(e.x, e.y, 400, true);
          }
        }
      }
    }

    // Drop Loot
    if (enemy.dropsChest) {
      em.spawnPickup(enemy.x, enemy.y, 'chest');
    } else {
      // XP Gem
      em.spawnGem(enemy.x, enemy.y, enemy.xpValue);

      // Random Item Drops based on Luck
      const luck = em.player.stats.luck;
      const dropRoll = Math.random();

      if (dropRoll < 0.04 * luck) {
        em.spawnPickup(enemy.x, enemy.y, 'coin');
      } else if (dropRoll < 0.05 * luck) {
        em.spawnPickup(enemy.x, enemy.y, 'meat');
      } else if (dropRoll < 0.053 * luck) {
        em.spawnPickup(enemy.x, enemy.y, 'magnet');
      } else if (dropRoll < 0.055 * luck) {
        em.spawnPickup(enemy.x, enemy.y, 'rosary');
      }
    }

    const idx = em.enemies.indexOf(enemy);
    if (idx !== -1) {
      em.removeEnemy(enemy, idx);
    }
  }
}
