import { ACHIEVEMENTS } from '../config/achievements';
import { StorageService } from '../services/StorageService';
import { ToastNotification } from '../ui/ToastNotification';
import { PlayerComponent } from '../ecs/Components';

export class AchievementManager {
  private toast: ToastNotification;

  constructor(toast: ToastNotification) {
    this.toast = toast;
  }

  public checkInRunProgress(player: PlayerComponent): void {
    for (const ach of ACHIEVEMENTS) {
      if (StorageService.isAchievementUnlocked(ach.id)) continue;

      let achieved = false;

      if (ach.conditionType === 'survive_time') {
        if (player.survivalTime >= ach.targetValue) {
          achieved = true;
        }
      } else if (ach.conditionType === 'hero_survive') {
        if (ach.extraParam === player.hero.id && player.survivalTime >= ach.targetValue) {
          achieved = true;
        }
      } else if (ach.conditionType === 'kills_single') {
        if (player.kills >= ach.targetValue) {
          achieved = true;
        }
      } else if (ach.conditionType === 'level_single') {
        if (player.level >= ach.targetValue) {
          achieved = true;
        }
      } else if (ach.conditionType === 'gold_single') {
        if (player.goldCollected >= ach.targetValue) {
          achieved = true;
        }
      }

      if (achieved) {
        this.triggerUnlock(ach.id);
      }
    }
  }

  public onBossKill(bossKey: string): void {
    StorageService.recordBossKill(bossKey);

    for (const ach of ACHIEVEMENTS) {
      if (StorageService.isAchievementUnlocked(ach.id)) continue;

      if (ach.conditionType === 'boss_kill' && ach.extraParam === bossKey) {
        this.triggerUnlock(ach.id);
      }
    }
  }

  public onEvolution(): void {
    StorageService.recordEvolution();

    for (const ach of ACHIEVEMENTS) {
      if (StorageService.isAchievementUnlocked(ach.id)) continue;

      if (ach.conditionType === 'evolution') {
        this.triggerUnlock(ach.id);
      }
    }
  }

  public checkLifetimeMilestones(): void {
    const data = StorageService.load();

    for (const ach of ACHIEVEMENTS) {
      if (StorageService.isAchievementUnlocked(ach.id)) continue;

      if (ach.conditionType === 'gold_total') {
        if (data.lifetimeStats.totalGoldEarned >= ach.targetValue) {
          this.triggerUnlock(ach.id);
        }
      }
    }
  }

  private triggerUnlock(achievementId: string): void {
    const unlocked = StorageService.unlockAchievement(achievementId);
    if (unlocked) {
      this.toast.show(unlocked);
    }
  }
}
