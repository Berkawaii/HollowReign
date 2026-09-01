import { FirebaseService, LeaderboardEntry } from '../services/FirebaseService';
import { t } from '../i18n';

export class LeaderboardModal {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'leaderboard-modal';
    this.container.className =
      'fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4 font-mono text-white select-none hidden';
    document.body.appendChild(this.container);
  }

  public async show(onClose: () => void): Promise<void> {
    this.container.style.display = 'flex';
    this.container.innerHTML = `
      <div class="w-full max-w-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl flex flex-col my-auto max-h-[90vh]">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">${t('global_rankings')}</span>
            <h2 class="text-2xl font-black text-slate-100 mt-0.5">${t('leaderboard')}</h2>
          </div>
          <button id="leaderboard-close-btn" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95">
            ${t('close')}
          </button>
        </div>
        <div id="leaderboard-list-container" class="flex-1 overflow-y-auto flex items-center justify-center p-8 text-slate-400">
          Loading...
        </div>
      </div>
    `;

    this.container.querySelector('#leaderboard-close-btn')?.addEventListener('click', () => {
      this.hide();
      onClose();
    });

    const entries = await FirebaseService.getTopScores(30);
    this.renderList(entries);
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  private renderList(entries: LeaderboardEntry[]): void {
    const listContainer = this.container.querySelector('#leaderboard-list-container');
    if (!listContainer) return;

    if (entries.length === 0) {
      listContainer.innerHTML = `
        <div class="text-center py-12">
          <p class="text-base text-slate-400">${t('no_scores_yet')}</p>
          <p class="text-xs text-slate-600 mt-1">${t('be_the_first')}</p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = `
      <div class="w-full overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-800 text-slate-400 text-[11px]">
              <th class="py-2.5 px-3">#</th>
              <th class="py-2.5 px-3">${t('player')}</th>
              <th class="py-2.5 px-3">${t('weapon')} / Hero</th>
              <th class="py-2.5 px-3">${t('time')}</th>
              <th class="py-2.5 px-3">${t('kills')}</th>
              <th class="py-2.5 px-3">${t('level')}</th>
              <th class="py-2.5 px-3">${t('date')}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-900 font-mono">
            ${entries
              .map((e, idx) => {
                const rank = idx + 1;
                const badge =
                  rank === 1
                    ? '<span class="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-xs">#1</span>'
                    : rank === 2
                    ? '<span class="bg-slate-300 text-slate-950 font-black px-2 py-0.5 rounded text-xs">#2</span>'
                    : rank === 3
                    ? '<span class="bg-amber-700 text-white font-black px-2 py-0.5 rounded text-xs">#3</span>'
                    : `<span class="text-slate-500 font-bold">#${rank}</span>`;

                const mins = Math.floor(e.survivalTime / 60)
                  .toString()
                  .padStart(2, '0');
                const secs = Math.floor(e.survivalTime % 60)
                  .toString()
                  .padStart(2, '0');

                return `
                  <tr class="hover:bg-slate-900/60 transition ${
                    rank <= 3 ? 'bg-amber-950/20' : ''
                  }">
                    <td class="py-3 px-3 font-bold text-center w-12">${badge}</td>
                    <td class="py-3 px-3 font-bold text-slate-100">${e.playerName}</td>
                    <td class="py-3 px-3 text-slate-300">${e.heroName}</td>
                    <td class="py-3 px-3 font-bold text-amber-300">${mins}:${secs}</td>
                    <td class="py-3 px-3 text-rose-400 font-bold">${e.kills}</td>
                    <td class="py-3 px-3 text-sky-400 font-bold">Lvl ${e.level}</td>
                    <td class="py-3 px-3 text-slate-500 text-[10px]">${e.date}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}
