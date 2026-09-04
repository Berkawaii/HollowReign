import { EntityManager } from '../ecs/EntityManager';
import { WEAPONS } from '../config/weapons';
import { PASSIVES } from '../config/passives';
import { ENEMIES } from '../config/enemies';
import { sound } from '../core/AudioEngine';
import { WorldMap } from '../core/WorldMap';
import { ProceduralAssets } from '../utils/ProceduralAssets';
import { StorageService } from '../services/StorageService';
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
  void_tendril: 'TND',
  leviathans_grasp: 'LEV',
  abyssal_anchor: 'ANC',
  worldbreaker_anchor: 'WBR',
  singularity_orb: 'SNG',
  event_horizon: 'EVT',
  blood_chalice: 'CLC',
  primordial_heart: 'PRM',
  apocalypse_horizon: 'APO',
  blood_tide: 'BTD',
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
  madness_grimoire: 'GRM',
  void_carapace: 'CRP',
  astral_prism: 'PRS',
};

export class HUD {
  private container: HTMLDivElement;
  private lastBossId: number = -1;
  private bossIntroTimer: number = 0;
  private bossIntroName: string = '';
  private bossIntroSubtitle: string = '';
  private lastUpdateTime: number = performance.now();
  private trailingBossHp: number = 0;

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

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastUpdateTime) / 1000);
    this.lastUpdateTime = now;

    // Detect active boss for Dark Souls entrance banner & health bar
    const activeBoss = em.enemies.find((e) => e.active && (e.behavior === 'boss' || e.behavior === 'reaper'));
    if (activeBoss) {
      if (activeBoss.id !== this.lastBossId) {
        this.lastBossId = activeBoss.id;
        const isReaper = activeBoss.behavior === 'reaper';
        this.bossIntroTimer = isReaper ? 4.2 : 3.6;
        const cfg = ENEMIES[activeBoss.typeId];
        this.bossIntroName = isReaper ? 'THE ANCIENT ONE (GRIM REAPER)' : cfg?.name || 'ANCIENT BEHEMOTH';
        this.bossIntroSubtitle = isReaper
          ? 'INEVITABLE DEATH • HARBINGER OF COSMIC OBLIVION'
          : cfg?.subtitle || 'THE ABYSSAL HARBINGER';
        sound.play('explosion');
        this.trailingBossHp = activeBoss.hp;
      }

      if (this.trailingBossHp > activeBoss.hp) {
        this.trailingBossHp = Math.max(activeBoss.hp, this.trailingBossHp - activeBoss.maxHp * dt * 0.4);
      } else {
        this.trailingBossHp = activeBoss.hp;
      }
    } else {
      this.trailingBossHp = 0;
    }

    if (this.bossIntroTimer > 0) {
      this.bossIntroTimer = Math.max(0, this.bossIntroTimer - dt);
    }

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
    const activeQuest = worldMap?.activeQuestEvent;
    const nearestQuest = worldMap?.getNearestLockedQuest(em.playerX, em.playerY);

    const maxWeaponSlots = StorageService.getMaxWeaponSlots();
    const maxPassiveSlots = StorageService.getMaxPassiveSlots();

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

      <!-- ACTIVE RITUAL OR QUEST COMPASS INDICATOR (BELOW HEADER TIMER) -->
      ${
        activeQuest
          ? `
        <div class="absolute top-[76px] sm:top-[72px] left-1/2 -translate-x-1/2 z-20 bg-purple-950/95 border border-purple-400 text-purple-200 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center space-x-2 backdrop-blur-md">
          <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
          <span>[${t('active_ritual')}]: ${activeQuest.title} ${activeQuest.remainingTime !== undefined ? `• ${Math.ceil(activeQuest.remainingTime)}s` : ''}</span>
        </div>
      `
          : nearestQuest && nearestQuest.dist > 160
          ? `
        <div class="absolute top-[76px] sm:top-[72px] left-1/2 -translate-x-1/2 z-20 bg-slate-950/90 border border-amber-500/50 text-amber-300 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-mono flex items-center space-x-2 shadow-[0_0_12px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <span class="text-amber-400 font-bold uppercase tracking-wider">${t('quest_compass')}:</span>
          <span class="text-slate-200 truncate max-w-[120px] sm:max-w-none">${nearestQuest.name}</span>
          <span class="text-yellow-300 font-black">${Math.round(nearestQuest.dist)}m [${nearestQuest.directionLabel}]</span>
        </div>
      `
          : ''
      }

      <!-- BOTTOM CENTER: ORNATE DARK FANTASY SHRINE PROMPT -->
      ${
        shrine
          ? `
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-black/95 border-2 border-amber-500/70 p-3 sm:p-3.5 rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.25)] flex items-center space-x-3 sm:space-x-3.5 backdrop-blur-md animate-in fade-in zoom-in-95 z-20">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-600 via-amber-800 to-amber-950 border border-amber-400/80 flex items-center justify-center font-gothic font-black text-amber-200 text-xs shadow-[0_0_10px_rgba(245,158,11,0.3)] shrink-0">
            ${t('shrine_altar')}
          </div>
          <div class="text-left font-mono">
            <div class="font-gothic font-black text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-400 leading-snug">${shrine.name}</div>
            <div class="text-[10px] sm:text-[11px] flex items-center space-x-1.5 sm:space-x-2 mt-0.5">
              <span class="text-rose-300 bg-rose-950/70 border border-rose-800/60 px-1.5 sm:px-2 py-0.5 rounded font-bold">${shrine.costText}</span>
              <span class="text-amber-400 font-bold text-xs">-></span>
              <span class="text-emerald-300 bg-emerald-950/70 border border-emerald-800/60 px-1.5 sm:px-2 py-0.5 rounded font-bold">${shrine.rewardText}</span>
            </div>
          </div>
          <button id="hud-shrine-interact-btn" class="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 text-slate-950 px-3 sm:px-4 py-2 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(245,158,11,0.3)] transition active:scale-95 flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            <span>${t('shrine_prompt_use')}</span>
            <kbd class="bg-black/20 text-slate-900 border border-black/30 px-1 py-0.2 rounded text-[10px] font-mono font-black">[E]</kbd>
          </button>
        </div>
      `
          : ''
      }

      <!-- BOTTOM LEFT: INVENTORY SLOTS (PIXEL ICONS & LEVEL BADGES) -->
      <div class="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 flex flex-col space-y-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 sm:p-2.5 rounded-2xl border border-amber-500/30 shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-auto scale-75 sm:scale-100 origin-bottom-left">
        <!-- Weapon Slots (Max 6, Starts at 3) -->
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

                const iconUrl = ProceduralAssets.toDataURL(w?.iconId || ('icon_' + eq.id));

                return `
                  <div title="${w ? w.name : ''}" class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${
                    isEvo
                      ? 'bg-gradient-to-b from-amber-950 via-slate-950 to-red-950 border-2 border-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : isReadyForEvo
                      ? 'bg-slate-900/95 border-2 border-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-900/90 border border-amber-500/40'
                  } flex flex-col items-center justify-between p-1 relative group cursor-pointer overflow-hidden">
                    <img src="${iconUrl}" alt="${w?.name || ''}" class="w-5 h-5 sm:w-6 sm:h-6 object-contain" style="image-rendering: pixelated;" />
                    <span class="text-[8px] font-mono leading-none ${
                      isEvo
                        ? 'bg-yellow-400 text-slate-950 font-black px-1 py-0.5'
                        : isReadyForEvo
                        ? 'bg-amber-400 text-slate-950 font-black px-1 py-0.5'
                        : 'bg-black/80 text-amber-300 font-bold px-1 py-0.2'
                    } rounded">
                      ${isEvo ? 'EVO' : isReadyForEvo ? 'MAX' : `LV${eq.level}`}
                    </span>
                  </div>
                `;
              }

              if (idx < maxWeaponSlots) {
                return `
                  <div title="${t('open_slot')}" class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/60 border border-dashed border-slate-700/80 flex items-center justify-center text-slate-600 text-[8px] sm:text-[9px] font-mono font-bold">
                    [${t('open_slot')}]
                  </div>
                `;
              }

              return `
                <div title="${t('locked_slot_title')}" class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/80 border border-red-950/70 flex flex-col items-center justify-center text-red-700/60 text-[8px] font-mono font-bold">
                  <span class="text-[8px] text-slate-600 font-bold leading-none">${t('locked_badge')}</span>
                </div>
              `;
            })
            .join('')}
        </div>

        <!-- Passive Slots (Max 6, Starts at 3) -->
        <div class="flex space-x-1.5">
          ${Array.from({ length: 6 })
            .map((_, idx) => {
              const eq = p.passives[idx];
              if (eq) {
                const pass = PASSIVES[eq.id];
                const iconUrl = ProceduralAssets.toDataURL(pass?.iconId || ('icon_' + eq.id));
                const isMax = pass && eq.level >= pass.maxLevel;

                return `
                  <div title="${pass ? pass.name : ''}" class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${
                    isMax
                      ? 'bg-slate-900/90 border-2 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                      : 'bg-slate-900/90 border border-sky-500/40'
                  } flex flex-col items-center justify-between p-1 relative cursor-pointer overflow-hidden">
                    <img src="${iconUrl}" alt="${pass?.name || ''}" class="w-5 h-5 sm:w-6 sm:h-6 object-contain" style="image-rendering: pixelated;" />
                    <span class="text-[8px] font-mono leading-none ${
                      isMax
                        ? 'bg-sky-400 text-slate-950 font-black px-1 py-0.5'
                        : 'bg-black/80 text-sky-300 font-bold px-1 py-0.2'
                    } rounded">
                      ${isMax ? 'MAX' : `LV${eq.level}`}
                    </span>
                  </div>
                `;
              }

              if (idx < maxPassiveSlots) {
                return `
                  <div title="${t('open_slot')}" class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950/60 border border-dashed border-slate-700/80 flex items-center justify-center text-slate-600 text-[8px] sm:text-[9px] font-mono font-bold">
                    [${t('open_slot')}]
                  </div>
                `;
              }

              return `
                <div title="${t('locked_slot_title')}" class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-black/80 border border-red-950/70 flex flex-col items-center justify-center text-red-700/60 text-[8px] font-mono font-bold">
                  <span class="text-[8px] text-slate-600 font-bold leading-none">${t('locked_badge')}</span>
                </div>
              `;
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
              ${p.abilityCooldownTimer <= 0 ? t('ready_space') : `${p.abilityCooldownTimer.toFixed(1)}s`}
            </div>
          </div>
        </button>
      </div>

      <!-- DARK SOULS CINEMATIC BOSS ENTRANCE BANNER -->
      ${
        this.bossIntroTimer > 0
          ? `
        <div class="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between transition-opacity duration-300" style="opacity: ${
          this.bossIntroTimer > 3.0
            ? (3.6 - this.bossIntroTimer) / 0.6
            : this.bossIntroTimer < 0.6
            ? this.bossIntroTimer / 0.6
            : 1
        }">
          <!-- Top Letterbox Bar -->
          <div class="w-full h-12 sm:h-20 bg-gradient-to-b from-black via-black/95 to-transparent"></div>

          <!-- Center Grand Banner -->
          <div class="flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-r from-transparent via-black/85 to-transparent backdrop-blur-xs">
            <div class="flex items-center space-x-3 mb-1.5">
              <div class="h-[1px] w-12 sm:w-28 bg-gradient-to-r from-transparent via-amber-500 to-amber-200"></div>
              <span class="text-[9px] sm:text-xs font-mono font-bold text-red-500 uppercase tracking-[0.35em] drop-shadow">${t('archon_awakens')}</span>
              <div class="h-[1px] w-12 sm:w-28 bg-gradient-to-l from-transparent via-amber-500 to-amber-200"></div>
            </div>

            <h1 class="font-gothic text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-yellow-600 tracking-[0.15em] sm:tracking-[0.25em] uppercase text-center drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              ${this.bossIntroName}
            </h1>

            <div class="text-xs sm:text-sm md:text-base font-mono font-bold text-red-400 tracking-[0.3em] uppercase text-center mt-1 drop-shadow">
              [ ${this.bossIntroSubtitle} ]
            </div>

            <div class="h-[1px] w-36 sm:w-72 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent mt-3"></div>
          </div>

          <!-- Bottom Letterbox Bar -->
          <div class="w-full h-12 sm:h-20 bg-gradient-to-t from-black via-black/95 to-transparent"></div>
        </div>
      `
          : ''
      }

      <!-- PERSISTENT DARK SOULS DOCKED BOSS HEALTH BAR -->
      ${
        activeBoss
          ? `
        <div class="fixed bottom-14 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl pointer-events-none z-30 flex flex-col items-center">
          <!-- Boss Title, Subtitle, & Enraged State -->
          <div class="w-full flex items-center justify-between px-1 mb-1 font-mono">
            <div class="flex items-center space-x-2">
              <span class="font-gothic font-black text-xs sm:text-sm ${
                activeBoss.behavior === 'reaper' ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-amber-200'
              } uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                ${activeBoss.behavior === 'reaper' ? 'THE ANCIENT ONE (GRIM REAPER)' : ENEMIES[activeBoss.typeId]?.name || 'BOSS'}
              </span>
              <span class="hidden sm:inline text-[10px] text-slate-400 font-normal">
                (${activeBoss.behavior === 'reaper' ? 'HARBINGER OF OBLIVION' : ENEMIES[activeBoss.typeId]?.subtitle || 'Archon'})
              </span>
            </div>
            <div class="flex items-center space-x-2">
              ${
                activeBoss.behavior === 'reaper'
                  ? `<span class="text-[9px] sm:text-[10px] font-black font-mono text-purple-300 bg-purple-950/90 border border-purple-500 px-1.5 py-0.2 rounded animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.7)]">
                      [${t('inevitable_death')}]
                     </span>`
                  : activeBoss.isEnraged
                  ? `<span class="text-[9px] sm:text-[10px] font-black font-mono text-red-400 bg-red-950/90 border border-red-500 px-1.5 py-0.2 rounded animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]">
                      [${t('enraged')}]
                     </span>`
                  : ''
              }
              <span class="text-[9px] sm:text-[10px] font-bold ${
                activeBoss.behavior === 'reaper' ? 'text-purple-300' : 'text-amber-400'
              }">
                ${Math.ceil(activeBoss.hp)} / ${activeBoss.maxHp}
              </span>
            </div>
          </div>

          <!-- Outer Gothic Bar Frame -->
          <div class="w-full h-3 sm:h-3.5 bg-slate-950/95 border-2 ${
            activeBoss.behavior === 'reaper'
              ? 'border-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.8)]'
              : activeBoss.isEnraged
              ? 'border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.7)]'
              : 'border-amber-500/80 shadow-lg'
          } rounded-sm overflow-hidden relative">
            <!-- Trailing Damage Amber Bar -->
            <div class="absolute top-0 bottom-0 left-0 ${
              activeBoss.behavior === 'reaper'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                : 'bg-gradient-to-r from-amber-600 to-yellow-500'
            } transition-all duration-75 opacity-90" style="width: ${Math.max(
              0,
              Math.min(100, (this.trailingBossHp / activeBoss.maxHp) * 100)
            )}%"></div>
            <!-- Current HP Bar -->
            <div class="absolute top-0 bottom-0 left-0 ${
              activeBoss.behavior === 'reaper'
                ? 'bg-gradient-to-r from-purple-950 via-purple-700 to-rose-600'
                : 'bg-gradient-to-r from-red-800 via-rose-600 to-red-500'
            } transition-all duration-100" style="width: ${Math.max(
              0,
              Math.min(100, (activeBoss.hp / activeBoss.maxHp) * 100)
            )}%"></div>
          </div>
        </div>
      `
          : ''
      }
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
