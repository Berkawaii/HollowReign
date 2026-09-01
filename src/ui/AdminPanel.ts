import { EntityManager } from '../ecs/EntityManager';
import { WEAPONS } from '../config/weapons';
import { PASSIVES, PassiveConfig } from '../config/passives';
import { ENEMIES } from '../config/enemies';
import { sound } from '../core/AudioEngine';

export class AdminPanel {
  private container: HTMLDivElement;
  private toggleButton: HTMLButtonElement;
  private isVisible: boolean = false;
  private em: EntityManager | null = null;
  public gameSpeed: number = 1.0;

  constructor() {
    // Floating trigger button in top-right corner (hidden by default unless authorized)
    this.toggleButton = document.createElement('button');
    this.toggleButton.id = 'admin-toggle-btn';
    this.toggleButton.className =
      'fixed top-3 right-40 z-30 bg-purple-950/80 hover:bg-purple-800 border border-purple-500/60 text-purple-200 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition shadow-lg active:scale-95 flex items-center space-x-1.5';
    this.toggleButton.innerHTML = '<span>[ADMIN]</span>';
    
    if (!this.isAuthorized()) {
      this.toggleButton.style.display = 'none';
    }
    document.body.appendChild(this.toggleButton);

    // Expose console helpers for developer
    (window as unknown as { enableAdmin?: () => void; disableAdmin?: () => void }).enableAdmin = () => {
      try { localStorage.setItem('hollow_reign_admin', 'true'); } catch (_) {}
      this.toggleButton.style.display = 'flex';
      console.log('Hollow Reign: Admin panel unlocked.');
    };
    (window as unknown as { enableAdmin?: () => void; disableAdmin?: () => void }).disableAdmin = () => {
      try { localStorage.removeItem('hollow_reign_admin'); } catch (_) {}
      this.toggleButton.style.display = 'none';
      this.hide();
      console.log('Hollow Reign: Admin panel locked.');
    };

    // Admin Panel Container
    this.container = document.createElement('div');
    this.container.id = 'admin-panel';
    this.container.className =
      'fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4 font-mono text-white select-none hidden overflow-y-auto';
    document.body.appendChild(this.container);

    this.toggleButton.addEventListener('click', () => {
      if (this.isAuthorized()) {
        this.toggle();
      }
    });

    // Keyboard shortcut: Backquote (`) or F1 (only if authorized)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Backquote' || e.code === 'F1') {
        if (this.isAuthorized()) {
          this.toggle();
        }
      }
    });
  }

  public isAuthorized(): boolean {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true' || urlParams.get('debug') === '1') {
        localStorage.setItem('hollow_reign_admin', 'true');
        return true;
      }
      if (localStorage.getItem('hollow_reign_admin') === 'true') {
        return true;
      }
    } catch (_) {}

    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  public bindEntityManager(em: EntityManager): void {
    this.em = em;
  }

  public toggle(): void {
    if (!this.isAuthorized()) return;
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public show(): void {
    if (!this.isAuthorized()) return;
    this.isVisible = true;
    this.container.style.display = 'flex';
    this.render();
  }

  public hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
  }

  private render(): void {
    if (!this.em || !this.em.player) {
      this.container.innerHTML = `
        <div class="w-full max-w-md bg-slate-950 border border-purple-500 rounded-2xl p-6 text-center shadow-2xl">
          <h2 class="text-xl font-bold text-purple-400 mb-2">[DEV] Developer Panel</h2>
          <p class="text-xs text-slate-400 mb-4">Bir kosu baslattiktan sonra bu paneli acarak tum silahlari, evrimleri ve test araclarini kullanabilirsiniz.</p>
          <button id="admin-close-btn" class="bg-purple-900 hover:bg-purple-800 text-xs font-bold px-4 py-2 rounded-lg">KAPAT</button>
        </div>
      `;
      this.container.querySelector('#admin-close-btn')?.addEventListener('click', () => this.hide());
      return;
    }

    const p = this.em.player;
    const em = this.em;

    this.container.innerHTML = `
      <div class="w-full max-w-5xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-purple-500/80 rounded-3xl p-6 shadow-2xl flex flex-col my-auto max-h-[95vh] overflow-y-auto font-mono">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-purple-900/60 pb-3 mb-4">
          <div>
            <span class="text-xs font-bold text-purple-400 uppercase tracking-widest">Developer & Cheat Tools</span>
            <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-amber-300">
              ADMIN / CHEAT PANEL
            </h2>
          </div>
          <button id="admin-close-btn" class="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95">
            CLOSE [ESC / \`]
          </button>
        </div>

        <!-- Quick Cheats Bar -->
        <div class="bg-purple-950/40 border border-purple-500/30 p-3.5 rounded-2xl mb-4 flex flex-wrap gap-2 items-center">
          <!-- God Mode Toggle -->
          <button id="cheat-godmode-btn" class="px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center space-x-1.5 ${
            em.godMode ? 'bg-emerald-600 text-white shadow-emerald-500/30 shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }">
            <span>God Mode: ${em.godMode ? 'ON' : 'OFF'}</span>
          </button>

          <!-- Heal Full -->
          <button id="cheat-heal-btn" class="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 transition active:scale-95">
            Full Heal
          </button>

          <!-- Level Up +1 / +10 -->
          <button id="cheat-level-1-btn" class="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-sky-400 transition active:scale-95">
            +1 Level
          </button>
          <button id="cheat-level-10-btn" class="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-sky-300 transition active:scale-95">
            +10 Levels
          </button>

          <!-- Gold +1000 / +10000 -->
          <button id="cheat-gold-1k-btn" class="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-amber-400 transition active:scale-95">
            +1,000 Gold
          </button>
          <button id="cheat-gold-10k-btn" class="bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-yellow-300 transition active:scale-95">
            +10,000 Gold
          </button>

          <!-- Nuke All Enemies -->
          <button id="cheat-nuke-btn" class="bg-red-950 hover:bg-red-900 border border-red-700 px-3 py-2 rounded-xl text-xs font-bold text-red-200 transition active:scale-95">
            Kill All Enemies
          </button>

          <!-- Speed multiplier -->
          <div class="flex items-center space-x-1 ml-auto bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            <span class="text-[10px] text-slate-400">Speed:</span>
            <button data-speed="1" class="speed-btn px-2 py-0.5 rounded text-xs font-bold ${this.gameSpeed === 1 ? 'bg-purple-600 text-white' : 'text-slate-400'}">1x</button>
            <button data-speed="2" class="speed-btn px-2 py-0.5 rounded text-xs font-bold ${this.gameSpeed === 2 ? 'bg-purple-600 text-white' : 'text-slate-400'}">2x</button>
            <button data-speed="4" class="speed-btn px-2 py-0.5 rounded text-xs font-bold ${this.gameSpeed === 4 ? 'bg-purple-600 text-white' : 'text-slate-400'}">4x</button>
          </div>
        </div>

        <!-- Section 1: Super Weapon Evolutions (Direct Add) -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
              <span>SUPER WEAPONS (EVOLUTIONS)</span>
            </span>
            <button id="cheat-evolve-ready-btn" class="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs px-3 py-1 rounded-lg transition active:scale-95 shadow">
              EVOLVE ALL READY WEAPONS
            </button>
          </div>
          <p class="text-[11px] text-slate-400 mb-2 font-sans">
            <strong>Standard Gameplay:</strong> Weapons evolve from <strong>Treasure Chests</strong> when at Lvl 8 and the paired Passive is owned. You can also directly equip below:
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            ${Object.values(WEAPONS)
              .filter((w) => w.isEvolution)
              .map((w) => {
                const isEquipped = p.weapons.some((eq) => eq.id === w.id);
                return `
                  <button data-equip-weapon="${w.id}" class="admin-action-btn bg-gradient-to-r from-red-950/80 to-amber-950/80 hover:from-red-900 hover:to-amber-900 border ${
                  isEquipped ? 'border-amber-400 shadow-amber-500/20 shadow' : 'border-amber-700/50'
                } p-3 rounded-xl flex items-center justify-between text-left transition active:scale-95 group">
                    <div class="flex-1 mr-2">
                      <div class="flex items-center space-x-1.5">
                        <span class="font-bold text-xs text-amber-200">${w.name}</span>
                        ${isEquipped ? '<span class="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 rounded">EQUIPPED</span>' : ''}
                      </div>
                      <p class="text-[10px] text-slate-400 mt-0.5 line-clamp-1 font-sans">${w.description}</p>
                    </div>
                    <span class="text-[11px] font-bold text-amber-400">+ EQUIP</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- Section 2: Base Weapons (Equip or Max Level 8) -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-sky-400 uppercase tracking-wider">BASE WEAPONS (Lvl 1 - 8)</span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            ${Object.values(WEAPONS)
              .filter((w) => !w.isEvolution)
              .map((w) => {
                const eq = p.weapons.find((item) => item.id === w.id);
                const currentLvl = eq ? eq.level : 0;
                return `
                  <div class="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
                    <div>
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-xs text-slate-200">${w.name}</span>
                        <span class="text-[10px] font-bold ${currentLvl > 0 ? 'text-sky-400' : 'text-slate-500'}">Lvl ${currentLvl}/8</span>
                      </div>
                    </div>
                    <div class="flex space-x-1 mt-2">
                      <button data-upgrade-weapon="${w.id}" class="admin-action-btn flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-[10px] font-bold text-sky-300">
                        +1 Lvl
                      </button>
                      <button data-max-weapon="${w.id}" class="admin-action-btn flex-1 bg-sky-950 hover:bg-sky-900 border border-sky-600/50 py-1 rounded text-[10px] font-bold text-sky-200">
                        MAX (8)
                      </button>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- Section 3: Passive Items -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">PASSIVE ITEMS (Lvl 1 - 5)</span>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
            ${Object.values(PASSIVES)
              .map((pass) => {
                const eq = p.passives.find((item) => item.id === pass.id);
                const currentLvl = eq ? eq.level : 0;
                return `
                  <div class="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-xs text-slate-200">${pass.name}</span>
                      <span class="text-[10px] font-bold ${currentLvl > 0 ? 'text-emerald-400' : 'text-slate-500'}">Lvl ${currentLvl}/5</span>
                    </div>
                    <p class="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-sans">${pass.description}</p>
                    <div class="flex space-x-1 mt-2">
                      <button data-upgrade-passive="${pass.id}" class="admin-action-btn flex-1 bg-slate-800 hover:bg-slate-700 py-1 rounded text-[10px] font-bold text-emerald-300">
                        +1 Lvl
                      </button>
                      <button data-max-passive="${pass.id}" class="admin-action-btn flex-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/50 py-1 rounded text-[10px] font-bold text-emerald-200">
                        MAX (5)
                      </button>
                    </div>
                  </div>
                `;
              })
              .join('')}
          </div>
        </div>

        <!-- Section 4: Special Wave Attacks & Shrines & Bosses -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-800 pt-3">
          <!-- Item Spawners -->
          <div class="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <span class="text-[11px] font-bold text-slate-300 block mb-2">Spawn Pickups:</span>
            <div class="grid grid-cols-3 gap-1.5 text-[11px]">
              <button id="spawn-chest-btn" class="bg-amber-950 hover:bg-amber-900 border border-amber-600/60 py-1.5 rounded-lg font-bold text-amber-200">Chest</button>
              <button id="spawn-magnet-btn" class="bg-blue-950 hover:bg-blue-900 border border-blue-600/60 py-1.5 rounded-lg font-bold text-blue-200">Magnet</button>
              <button id="spawn-rosary-btn" class="bg-yellow-950 hover:bg-yellow-900 border border-yellow-600/60 py-1.5 rounded-lg font-bold text-yellow-200">Bomb</button>
              <button id="spawn-meat-btn" class="bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 py-1.5 rounded-lg font-bold text-emerald-200">Meat</button>
              <button id="spawn-gold-gem-btn" class="bg-purple-950 hover:bg-purple-900 border border-purple-600/60 py-1.5 rounded-lg font-bold text-purple-200">Giant XP</button>
              <button id="spawn-coin-btn" class="bg-slate-800 hover:bg-slate-700 py-1.5 rounded-lg font-bold text-slate-200">Gold</button>
            </div>
          </div>

          <!-- Special Wave Attacks -->
          <div class="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <span class="text-[11px] font-bold text-rose-300 block mb-2">Trigger Special Attacks:</span>
            <div class="flex flex-col space-y-1.5 text-[11px]">
              <button id="attack-ring-btn" class="bg-red-950 hover:bg-red-900 border border-red-600/60 py-1.5 rounded-lg font-bold text-rose-200">Tight Ring Encirclement</button>
              <button id="attack-swarm-btn" class="bg-sky-950 hover:bg-sky-900 border border-sky-600/60 py-1.5 rounded-lg font-bold text-sky-200">Fast Swarm Stampede</button>
              <button id="attack-wall-btn" class="bg-amber-950 hover:bg-amber-900 border border-amber-600/60 py-1.5 rounded-lg font-bold text-amber-200">Pincer Wall Attack</button>
            </div>
          </div>

          <!-- Time Warp & Boss Spawner -->
          <div class="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <span class="text-[11px] font-bold text-slate-300 block mb-2">Time Warp & Spawn Bosses:</span>
            <div class="grid grid-cols-2 gap-1.5 text-[11px]">
              <button id="time-add-1m-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 py-1.5 rounded-lg font-bold">+1 Min</button>
              <button id="time-add-5m-btn" class="bg-slate-900 hover:bg-slate-800 border border-slate-700 py-1.5 rounded-lg font-bold">+5 Mins</button>
              <button id="spawn-minotaur-btn" class="bg-amber-950 hover:bg-amber-900 border border-amber-600/60 py-1.5 rounded-lg font-bold text-amber-200">Minotaur</button>
              <button id="spawn-gorgon-btn" class="bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 py-1.5 rounded-lg font-bold text-emerald-200">Medusa</button>
              <button id="spawn-boss-btn" class="bg-red-950 hover:bg-red-900 border border-red-600/60 py-1.5 rounded-lg font-bold text-red-200">Vampire</button>
              <button id="spawn-necromancer-btn" class="bg-violet-950 hover:bg-violet-900 border border-violet-600/60 py-1.5 rounded-lg font-bold text-violet-200">Necromancer</button>
              <button id="spawn-reaper-btn" class="col-span-2 bg-purple-950 hover:bg-purple-900 border border-purple-600/60 py-1.5 rounded-lg font-bold text-purple-200">Grim Reaper</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    if (!this.em || !this.em.player) return;
    const p = this.em.player;
    const em = this.em;

    // Close
    this.container.querySelector('#admin-close-btn')?.addEventListener('click', () => this.hide());

    // God Mode Toggle
    this.container.querySelector('#cheat-godmode-btn')?.addEventListener('click', () => {
      em.godMode = !em.godMode;
      sound.play('magic_bolt');
      this.render();
    });

    // Heal Full
    this.container.querySelector('#cheat-heal-btn')?.addEventListener('click', () => {
      p.currentHp = p.stats.maxHealth;
      sound.play('coin');
      this.render();
    });

    // Level +1 / +10
    this.container.querySelector('#cheat-level-1-btn')?.addEventListener('click', () => {
      p.level += 1;
      sound.play('level_up');
      this.render();
    });
    this.container.querySelector('#cheat-level-10-btn')?.addEventListener('click', () => {
      p.level += 10;
      sound.play('level_up');
      this.render();
    });

    // Gold +1k / +10k
    this.container.querySelector('#cheat-gold-1k-btn')?.addEventListener('click', () => {
      p.goldCollected += 1000;
      sound.play('coin');
      this.render();
    });
    this.container.querySelector('#cheat-gold-10k-btn')?.addEventListener('click', () => {
      p.goldCollected += 10000;
      sound.play('coin');
      this.render();
    });

    // Nuke all enemies
    this.container.querySelector('#cheat-nuke-btn')?.addEventListener('click', () => {
      sound.play('explosion');
      for (let i = em.enemies.length - 1; i >= 0; i--) {
        const e = em.enemies[i];
        p.kills++;
        em.spawnGem(e.x, e.y, e.xpValue);
        em.removeEnemy(e, i);
      }
      this.render();
    });

    // Speed buttons
    this.container.querySelectorAll('.speed-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const spd = Number((e.currentTarget as HTMLElement).dataset.speed);
        this.gameSpeed = spd || 1.0;
        this.render();
      });
    });

    // Evolve Ready Weapons
    this.container.querySelector('#cheat-evolve-ready-btn')?.addEventListener('click', () => {
      let evolvedAny = false;
      for (let i = 0; i < p.weapons.length; i++) {
        const eq = p.weapons[i];
        const baseConfig = WEAPONS[eq.id];
        if (baseConfig && !baseConfig.isEvolution && eq.level >= baseConfig.maxLevel && baseConfig.evolutionWeaponId) {
          const partnerId = baseConfig.evolutionPartnerPassive;
          const hasPartner = partnerId && p.passives.some((pass) => pass.id === partnerId);
          if (hasPartner) {
            const evolvedConfig = WEAPONS[baseConfig.evolutionWeaponId];
            if (evolvedConfig) {
              p.weapons[i] = { id: evolvedConfig.id, level: 1, timer: 0, lastAngle: 0 };
              evolvedAny = true;
            }
          }
        }
      }
      if (evolvedAny) {
        sound.play('chest_open');
      }
      this.render();
    });

    // Equip Super Weapon Evolution Directly
    this.container.querySelectorAll('[data-equip-weapon]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const weaponId = (e.currentTarget as HTMLElement).dataset.equipWeapon;
        if (!weaponId) return;

        const config = WEAPONS[weaponId];
        // If this is an evolution, check if player has its base weapon and replace it directly!
        if (config?.isEvolution && config.evolvedFromWeaponId) {
          const baseIdx = p.weapons.findIndex((w) => w.id === config.evolvedFromWeaponId);
          if (baseIdx !== -1) {
            p.weapons[baseIdx] = { id: weaponId, level: 1, timer: 0, lastAngle: 0 };
            sound.play('chest_open');
            this.render();
            return;
          }
        }

        const existingIdx = p.weapons.findIndex((w) => w.id === weaponId);
        if (existingIdx !== -1) {
          p.weapons[existingIdx].level = 1;
        } else {
          // If weapon slots full, replace first or append
          if (p.weapons.length >= 6) {
            p.weapons[0] = { id: weaponId, level: 1, timer: 0, lastAngle: 0 };
          } else {
            p.weapons.push({ id: weaponId, level: 1, timer: 0, lastAngle: 0 });
          }
        }
        sound.play('chest_open');
        this.render();
      });
    });

    // Upgrade Base Weapon +1
    this.container.querySelectorAll('[data-upgrade-weapon]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const weaponId = (e.currentTarget as HTMLElement).dataset.upgradeWeapon;
        if (!weaponId) return;
        const config = WEAPONS[weaponId];
        if (!config) return;

        const existing = p.weapons.find((w) => w.id === weaponId);
        if (existing) {
          existing.level = Math.min(config.maxLevel, existing.level + 1);
        } else if (p.weapons.length < 6) {
          p.weapons.push({ id: weaponId, level: 1, timer: 0, lastAngle: 0 });
        }
        sound.play('magic_bolt');
        this.render();
      });
    });

    // Max Level Base Weapon (8)
    this.container.querySelectorAll('[data-max-weapon]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const weaponId = (e.currentTarget as HTMLElement).dataset.maxWeapon;
        if (!weaponId) return;
        const config = WEAPONS[weaponId];
        if (!config) return;

        const existing = p.weapons.find((w) => w.id === weaponId);
        if (existing) {
          existing.level = config.maxLevel;
        } else if (p.weapons.length < 6) {
          p.weapons.push({ id: weaponId, level: config.maxLevel, timer: 0, lastAngle: 0 });
        }
        sound.play('chest_open');
        this.render();
      });
    });

    // Upgrade Passive +1
    this.container.querySelectorAll('[data-upgrade-passive]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const passId = (e.currentTarget as HTMLElement).dataset.upgradePassive;
        if (!passId) return;
        const config = PASSIVES[passId];
        if (!config) return;

        const existing = p.passives.find((pass) => pass.id === passId);
        if (existing) {
          existing.level = Math.min(config.maxLevel, existing.level + 1);
          this.applyPassiveEffect(p, config.levels[existing.level - 1]);
        } else if (p.passives.length < 6) {
          p.passives.push({ id: passId, level: 1 });
          this.applyPassiveEffect(p, config.levels[0]);
        }
        sound.play('coin');
        this.render();
      });
    });

    // Max Passive (5)
    this.container.querySelectorAll('[data-max-passive]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const passId = (e.currentTarget as HTMLElement).dataset.maxPassive;
        if (!passId) return;
        const config = PASSIVES[passId];
        if (!config) return;

        const existing = p.passives.find((pass) => pass.id === passId);
        if (existing) {
          existing.level = config.maxLevel;
        } else if (p.passives.length < 6) {
          p.passives.push({ id: passId, level: config.maxLevel });
        }
        // Apply all ranks
        config.levels.forEach((lvl) => this.applyPassiveEffect(p, lvl));
        sound.play('chest_open');
        this.render();
      });
    });

    // Spawn Pickups
    this.container.querySelector('#spawn-chest-btn')?.addEventListener('click', () => {
      em.spawnPickup(em.playerX + 40, em.playerY, 'chest');
      sound.play('coin');
      this.hide();
    });
    this.container.querySelector('#spawn-magnet-btn')?.addEventListener('click', () => {
      em.spawnPickup(em.playerX + 40, em.playerY, 'magnet');
      sound.play('coin');
      this.hide();
    });
    this.container.querySelector('#spawn-rosary-btn')?.addEventListener('click', () => {
      em.spawnPickup(em.playerX + 40, em.playerY, 'rosary');
      sound.play('coin');
      this.hide();
    });
    this.container.querySelector('#spawn-meat-btn')?.addEventListener('click', () => {
      em.spawnPickup(em.playerX + 40, em.playerY, 'meat');
      sound.play('coin');
      this.hide();
    });
    this.container.querySelector('#spawn-gold-gem-btn')?.addEventListener('click', () => {
      em.spawnGem(em.playerX + 40, em.playerY, 500);
      sound.play('coin');
      this.hide();
    });
    this.container.querySelector('#spawn-coin-btn')?.addEventListener('click', () => {
      em.spawnPickup(em.playerX + 40, em.playerY, 'coin');
      sound.play('coin');
      this.hide();
    });

    // Special Wave Attacks
    this.container.querySelector('#attack-ring-btn')?.addEventListener('click', () => {
      const g = (window as unknown as { game?: { spawnDirector?: { spawnCircleRing: (em: EntityManager) => void } } }).game;
      if (g?.spawnDirector) {
        g.spawnDirector.spawnCircleRing(em);
      }
      this.hide();
    });

    this.container.querySelector('#attack-swarm-btn')?.addEventListener('click', () => {
      const g = (window as unknown as { game?: { spawnDirector?: { spawnSwarmRush: (em: EntityManager) => void } } }).game;
      if (g?.spawnDirector) {
        g.spawnDirector.spawnSwarmRush(em);
      }
      this.hide();
    });

    this.container.querySelector('#attack-wall-btn')?.addEventListener('click', () => {
      const g = (window as unknown as { game?: { spawnDirector?: { spawnPincerWall: (em: EntityManager) => void } } }).game;
      if (g?.spawnDirector) {
        g.spawnDirector.spawnPincerWall(em);
      }
      this.hide();
    });

    // Time Warp
    this.container.querySelector('#time-add-1m-btn')?.addEventListener('click', () => {
      p.survivalTime += 60;
      this.render();
    });
    this.container.querySelector('#time-add-5m-btn')?.addEventListener('click', () => {
      p.survivalTime += 300;
      this.render();
    });

    // Spawn Bosses
    this.container.querySelector('#spawn-minotaur-btn')?.addEventListener('click', () => {
      em.spawnEnemy(
        ENEMIES.minotaur_boss.id,
        em.playerX + 220,
        em.playerY,
        ENEMIES.minotaur_boss.baseHp,
        ENEMIES.minotaur_boss.baseSpeed,
        ENEMIES.minotaur_boss.baseDamage,
        ENEMIES.minotaur_boss.xpValue,
        ENEMIES.minotaur_boss.radius,
        ENEMIES.minotaur_boss.behavior,
        ENEMIES.minotaur_boss.knockbackResistance,
        true
      );
      sound.play('explosion');
      this.hide();
    });

    this.container.querySelector('#spawn-gorgon-btn')?.addEventListener('click', () => {
      em.spawnEnemy(
        ENEMIES.gorgon_boss.id,
        em.playerX + 220,
        em.playerY,
        ENEMIES.gorgon_boss.baseHp,
        ENEMIES.gorgon_boss.baseSpeed,
        ENEMIES.gorgon_boss.baseDamage,
        ENEMIES.gorgon_boss.xpValue,
        ENEMIES.gorgon_boss.radius,
        ENEMIES.gorgon_boss.behavior,
        ENEMIES.gorgon_boss.knockbackResistance,
        true
      );
      sound.play('explosion');
      this.hide();
    });

    this.container.querySelector('#spawn-boss-btn')?.addEventListener('click', () => {
      em.spawnEnemy(
        ENEMIES.vampire_boss.id,
        em.playerX + 220,
        em.playerY,
        ENEMIES.vampire_boss.baseHp,
        ENEMIES.vampire_boss.baseSpeed,
        ENEMIES.vampire_boss.baseDamage,
        ENEMIES.vampire_boss.xpValue,
        ENEMIES.vampire_boss.radius,
        ENEMIES.vampire_boss.behavior,
        ENEMIES.vampire_boss.knockbackResistance,
        true
      );
      sound.play('explosion');
      this.hide();
    });

    this.container.querySelector('#spawn-necromancer-btn')?.addEventListener('click', () => {
      em.spawnEnemy(
        ENEMIES.necromancer_boss.id,
        em.playerX + 220,
        em.playerY,
        ENEMIES.necromancer_boss.baseHp,
        ENEMIES.necromancer_boss.baseSpeed,
        ENEMIES.necromancer_boss.baseDamage,
        ENEMIES.necromancer_boss.xpValue,
        ENEMIES.necromancer_boss.radius,
        ENEMIES.necromancer_boss.behavior,
        ENEMIES.necromancer_boss.knockbackResistance,
        true
      );
      sound.play('explosion');
      this.hide();
    });

    this.container.querySelector('#spawn-reaper-btn')?.addEventListener('click', () => {
      em.spawnEnemy(
        ENEMIES.reaper.id,
        em.playerX + 250,
        em.playerY,
        ENEMIES.reaper.baseHp,
        ENEMIES.reaper.baseSpeed,
        ENEMIES.reaper.baseDamage,
        ENEMIES.reaper.xpValue,
        ENEMIES.reaper.radius,
        ENEMIES.reaper.behavior,
        ENEMIES.reaper.knockbackResistance,
        false
      );
      sound.play('explosion');
      this.hide();
    });
  }

  private applyPassiveEffect(
    player: NonNullable<EntityManager['player']>,
    levelEffect: PassiveConfig['levels'][0]
  ): void {
    const changes = levelEffect.statChanges;
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
