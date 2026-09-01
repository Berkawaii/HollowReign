import { EntityManager } from '../ecs/EntityManager';
import { Camera } from './Camera';
import { InputManager } from './InputManager';
import { MovementSystem } from '../ecs/Systems/MovementSystem';
import { SpawnDirector } from '../ecs/Systems/SpawnDirector';
import { CombatSystem } from '../ecs/Systems/CombatSystem';
import { CollisionSystem } from '../ecs/Systems/CollisionSystem';
import { PickupSystem } from '../ecs/Systems/PickupSystem';
import { RenderSystem } from '../ecs/Systems/RenderSystem';
import { AbilitySystem } from '../ecs/Systems/AbilitySystem';
import { ParticleSystem } from '../ecs/Systems/ParticleSystem';
import { UIManager } from '../ui/UIManager';
import { ProceduralAssets } from '../utils/ProceduralAssets';
import { StorageService } from '../services/StorageService';
import { FirebaseService } from '../services/FirebaseService';
import { AchievementManager } from './AchievementManager';
import { sound } from './AudioEngine';
import { HeroConfig } from '../config/heroes';
import { STAGES, StageConfig } from '../config/stages';
import { WorldMap } from './WorldMap';

export type GameState =
  | 'HERO_SELECT'
  | 'PLAYING'
  | 'PAUSED_LEVEL_UP'
  | 'PAUSED_CHEST'
  | 'PAUSED_MANUAL'
  | 'GAME_OVER';

export class Game {
  public state: GameState = 'HERO_SELECT';

  public canvas: HTMLCanvasElement;
  public camera: Camera;
  public input: InputManager;
  public em: EntityManager;
  public ui: UIManager;
  public worldMap: WorldMap;
  public achievementManager: AchievementManager;
  public currentStage: StageConfig = STAGES[0];

  // ECS Systems
  public movementSystem: MovementSystem;
  public spawnDirector: SpawnDirector;
  public combatSystem: CombatSystem;
  public collisionSystem: CollisionSystem;
  public pickupSystem: PickupSystem;
  public abilitySystem: AbilitySystem;
  public particleSystem: ParticleSystem;
  public renderSystem: RenderSystem;

  // Game Loop Timers
  private lastTime: number = 0;
  private hudUpdateTimer: number = 0;
  private achievementCheckTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.camera = new Camera(window.innerWidth, window.innerHeight);
    this.input = new InputManager();
    this.em = new EntityManager();
    this.ui = new UIManager();
    this.worldMap = new WorldMap();
    this.achievementManager = new AchievementManager(this.ui.toast);

    this.movementSystem = new MovementSystem();
    this.spawnDirector = new SpawnDirector();
    this.combatSystem = new CombatSystem();
    this.collisionSystem = new CollisionSystem();
    this.pickupSystem = new PickupSystem();
    this.abilitySystem = new AbilitySystem();
    this.particleSystem = new ParticleSystem();
    this.renderSystem = new RenderSystem(this.canvas);

    (window as unknown as { game: Game }).game = this;

