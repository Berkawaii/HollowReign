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
      'fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-40 p-4 font-mono text-white select-none overflow-y-auto';
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
      <div class="w-full max-w-6xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-amber-500/60 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col my-auto max-h-[96vh]">
        
        <!-- Top Bar -->
        <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">${t('app_title')}</span>
            <h1 class="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
              ${t('select_your_hero')} & BIOME
            </h1>
          </div>

          <div class="flex items-center space-x-2.5">
            <!-- Language Selector Dropdown -->
            <div class="relative">
              <button id="hero-lang-toggle-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95 flex items-center space-x-1.5 shadow">
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
            <button id="hero-menu-achievements-btn" class="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 transition active:scale-95 shadow">
              ${t('achievements')}
            </button>

            <!-- PowerUp Shop Button -->
            <button id="hero-menu-shop-btn" class="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 transition active:scale-95 flex items-center space-x-1.5 shadow">
              <span class="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              <span>${data.gold} ${t('gold')}</span>
            </button>

            <!-- Leaderboard Button -->
            <button id="hero-menu-leaderboard-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 transition active:scale-95">
              ${t('leaderboard')}
            </button>
          </div>
        </div>

        <!-- Stage / Biome Selector Row -->
        <div class="mb-4 bg-slate-950/90 border border-slate-800 p-3 rounded-2xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">CHOOSE STAGE & BIOME</span>
            <span class="text-[10px] text-slate-400 font-sans">${this.selectedStage.title}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            ${STAGES.map((s) => {
              const isSelected = s.id === this.selectedStage.id;
              const isUnlocked = StorageService.isStageUnlocked(s.id);

              return `
                <button data-stage-id="${s.id}" class="stage-select-btn p-2.5 rounded-xl border-2 text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-amber-400 bg-amber-950/40 shadow-lg'
                  : isUnlocked
                  ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80'
                  : 'border-slate-900 bg-slate-950/40 opacity-75 hover:opacity-100 hover:border-slate-700'
              }">
                  <div class="w-full">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <span class="font-black text-xs ${isSelected ? 'text-amber-300' : 'text-slate-200'}">${s.name}</span>
                        ${
                          !isUnlocked
                            ? `<span class="text-[9px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">${t('locked')}</span>`
                            : ''
                        }
                      </div>
                      <span class="text-[10px] font-mono font-bold ${isSelected ? 'text-amber-400' : isUnlocked ? 'text-slate-500' : 'text-amber-500/80'}">
                        ${isSelected ? '[SELECTED]' : isUnlocked ? 'PICK >' : 'LOCKED'}
                      </span>
                    </div>
                    <div class="text-[10px] text-slate-400 font-sans mt-1 line-clamp-1">${s.description}</div>
                  </div>

                  ${
                    !isUnlocked
                      ? `<div class="mt-2 text-[9px] text-amber-300/90 font-mono font-semibold bg-amber-950/50 border border-amber-500/30 px-2 py-1 rounded-md">
                          🔒 ${s.unlockCondition}
                        </div>`
                      : `<div class="mt-2 text-[9px] text-emerald-400/80 font-mono flex items-center space-x-1">
                          <span>✓ Ready for Expedition</span>
                        </div>`
                  }
                </button>
              `;
            }).join('')}
          </div>

          ${
            !isSelectedStageUnlocked
              ? `
            <button id="stage-unlock-banner-btn" class="mt-2.5 w-full bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/70 rounded-xl p-2.5 text-left flex items-center justify-between transition cursor-pointer active:scale-95 shadow">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-black text-amber-400 font-mono">🔒 STAGE LOCKED:</span>
                <span class="text-xs text-slate-200 font-sans font-bold">${this.selectedStage.unlockCondition}</span>
              </div>
              <span class="text-xs text-amber-300 font-bold font-mono underline ml-3 shrink-0">VIEW ACHIEVEMENTS ></span>
            </button>
          `
              : ''
          }
        </div>

        <!-- Main Layout: Heroes List + Detail Panel -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
          
          <!-- Heroes Cards Column -->
          <div class="lg:col-span-2 flex flex-col space-y-2.5 overflow-y-auto pr-2 max-h-[44vh] lg:max-h-full">
            ${HEROES.map((h) => {
              const isSelected = h.id === this.selectedHero.id;
              const isUnlocked = StorageService.isHeroUnlocked(h.id);
              const weapon = WEAPONS[h.startingWeaponId];
              const portraitUrl = ProceduralAssets.getHeroPortraitDataUrl(h.id);

              return `
                <button data-hero-id="${h.id}" class="hero-card-btn w-full bg-slate-900/90 hover:bg-slate-800/90 border-2 ${
                isSelected
                  ? 'border-amber-400 bg-slate-800/90 shadow-amber-500/20 shadow-lg'
                  : isUnlocked
                  ? 'border-slate-800'
                  : 'border-slate-900 opacity-60'
              } p-3 rounded-2xl flex items-center justify-between text-left transition duration-150 transform hover:scale-[1.01] active:scale-95 group">
                  
                  <div class="flex items-center space-x-3.5">
                    <!-- Hero Portrait Photo -->
                    <div class="relative shrink-0">
                      <img src="${portraitUrl}" alt="${h.name}" class="w-12 h-12 rounded-xl border-2 shadow-md ${
                isUnlocked ? '' : 'grayscale brightness-50'
              }" style="border-color: ${isUnlocked ? h.color : '#334155'}; image-rendering: pixelated;" />
                      ${
                        !isUnlocked
                          ? `<span class="absolute inset-0 flex items-center justify-center text-[9px] font-black bg-black/60 text-slate-400 rounded-xl">${t('locked')}</span>`
                          : ''
                      }
                    </div>

                    <div>
                      <div class="flex items-center space-x-2">
                        <span class="font-black text-base ${isUnlocked ? 'text-slate-100 group-hover:text-amber-300' : 'text-slate-500'} transition">${h.name}</span>
                        <span class="text-xs text-slate-400">(${h.title})</span>
                      </div>
                      <div class="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2 font-sans">
                        <span class="text-amber-400 font-bold font-mono">${t('weapon')}:</span>
                        <span>${weapon ? weapon.name : h.startingWeaponId}</span>
                      </div>
                    </div>
                  </div>

                  <div class="text-xs font-bold ${
                    isSelected
                      ? 'text-amber-400'
                      : isUnlocked
                      ? 'text-slate-500'
                      : 'text-slate-700'
                  } font-mono">
                    ${isSelected ? t('selected_btn') : isUnlocked ? t('select_btn') : t('locked')}
                  </div>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Hero Details Column -->
          <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <!-- Big Hero Portrait Preview -->
              <div class="flex flex-col items-center border-b border-slate-800 pb-3 mb-3">
                <div class="relative mb-2">
                  <img src="${selectedPortrait}" alt="${this.selectedHero.name}" class="w-20 h-20 rounded-2xl border-2 ${
      isSelectedHeroUnlocked ? 'border-amber-400/80 shadow-2xl' : 'border-slate-800 grayscale brightness-50'
    }" style="image-rendering: pixelated;" />
                  ${
                    !isSelectedHeroUnlocked
                      ? `<span class="absolute inset-0 flex items-center justify-center text-xs font-black bg-black/70 text-amber-400 rounded-2xl">${t('locked')}</span>`
                      : ''
                  }
                </div>
                <span class="text-[11px] text-amber-400 font-bold uppercase tracking-widest">${this.selectedHero.title}</span>
                <h3 class="text-xl font-black text-white">${this.selectedHero.name}</h3>
                <p class="text-[11px] text-slate-400 mt-0.5 font-sans leading-relaxed text-center">${this.selectedHero.description}</p>
              </div>

              ${
                !isSelectedHeroUnlocked && unlockHeroReq
                  ? `
                <button id="hero-unlock-req-btn" class="w-full bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/60 rounded-xl p-2.5 mb-3 text-center transition cursor-pointer active:scale-95 shadow">
                  <span class="text-[9px] font-bold text-amber-400 uppercase tracking-widest block font-mono">${t('unlock_requirement')} (CLICK TO VIEW)</span>
                  <p class="text-xs text-slate-200 mt-0.5 font-sans font-bold">${unlockHeroReq.description}</p>
                </button>
              `
                  : `
                <div class="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 mb-3">
                  <span class="text-[10px] font-bold text-amber-300 uppercase tracking-wider block font-mono">${t('passive_trait')}</span>
                  <p class="text-[11px] text-slate-200 mt-0.5 font-sans">${this.selectedHero.traitDescription}</p>
                </div>
              `
              }

              <!-- Stats Summary -->
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div class="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 text-[9px] block">${t('max_health')}</span>
                  <span class="font-bold text-slate-200">${this.selectedHero.baseStats.maxHealth} HP</span>
                </div>
                <div class="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 text-[9px] block">${t('armor')}</span>
                  <span class="font-bold text-slate-200">${this.selectedHero.baseStats.armor}</span>
                </div>
                <div class="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 text-[9px] block">${t('move_speed')}</span>
                  <span class="font-bold text-slate-200">${this.selectedHero.baseStats.moveSpeed} px/s</span>
                </div>
                <div class="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span class="text-slate-500 text-[9px] block">${t('starting_weapon')}</span>
                  <span class="font-bold text-amber-400">${startingWeapon ? startingWeapon.name : ''}</span>
                </div>
              </div>
            </div>

            <!-- Start Button -->
            <button id="hero-start-run-btn" class="mt-4 w-full ${
              canStart
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border border-amber-500/50 text-amber-300 shadow-md'
            } font-black text-base py-3 rounded-xl shadow-xl transition active:scale-95 cursor-pointer">
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
