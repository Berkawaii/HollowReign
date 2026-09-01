import { EntityManager } from '../ecs/EntityManager';
import { WEAPONS } from '../config/weapons';
import { PASSIVES } from '../config/passives';
import { sound } from '../core/AudioEngine';
import { WorldMap } from '../core/WorldMap';
import { ProceduralAssets } from '../utils/ProceduralAssets';
import { t } from '../i18n';

export const WEAPON_SHORT_NAMES: Record<string, string> = {
  whip: 'WHP',
  bloody_tear: 'BLD',
  magic_wand: 'WND',
  holy_wand: 'HLY',
  knife: 'KNF',
  thousand_edge: 'THS',
  fire_wand: 'FIR',
  hellfire: 'HLF',
  bible: 'BBL',
  unholy_vespers: 'VSP',
  garlic: 'GRL',
  soul_eater: 'SOL',
  bone: 'BON',
  cross: 'CRS',
  heaven_sword: 'HVN',
  lightning_ring: 'LTG',
  thunder_loop: 'THN',
  axe: 'AXE',
  death_spiral: 'DTH',
  santa_water: 'WTR',
  la_borra: 'BOR',
};

export const PASSIVE_SHORT_NAMES: Record<string, string> = {
  hollow_heart: 'HRT',
  empty_tome: 'TOM',
  bracer: 'BRC',
  spinach: 'SPN',
  spellbinder: 'SPL',
  pummarola: 'PUM',
  clover: 'CLV',
  duplicator: 'DUP',
  candelabrador: 'CND',
  attractorb: 'ORB',
};

