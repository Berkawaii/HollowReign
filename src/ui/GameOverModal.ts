import { EntityManager } from '../ecs/EntityManager';
import { FirebaseService } from '../services/FirebaseService';
import { t } from '../i18n';

export class GameOverModal {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'game-over-modal';
    this.container.className =
      'fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-start md:justify-center z-50 p-2 sm:p-4 font-mono text-white select-none hidden overflow-y-auto';
    document.body.appendChild(this.container);
  }

  public show(
    em: EntityManager,
    onRestart: () => void,
    onOpenShop: () => void,
    onOpenLeaderboard: () => void
  ): void {
    if (!em.player) return;
    const p = em.player;
    const isVictory = p.survivalTime >= 1800; // 30 mins

    const minutes = Math.floor(p.survivalTime / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(p.survivalTime % 60)
      .toString()
      .padStart(2, '0');

    this.container.style.display = 'flex';
    this.container.innerHTML = `
      <div class="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 ${
        isVictory ? 'border-amber-400' : 'border-red-600'
      } rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl flex flex-col items-center my-auto max-h-[94vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        <!-- Status Title -->
        <span class="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-2 font-mono ${
          isVictory ? 'bg-amber-950 text-amber-300 border-amber-500' : 'bg-red-950 text-red-300 border-red-700'
        }">
          ${isVictory ? t('victory_achieved') : t('you_have_been_slain')}
        </span>

        <h2 class="text-3xl font-black text-transparent bg-clip-text ${
          isVictory
            ? 'bg-gradient-to-r from-yellow-300 to-amber-500'
            : 'bg-gradient-to-r from-red-400 to-rose-600'
        } mb-6">
          ${isVictory ? t('survived_30_mins') : t('run_completed')}
        </h2>

        <!-- Stats Box -->
        <div class="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 grid grid-cols-2 gap-4 mb-6 text-sm">
          <div class="flex flex-col">
            <span class="text-slate-400 text-xs">${t('weapon')} / Hero</span>
            <span class="font-bold text-slate-200">${p.hero.name}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-slate-400 text-xs">${t('time')}</span>
            <span class="font-bold text-amber-300 text-base font-mono">${minutes}:${seconds}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-slate-400 text-xs">${t('kills')}</span>
            <span class="font-bold text-rose-400 text-base font-mono">${p.kills}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-slate-400 text-xs">${t('level')}</span>
            <span class="font-bold text-sky-400 text-base font-mono">Lvl ${p.level}</span>
          </div>
          <div class="col-span-2 flex items-center justify-between border-t border-slate-800 pt-3">
            <span class="text-slate-300 text-xs font-bold">${t('gold')}</span>
            <span class="font-black text-amber-400 text-lg font-mono">+${p.goldCollected} ${t('gold')}</span>
          </div>
        </div>

        <!-- Leaderboard Submit Form -->
        <div class="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
          <label class="block text-xs font-bold text-slate-300 mb-2">${t('submit_to_leaderboard')}</label>
          <div class="flex space-x-2">
            <input id="player-name-input" type="text" maxlength="16" placeholder="${t('player')} Name" value="Survivor" class="flex-1 bg-slate-900 border border-slate-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400 font-mono" />
            <button id="submit-score-btn" class="bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 transition active:scale-95">
              ${t('submit_score')}
            </button>
          </div>
          <p id="submit-status-msg" class="text-[11px] text-slate-500 mt-2 text-center"></p>
        </div>

        <!-- Action Buttons -->
        <div class="w-full flex flex-col space-y-2.5">
          <button id="game-over-restart-btn" class="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base py-3.5 rounded-xl shadow-lg transition active:scale-95">
            ${t('play_again')}
          </button>
          <div class="flex space-x-2">
            <button id="game-over-shop-btn" class="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 rounded-xl text-xs font-bold transition active:scale-95">
              ${t('shop')}
            </button>
            <button id="game-over-leaderboard-btn" class="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 rounded-xl text-xs font-bold transition active:scale-95">
              ${t('leaderboard')}
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind Restart
    this.container.querySelector('#game-over-restart-btn')?.addEventListener('click', () => {
      this.hide();
      onRestart();
    });

    // Bind Shop
    this.container.querySelector('#game-over-shop-btn')?.addEventListener('click', () => {
      this.hide();
      onOpenShop();
    });

    // Bind Leaderboard
    this.container.querySelector('#game-over-leaderboard-btn')?.addEventListener('click', () => {
      this.hide();
      onOpenLeaderboard();
    });

    // Bind Submit Score
    const submitBtn = this.container.querySelector('#submit-score-btn');
    const nameInput = this.container.querySelector('#player-name-input') as HTMLInputElement;
    const statusMsg = this.container.querySelector('#submit-status-msg');

    if (submitBtn && nameInput && statusMsg) {
      submitBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim() || 'Survivor';
        submitBtn.setAttribute('disabled', 'true');
        statusMsg.textContent = t('submitting');

        const record = {
          heroId: p.hero.id,
          heroName: p.hero.name,
          survivalTime: p.survivalTime,
          level: p.level,
          kills: p.kills,
          gold: p.goldCollected,
          date: new Date().toLocaleDateString('en-US'),
        };

        const success = await FirebaseService.submitScore(name, record);
        if (success) {
          statusMsg.textContent = t('score_submitted');
          statusMsg.className = 'text-[11px] text-emerald-400 mt-2 text-center';
        } else {
          statusMsg.textContent = t('saved_locally');
          statusMsg.className = 'text-[11px] text-amber-400 mt-2 text-center';
        }
      });
    }
  }

  public hide(): void {
    this.container.style.display = 'none';
  }
}
