import confetti from 'canvas-confetti';
import { EntityManager } from '../ecs/EntityManager';
import { WEAPONS, WEAPON_UNIFICATIONS } from '../config/weapons';
import { PASSIVES, PassiveConfig } from '../config/passives';
import { ProceduralAssets } from '../utils/ProceduralAssets';
import { sound } from '../core/AudioEngine';
import { StorageService } from '../services/StorageService';
import { t } from '../i18n';

export interface SlotReward {
  type: 'unification' | 'evolution' | 'weapon_upgrade' | 'passive_upgrade' | 'gold' | 'feast' | 'vacuum' | 'rosary';
  name: string;
  subtitle: string;
  iconDataUrl: string;
  accentColor: string;
  badge: string;
  apply: () => void;
}

export class ChestModal {
  private container: HTMLDivElement;
  private isSpinning: boolean = false;
  private spinIntervals: number[] = [];
  private timeouts: number[] = [];

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'chest-modal';
    this.container.className =
      'fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-start md:justify-center z-50 p-2 sm:p-6 font-mono text-white select-none hidden overflow-y-auto';
    document.body.appendChild(this.container);
  }

  public show(em: EntityManager, onClose: () => void, onEvolution?: () => void): void {
    if (!em.player) return;
    const player = em.player;
    this.clearAllTimers();

    this.container.style.display = 'flex';
    sound.play('chest_open');

    // 1. Determine Tier based on Player Luck
    const luck = player.stats.luck;
    const roll = Math.random();

    let reelCount = 1;
    let tierTitle = 'LUCKY CHEST';
    let tierSub = '1 REEL • STANDARD ROLL';
    let tierColor = 'from-amber-500 via-yellow-400 to-amber-600';
    let tierBadgeColor = 'bg-amber-950/80 border-amber-400 text-amber-300';
    let baseGold = Math.round((100 + Math.random() * 100) * player.stats.greed);

    const superChance = 0.24 + 0.08 * (luck - 1); // ~24% - 35%
    const megaChance = 0.06 + 0.05 * (luck - 1);  // ~6% - 14%

    if (roll < megaChance) {
      reelCount = 5;
      tierTitle = '5-WAY MEGA JACKPOT!';
      tierSub = '5 REELS • ULTRA LUCKY FRENZY!';
      tierColor = 'from-fuchsia-500 via-rose-500 to-amber-400';
      tierBadgeColor = 'bg-fuchsia-950/80 border-fuchsia-400 text-fuchsia-300 animate-pulse';
      baseGold = Math.round((600 + Math.random() * 600) * player.stats.greed);
    } else if (roll < megaChance + superChance) {
      reelCount = 3;
      tierTitle = 'TRIPLE JACKPOT!';
      tierSub = '3 REELS • SUPER LUCKY ROLL';
      tierColor = 'from-cyan-400 via-sky-500 to-indigo-500';
      tierBadgeColor = 'bg-sky-950/80 border-sky-400 text-sky-300 animate-pulse';
      baseGold = Math.round((280 + Math.random() * 250) * player.stats.greed);
    }

    // 2. Generate Rewards for each reel
    const rewards = this.generateRewards(em, reelCount, onEvolution);

    // 3. Pool of icons for spinning reel animation
    const spinIcons = [
      ProceduralAssets.toDataURL('icon_whip'),
      ProceduralAssets.toDataURL('icon_magic_wand'),
      ProceduralAssets.toDataURL('icon_knife'),
      ProceduralAssets.toDataURL('icon_fire_wand'),
      ProceduralAssets.toDataURL('icon_bible'),
      ProceduralAssets.toDataURL('icon_garlic'),
      ProceduralAssets.toDataURL('pickup_coin'),
      ProceduralAssets.toDataURL('pickup_meat'),
      ProceduralAssets.toDataURL('pickup_magnet'),
      ProceduralAssets.toDataURL('pickup_rosary'),
      ProceduralAssets.toDataURL('gem_red'),
      ProceduralAssets.toDataURL('gem_blue'),
    ];

    // 4. Render Slot Machine UI
    this.renderSlotMachine(tierTitle, tierSub, tierColor, tierBadgeColor, reelCount, rewards, baseGold, spinIcons, em, onClose);
  }

  private renderSlotMachine(
    tierTitle: string,
    tierSub: string,
    tierColor: string,
    tierBadgeColor: string,
    reelCount: number,
    rewards: SlotReward[],
    totalGold: number,
    spinIcons: string[],
    em: EntityManager,
    onClose: () => void
  ): void {
    this.container.innerHTML = `
      <div class="w-full max-w-2xl bg-gradient-to-b from-slate-950 via-neutral-950 to-black border-4 border-amber-400/90 rounded-2xl sm:rounded-3xl p-3 sm:p-7 shadow-[0_0_60px_rgba(245,158,11,0.35)] flex flex-col items-center text-center my-auto max-h-[94vh] overflow-y-auto animate-in zoom-in-90 duration-300">
        
        <!-- Marquee Light Arcade Header -->
        <div class="w-full flex items-center justify-between px-3 py-1.5 bg-neutral-900/90 border-2 border-amber-500/40 rounded-full mb-3 shadow-inner">
          <div class="flex space-x-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-green-400"></span>
          </div>
          <span class="text-xs font-black tracking-widest bg-gradient-to-r ${tierColor} bg-clip-text text-transparent uppercase font-mono">
            ${tierTitle}
          </span>
          <div class="flex space-x-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-green-400"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
            <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          </div>
        </div>

        <span class="text-xs ${tierBadgeColor} px-3 py-1 rounded-full border uppercase tracking-widest font-mono mb-4 shadow-md">
          ${tierSub}
        </span>

        <!-- Slot Machine Reels Frame -->
        <div class="w-full bg-gradient-to-b from-amber-950/40 to-neutral-950 border-3 border-amber-400/60 rounded-2xl p-3 sm:p-4 shadow-2xl mb-4">
          <div id="slot-reels-grid" class="grid ${
            reelCount === 5 ? 'grid-cols-5' : reelCount === 3 ? 'grid-cols-3' : 'grid-cols-1 max-w-xs mx-auto'
          } gap-2 sm:gap-3">
            ${rewards
              .map(
                (_, idx) => `
              <div id="slot-reel-${idx}" class="relative h-44 sm:h-52 bg-slate-950/90 border-2 border-slate-700 rounded-xl flex flex-col items-center justify-center p-2 overflow-hidden shadow-inner transition-all duration-300">
                <!-- Center Payline Crosshair -->
                <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-amber-400/20 pointer-events-none"></div>

                <!-- Slot Reel Icon Display -->
                <div class="reel-icon-wrapper w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center shadow-lg mb-2 relative overflow-hidden">
                  <img id="reel-img-${idx}" src="${spinIcons[idx % spinIcons.length]}" class="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow animate-bounce" />
                </div>

                <!-- Reward Status / Label -->
                <span id="reel-badge-${idx}" class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-400 font-mono mb-1">
                  SPINNING...
                </span>
                <span id="reel-name-${idx}" class="text-[11px] sm:text-xs font-bold text-slate-300 truncate w-full text-center font-mono">
                  ???
                </span>
                <span id="reel-sub-${idx}" class="text-[9px] text-slate-400/80 truncate w-full text-center hidden sm:block font-sans">
                  Rolling...
                </span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Total Gold Award -->
        <div class="flex items-center space-x-2 text-xl sm:text-2xl font-black text-amber-400 my-1 font-mono">
          <span>+${totalGold} ${t('gold')}</span>
        </div>

        <!-- Action / Controls Button -->
        <div class="w-full flex space-x-3 mt-3">
          <button id="slot-skip-btn" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm py-3 rounded-xl border border-slate-600 transition active:scale-95 font-mono">
            ${t('skip_animation')}
          </button>
          <button id="slot-claim-btn" class="flex-1 bg-gradient-to-r ${tierColor} text-slate-950 font-black text-xs sm:text-sm py-3 rounded-xl shadow-lg transition active:scale-95 font-mono hidden">
            ${t('collect_all_rewards')}
          </button>
        </div>
      </div>
    `;

    this.isSpinning = true;

    // Start animated spinning on all reels
    for (let i = 0; i < reelCount; i++) {
      const reelImg = this.container.querySelector(`#reel-img-${i}`) as HTMLImageElement;
      if (reelImg) {
        const intervalId = window.setInterval(() => {
          const randIcon = spinIcons[Math.floor(Math.random() * spinIcons.length)];
          reelImg.src = randIcon;
        }, 55);
        this.spinIntervals.push(intervalId);
      }
    }

    // Regular ticking sound interval
    const soundTickInterval = window.setInterval(() => {
      if (this.isSpinning) {
        sound.play('slot_tick');
      }
    }, 110);
    this.spinIntervals.push(soundTickInterval);

    // Staggered reel reveals
    const revealTimes = reelCount === 1 ? [900] : reelCount === 3 ? [900, 1500, 2100] : [700, 1200, 1700, 2200, 2700];

    revealTimes.forEach((delay, idx) => {
      const timer = window.setTimeout(() => {
        this.lockReel(idx, rewards[idx]);
        if (idx === reelCount - 1) {
          this.finishSpin(reelCount, rewards, totalGold, em);
        }
      }, delay);
      this.timeouts.push(timer);
    });

    // Skip Button Handler
    const skipBtn = this.container.querySelector('#slot-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.clearAllTimers();
        for (let i = 0; i < reelCount; i++) {
          this.lockReel(i, rewards[i]);
        }
        this.finishSpin(reelCount, rewards, totalGold, em);
      });
    }

    // Claim Button Handler
    const claimBtn = this.container.querySelector('#slot-claim-btn');
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        this.hide();
        onClose();
      });
    }
  }

  private lockReel(idx: number, reward: SlotReward): void {
    if (this.spinIntervals[idx]) {
      clearInterval(this.spinIntervals[idx]);
    }

    const reelCard = this.container.querySelector(`#slot-reel-${idx}`) as HTMLDivElement;
    const reelImg = this.container.querySelector(`#reel-img-${idx}`) as HTMLImageElement;
    const reelBadge = this.container.querySelector(`#reel-badge-${idx}`) as HTMLSpanElement;
    const reelName = this.container.querySelector(`#reel-name-${idx}`) as HTMLSpanElement;
    const reelSub = this.container.querySelector(`#reel-sub-${idx}`) as HTMLSpanElement;

    if (!reelCard || !reelImg || !reward) return;

    sound.play('slot_stop');

    reelImg.src = reward.iconDataUrl;
    reelImg.classList.remove('animate-bounce');

    reelCard.className = `relative h-44 sm:h-52 bg-slate-900 border-2 ${reward.accentColor} rounded-xl flex flex-col items-center justify-center p-2 overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all duration-300 scale-105`;

    if (reelBadge) {
      reelBadge.className = `text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${reward.accentColor.replace(
        'border-',
        'bg-'
      )}/20 ${reward.accentColor} text-white font-mono mb-1`;
      reelBadge.textContent = reward.badge;
    }

    if (reelName) {
      reelName.className = 'text-[11px] sm:text-xs font-black text-white truncate w-full text-center font-mono';
      reelName.textContent = reward.name;
    }

    if (reelSub) {
      reelSub.className = 'text-[9px] text-slate-300 truncate w-full text-center font-sans';
      reelSub.textContent = reward.subtitle;
    }

    setTimeout(() => {
      reelCard.classList.remove('scale-105');
    }, 200);
  }

  private finishSpin(reelCount: number, rewards: SlotReward[], totalGold: number, em: EntityManager): void {
    this.isSpinning = false;
    this.clearAllTimers();

    if (!em.player) return;

    // Apply all won rewards
    for (const rew of rewards) {
      rew.apply();
    }

    // Apply Gold
    em.player.goldCollected += totalGold;
    StorageService.addGold(totalGold);

    // Audio & Confetti Celebration
    if (reelCount >= 3) {
      sound.play('jackpot');
      confetti({
        particleCount: reelCount === 5 ? 200 : 110,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    // Toggle Buttons
    const skipBtn = this.container.querySelector('#slot-skip-btn') as HTMLButtonElement;
    const claimBtn = this.container.querySelector('#slot-claim-btn') as HTMLButtonElement;

    if (skipBtn) skipBtn.style.display = 'none';
    if (claimBtn) claimBtn.style.display = 'block';
  }

  private generateRewards(em: EntityManager, count: number, onEvolution?: () => void): SlotReward[] {
    const rewards: SlotReward[] = [];
    if (!em.player) return rewards;
    const p = em.player;

    // 1. Check Unification or Evolution (Slot 1 Priority)
    const evoResult = this.checkUnificationOrEvolution(em);
    if (evoResult) {
      if (onEvolution) onEvolution();
      rewards.push({
        type: evoResult.isUnification ? 'unification' : 'evolution',
        name: evoResult.name,
        subtitle: evoResult.isUnification ? 'Ultra Weapon Unified!' : 'Weapon Evolved!',
        iconDataUrl: ProceduralAssets.toDataURL(evoResult.isUnification ? 'icon_hellfire' : 'icon_bloody_tear'),
        accentColor: evoResult.isUnification ? 'border-fuchsia-400' : 'border-amber-400',
        badge: evoResult.isUnification ? 'ULTRA UNIFY' : 'EVOLUTION',
        apply: () => {}, // Already applied inside checkUnificationOrEvolution
      });
    }

    // 2. Fill remaining slots with lucky rolls
    while (rewards.length < count) {
      const rollType = Math.random();

      // (A) Upgradable Equipped Weapon
      const upgradableWeapons = p.weapons.filter((w) => {
        const cfg = WEAPONS[w.id];
        return cfg && w.level < cfg.maxLevel;
      });

      // (B) Upgradable Equipped Passive
      const upgradablePassives = p.passives.filter((pass) => {
        const cfg = PASSIVES[pass.id];
        return cfg && pass.level < cfg.maxLevel;
      });

      if (rollType < 0.45 && upgradableWeapons.length > 0) {
        const weapon = upgradableWeapons[Math.floor(Math.random() * upgradableWeapons.length)];
        const cfg = WEAPONS[weapon.id];
        const nextLvl = weapon.level + 1;
        rewards.push({
          type: 'weapon_upgrade',
          name: cfg.name,
          subtitle: `Upgraded to Level ${nextLvl}!`,
          iconDataUrl: ProceduralAssets.toDataURL(cfg.iconId),
          accentColor: 'border-blue-400',
          badge: `WEAPON LV ${nextLvl}`,
          apply: () => {
            weapon.level++;
          },
        });
      } else if (rollType < 0.75 && upgradablePassives.length > 0) {
        const passive = upgradablePassives[Math.floor(Math.random() * upgradablePassives.length)];
        const cfg = PASSIVES[passive.id];
        const nextLvl = passive.level + 1;
        rewards.push({
          type: 'passive_upgrade',
          name: cfg.name,
          subtitle: `Upgraded to Level ${nextLvl}!`,
          iconDataUrl: ProceduralAssets.toDataURL(cfg.iconId),
          accentColor: 'border-emerald-400',
          badge: `PASSIVE LV ${nextLvl}`,
          apply: () => {
            passive.level++;
            const effect = cfg.levels[passive.level - 1];
            if (effect) this.applyPassiveStats(p, effect.statChanges);
          },
        });
      } else {
        // (C) Consumables / Instant Power-ups
        const subRoll = Math.random();
        if (subRoll < 0.35) {
          // Royal Feast
          rewards.push({
            type: 'feast',
            name: 'Royal Feast',
            subtitle: '100% Heal & +25 Max HP!',
            iconDataUrl: ProceduralAssets.toDataURL('pickup_meat'),
            accentColor: 'border-rose-400',
            badge: 'HEAL & VITALITY',
            apply: () => {
              p.stats.maxHealth += 25;
              p.currentHp = p.stats.maxHealth;
            },
          });
        } else if (subRoll < 0.65) {
          // Astral Vacuum
          rewards.push({
            type: 'vacuum',
            name: 'Astral Vacuum',
            subtitle: 'Pulls All XP Gems on Map!',
            iconDataUrl: ProceduralAssets.toDataURL('pickup_magnet'),
            accentColor: 'border-cyan-400',
            badge: 'MAP VACUUM',
            apply: () => {
              for (const g of em.gems) {
                if (g.active) {
                  g.x = em.playerX;
                  g.y = em.playerY;
                }
              }
            },
          });
        } else {
          // Sacred Rosary (Screen Wipe)
          rewards.push({
            type: 'rosary',
            name: 'Sacred Rosary',
            subtitle: 'Obliterates All Enemies!',
            iconDataUrl: ProceduralAssets.toDataURL('pickup_rosary'),
            accentColor: 'border-purple-400',
            badge: 'SCREEN WIPE',
            apply: () => {
              for (const e of em.enemies) {
                if (e.active && e.behavior !== 'boss') {
                  e.hp = 0;
                }
              }
            },
          });
        }
      }
    }

    return rewards;
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
    if (changes.armorFlat) player.stats.armor += changes.armorFlat;
    if (changes.maxHealthPct) {
      const addedHp = Math.round(player.stats.maxHealth * changes.maxHealthPct);
      player.stats.maxHealth += addedHp;
      player.currentHp += addedHp;
    }
  }

  public hide(): void {
    this.clearAllTimers();
    this.container.style.display = 'none';
  }

  private clearAllTimers(): void {
    for (const iv of this.spinIntervals) clearInterval(iv);
    for (const tm of this.timeouts) clearTimeout(tm);
    this.spinIntervals.length = 0;
    this.timeouts.length = 0;
    this.isSpinning = false;
  }

  private checkUnificationOrEvolution(em: EntityManager): { isUnification: boolean; name: string; description: string } | null {
    if (!em.player) return null;
    const p = em.player;

    // 1. DUAL WEAPON UNIFICATION CHECK
    for (const recipe of WEAPON_UNIFICATIONS) {
      const idx1 = p.weapons.findIndex((eq) => eq.id === recipe.weapon1Id);
      const idx2 = p.weapons.findIndex((eq) => eq.id === recipe.weapon2Id);

      if (idx1 !== -1 && idx2 !== -1) {
        const w1 = p.weapons[idx1];
        const w2 = p.weapons[idx2];
        const cfg1 = WEAPONS[w1.id];
        const cfg2 = WEAPONS[w2.id];

        if (w1.level >= cfg1.maxLevel && w2.level >= cfg2.maxLevel) {
          const resConfig = WEAPONS[recipe.resultWeaponId];
          if (resConfig) {
            p.weapons[idx1] = {
              id: resConfig.id,
              level: 1,
              timer: 0,
              lastAngle: 0,
            };
            p.weapons.splice(idx2, 1); // Free slot
            return {
              isUnification: true,
              name: resConfig.name,
              description: resConfig.description,
            };
          }
        }
      }
    }

    // 2. STANDARD WEAPON EVOLUTION CHECK
    for (let i = 0; i < p.weapons.length; i++) {
      const eq = p.weapons[i];
      const baseConfig = WEAPONS[eq.id];

      if (baseConfig && !baseConfig.isEvolution && eq.level >= baseConfig.maxLevel && baseConfig.evolutionWeaponId) {
        const partnerId = baseConfig.evolutionPartnerPassive;
        const hasPartner = partnerId && p.passives.some((pass) => pass.id === partnerId);

        if (hasPartner) {
          const evolvedConfig = WEAPONS[baseConfig.evolutionWeaponId];
          if (evolvedConfig) {
            p.weapons[i] = {
              id: evolvedConfig.id,
              level: 1,
              timer: 0,
              lastAngle: 0,
            };
            return {
              isUnification: false,
              name: evolvedConfig.name,
              description: evolvedConfig.description,
            };
          }
        }
      }
    }

    return null;
  }
}
