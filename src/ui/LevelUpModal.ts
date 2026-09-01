import { EntityManager } from '../ecs/EntityManager';
import { WEAPONS, WeaponConfig } from '../config/weapons';
import { PASSIVES, PassiveConfig } from '../config/passives';
import { StorageService } from '../services/StorageService';
import { sound } from '../core/AudioEngine';
import { t } from '../i18n';

export interface UpgradeCardOption {
  type: 'weapon' | 'passive';
  id: string;
  name: string;
  currentLevel: number;
  nextLevel: number;
  isNew: boolean;
  description: string;
  iconId: string;
}

export class LevelUpModal {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'level-up-modal';
    this.container.className =
      'fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-start md:justify-center z-50 p-2 sm:p-4 font-mono text-white select-none hidden overflow-y-auto';
    document.body.appendChild(this.container);
  }

  public show(em: EntityManager, onOptionSelected: () => void): void {
    if (!em.player) return;

    sound.play('level_up');
    this.container.style.display = 'flex';
    this.renderOptions(em, onOptionSelected);
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  private renderOptions(em: EntityManager, onOptionSelected: () => void): void {
    if (!em.player) return;

    const p = em.player;
    const options = this.generateCards(em);

    this.container.innerHTML = `
      <div class="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/80 rounded-2xl p-3 sm:p-6 shadow-2xl flex flex-col items-center my-auto max-h-[94vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="text-center mb-6">
          <span class="text-amber-400 font-bold tracking-widest text-xs uppercase bg-amber-950/60 border border-amber-600/40 px-3 py-1 rounded-full">
            ${t('level')} Up!
          </span>
          <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 mt-2">
            ${t('choose_upgrade')}
          </h2>
          <p class="text-xs text-slate-400 mt-1">${t('level')}: ${p.level} • ${t('rerolls_left')}: ${p.stats.rerolls}</p>
        </div>

        <!-- Cards Grid -->
        <div class="w-full flex flex-col space-y-3 mb-6">
          ${options
            .map(
              (card, idx) => `
            <button data-card-idx="${idx}" class="upgrade-card-btn w-full bg-slate-900/80 hover:bg-slate-800/90 border-2 ${
                card.type === 'weapon' ? 'border-amber-500/40 hover:border-amber-400' : 'border-sky-500/40 hover:border-sky-400'
              } p-4 rounded-xl flex items-center justify-between text-left transition-all duration-150 transform hover:scale-[1.02] active:scale-95 group shadow-lg">
              
              <div class="flex items-center space-x-4">
                <!-- Card Badge -->
                <div class="w-12 h-12 rounded-lg ${
                  card.type === 'weapon' ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-sky-950 border-sky-500 text-sky-300'
                } border flex items-center justify-center text-xs font-black font-mono">
                  ${card.type === 'weapon' ? 'WEP' : 'PAS'}
                </div>

                <!-- Info -->
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="font-black text-base text-slate-100 group-hover:text-amber-300 transition">${card.name}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded ${
                      card.isNew
                        ? 'bg-emerald-600/80 text-emerald-100 border border-emerald-400/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }">
                      ${card.isNew ? t('new_badge') : `${t('level')} ${card.nextLevel}`}
                    </span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1 font-sans">${card.description}</p>
                </div>
              </div>

              <!-- Level Indicators -->
              <div class="text-xs font-bold text-slate-500 group-hover:text-amber-400 pr-2">
                ${t('select_btn')}
              </div>
            </button>
          `
            )
            .join('')}
        </div>

        <!-- Footer Buttons: Reroll & Skip -->
        <div class="flex items-center space-x-4">
          <button id="level-reroll-btn" class="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center space-x-1.5" ${
            p.stats.rerolls <= 0 ? 'disabled' : ''
          }>
            <span>${t('reroll_cards')} (${p.stats.rerolls})</span>
          </button>

          <button id="level-skip-btn" class="bg-slate-800/80 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition active:scale-95">
            ${t('skip_gold')}
          </button>
        </div>
      </div>
    `;

    // Bind Card Selection
    this.container.querySelectorAll('.upgrade-card-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number((e.currentTarget as HTMLElement).dataset.cardIdx);
        const card = options[idx];
        if (card) {
          this.applyCardUpgrade(em, card);
          this.hide();
          onOptionSelected();
        }
      });
    });

    // Bind Reroll
    const rerollBtn = this.container.querySelector('#level-reroll-btn');
    if (rerollBtn) {
      rerollBtn.addEventListener('click', () => {
        if (p.stats.rerolls > 0) {
          p.stats.rerolls--;
          sound.play('magic_bolt');
          this.renderOptions(em, onOptionSelected);
        }
      });
    }

    // Bind Skip
    const skipBtn = this.container.querySelector('#level-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        p.goldCollected += 25;
        sound.play('coin');
        this.hide();
        onOptionSelected();
      });
    }
  }

  private generateCards(em: EntityManager): UpgradeCardOption[] {
    if (!em.player) return [];
    const p = em.player;

    const candidates: { card: UpgradeCardOption; weight: number }[] = [];

    const hasWeaponSlot = p.weapons.length < 6;
    const hasPassiveSlot = p.passives.length < 6;

    // 1. EVALUATE WEAPONS
    Object.values(WEAPONS).forEach((w: WeaponConfig) => {
      if (w.isEvolution) return; // Evolutions come from chests only!

      // Do NOT offer base weapon if player already owns its evolved super form!
      if (w.evolutionWeaponId && p.weapons.some((eq) => eq.id === w.evolutionWeaponId)) {
        return;
      }

      const existing = p.weapons.find((eq) => eq.id === w.id);
      if (existing) {
        if (existing.level < w.maxLevel) {
          const nextLvlStats = w.levels[existing.level];
          candidates.push({
            card: {
              type: 'weapon',
              id: w.id,
              name: w.name,
              currentLevel: existing.level,
              nextLevel: existing.level + 1,
              isNew: false,
              description: nextLvlStats.description,
              iconId: w.iconId,
            },
            weight: 100, // higher priority to finish existing builds
          });
        }
      } else if (hasWeaponSlot && StorageService.isWeaponUnlocked(w.id)) {
        const lvl1 = w.levels[0];
        candidates.push({
          card: {
            type: 'weapon',
            id: w.id,
            name: w.name,
            currentLevel: 0,
            nextLevel: 1,
            isNew: true,
            description: lvl1.description,
            iconId: w.iconId,
          },
          weight: 45,
        });
      }
    });

    // 2. EVALUATE PASSIVES
    Object.values(PASSIVES).forEach((pass: PassiveConfig) => {
      const existing = p.passives.find((eq) => eq.id === pass.id);
      if (existing) {
        if (existing.level < pass.maxLevel) {
          const nextLvl = pass.levels[existing.level];
          candidates.push({
            card: {
              type: 'passive',
              id: pass.id,
              name: pass.name,
              currentLevel: existing.level,
              nextLevel: existing.level + 1,
              isNew: false,
              description: nextLvl.description,
              iconId: pass.iconId,
            },
            weight: 85,
          });
        }
      } else if (hasPassiveSlot && StorageService.isPassiveUnlocked(pass.id)) {
        const lvl1 = pass.levels[0];
        candidates.push({
          card: {
            type: 'passive',
            id: pass.id,
            name: pass.name,
            currentLevel: 0,
            nextLevel: 1,
            isNew: true,
            description: lvl1.description,
            iconId: pass.iconId,
          },
          weight: 40,
        });
      }
    });

    // Pick 3 or 4 cards using weighted sampling
    const cardCount = Math.random() < 0.25 * p.stats.luck ? 4 : 3;
    const chosen: UpgradeCardOption[] = [];

    while (chosen.length < cardCount && candidates.length > 0) {
      const totalWeight = candidates.reduce((acc, c) => acc + c.weight, 0);
      let rand = Math.random() * totalWeight;

      for (let i = 0; i < candidates.length; i++) {
        if (rand < candidates[i].weight) {
          chosen.push(candidates[i].card);
          candidates.splice(i, 1);
          break;
        }
        rand -= candidates[i].weight;
      }
    }

    return chosen;
  }

  private applyCardUpgrade(em: EntityManager, card: UpgradeCardOption): void {
    if (!em.player) return;
    const p = em.player;

    if (card.type === 'weapon') {
      const existing = p.weapons.find((w) => w.id === card.id);
      if (existing) {
        existing.level++;
      } else {
        p.weapons.push({
          id: card.id,
          level: 1,
          timer: 0,
          lastAngle: 0,
        });
      }
    } else if (card.type === 'passive') {
      const existing = p.passives.find((pass) => pass.id === card.id);
      const config = PASSIVES[card.id];
      if (existing) {
        existing.level++;
        const effect = config.levels[existing.level - 1];
        this.applyPassiveStats(p, effect.statChanges);
      } else {
        p.passives.push({
          id: card.id,
          level: 1,
        });
        const effect = config.levels[0];
        this.applyPassiveStats(p, effect.statChanges);
      }
    }
  }

  private applyPassiveStats(player: NonNullable<EntityManager['player']>, changes: PassiveConfig['levels'][0]['statChanges']): void {
    if (changes.mightPct) player.stats.might += changes.mightPct;
    if (changes.cooldownReduction) player.stats.cooldown = Math.max(0.2, player.stats.cooldown - changes.cooldownReduction);
    if (changes.speedPct) player.stats.speed += changes.speedPct;
    if (changes.durationPct) player.stats.duration += changes.durationPct;
    if (changes.recoveryFlat) player.stats.recovery += changes.recoveryFlat;
    if (changes.areaPct) player.stats.area += changes.areaPct;
    if (changes.magnetPct) player.stats.magnet += changes.magnetPct;
    if (changes.luckPct) player.stats.luck += changes.luckPct;
    if (changes.amountFlat) player.stats.amount += changes.amountFlat;
    if (changes.maxHealthPct) {
      const addedHp = Math.round(player.stats.maxHealth * changes.maxHealthPct);
      player.stats.maxHealth += addedHp;
      player.currentHp += addedHp;
    }
  }
}
