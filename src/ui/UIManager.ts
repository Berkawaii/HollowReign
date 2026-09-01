import { HUD } from './HUD';
import { LevelUpModal } from './LevelUpModal';
import { ChestModal } from './ChestModal';
import { GameOverModal } from './GameOverModal';
import { ShopModal } from './ShopModal';
import { LeaderboardModal } from './LeaderboardModal';
import { HeroSelectModal } from './HeroSelectModal';
import { InventoryModal } from './InventoryModal';
import { AdminPanel } from './AdminPanel';
import { AchievementsModal } from './AchievementsModal';
import { ToastNotification } from './ToastNotification';
import { EntityManager } from '../ecs/EntityManager';
import { HeroConfig } from '../config/heroes';
import { WorldMap } from '../core/WorldMap';

export class UIManager {
  public hud: HUD;
  public levelUpModal: LevelUpModal;
  public chestModal: ChestModal;
  public gameOverModal: GameOverModal;
  public shopModal: ShopModal;
  public leaderboardModal: LeaderboardModal;
  public heroSelectModal: HeroSelectModal;
  public inventoryModal: InventoryModal;
  public adminPanel: AdminPanel;
  public achievementsModal: AchievementsModal;
  public toast: ToastNotification;

  constructor() {
    this.hud = new HUD();
    this.levelUpModal = new LevelUpModal();
    this.chestModal = new ChestModal();
    this.gameOverModal = new GameOverModal();
    this.shopModal = new ShopModal();
    this.leaderboardModal = new LeaderboardModal();
    this.heroSelectModal = new HeroSelectModal();
    this.inventoryModal = new InventoryModal();
    this.adminPanel = new AdminPanel();
    this.achievementsModal = new AchievementsModal();
    this.toast = new ToastNotification();
  }

  public showHeroSelect(
    onStartGame: (hero: HeroConfig, stage: import('../config/stages').StageConfig) => void,
    onOpenShop: () => void,
    onOpenLeaderboard: () => void,
    onOpenAchievements: () => void
  ): void {
    this.hud.hide();
    this.levelUpModal.hide();
    this.chestModal.hide();
    this.gameOverModal.hide();
    this.heroSelectModal.show(
      onStartGame,
      onOpenShop,
      onOpenLeaderboard,
      onOpenAchievements
    );
  }

  public startRunUI(): void {
    this.heroSelectModal.hide();
    this.shopModal.hide();
    this.leaderboardModal.hide();
    this.achievementsModal.hide();
    this.gameOverModal.hide();
    this.hud.show();
  }

  public updateHUD(
    em: EntityManager,
    onPauseToggle: () => void,
    worldMap?: WorldMap,
    onOpenInventory?: () => void,
    onTriggerAbility?: () => void
  ): void {
    this.hud.update(em, onPauseToggle, worldMap, onOpenInventory, onTriggerAbility);
  }
}
