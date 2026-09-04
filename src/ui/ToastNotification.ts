import { sound } from '../core/AudioEngine';
import { AchievementConfig } from '../config/achievements';
import { t } from '../i18n';

export class ToastNotification {
  private container: HTMLDivElement;
  private queue: AchievementConfig[] = [];
  private isShowing: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'toast-notification-container';
    this.container.className =
      'fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none font-mono flex flex-col items-center space-y-2';
    document.body.appendChild(this.container);
  }

  public show(achievement: AchievementConfig): void {
    this.queue.push(achievement);
    if (!this.isShowing) {
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    this.isShowing = true;
    const ach = this.queue.shift()!;
    sound.play('coin');

    const toast = document.createElement('div');
    toast.className =
      'bg-gradient-to-r from-amber-950/95 via-slate-950/95 to-amber-950/95 border-2 border-amber-400 p-4 rounded-2xl shadow-2xl flex items-center space-x-3 text-white max-w-md animate-in slide-in-from-top-4 duration-300 pointer-events-auto';

    toast.innerHTML = `
      <div class="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow">
        ACH
      </div>
      <div>
        <div class="text-[10px] font-bold uppercase tracking-widest text-amber-400">${t('achievement_unlocked')}</div>
        <div class="text-sm font-black text-white">${ach.name}</div>
        <div class="text-[11px] text-emerald-400 font-mono mt-0.5">${t('unlocked_reward')}: ${ach.rewardName}</div>
      </div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('transition-opacity', 'duration-500', 'opacity-0');
      setTimeout(() => {
        toast.remove();
        this.processQueue();
      }, 500);
    }, 4000);
  }
}
