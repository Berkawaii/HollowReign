import { EntityManager } from '../EntityManager';
import { sound } from '../../core/AudioEngine';
import { Camera } from '../../core/Camera';

export class PickupSystem {
  public update(
    em: EntityManager,
    camera: Camera,
    onLevelUp: () => void,
    onChestOpen: () => void,
    dt: number
  ): void {
    if (!em.player) return;

    const magnetRadius = em.player.stats.magnet;
    const magnetRadiusSq = magnetRadius * magnetRadius;

    // 1. UPDATE XP GEMS
    for (let i = em.gems.length - 1; i >= 0; i--) {
      const g = em.gems[i];
      if (!g.active) continue;

      const dx = em.playerX - g.x;
      const dy = em.playerY - g.y;
      const distSq = dx * dx + dy * dy;

      // Check magnet pull range
      if (distSq <= magnetRadiusSq || g.isMagnetized) {
        g.isMagnetized = true;
        const dist = Math.sqrt(distSq) || 1;
        // Quadratic acceleration towards player
        const speed = Math.max(300, 60000 / (dist + 20));
        g.x += (dx / dist) * speed * dt;
        g.y += (dy / dist) * speed * dt;
      }

      // Check collection
      const touchRadius = em.playerRadius + g.radius;
      if (distSq <= touchRadius * touchRadius) {
        this.collectGem(em, g, onLevelUp);
        em.removeGem(g, i);
      }
    }

    // 2. UPDATE PICKUPS (Coins, Meat, Rosary, Magnet, Chests)
    for (let i = em.pickups.length - 1; i >= 0; i--) {
      const p = em.pickups[i];
      if (!p.active) continue;

      const dx = em.playerX - p.x;
      const dy = em.playerY - p.y;
      const distSq = dx * dx + dy * dy;

      // Magnet pull coins and meat
      if (p.pickupType !== 'chest' && distSq <= magnetRadiusSq) {
        const dist = Math.sqrt(distSq) || 1;
        const speed = 400;
        p.x += (dx / dist) * speed * dt;
        p.y += (dy / dist) * speed * dt;
      }

      // Check collection
      const touchRadius = em.playerRadius + p.radius;
      if (distSq <= touchRadius * touchRadius) {
        this.collectPickup(em, p, camera, onChestOpen);
        em.removePickup(p, i);
      }
    }
  }

  private collectGem(em: EntityManager, gem: { xpValue: number }, onLevelUp: () => void): void {
    if (!em.player) return;

    sound.playXpPickup();
    const effectiveXp = Math.round(gem.xpValue * em.player.stats.growth);
    em.player.currentXp += effectiveXp;

    // Check Level Up
    if (em.player.currentXp >= em.player.xpToNextLevel) {
      em.player.level++;
      em.player.currentXp -= em.player.xpToNextLevel;
      // Classic growth curve formula
      em.player.xpToNextLevel = Math.round(5 + Math.pow(em.player.level, 1.6) * 4);

      sound.play('level_up');

      // Hero Specific Level-Up Traits
      if (em.player.hero.id === 'valerius') {
        if (em.player.level % 10 === 0) {
          em.player.stats.armor += 1;
        }
      } else if (em.player.hero.id === 'sylvia') {
        if (em.player.level % 20 === 0) {
          em.player.stats.amount += 1;
        }
      }

      onLevelUp();
    }
  }

  private collectPickup(
    em: EntityManager,
    pickup: { pickupType: string },
    camera: Camera,
    onChestOpen: () => void
  ): void {
    if (!em.player) return;

    switch (pickup.pickupType) {
      case 'coin': {
        const goldVal = Math.round(10 * em.player.stats.greed);
        em.player.goldCollected += goldVal;
        sound.play('coin');
        em.spawnDamageNumber(em.playerX, em.playerY - 20, goldVal, false, '#f59e0b');
        break;
      }

      case 'meat': {
        em.player.currentHp = Math.min(
          em.player.stats.maxHealth,
          em.player.currentHp + 35
        );
        sound.play('coin');
        em.spawnDamageNumber(em.playerX, em.playerY - 20, 35, false, '#22c55e');
        break;
      }

      case 'magnet': {
        sound.play('magic_bolt');
        camera.addShake(0.3);
        for (const gem of em.gems) {
          if (gem.active) gem.isMagnetized = true;
        }
        break;
      }

      case 'rosary': {
        sound.play('explosion');
        camera.addShake(0.9);
        for (let i = em.enemies.length - 1; i >= 0; i--) {
          const e = em.enemies[i];
          if (e.active && e.behavior !== 'boss' && e.behavior !== 'reaper') {
            em.player.kills++;
            em.spawnGem(e.x, e.y, e.xpValue);
            em.removeEnemy(e, i);
          }
        }
        break;
      }

      case 'chest': {
        sound.play('chest_open');
        onChestOpen();
        break;
      }
    }
  }
}
