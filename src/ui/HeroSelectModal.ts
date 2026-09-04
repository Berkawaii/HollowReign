import { HEROES, HeroConfig } from '../config/heroes';
import { WEAPONS } from '../config/weapons';
import { STAGES, StageConfig } from '../config/stages';
import { ACHIEVEMENTS } from '../config/achievements';
import { StorageService } from '../services/StorageService';
import { ProceduralAssets } from '../utils/ProceduralAssets';
import { sound } from '../core/AudioEngine';
import { i18n, t } from '../i18n';

export class HeroSelectModal {
  private container: HTMLDivElement;
  private selectedHero: HeroConfig = HEROES[0];
  private selectedStage: StageConfig = STAGES[0];
  private currentStep: 'hero' | 'stage' = 'hero';
  private isLangDropdownOpen: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hero-select-modal';
    this.container.className =
      'fixed inset-0 bg-[#05060a]/95 flex flex-col items-center justify-center z-40 p-2 sm:p-4 text-white select-none overflow-hidden';
    document.body.appendChild(this.container);

    i18n.onLanguageChange(() => {
      if (this.container.style.display === 'flex') {
        this.render(this.lastStartGame, this.lastOpenShop, this.lastOpenLeaderboard, this.lastOpenAchievements);
      }
    });
  }

  private lastStartGame: (hero: HeroConfig, stage: StageConfig) => void = () => {};
  private lastOpenShop: () => void = () => {};
  private lastOpenLeaderboard: () => void = () => {};
  private lastOpenAchievements: () => void = () => {};

  public show(
    onStartGame: (hero: HeroConfig, stage: StageConfig) => void,
    onOpenShop: () => void,
    onOpenLeaderboard: () => void,
    onOpenAchievements: () => void
  ): void {
    this.lastStartGame = onStartGame;
    this.lastOpenShop = onOpenShop;
    this.lastOpenLeaderboard = onOpenLeaderboard;
    this.lastOpenAchievements = onOpenAchievements;
    this.currentStep = 'hero';

    this.container.style.display = 'flex';
    this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  private render(
    onStartGame: (hero: HeroConfig, stage: StageConfig) => void,
    onOpenShop: () => void,
    onOpenLeaderboard: () => void,
    onOpenAchievements: () => void
  ): void {
    const data = StorageService.load();
    const startingWeapon = WEAPONS[this.selectedHero.startingWeaponId];
    const isSelectedHeroUnlocked = StorageService.isHeroUnlocked(this.selectedHero.id);
    const isSelectedHeroGlitched = !!this.selectedHero.isGlitchLocked && !isSelectedHeroUnlocked;
    const selectedPortrait = isSelectedHeroGlitched
      ? ProceduralAssets.getGlitchPortraitDataUrl(this.selectedHero.id)
      : ProceduralAssets.getHeroPortraitDataUrl(this.selectedHero.id);
    const isSelectedStageUnlocked = StorageService.isStageUnlocked(this.selectedStage.id);
    const equippedAbility = StorageService.getEquippedAbility(this.selectedHero.id);
    const isAbility2Unlocked = StorageService.isAbilityUnlocked(this.selectedHero.id, 2);

    const unlockHeroReq = ACHIEVEMENTS.find(
      (a) => a.rewardType === 'hero' && a.rewardId === this.selectedHero.id
    );

    const currentLang = i18n.getLanguage();
    const supportedLangs = i18n.getSupportedLanguages();
    const currentLangMeta = supportedLangs.find((l) => l.code === currentLang) || supportedLangs[0];

    const canStart = isSelectedHeroUnlocked && isSelectedStageUnlocked;

    if (this.currentStep === 'hero') {
      // STEP 1: HERO & ABILITY SELECTION
      this.container.innerHTML = `
        <div class="w-full max-w-6xl bg-[#090b12] border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col my-auto max-h-[96vh] h-[92vh] overflow-hidden">
          
          <!-- Top Bar -->
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3 shrink-0">
            <div>
              <div class="flex items-center space-x-2">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span class="text-[10px] sm:text-xs font-mono font-bold text-amber-400/90 uppercase tracking-[0.25em]">STEP 1 OF 2 • HERO SELECTION</span>
              </div>
              <h1 class="text-xl sm:text-2xl md:text-3xl font-gothic font-black text-slate-100 tracking-wide mt-0.5">
                SELECT YOUR CHAMPION
              </h1>
            </div>

            <div class="flex items-center space-x-2 sm:space-x-2.5">
              <!-- Language Dropdown -->
              <div class="relative">
                <button id="hero-lang-toggle-btn" class="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-200 transition active:scale-95 flex items-center space-x-1.5 shadow">
                  <span class="text-amber-400 font-bold">${currentLangMeta.flag}</span>
                  <span>${currentLangMeta.nativeName}</span>
                  <span class="text-[9px] text-slate-400">▾</span>
                </button>

                ${
                  this.isLangDropdownOpen
                    ? `
                  <div class="absolute right-0 top-full mt-1.5 w-44 bg-[#0d101a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 py-1 max-h-60 overflow-y-auto font-mono">
                    ${supportedLangs
                      .map(
                        (l) => `
                      <button data-lang-code="${l.code}" class="lang-option-btn w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                          l.code === currentLang ? 'bg-amber-950/40 text-amber-300 font-bold' : 'text-slate-300'
                        }">
                        <span>${l.nativeName}</span>
                        <span class="text-[10px] text-slate-500">${l.flag}</span>
                      </button>
                    `
                      )
                      .join('')}
                  </div>
                `
                    : ''
                }
              </div>

              <!-- Achievements -->
              <button id="hero-menu-achievements-btn" class="hidden sm:block bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-200 transition active:scale-95 shadow">
                ${t('achievements')}
              </button>

              <!-- Gold & Shop -->
              <button id="hero-menu-shop-btn" class="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-300 transition active:scale-95 flex items-center space-x-1.5 shadow">
                <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>${data.gold} ${t('gold')}</span>
              </button>

              <!-- Leaderboard -->
              <button id="hero-menu-leaderboard-btn" class="hidden sm:block bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-200 transition active:scale-95 shadow">
                ${t('leaderboard')}
              </button>
            </div>
          </div>

          <!-- Main 2-Column Area -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-5 flex-1 overflow-hidden min-h-0">
            
            <!-- Left: Hero Roster Cards (5 cols) -->
            <div class="lg:col-span-5 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pr-0 lg:pr-1.5 snap-x no-scrollbar">
              ${HEROES.map((h) => {
                const isSelected = h.id === this.selectedHero.id;
                const isUnlocked = StorageService.isHeroUnlocked(h.id);
                const isGlitched = !!h.isGlitchLocked && !isUnlocked;
                const portrait = isGlitched
                  ? ProceduralAssets.getGlitchPortraitDataUrl(h.id)
                  : ProceduralAssets.getHeroPortraitDataUrl(h.id);
                const weapon = WEAPONS[h.startingWeaponId];

                return `
                  <button data-hero-id="${h.id}" class="hero-card-btn shrink-0 w-[220px] sm:w-[240px] lg:w-full bg-[#0d101a] hover:bg-[#131726] border ${
                  isSelected
                    ? isGlitched
                      ? 'glitch-card border-rose-500 bg-[#1a0c24] shadow-[0_0_18px_rgba(244,63,94,0.35)]'
                      : 'border-amber-400/90 bg-[#14192b] shadow-[0_0_15px_rgba(245,158,11,0.18)]'
                    : isGlitched
                    ? 'border-rose-900/60 bg-[#12071a] hover:border-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                    : isUnlocked
                    ? 'border-slate-800/90 hover:border-slate-700'
                    : 'border-slate-900 opacity-55'
                } p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between text-left transition duration-150 transform hover:scale-[1.01] active:scale-95 group snap-start cursor-pointer">
                    
                    <div class="flex items-center space-x-2.5">
                      <div class="relative shrink-0">
                        <img src="${portrait}" alt="${isGlitched ? 'Corrupted' : h.name}" class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl border shadow ${
                          isUnlocked ? '' : isGlitched ? 'brightness-110' : 'grayscale brightness-50'
                        }" style="border-color: ${isGlitched ? '#f43f5e' : isUnlocked ? h.color : '#334155'}; image-rendering: pixelated;" />
                        ${
                          !isUnlocked
                            ? isGlitched
                              ? `<span class="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-bold bg-black/60 text-rose-400 rounded-xl animate-pulse">CORRUPT</span>`
                              : `<span class="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold bg-black/70 text-slate-400 rounded-xl">LOCK</span>`
                            : ''
                        }
                      </div>

                      <div class="min-w-0">
                        <div class="flex items-center space-x-1.5">
                          ${
                            isGlitched
                              ? `<span class="glitch-text font-mono font-bold text-sm sm:text-base text-rose-400 truncate tracking-wider">§̸̧Ø̷̧R̴̷R̵̸Ø̶̧W̴</span>`
                              : `<span class="font-gothic font-bold text-sm sm:text-base ${isSelected ? 'text-amber-300' : isUnlocked ? 'text-slate-100 group-hover:text-amber-200' : 'text-slate-500'} truncate tracking-wide">${h.name}</span>`
                          }
                        </div>
                        <div class="flex items-center space-x-1.5 mt-0.5">
                          ${
                            isGlitched
                              ? `<span class="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800 text-rose-300 uppercase tracking-widest">[C̵O̷R̵R̸U̸P̶T̷]</span>
                                 <span class="text-[10px] text-slate-500 font-mono truncate">?? // REDACTED</span>`
                              : `<span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-amber-400/90 uppercase tracking-wider">${h.role}</span>
                                 <span class="text-[10px] text-slate-400 font-sans truncate">${weapon ? weapon.name : ''}</span>`
                          }
                        </div>
                      </div>
                    </div>

                    <div class="text-[10px] font-mono font-bold ${
                      isSelected
                        ? isGlitched ? 'text-rose-400' : 'text-amber-400'
                        : isGlitched
                        ? 'text-rose-500/80 group-hover:text-rose-300'
                        : isUnlocked
                        ? 'text-slate-500 group-hover:text-slate-300'
                        : 'text-slate-700'
                    } shrink-0 ml-1">
                      ${isSelected ? '[SELECTED]' : isGlitched ? 'ANALYZE >' : isUnlocked ? 'PICK >' : 'LOCKED'}
                    </div>
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Right: Hero Showcase & Ability Deck (7 cols) -->
            <div class="lg:col-span-7 bg-[#0d101a] border ${
              isSelectedHeroGlitched ? 'border-rose-900/80 shadow-[0_0_25px_rgba(244,63,94,0.18)]' : 'border-slate-800/90'
            } rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between overflow-y-auto shadow-inner">
              <div>
                <!-- Hero Header -->
                <div class="flex items-start space-x-3.5 border-b ${
                  isSelectedHeroGlitched ? 'border-rose-900/60' : 'border-slate-800/80'
                } pb-3 mb-3">
                  <div class="relative shrink-0">
                    <img src="${selectedPortrait}" alt="${isSelectedHeroGlitched ? 'Corrupted' : this.selectedHero.name}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 ${
                      isSelectedHeroGlitched
                        ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                        : isSelectedHeroUnlocked
                        ? 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : 'border-slate-800 grayscale brightness-50'
                    }" style="image-rendering: pixelated;" />
                    ${
                      isSelectedHeroGlitched
                        ? `<span class="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-black bg-black/60 text-rose-400 rounded-2xl animate-pulse">CORRUPT</span>`
                        : !isSelectedHeroUnlocked
                        ? `<span class="absolute inset-0 flex items-center justify-center text-xs font-mono font-black bg-black/70 text-amber-400 rounded-2xl">LOCKED</span>`
                        : ''
                    }
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                      ${
                        isSelectedHeroGlitched
                          ? `<h2 class="glitch-text text-xl sm:text-2xl font-mono font-black text-rose-400 tracking-wider">§̸̧Ø̷̧R̴̷R̵̸Ø̶̧W̴_̸0x7F</h2>
                             <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 border border-rose-600 text-rose-300 uppercase tracking-widest">[D̷A̸T̵A̷_̸C̴O̵R̵R̸U̵P̸T̸E̵D̸]</span>`
                          : `<h2 class="text-xl sm:text-2xl font-gothic font-black text-slate-100 tracking-wide">${this.selectedHero.name}</h2>
                             <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-amber-300 uppercase tracking-widest">${this.selectedHero.role}</span>`
                      }
                    </div>
                    <div class="text-xs ${isSelectedHeroGlitched ? 'text-cyan-400/90 font-mono' : 'text-amber-400/90 font-mono'} tracking-wider font-medium">
                      ${isSelectedHeroGlitched ? '[U̶N̸K̵N̷O̵W̸N̸_̶E̸N̸T̷I̵T̷Y̸]' : this.selectedHero.title}
                    </div>
                    ${
                      isSelectedHeroGlitched
                        ? `<p class="text-[11px] sm:text-xs text-rose-200/90 mt-1 font-mono leading-relaxed bg-black/50 p-2 rounded-xl border border-rose-900/50">
                             0x7F // S̸O̴U̵L̸_̵N̷O̸T̵_̸F̶O̴U̸N̴D̵ ... T̷H̶E̸ ̸R̶E̸A̴P̷E̸R̵ ̸M̶U̸S̴T̷ ̸F̴A̶L̷L̵ ... ONLY THE SLAYER OF THE HARBINGER CAN PURGE THE CORRUPTION AND AWAKEN THIS VESSEL.
                           </p>`
                        : `<p class="text-[11px] sm:text-xs text-slate-300 mt-1 font-sans leading-relaxed">${this.selectedHero.description}</p>`
                    }
                  </div>
                </div>

                ${
                  isSelectedHeroGlitched
                    ? `
                  <!-- Fully Concealed Corrupted Void Anomaly: Zero Info / Zero Spoilers -->
                  <div class="flex-1 flex flex-col justify-center items-center p-8 text-center my-auto min-h-[280px]">
                    <div class="w-16 h-16 rounded-2xl border border-rose-500/50 bg-rose-950/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                      <span class="glitch-text text-2xl font-mono text-rose-400 font-black">X</span>
                    </div>
                    <div class="glitch-text text-sm sm:text-base font-mono font-bold text-rose-400 uppercase tracking-[0.25em] mb-2">
                      [CORRUPTED ENTITY // CIPHER RESTRICTED]
                    </div>
                    <p class="text-xs text-slate-500 font-mono max-w-sm leading-relaxed mb-4">
                      MEMORY FRAGMENTS AND VESSEL PROTOCOLS REMAIN EXPUNGED. PURGE THE CORRUPTION TO AWAKEN.
                    </p>
                    <div class="w-48 h-1 bg-gradient-to-r from-transparent via-rose-500/40 to-transparent"></div>
                  </div>
                </div>

                <!-- Action CTA for Glitched State: Zero Spoilers -->
                <button disabled class="w-full bg-slate-950/80 border border-rose-900/50 text-slate-500 font-gothic font-black text-sm sm:text-base py-3 sm:py-3.5 rounded-xl cursor-not-allowed tracking-widest flex items-center justify-center space-x-2">
                  <span>[SEALED VESSEL - LOCKED]</span>
                </button>
              `
                    : `
                ${
                  !isSelectedHeroUnlocked && unlockHeroReq
                    ? `
                  <button id="hero-unlock-req-btn" class="w-full bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/50 rounded-xl p-2.5 mb-3 text-center transition cursor-pointer active:scale-95 shadow">
                    <span class="text-[9px] font-bold text-amber-400 uppercase tracking-widest block font-mono">UNLOCK REQUIREMENT (CLICK TO VIEW)</span>
                    <p class="text-xs text-slate-200 mt-0.5 font-sans font-bold">${unlockHeroReq.description}</p>
                  </button>
                `
                    : `
                  <!-- Passive Trait -->
                  <div class="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl mb-3">
                    <span class="text-[9px] font-bold text-amber-300 uppercase tracking-widest block font-mono">PASSIVE TRAIT</span>
                    <p class="text-xs text-slate-200 mt-0.5 font-sans leading-snug">${this.selectedHero.traitDescription}</p>
                  </div>
                `
                }

                <!-- ACTIVE ABILITY (SPACE) DECK -->
                <div class="mb-3">
                  <div class="flex items-center justify-between mb-1.5 font-mono">
                    <span class="text-[10px] font-bold text-amber-400 uppercase tracking-widest">ACTIVE SPECIAL ABILITY [SPACE]</span>
                    <span class="text-[9px] text-slate-400">CLICK CARD TO EQUIP</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <!-- Ability 1: Innate Primary -->
                    <button data-equip-ability="1" class="ability-card-btn p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      equippedAbility === 1
                        ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }">
                      <div>
                        <div class="flex items-center justify-between">
                          <span class="font-gothic font-bold text-xs ${equippedAbility === 1 ? 'text-amber-300' : 'text-slate-200'}">${this.selectedHero.ability1.name}</span>
                          <span class="text-[9px] font-mono text-slate-400">${this.selectedHero.ability1.cooldown}s CD</span>
                        </div>
                        <p class="text-[10px] text-slate-300 font-sans mt-1 leading-snug line-clamp-3">${this.selectedHero.ability1.description}</p>
                      </div>
                      <div class="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between font-mono text-[9px]">
                        <span class="text-slate-500">PRIMARY</span>
                        <span class="font-bold ${equippedAbility === 1 ? 'text-amber-400' : 'text-slate-400'}">
                          ${equippedAbility === 1 ? '[EQUIPPED]' : 'SELECT >'}
                        </span>
                      </div>
                    </button>

                    <!-- Ability 2: Awakened Secondary -->
                    ${
                      isAbility2Unlocked
                        ? `
                      <button data-equip-ability="2" class="ability-card-btn p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        equippedAbility === 2
                          ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }">
                        <div>
                          <div class="flex items-center justify-between">
                            <span class="font-gothic font-bold text-xs ${equippedAbility === 2 ? 'text-amber-300' : 'text-slate-200'}">${this.selectedHero.ability2.name}</span>
                            <span class="text-[9px] font-mono text-slate-400">${this.selectedHero.ability2.cooldown}s CD</span>
                          </div>
                          <p class="text-[10px] text-slate-300 font-sans mt-1 leading-snug line-clamp-3">${this.selectedHero.ability2.description}</p>
                        </div>
                        <div class="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between font-mono text-[9px]">
                          <span class="text-amber-400 font-bold">AWAKENED</span>
                          <span class="font-bold ${equippedAbility === 2 ? 'text-amber-400' : 'text-slate-400'}">
                            ${equippedAbility === 2 ? '[EQUIPPED]' : 'SELECT >'}
                          </span>
                        </div>
                      </button>
                    `
                        : `
                      <div class="p-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-left flex flex-col justify-between">
                        <div>
                          <div class="flex items-center justify-between">
                            <span class="font-gothic font-bold text-xs text-slate-400">${this.selectedHero.ability2.name}</span>
                            <span class="text-[9px] font-mono text-slate-500">${this.selectedHero.ability2.cooldown}s CD</span>
                          </div>
                          <p class="text-[10px] text-slate-500 font-sans mt-1 leading-snug line-clamp-3">${this.selectedHero.ability2.description}</p>
                        </div>
                        <div class="mt-2 pt-1 border-t border-slate-900 flex items-center justify-between">
                          <button data-unlock-ability-hero="${this.selectedHero.id}" class="unlock-ability-btn w-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 hover:border-amber-400 py-1 rounded text-[10px] font-mono font-bold text-amber-300 transition active:scale-95 shadow">
                            UNLOCK (500 GOLD)
                          </button>
                        </div>
                      </div>
                    `
                    }
                  </div>
                </div>

                <!-- Attributes Grid -->
                <div class="grid grid-cols-4 gap-2 text-[10px] font-mono mb-3">
                  <div class="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span class="text-slate-500 text-[9px] block">HP</span>
                    <span class="font-bold text-rose-400 text-xs">${this.selectedHero.baseStats.maxHealth}</span>
                  </div>
                  <div class="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span class="text-slate-500 text-[9px] block">ARMOR</span>
                    <span class="font-bold text-sky-400 text-xs">+${this.selectedHero.baseStats.armor}</span>
                  </div>
                  <div class="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span class="text-slate-500 text-[9px] block">SPEED</span>
                    <span class="font-bold text-emerald-400 text-xs">${this.selectedHero.baseStats.moveSpeed}</span>
                  </div>
                  <div class="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                    <span class="text-slate-500 text-[9px] block">WEAPON</span>
                    <span class="font-bold text-amber-400 truncate block text-xs">${startingWeapon ? startingWeapon.name : ''}</span>
                  </div>
                </div>
              </div>

              <!-- Action CTA: Proceed to Stage Selection -->
              <button id="hero-proceed-stage-btn" class="w-full ${
                isSelectedHeroUnlocked
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
              } font-gothic font-black text-sm sm:text-base py-3 sm:py-3.5 rounded-xl transition active:scale-95 cursor-pointer tracking-widest flex items-center justify-center space-x-2">
                <span>${isSelectedHeroUnlocked ? 'PROCEED TO REALM SELECTION' : 'VIEW UNLOCK ACHIEVEMENTS'}</span>
                <span>→</span>
              </button>
            `
                }
            </div>
          </div>
        </div>
      `;
    } else {
      // STEP 2: REALM / BIOME SELECTION
      const activeAbilityConfig = equippedAbility === 2 ? this.selectedHero.ability2 : this.selectedHero.ability1;

      this.container.innerHTML = `
        <div class="w-full max-w-6xl bg-[#090b12] border border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col my-auto max-h-[96vh] h-[92vh] overflow-hidden justify-between">
          
          <!-- Top Bar -->
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3 shrink-0">
            <div>
              <div class="flex items-center space-x-2">
                <button id="stage-back-breadcrumb-btn" class="text-xs font-mono font-bold text-slate-400 hover:text-amber-300 transition flex items-center space-x-1 cursor-pointer">
                  <span>←</span>
                  <span>CHANGE HERO</span>
                </button>
                <span class="text-slate-600">•</span>
                <span class="text-[10px] sm:text-xs font-mono font-bold text-amber-400/90 uppercase tracking-[0.25em]">STEP 2 OF 2 • REALM SELECTION</span>
              </div>
              <h1 class="text-xl sm:text-2xl md:text-3xl font-gothic font-black text-slate-100 tracking-wide mt-0.5">
                CHOOSE DESTINATION REALM
              </h1>
            </div>

            <!-- Selected Hero Summary Pill -->
            <div class="bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-xl flex items-center space-x-2.5 shadow">
              <img src="${selectedPortrait}" class="w-8 h-8 rounded-lg border border-amber-400/80 shadow" style="image-rendering: pixelated;" />
              <div class="text-left font-mono">
                <div class="text-xs font-bold text-slate-200">${this.selectedHero.name}</div>
                <div class="text-[10px] text-amber-400 font-semibold">[${activeAbilityConfig.name}]</div>
              </div>
            </div>
          </div>

          <!-- Main Stage Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 flex-1 overflow-y-auto py-2 my-auto">
            ${STAGES.map((s, idx) => {
              const isSelected = s.id === this.selectedStage.id;
              const isUnlocked = StorageService.isStageUnlocked(s.id);
              const threatLevel = idx === 0 ? 'THREAT LEVEL I' : idx === 1 ? 'THREAT LEVEL II' : 'THREAT LEVEL III';
              const threatColor = idx === 0 ? 'text-emerald-400 border-emerald-500/40' : idx === 1 ? 'text-amber-400 border-amber-500/40' : 'text-rose-400 border-rose-500/40';

              return `
                <button data-stage-id="${s.id}" class="stage-select-btn p-4 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer group shadow ${
                isSelected
                  ? 'border-amber-400/90 bg-[#121624] shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                  : isUnlocked
                  ? 'border-slate-800 bg-[#0d101a] hover:border-slate-700 hover:bg-[#131726]'
                  : 'border-slate-900 bg-[#0a0c14] opacity-60 hover:opacity-80'
              }">
                  <div>
                    <div class="flex items-center justify-between mb-2 font-mono">
                      <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-900 border ${threatColor}">${threatLevel}</span>
                      <span class="text-[9px] font-bold ${isSelected ? 'text-amber-400' : isUnlocked ? 'text-slate-500' : 'text-slate-700'}">
                        ${isSelected ? '[SELECTED]' : isUnlocked ? 'SELECT >' : 'LOCKED'}
                      </span>
                    </div>

                    <h3 class="font-gothic font-bold text-base sm:text-lg ${isSelected ? 'text-amber-300' : 'text-slate-100 group-hover:text-amber-200'} tracking-wide">${s.name}</h3>
                    <div class="text-[11px] text-amber-400/80 font-mono mt-0.5">${s.title}</div>
                    <p class="text-xs text-slate-300 font-sans mt-2 leading-relaxed">${s.description}</p>
                  </div>

                  <div class="mt-4 pt-3 border-t border-slate-800/80 font-mono">
                    ${
                      isUnlocked
                        ? `<div class="text-xs text-emerald-400 font-bold flex items-center space-x-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span>[REALM UNLOCKED]</span>
                          </div>`
                        : `<div class="text-[10px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 p-2 rounded-lg leading-tight font-semibold">
                            [LOCKED]: ${s.unlockCondition}
                          </div>`
                    }
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Action Footer: Always in viewport, zero scrolling needed! -->
          <div class="border-t border-slate-800/80 pt-3 mt-3 flex items-center justify-between shrink-0">
            <button id="stage-back-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-5 py-3 rounded-xl text-xs font-mono font-bold text-slate-300 transition active:scale-95 cursor-pointer">
              ← BACK TO HEROES
            </button>

            <button id="stage-start-run-btn" class="${
              canStart
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
            } font-gothic font-black text-sm sm:text-base px-8 py-3 rounded-xl transition active:scale-95 cursor-pointer tracking-widest flex items-center space-x-2">
              <span>${canStart ? `DESCEND INTO ${this.selectedStage.name.toUpperCase()}` : 'VIEW UNLOCK ACHIEVEMENTS'}</span>
              <span>&gt;&gt;</span>
            </button>
          </div>
        </div>
      `;
    }

    // ==========================================
    // BIND EVENT LISTENERS
    // ==========================================

    // Language Toggle & Options
    this.container.querySelector('#hero-lang-toggle-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isLangDropdownOpen = !this.isLangDropdownOpen;
      this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
    });

    this.container.querySelectorAll('.lang-option-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const code = (e.currentTarget as HTMLElement).dataset.langCode;
        if (code) {
          i18n.setLanguage(code as any);
          sound.play('coin');
          this.isLangDropdownOpen = false;
          this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
        }
      });
    });

    // Header Links
    this.container.querySelector('#hero-menu-shop-btn')?.addEventListener('click', () => {
      this.hide();
      onOpenShop();
    });

    this.container.querySelector('#hero-menu-leaderboard-btn')?.addEventListener('click', () => {
      this.hide();
      onOpenLeaderboard();
    });

    this.container.querySelector('#hero-menu-achievements-btn')?.addEventListener('click', () => {
      this.hide();
      onOpenAchievements();
    });

    if (this.currentStep === 'hero') {
      // Hero Card Selection
      this.container.querySelectorAll('.hero-card-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const id = (e.currentTarget as HTMLElement).dataset.heroId;
          const hero = HEROES.find((h) => h.id === id);
          if (hero) {
            this.selectedHero = hero;
            sound.play('coin');
            this.isLangDropdownOpen = false;
            this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
          }
        });
      });

      // Equip Ability 1 or 2
      this.container.querySelectorAll('.ability-card-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const abilityIdx = parseInt((e.currentTarget as HTMLElement).dataset.equipAbility || '1', 10);
          StorageService.setEquippedAbility(this.selectedHero.id, abilityIdx);
          sound.play('coin');
          this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
        });
      });

      // Unlock Ability 2 with Gold
      this.container.querySelectorAll('.unlock-ability-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const heroId = (e.currentTarget as HTMLElement).dataset.unlockAbilityHero || this.selectedHero.id;
          const success = StorageService.unlockAbility(heroId, 2, 500);
          if (success) {
            StorageService.setEquippedAbility(heroId, 2);
            sound.play('powerup');
            this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
          } else {
            sound.play('hit');
            alert('Not enough gold to unlock this ability! Need 500 Gold.');
          }
        });
      });

      // Hero Unlock Requirement Click
      this.container.querySelector('#hero-unlock-req-btn')?.addEventListener('click', () => {
        this.hide();
        onOpenAchievements();
      });

      // Proceed to Realm Selection
      this.container.querySelector('#hero-proceed-stage-btn')?.addEventListener('click', () => {
        if (isSelectedHeroUnlocked) {
          this.currentStep = 'stage';
          sound.play('coin');
          this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
        } else {
          this.hide();
          onOpenAchievements();
        }
      });
    } else {
      // Step 2: Stage Selection
      this.container.querySelectorAll('.stage-select-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const stageId = (e.currentTarget as HTMLElement).dataset.stageId;
          const stage = STAGES.find((s) => s.id === stageId);
          if (stage) {
            this.selectedStage = stage;
            sound.play('coin');
            this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
          }
        });
      });

      // Back to Heroes
      this.container.querySelector('#stage-back-btn')?.addEventListener('click', () => {
        this.currentStep = 'hero';
        sound.play('coin');
        this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
      });

      this.container.querySelector('#stage-back-breadcrumb-btn')?.addEventListener('click', () => {
        this.currentStep = 'hero';
        sound.play('coin');
        this.render(onStartGame, onOpenShop, onOpenLeaderboard, onOpenAchievements);
      });

      // Start Run
      this.container.querySelector('#stage-start-run-btn')?.addEventListener('click', () => {
        if (canStart) {
          this.hide();
          onStartGame(this.selectedHero, this.selectedStage);
        } else {
          this.hide();
          onOpenAchievements();
        }
      });
    }
  }
}