export class HUD {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hud-container';
    this.container.className = 'fixed inset-0 pointer-events-none z-10 select-none font-mono text-white';
    document.body.appendChild(this.container);
  }

  public show(): void {
    this.container.style.display = 'block';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public update(
    em: EntityManager,
    onPauseToggle: () => void,
    worldMap?: WorldMap,
    onOpenInventory?: () => void,
    onTriggerAbility?: () => void
  ): void {
    if (!em.player) return;

    const p = em.player;
    const hpPct = Math.max(0, Math.min(100, (p.currentHp / p.stats.maxHealth) * 100));
    const xpPct = Math.max(0, Math.min(100, (p.currentXp / p.xpToNextLevel) * 100));

    const minutes = Math.floor(p.survivalTime / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(p.survivalTime % 60)
      .toString()
      .padStart(2, '0');

    const shrine = worldMap?.nearbyShrine;
    const heroPortrait = ProceduralAssets.getHeroPortraitDataUrl(p.hero.id);

    this.container.innerHTML = `
      <!-- TOP BAR: EXP & STATS -->
      <div class="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent">
        <!-- XP Progress Bar -->
        <div class="w-full h-4 bg-slate-900/90 border border-slate-700 rounded-full overflow-hidden relative shadow-inner mb-2">
          <div class="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-100" style="width: ${xpPct}%"></div>
          <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-sky-100 drop-shadow">
            ${t('level')} ${p.level} • XP: ${p.currentXp} / ${p.xpToNextLevel}
          </span>
        </div>

        <!-- Header Stats Grid -->
        <div class="flex items-center justify-between text-sm px-1 sm:px-2 gap-1 sm:gap-2">
          <!-- Left: Hero Portrait & HP -->
          <div class="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            <img src="${heroPortrait}" alt="${p.hero.name}" class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-amber-400/80 shadow shrink-0" style="image-rendering: pixelated;" />
            <div>
              <div class="font-bold text-slate-200 text-[11px] sm:text-xs truncate max-w-[85px] sm:max-w-none">${p.hero.name} <span class="hidden sm:inline text-slate-400 font-normal text-[11px]">(${p.hero.title})</span></div>
              <div class="w-20 sm:w-32 h-2.5 sm:h-3 bg-slate-900 border border-red-900 rounded overflow-hidden relative mt-0.5">
                <div class="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150" style="width: ${hpPct}%"></div>
                <span class="absolute inset-0 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white drop-shadow">
                  ${Math.ceil(p.currentHp)}/${p.stats.maxHealth}
                </span>
              </div>
            </div>
          </div>

          <!-- Center: Timer -->
          <div class="text-xl sm:text-2xl font-black text-amber-300 tracking-wider drop-shadow-md shrink-0">
            ${minutes}:${seconds}
          </div>

          <!-- Right: Kills, Gold, Inventory & Pause -->
          <div class="flex items-center space-x-1 sm:space-x-2 text-xs shrink-0">
            <div class="flex items-center space-x-1 text-rose-400 font-bold bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs">
              <span class="hidden sm:inline text-[10px] text-rose-500 uppercase">${t('kills')}</span>
              <span>${p.kills}</span>
            </div>
            <div class="flex items-center space-x-1 text-amber-400 font-bold bg-slate-950/80 border border-slate-800 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs">
              <span class="hidden sm:inline text-[10px] text-amber-500 uppercase">${t('gold')}</span>
              <span>${p.goldCollected}</span>
            </div>
            <button id="hud-inventory-btn" class="pointer-events-auto bg-amber-950/80 hover:bg-amber-900 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-amber-500/60 text-[10px] sm:text-xs font-bold text-amber-200 transition active:scale-95 flex items-center space-x-1">
              <span>${t('inventory')}</span>
            </button>
            <button id="hud-mute-btn" class="hidden sm:block pointer-events-auto bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-600 text-xs font-bold transition active:scale-95">
              ${sound.isAudioMuted() ? t('muted') : t('sound')}
            </button>
            <button id="hud-pause-btn" class="pointer-events-auto bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-600 text-[10px] sm:text-xs font-bold transition active:scale-95">
              ${t('pause')}
            </button>
          </div>
        </div>
      </div>

      <!-- BOTTOM CENTER: SHRINE PROMPT (IF NEARBY) -->
      ${
        shrine
          ? `
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto bg-slate-950/95 border-2 border-amber-400 p-3 rounded-2xl shadow-2xl flex items-center space-x-3 animate-in fade-in zoom-in-95">
          <div class="w-8 h-8 rounded-lg bg-amber-950 border border-amber-400 flex items-center justify-center font-bold text-amber-300 text-xs">
            SHR
          </div>
          <div class="text-left">
            <div class="font-bold text-xs text-amber-300">${shrine.name}</div>
            <div class="text-[10px] text-slate-300 font-sans">
              <span class="text-rose-400 font-bold">${shrine.costText}</span> ➔ <span class="text-emerald-400 font-bold">${shrine.rewardText}</span>
            </div>
          </div>
          <button id="hud-shrine-interact-btn" class="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-black shadow transition active:scale-95">
            ${t('shrine_prompt_use')}
          </button>
        </div>
      `
          : ''
      }

      <!-- BOTTOM LEFT: INVENTORY SLOTS -->
      <div class="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex flex-col space-y-1 sm:space-y-2 bg-black/70 backdrop-blur-sm p-1.5 sm:p-2.5 rounded-xl border border-slate-800 shadow-xl pointer-events-auto scale-75 sm:scale-100 origin-bottom-left">
        <!-- Weapon Slots (Max 6) -->
        <div class="flex space-x-1.5">
          ${Array.from({ length: 6 })
            .map((_, idx) => {
              const eq = p.weapons[idx];
              if (eq) {
                const w = WEAPONS[eq.id];
                const isEvo = w?.isEvolution;
                const isReadyForEvo =
                  !isEvo &&
                  w &&
                  eq.level >= w.maxLevel &&
                  w.evolutionPartnerPassive &&
                  p.passives.some((pass) => pass.id === w.evolutionPartnerPassive);

                const shortName = WEAPON_SHORT_NAMES[eq.id] || (w ? w.name.slice(0, 3).toUpperCase() : 'W');

                return `
                  <div title="${w ? w.name : ''}" class="w-10 h-10 rounded-lg ${
                    isEvo
                      ? 'bg-gradient-to-b from-amber-900/90 via-slate-900 to-red-950/90 border-2 border-yellow-400 shadow-lg shadow-amber-500/40'
                      : isReadyForEvo
                      ? 'bg-slate-900/90 border-2 border-amber-400 animate-pulse shadow-md shadow-amber-500/30'
                      : 'bg-slate-900/90 border border-amber-500/50'
                  } flex flex-col items-center justify-between p-0.5 relative group cursor-pointer">
                    <span class="text-xs font-bold ${isEvo ? 'text-yellow-200' : 'text-amber-300'} truncate w-full text-center">${shortName}</span>
                    <span class="text-[9px] ${
                      isEvo
                        ? 'bg-yellow-500 text-slate-950 font-black px-1'
                        : isReadyForEvo
                        ? 'bg-amber-500 text-slate-950 font-bold px-1'
                        : 'bg-amber-900/80 text-amber-200 px-1'
                    } rounded font-bold">
                      ${isEvo ? 'EVO' : isReadyForEvo ? 'L8 MAX' : `L${eq.level}`}
                    </span>
                  </div>
                `;
              }
              return `<div class="w-10 h-10 rounded-lg bg-slate-950/60 border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-[10px] font-bold">WEP</div>`;
            })
            .join('')}
        </div>

        <!-- Passive Slots (Max 6) -->
        <div class="flex space-x-1.5">
          ${Array.from({ length: 6 })
            .map((_, idx) => {
              const eq = p.passives[idx];
              if (eq) {
                const pass = PASSIVES[eq.id];
                const shortName = PASSIVE_SHORT_NAMES[eq.id] || (pass ? pass.name.slice(0, 3).toUpperCase() : 'P');
                return `
                  <div title="${pass ? pass.name : ''}" class="w-10 h-10 rounded-lg bg-slate-900/90 border border-sky-500/50 flex flex-col items-center justify-between p-0.5 relative cursor-pointer">
                    <span class="text-xs font-bold text-sky-300 truncate w-full text-center">${shortName}</span>
                    <span class="text-[9px] bg-sky-900/80 text-sky-200 px-1 rounded font-bold">L${eq.level}</span>
                  </div>
                `;
              }
              return `<div class="w-10 h-10 rounded-lg bg-slate-950/60 border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-[10px] font-bold">PAS</div>`;
            })
            .join('')}
        </div>
      </div>

      <!-- BOTTOM RIGHT: ACTIVE ABILITY / DASH [SPACE] -->
      <div class="absolute bottom-4 right-4 pointer-events-auto">
        <button id="hud-ability-btn" class="flex items-center space-x-2.5 px-3.5 py-2 rounded-2xl border transition active:scale-95 shadow-xl ${
          p.abilityCooldownTimer <= 0
            ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-amber-300 text-slate-950 shadow-amber-500/30 animate-pulse'
            : 'bg-slate-950/85 border-slate-700 text-slate-400'
        }">
          <div class="w-7 h-7 rounded-lg ${p.abilityCooldownTimer <= 0 ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'} flex items-center justify-center font-black text-[10px] shrink-0 border border-current font-mono">
            SPC
          </div>
          <div class="text-left font-mono">
            <div class="text-[11px] font-black leading-tight ${p.abilityCooldownTimer <= 0 ? 'text-slate-950' : 'text-slate-200'}">${p.abilityName}</div>
            <div class="text-[9px] ${p.abilityCooldownTimer <= 0 ? 'text-amber-950 font-bold' : 'text-slate-400'}">
              ${p.abilityCooldownTimer <= 0 ? 'READY [SPACE]' : `${p.abilityCooldownTimer.toFixed(1)}s`}
            </div>
          </div>
        </button>
      </div>
    `;

    // Bind click events
    this.container.querySelector('#hud-pause-btn')?.addEventListener('click', onPauseToggle);

    if (onOpenInventory) {
      this.container.querySelector('#hud-inventory-btn')?.addEventListener('click', onOpenInventory);
    }

    this.container.querySelector('#hud-shrine-interact-btn')?.addEventListener('click', () => {
      if (worldMap) {
        worldMap.interactWithNearbyShrine(em);
      }
    });

    const muteBtn = this.container.querySelector('#hud-mute-btn');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const muted = sound.toggleMute();
        muteBtn.textContent = muted ? t('muted') : t('sound');
      });
    }

    if (onTriggerAbility) {
      this.container.querySelector('#hud-ability-btn')?.addEventListener('click', onTriggerAbility);
    }
  }
}
