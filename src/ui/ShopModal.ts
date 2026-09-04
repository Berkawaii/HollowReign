import { POWER_UPS, calculatePowerUpPrice } from '../config/metaProgression';
import { StorageService } from '../services/StorageService';
import { sound } from '../core/AudioEngine';
import { t } from '../i18n';

export class ShopModal {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'shop-modal';
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
    const totalPurchased = Object.values(data.powerUps).reduce((a, b) => a + b, 0);

    this.container.innerHTML = `
      <div class="w-full max-w-4xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/70 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col my-auto max-h-[94vh] overflow-hidden">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-amber-500/30 pb-4 mb-4">
          <div>
            <span class="text-xs font-mono font-bold text-amber-400 uppercase tracking-[0.25em]">${t('permanent_upgrades')}</span>
            <h2 class="text-2xl sm:text-3xl font-gothic font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-500 mt-0.5">${t('power_up_shop')}</h2>
          </div>

          <div class="flex items-center space-x-3 sm:space-x-4">
            <div class="bg-amber-950/70 border border-amber-500/50 px-3.5 sm:px-4 py-2 rounded-xl flex items-center space-x-2 shadow">
              <span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span class="text-lg sm:text-xl font-black text-amber-300 font-mono">${data.gold} ${t('gold')}</span>
            </div>

            <button id="shop-refund-btn" class="bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs font-bold px-3 py-2 rounded-xl transition active:scale-95 flex items-center space-x-1 font-mono shadow">
              <span>${t('refund_all')}</span>
            </button>
          </div>
        </div>

        <!-- PowerUps Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1 py-1">
          ${Object.values(POWER_UPS)
            .map((p) => {
              const currentRank = data.powerUps[p.id] || 0;
              const isMax = currentRank >= p.maxRank;
              const price = calculatePowerUpPrice(p.id, currentRank, totalPurchased);
              const canAfford = data.gold >= price && !isMax;

              // Pip dots
              const pips = Array.from({ length: p.maxRank })
                .map((_, i) => (i < currentRank ? '●' : '○'))
                .join(' ');

              return `
                <div class="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 p-3.5 rounded-2xl flex items-center justify-between transition group shadow">
                  <!-- Info -->
                  <div class="flex-1 mr-3">
                    <div class="flex items-center space-x-2">
                      <span class="font-gothic font-bold text-sm sm:text-base text-slate-100 group-hover:text-amber-200 transition">${p.name}</span>
                      <span class="text-xs text-amber-400 font-mono tracking-widest">${pips}</span>
                    </div>
                    <p class="text-[11px] text-slate-400 mt-0.5 font-sans leading-relaxed">${p.description}</p>
                    <div class="text-[10px] text-slate-500 mt-1 font-mono">
                      ${t('rank')}: <span class="text-amber-400 font-bold">${currentRank}</span> / ${p.maxRank}
                    </div>
                  </div>

                  <!-- Buy Button -->
                  <button data-powerup-id="${p.id}" class="shop-buy-btn px-4 py-2.5 rounded-xl font-bold text-xs transition active:scale-95 flex flex-col items-center justify-center min-w-[95px] font-mono ${
                isMax
                  ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                  : canAfford
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
              }" ${isMax || !canAfford ? 'disabled' : ''}>
                    ${
                      isMax
                        ? `<span class="font-mono text-[10px] text-slate-500">[${t('max')}]</span>`
                        : `
                      <span class="font-bold text-xs">${t('buy')}</span>
                      <span class="text-[10px] font-mono opacity-90">${price} ${t('gold')}</span>
                    `
                    }
                  </button>
                </div>
              `;
            })
            .join('')}
        </div>

        <!-- Footer -->
        <div class="border-t border-slate-800/80 pt-4 mt-4 flex items-center justify-between">
          <p class="text-xs text-slate-500 font-sans">
            ${t('shop_tip')}
          </p>
          <button id="shop-close-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 px-6 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-200 transition active:scale-95 shadow">
            ${t('back')}
          </button>
        </div>
      </div>
    `;

    // Bind Buy Buttons
    this.container.querySelectorAll('.shop-buy-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.powerupId;
        if (id && StorageService.buyPowerUp(id)) {
          sound.play('coin');
          this.render(onClose);
        }
      });
    });

    // Bind Refund Button
    const refundBtn = this.container.querySelector('#shop-refund-btn');
    if (refundBtn) {
      refundBtn.addEventListener('click', () => {
        const refunded = StorageService.refundPowerUps();
        if (refunded > 0) {
          sound.play('coin');
        }
        this.render(onClose);
      });
    }

    // Bind Close
    const closeBtn = this.container.querySelector('#shop-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
        onClose();
      });
    }
  }
}