    this.setupWindowResize();
    this.setupKeyboardPause();
  }

  public init(): void {
    // 1. Initialize Asset & Service Singletons
    ProceduralAssets.init();
    FirebaseService.init();
    this.ui.adminPanel.bindEntityManager(this.em);
    this.achievementManager.checkLifetimeMilestones();

    // 2. Start at Hero Select Screen
    this.openHeroSelect();

    // 3. Start Animation Loop
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private setupWindowResize(): void {
    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.resize(width, height);
      this.renderSystem.resize(width, height);
    };
    window.addEventListener('resize', resize);
    resize();
  }

  private setupKeyboardPause(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        if (this.state === 'PLAYING') {
          this.openInventory();
        } else if (this.state === 'PAUSED_MANUAL' && this.ui.inventoryModal.isOpen()) {
          this.ui.inventoryModal.hide();
          this.resume();
        }
      } else if (e.code === 'Escape') {
        if (this.ui.inventoryModal.isOpen()) {
          this.ui.inventoryModal.hide();
          this.resume();
        } else if (this.state === 'PLAYING') {
          this.openInventory();
        } else if (this.state === 'PAUSED_MANUAL') {
          this.resume();
        }
      }
    });
  }

  public openInventory(): void {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED_MANUAL';
    this.ui.inventoryModal.show(this.em, () => {
      this.resume();
    });
  }

  public openHeroSelect(): void {
    this.state = 'HERO_SELECT';
    sound.stopBgm();

    this.ui.showHeroSelect(
      (hero, stage) => this.startRun(hero, stage),
      () => this.ui.shopModal.show(() => this.openHeroSelect()),
      () => this.ui.leaderboardModal.show(() => this.openHeroSelect()),
      () => this.ui.achievementsModal.show(() => this.openHeroSelect())
    );
  }

  public startRun(hero: HeroConfig, stage: StageConfig = STAGES[0]): void {
    this.currentStage = stage;
    // Apply permanent meta-progression stat bonuses
    const metaBonuses = StorageService.getActiveMetaStatBonuses();
    this.em.initPlayer(hero, metaBonuses);
    this.spawnDirector.reset(stage);
    this.worldMap.reset(stage);
    this.particleSystem.reset();
    this.ui.adminPanel.bindEntityManager(this.em);

    this.state = 'PLAYING';
    this.ui.startRunUI();
    sound.startBgm();
  }

  private loop(currentTime: number): void {
    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    // Clamp dt to avoid huge time jumps when tab is in background, scaled by gameSpeed
    const dt = Math.min(0.08, rawDt) * this.ui.adminPanel.gameSpeed;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    // Always render game canvas with world obstacles, shrines, and particle effects
    this.renderSystem.render(this.em, this.camera, this.input, this.worldMap, this.particleSystem);

    requestAnimationFrame(this.loop.bind(this));
  }

  private update(dt: number): void {
    if (!this.em.player) return;

    // 0. Particles Simulation
    this.particleSystem.update(dt);

    // 1. Ability System & Dash Activation
    this.abilitySystem.update(this.em, this.input, this.camera, this.worldMap, dt);

    // 2. Movement & Physics with Obstacle Collisions
    this.movementSystem.update(this.em, this.input, this.camera, this.worldMap, dt);

    // 2. Camera Tracking
    this.camera.update(this.em.playerX, this.em.playerY, dt);

    // 3. Timed Wave Spawning
    this.spawnDirector.update(this.em, dt);

    // 4. Weapon Combat & Attack Projectiles
    this.combatSystem.update(this.em, dt);

    // 5. Collisions & Damage
    this.collisionSystem.update(
      this.em,
      this.camera,
      () => this.onPlayerDeath(),
      (bossKey) => this.achievementManager.onBossKill(bossKey),
      dt
    );

    // 6. Gem & Item Pickups
    this.pickupSystem.update(
      this.em,
      this.camera,
      () => this.onLevelUp(),
      () => this.onChestOpen(),
      dt
    );

    // 7. Periodic Achievement Progress Check (every 1s)
    this.achievementCheckTimer += dt;
    if (this.achievementCheckTimer >= 1.0) {
      this.achievementCheckTimer = 0;
      this.achievementManager.checkInRunProgress(this.em.player);
    }

    // 8. HUD Update (throttled to 10 FPS for DOM efficiency)
    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer >= 0.1) {
      this.hudUpdateTimer = 0;
      this.ui.updateHUD(
        this.em,
        () => this.toggleManualPause(),
        this.worldMap,
        () => this.openInventory(),
        () => this.input.triggerSpaceManual()
      );
    }
  }

  private onLevelUp(): void {
    this.state = 'PAUSED_LEVEL_UP';
    this.ui.levelUpModal.show(this.em, () => {
      if (this.em.player) {
        this.achievementManager.checkInRunProgress(this.em.player);
      }
      this.resume();
    });
  }

  private onChestOpen(): void {
    this.state = 'PAUSED_CHEST';
    this.ui.chestModal.show(
      this.em,
      () => {
        this.resume();
      },
      () => {
        this.achievementManager.onEvolution();
      }
    );
  }

  private onPlayerDeath(): void {
    this.state = 'GAME_OVER';
    sound.stopBgm();

    if (this.em.player) {
      this.achievementManager.checkInRunProgress(this.em.player);
      StorageService.saveRunScore({
        heroId: this.em.player.hero.id,
        heroName: this.em.player.hero.name,
        survivalTime: this.em.player.survivalTime,
        level: this.em.player.level,
        kills: this.em.player.kills,
        gold: this.em.player.goldCollected,
        date: new Date().toLocaleDateString('en-US'),
      });
      this.achievementManager.checkLifetimeMilestones();
    }

    this.ui.gameOverModal.show(
      this.em,
      () => {
        if (this.em.player) {
          this.startRun(this.em.player.hero, this.currentStage);
        } else {
          this.openHeroSelect();
        }
      },
      () => {
        this.ui.shopModal.show(() => this.openHeroSelect());
      },
      () => {
        this.ui.leaderboardModal.show(() => this.openHeroSelect());
      }
    );
  }

  private pauseManual(): void {
    this.state = 'PAUSED_MANUAL';
  }

  private resume(): void {
    this.state = 'PLAYING';
    this.lastTime = performance.now();
  }

  private toggleManualPause(): void {
    if (this.state === 'PLAYING') {
      this.pauseManual();
    } else if (this.state === 'PAUSED_MANUAL') {
      this.resume();
    }
  }
}
