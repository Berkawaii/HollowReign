import { ACHIEVEMENTS } from '../config/achievements';
import { StorageService } from '../services/StorageService';
import { sound } from '../core/AudioEngine';
import { t } from '../i18n';

export class AchievementsModal {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'achievements-modal';
    this.container.className =
      'fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-start md:justify-center z-50 p-2 sm:p-4 font-mono text-white select-none hidden overflow-y-auto';
    document.body.appendChild(this.container);
  }

  public show(onClose: () => void): void {
    this.container.style.display = 'flex';
    this.render(onClose);
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  private render(onClose: () => void): void {
    const data = StorageService.load();
    const totalAch = ACHIEVEMENTS.length;
    const unlockedCount = ACHIEVEMENTS.filter((a) =>
      data.unlockedAchievements.includes(a.id)
    ).length;
    const pct = Math.round((unlockedCount / totalAch) * 100);

    this.container.innerHTML = `
      <div class="w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/60 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[94vh] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">${t('progress_and_unlocks')}</span>
            <h2 class="text-2xl font-black text-slate-100 mt-0.5">${t('achievements_title')}</h2>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Progress Counter -->
            <div class="bg-amber-950/60 border border-amber-500/40 px-3.5 py-1.5 rounded-xl text-right">
              <span class="text-[10px] text-amber-400 block font-bold">${t('completed')}</span>
              <span class="text-base font-black text-white">${unlockedCount} / ${totalAch} (${pct}%)</span>
            </div>

            <button id="achievements-close-btn" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95">
              ${t('close')}
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden mb-4">
          <div class="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300" style="width: ${pct}%"></div>
        </div>

        <!-- Achievements List Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1 py-1">
          ${ACHIEVEMENTS.map((ach) => {
            const isUnlocked = data.unlockedAchievements.includes(ach.id);

            return `
              <div class="p-3.5 rounded-2xl border transition ${
                isUnlocked
                  ? 'bg-slate-900/90 border-amber-500/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-75'
              } flex items-start justify-between">
                
                <div class="flex-1 mr-3">
                  <div class="flex items-center space-x-2">
                    <span class="font-black text-sm ${isUnlocked ? 'text-amber-200' : 'text-slate-300'}">${ach.name}</span>
                    <span class="text-[9px] font-black px-1.5 py-0.5 rounded ${
                      isUnlocked
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }">
                      ${isUnlocked ? t('unlocked') : t('locked')}
                    </span>
                  </div>

                  <p class="text-[11px] text-slate-400 mt-1 font-sans leading-relaxed">${ach.description}</p>

                  <div class="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    <span class="text-slate-500">${t('reward')}</span>
                    <span class="font-bold ${isUnlocked ? 'text-amber-400' : 'text-slate-400'} font-mono">${ach.rewardName}</span>
                  </div>
                </div>

                <div class="w-10 h-10 rounded-xl ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 font-black shadow'
                    : 'bg-slate-900 border border-slate-800 text-slate-600 font-bold'
                } flex items-center justify-center text-xs shrink-0 font-mono">
                  ${isUnlocked ? 'OK' : 'LOCK'}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer -->
        <div class="border-t border-slate-800 pt-3 mt-3 flex items-center justify-between text-xs text-slate-500 font-sans">
          <span>${t('ach_tip')}</span>
        </div>
      </div>
    `;

    // Bind Close
    this.container.querySelector('#achievements-close-btn')?.addEventListener('click', () => {
      sound.play('coin');
      this.hide();
      onClose();
    });
  }
}
