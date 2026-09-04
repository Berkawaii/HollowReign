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
  private isLangDropdownOpen: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hero-select-modal';
    this.container.className =
      'fixed inset-0 bg-black/95 flex flex-col items-center justify-start md:justify-center z-40 p-2 sm:p-4 font-mono text-white select-none overflow-y-auto';
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
    const selectedPortrait = ProceduralAssets.getHeroPortraitDataUrl(this.selectedHero.id);
    const isSelectedHeroUnlocked = StorageService.isHeroUnlocked(this.selectedHero.id);
    const isSelectedStageUnlocked = StorageService.isStageUnlocked(this.selectedStage.id);

    const unlockHeroReq = ACHIEVEMENTS.find(
      (a) => a.rewardType === 'hero' && a.rewardId === this.selectedHero.id
    );

    const currentLang = i18n.getLanguage();
    const supportedLangs = i18n.getSupportedLanguages();
    const currentLangMeta = supportedLangs.find((l) => l.code === currentLang) || supportedLangs[0];

    const canStart = isSelectedHeroUnlocked && isSelectedStageUnlocked;

    this.container.innerHTML = `
      <div class="w-full max-w-6xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/60 rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-8 shadow-2xl flex flex-col my-auto max-h-none md:max-h-[96vh] overflow-y-auto">
        
        <!-- Top Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 border-b border-slate-800 pb-3 mb-3">
          <div>
            <span class="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest block">${t('app_title')}</span>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 leading-tight">
              ${t('select_your_hero')} & BIOME
            </h1>
          </div>

          <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <!-- Language Selector Dropdown -->
            <div class="relative">
              <button id="hero-lang-toggle-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-slate-200 transition active:scale-95 flex items-center space-x-1.5 shadow">
                <span class="font-black text-amber-400">${currentLangMeta.flag}</span>
                <span>${currentLangMeta.nativeName}</span>
                <span class="text-[10px] text-slate-400">▾</span>
              </button>

              ${
                this.isLangDropdownOpen
                  ? `
                <div class="absolute right-0 top-full mt-1.5 w-44 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 py-1 max-h-60 overflow-y-auto font-mono">
                  ${supportedLangs
                    .map(
                      (l) => `
                    <button data-lang-code="${l.code}" class="lang-option-btn w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                        l.code === currentLang ? 'bg-amber-950/60 text-amber-300 font-bold' : 'text-slate-300'
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

            <!-- Achievements Button -->
            <button id="hero-menu-achievements-btn" class="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-amber-300 transition active:scale-95 shadow">
              ${t('achievements')}
            </button>

            <!-- PowerUp Shop Button -->
            <button id="hero-menu-shop-btn" class="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-amber-300 transition active:scale-95 flex items-center space-x-1.5 shadow">
              <span class="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              <span>${data.gold} ${t('gold')}</span>
            </button>

            <!-- Leaderboard Button -->
            <button id="hero-menu-leaderboard-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold text-slate-200 transition active:scale-95">
              ${t('leaderboard')}
            </button>
          </div>
        </div>

        <!-- Stage / Biome Selector Row -->
        <div class="mb-3 sm:mb-4 bg-slate-950/90 border border-slate-800 p-2.5 sm:p-3 rounded-2xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">CHOOSE STAGE & BIOME</span>
            <span class="text-[10px] text-slate-400 font-sans truncate ml-2">${this.selectedStage.title}</span>
          </div>

          <div class="flex md:grid md:grid-cols-3 gap-2 overflow-x-auto pb-1 snap-x no-scrollbar">
            ${STAGES.map((s) => {
              const isSelected = s.id === this.selectedStage.id;
              const isUnlocked = StorageService.isStageUnlocked(s.id);

              return `
                <button data-stage-id="${s.id}" class="stage-select-btn shrink-0 w-[72vw] max-w-[260px] md:w-auto p-2 sm:p-2.5 rounded-xl border-2 text-left transition flex flex-col justify-between cursor-pointer snap-start ${
                isSelected
                  ? 'border-amber-400 bg-amber-950/40 shadow-lg'
                  : isUnlocked
                  ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80'
                  : 'border-slate-900 bg-slate-950/40 opacity-75 hover:opacity-100 hover:border-slate-700'
              }">
                  <div class="w-full">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-1.5">
                        <span class="font-black text-xs ${isSelected ? 'text-amber-300' : 'text-slate-200'}">${s.name}</span>
                        ${
                          !isUnlocked
                            ? `<span class="text-[9px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">${t('locked')}</span>`
                            : ''
                        }
                      </div>
                      <span class="text-[9px] font-mono font-bold ${isSelected ? 'text-amber-400' : isUnlocked ? 'text-slate-500' : 'text-amber-500/80'}">
                        ${isSelected ? '[SELECTED]' : isUnlocked ? 'PICK >' : 'LOCKED'}
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-sans mt-0.5 line-clamp-1">${s.description}</div>
                  </div>

                  ${
                    !isUnlocked
                      ? `<div class="mt-1.5 text-[9px] text-amber-300/90 font-mono font-semibold bg-amber-950/50 border border-amber-500/30 px-1.5 py-0.5 rounded">
                          [LOCKED] ${s.unlockCondition}
                        </div>`
                      : `<div class="mt-1.5 text-[9px] text-emerald-400/80 font-mono flex items-center space-x-1">
                          <span>[READY]</span>
                        </div>`
                  }
                </button>
              `;
            }).join('')}
          </div>

          ${
            !isSelectedStageUnlocked
              ? `
            <button id="stage-unlock-banner-btn" class="mt-2 w-full bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/70 rounded-xl p-2 text-left flex items-center justify-between transition cursor-pointer active:scale-95 shadow">
              <div class="flex items-center space-x-2">
                <span class="text-[11px] font-black text-amber-400 font-mono">[STAGE LOCKED]:</span>
                <span class="text-[11px] text-slate-200 font-sans font-bold">${this.selectedStage.unlockCondition}</span>
              </div>
              <span class="text-[11px] text-amber-300 font-bold font-mono underline ml-2 shrink-0">VIEW ACHIEVEMENTS ></span>
            </button>
          `
              : ''
          }
        </div>

        <!-- Main Layout: Heroes List + Detail Panel -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 flex-1">
          
          <!-- Heroes Cards Column (Horizontal carousel on mobile, vertical stack on desktop) -->
          <div class="lg:col-span-2 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 pr-0 lg:pr-2 snap-x no-scrollbar max-h-none lg:max-h-full">
            ${HEROES.map((h) => {
              const isSelected = h.id === this.selectedHero.id;
              const isUnlocked = StorageService.isHeroUnlocked(h.id);
              const weapon = WEAPONS[h.startingWeaponId];
              const portraitUrl = ProceduralAssets.getHeroPortraitDataUrl(h.id);

              return `
                <button data-hero-id="${h.id}" class="hero-card-btn shrink-0 w-[200px] sm:w-[240px] lg:w-full bg-slate-900/90 hover:bg-slate-800/90 border-2 ${
                isSelected
                  ? 'border-amber-400 bg-slate-800/90 shadow-amber-500/20 shadow-lg'
                  : isUnlocked
                  ? 'border-slate-800'
                  : 'border-slate-900 opacity-60'
              } p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between text-left transition duration-150 transform hover:scale-[1.01] active:scale-95 group snap-start">
                  
                  <div class="flex items-center space-x-2.5 sm:space-x-3.5">
                    <!-- Hero Portrait Photo -->
                    <div class="relative shrink-0">
                      <img src="${portraitUrl}" alt="${h.name}" class="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 shadow-md ${
                        isUnlocked ? '' : 'grayscale brightness-50'
                      }" style="border-color: ${isUnlocked ? h.color : '#334155'}; image-rendering: pixelated;" />
                      ${
                        !isUnlocked
                          ? `<span class="absolute inset-0 flex items-center justify-center text-[9px] font-black bg-black/60 text-slate-400 rounded-xl">${t('locked')}</span>`
                          : ''
                      }
                    </div>

                    <div>
                      <div class="flex items-center space-x-1.5">
                        <span class="font-black text-sm sm:text-base ${isUnlocked ? 'text-slate-100 group-hover:text-amber-300' : 'text-slate-500'} transition truncate">${h.name}</span>
                      </div>
                      <div class="text-[10px] sm:text-xs text-slate-400">(${h.title})</div>
                      <div class="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1 font-sans">
                        <span class="text-amber-400 font-bold font-mono text-[9px] sm:text-[10px]">${t('weapon')}:</span>
                        <span class="truncate">${weapon ? weapon.name : h.startingWeaponId}</span>
                      </div>
                    </div>
                  </div>

                  <div class="text-[10px] sm:text-xs font-bold ${
                    isSelected
                      ? 'text-amber-400'
                      : isUnlocked
                      ? 'text-slate-500'
                      : 'text-slate-700'
                  } font-mono shrink-0 ml-1">
                    ${isSelected ? t('selected_btn') : isUnlocked ? t('select_btn') : t('locked')}
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Hero Details Column -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
            <div>
              <!-- Big Hero Portrait Preview -->
              <div class="flex flex-col items-center border-b border-slate-800 pb-2.5 mb-2.5">
                <div class="relative mb-1.5">
                  <img src="${selectedPortrait}" alt="${this.selectedHero.name}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 ${
                    isSelectedHeroUnlocked ? 'border-amber-400/80 shadow-2xl' : 'border-slate-800 grayscale brightness-50'
                  }" style="image-rendering: pixelated;" />
                  ${
                    !isSelectedHeroUnlocked
                      ? `<span class="absolute inset-0 flex items-center justify-center text-xs font-black bg-black/70 text-amber-400 rounded-2xl">${t('locked')}</span>`
                      : ''
                  }
                </div>
                <span class="text-[10px] sm:text-[11px] text-amber-400 font-bold uppercase tracking-widest">${this.selectedHero.title}</span>
                <h3 class="text-lg sm:text-xl font-black text-white">${this.selectedHero.name}</h3>
                <p class="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-sans leading-relaxed text-center">${this.selectedHero.description}</p>
              </div>

              ${
                !isSelectedHeroUnlocked && unlockHeroReq
                  ? `
                <button id="hero-unlock-req-btn" class="w-full bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/60 rounded-xl p-2 mb-2.5 text-center transition cursor-pointer active:scale-95 shadow">
                  <span class="text-[9px] font-bold text-amber-400 uppercase tracking-widest block font-mono">${t('unlock_requirement')} (CLICK TO VIEW)</span>
                  <p class="text-[11px] text-slate-200 mt-0.5 font-sans font-bold">${unlockHeroReq.description}</p>
                </button>
              `
                  : `
                <div class="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2 sm:p-2.5 mb-2.5">
                  <span class="text-[9px] sm:text-[10px] font-bold text-amber-300 uppercase tracking-wider block font-mono">${t('passive_trait')}</span>
                  <p class="text-[10px] sm:text-[11px] text-slate-200 mt-0.5 font-sans">${this.selectedHero.traitDescription}</p>
                </div>
              `
              }

              <!-- Stats Summary -->
              <div class="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-[11px]">
                <div class="bg-slate-900 p-1.5 sm:p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 text-[8px] sm:text-[9px] block">${t('max_health')}</span>
                  <span class="font-bold text-slate-200">${this.selectedHero.baseStats.maxHealth} HP</span>
                </div>
                <div class="bg-slate-900 p-1.5 sm:p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 text-[8px] sm:text-[9px] block">${t('armor')}</span>
                  <span class="font-bold text-slate-200">${this.selectedHero.baseStats.armor}</span>
                </div>
                <div class="bg-slate-900 p-1.5 sm:p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 text-[8px] sm:text-[9px] block">${t('move_speed')}</span>
                  <span class="font-bold text-slate-200">${this.selectedHero.baseStats.moveSpeed} px/s</span>
                </div>
                <div class="bg-slate-900 p-1.5 sm:p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 text-[8px] sm:text-[9px] block">${t('starting_weapon')}</span>
                  <span class="font-bold text-amber-400 truncate block">${startingWeapon ? startingWeapon.name : ''}</span>
                </div>
              </div>
            </div>

            <!-- Start Button -->
            <button id="hero-start-run-btn" class="mt-3 sm:mt-4 w-full ${
              canStart
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border border-amber-500/50 text-amber-300 shadow-md'
            } font-black text-sm sm:text-base py-2.5 sm:py-3 rounded-xl shadow-xl transition active:scale-95 cursor-pointer">
              ${canStart ? `${t('start_run')} • ${this.selectedStage.name}` : `VIEW ACHIEVEMENTS TO UNLOCK >`}
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind Stage Selector Buttons
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

    // Bind Hero Select Cards
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

    // Bind Language Dropdown
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

    // Bind Action Buttons
    this.container.querySelector('#hero-start-run-btn')?.addEventListener('click', () => {
      if (canStart) {
        this.hide();
        onStartGame(this.selectedHero, this.selectedStage);
      } else {
        this.hide();
        onOpenAchievements();
      }
    });

    this.container.querySelector('#hero-unlock-req-btn')?.addEventListener('click', () => {
      this.hide();
      onOpenAchievements();
    });

    this.container.querySelector('#stage-unlock-banner-btn')?.addEventListener('click', () => {
      this.hide();
      onOpenAchievements();
    });

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
  }
}
