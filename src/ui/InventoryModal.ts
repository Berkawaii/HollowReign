import { EntityManager } from '../ecs/EntityManager';
import { WEAPONS } from '../config/weapons';
import { PASSIVES } from '../config/passives';
import { sound } from '../core/AudioEngine';
import { ProceduralAssets } from '../utils/ProceduralAssets';
import { t } from '../i18n';

export class InventoryModal {
  private container: HTMLDivElement;
  private isVisible: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'inventory-modal';
    this.container.className =
      'fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-start md:justify-center z-50 p-2 sm:p-4 font-mono text-white select-none hidden overflow-y-auto';
    document.body.appendChild(this.container);
  }

  public show(em: EntityManager, onClose: () => void): void {
    if (!em.player) return;
    this.isVisible = true;
    this.container.style.display = 'flex';
    sound.play('coin');

    const p = em.player;
    const heroPortrait = ProceduralAssets.getHeroPortraitDataUrl(p.hero.id);

    const minutes = Math.floor(p.survivalTime / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(p.survivalTime % 60)
      .toString()
      .padStart(2, '0');

    this.container.innerHTML = `
      <div class="w-full max-w-5xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/80 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-2xl flex flex-col my-auto max-h-[94vh] overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div class="flex items-center space-x-3">
            <img src="${heroPortrait}" alt="${p.hero.name}" class="w-12 h-12 rounded-xl border-2 border-amber-400 shadow shrink-0" style="image-rendering: pixelated;" />
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-xl font-black text-amber-300">${p.hero.name}</h2>
                <span class="text-xs bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-700/60 font-bold">${p.hero.title}</span>
              </div>
              <p class="text-xs text-slate-400 font-sans">${p.hero.description}</p>
            </div>
          </div>

          <!-- Run summary & Close button -->
          <div class="flex items-center space-x-4">
            <div class="text-right text-xs">
              <div class="text-amber-400 font-bold text-base font-mono">${t('time')}: ${minutes}:${seconds}</div>
              <div class="text-slate-400 font-mono">${t('kills')}: ${p.kills} | ${t('gold')}: ${p.goldCollected}</div>
            </div>
            <button id="inventory-close-btn" class="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow transition active:scale-95">
              ${t('resume')}
            </button>
          </div>
        </div>

        <!-- Main Content 2-Column Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <!-- LEFT COLUMN: LIVE CHARACTER STATS -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <h3 class="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span>${t('character_attributes')}</span>
              <span class="text-[10px] text-slate-500">${t('live_stats')}</span>
            </h3>

            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('health')}</span>
                <span class="font-bold text-rose-400">${Math.ceil(p.currentHp)} / ${p.stats.maxHealth}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('recovery')}</span>
                <span class="font-bold text-emerald-400">+${p.stats.recovery.toFixed(1)}/s</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('armor')}</span>
                <span class="font-bold text-sky-400">${p.stats.armor}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('move_speed')}</span>
                <span class="font-bold text-slate-200">${p.stats.moveSpeed} px/s</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('might')}</span>
                <span class="font-bold text-amber-300">%${Math.round(p.stats.might * 100)}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('cooldown_reduction')}</span>
                <span class="font-bold text-cyan-300">-%${Math.round((1 - p.stats.cooldown) * 100)}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('attack_area')}</span>
                <span class="font-bold text-orange-300">%${Math.round(p.stats.area * 100)}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('duration')}</span>
                <span class="font-bold text-indigo-300">%${Math.round(p.stats.duration * 100)}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('projectile_speed')}</span>
                <span class="font-bold text-blue-300">%${Math.round(p.stats.speed * 100)}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('projectile_amount')}</span>
                <span class="font-bold text-yellow-300">+${p.stats.amount}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('luck')}</span>
                <span class="font-bold text-emerald-300">%${Math.round(p.stats.luck * 100)}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('greed')}</span>
                <span class="font-bold text-amber-400">%${Math.round(p.stats.greed * 100)}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('curse')}</span>
                <span class="font-bold text-purple-400">%${Math.round(p.stats.curse * 100)}</span>
              </div>
              <div class="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                <span class="text-slate-400">${t('rerolls_left')}</span>
                <span class="font-bold text-teal-300">${p.stats.rerolls}</span>
              </div>
            </div>
          </div>

          <!-- RIGHT 2 COLUMNS: WEAPONS & PASSIVES -->
          <div class="lg:col-span-2 space-y-4">
            
            <!-- WEAPONS SECTION -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <h3 class="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2.5 flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span>${t('equipped_weapons')} (${p.weapons.length}/6)</span>
                <span class="text-[10px] text-slate-400">Lvl 8 + Passive = Super Evolution</span>
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                ${Array.from({ length: 6 })
                  .map((_, idx) => {
                    const eq = p.weapons[idx];
                    if (!eq) {
                      return `
                        <div class="h-20 rounded-xl bg-slate-900/30 border border-dashed border-slate-800/80 flex items-center justify-center text-slate-600 text-xs font-bold">
                          [Empty Slot]
                        </div>
                      `;
                    }

                    const w = WEAPONS[eq.id];
                    if (!w) return '';

                    const isEvo = w.isEvolution;
                    const partnerPassive = w.evolutionPartnerPassive ? PASSIVES[w.evolutionPartnerPassive] : null;
                    const hasPartner = partnerPassive ? p.passives.some((pass) => pass.id === partnerPassive.id) : false;
                    const isReadyForEvo = !isEvo && eq.level >= w.maxLevel && hasPartner;

                    return `
                      <div class="p-2.5 rounded-xl ${
                        isEvo
                          ? 'bg-gradient-to-r from-red-950/60 to-amber-950/60 border-2 border-yellow-400 shadow-md'
                          : isReadyForEvo
                          ? 'bg-slate-900/90 border-2 border-amber-400 animate-pulse'
                          : 'bg-slate-900/80 border border-slate-800'
                      } flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-1.5">
                            <span class="font-bold text-xs ${isEvo ? 'text-yellow-200' : 'text-slate-200'}">${w.name}</span>
                          </div>
                          <span class="text-[10px] font-black px-1.5 py-0.5 rounded ${
                            isEvo
                              ? 'bg-yellow-500 text-slate-950'
                              : isReadyForEvo
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-amber-900/80 text-amber-200'
                          }">
                            ${isEvo ? t('super_evolution') : isReadyForEvo ? t('ready_to_evolve') : `Lvl ${eq.level}/${w.maxLevel}`}
                          </span>
                        </div>

                        <p class="text-[10px] text-slate-400 mt-1 line-clamp-1 font-sans">${w.description}</p>

                        ${
                          partnerPassive
                            ? `
                          <div class="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
                            <span class="text-slate-400">${t('partner')}</span>
                            <span class="${hasPartner ? 'text-emerald-400 font-bold' : 'text-slate-500'}">
                              ${partnerPassive.name} ${hasPartner ? `[${t('owned')}]` : `[${t('missing')}]`}
                            </span>
                          </div>
                        `
                            : ''
                        }
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            </div>

            <!-- PASSIVES SECTION -->
            <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
              <h3 class="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2.5 border-b border-slate-800 pb-1.5">
                ${t('equipped_passives')} (${p.passives.length}/6)
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                ${Array.from({ length: 6 })
                  .map((_, idx) => {
                    const eq = p.passives[idx];
                    if (!eq) {
                      return `
                        <div class="h-16 rounded-xl bg-slate-900/30 border border-dashed border-slate-800/80 flex items-center justify-center text-slate-600 text-xs font-bold">
                          [Empty Slot]
                        </div>
                      `;
                    }

                    const pass = PASSIVES[eq.id];
                    if (!pass) return '';

                    const partnerWeapon = pass.evolutionPartnerFor ? WEAPONS[pass.evolutionPartnerFor] : null;

                    return `
                      <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-xs text-sky-200">${pass.name}</span>
                          <span class="text-[10px] font-bold bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800/60">
                            Lvl ${eq.level}/${pass.maxLevel}
                          </span>
                        </div>
                        <p class="text-[10px] text-slate-400 mt-1 line-clamp-1 font-sans">${pass.description}</p>
                        ${
                          partnerWeapon
                            ? `
                          <div class="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
                            <span class="text-slate-400">${t('evolves')}</span>
                            <span class="text-sky-300 font-bold">${partnerWeapon.name}</span>
                          </div>
                        `
                            : ''
                        }
                      </div>
                    `;
                  })
                  .join('')}
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#inventory-close-btn')?.addEventListener('click', () => {
      this.hide();
      onClose();
    });
  }

  public hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  public isOpen(): boolean {
    return this.isVisible;
  }
}
