/**
 * Universal Input Manager supporting Keyboard (WASD / Arrows / Space) and Virtual Touch Joystick.
 */
export class InputManager {
  private keys: Set<string> = new Set();
  public moveVector: { x: number; y: number } = { x: 0, y: 0 };
  public lastFacingX: number = 1; // 1 = right, -1 = left
  public lastFacingY: number = 0;
  public facingAngle: number = 0; // angle in radians

  // Mouse & Screen Pointer Coordinates
  public mouseX: number = window.innerWidth / 2;
  public mouseY: number = window.innerHeight / 2;

  // Space Trigger Flag
  private spaceTriggered: boolean = false;

  // Virtual Joystick State
  private touchOrigin: { x: number; y: number } | null = null;
  private touchCurrent: { x: number; y: number } | null = null;
  private isTouchActive: boolean = false;
  private joystickRadius: number = 60;

  constructor() {
    this.setupKeyboardListeners();
    this.setupTouchAndMouseListeners();
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.keys.add(e.key.toLowerCase());
      if (e.code === 'Space') {
        this.spaceTriggered = true;
      }
      this.updateMovement();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.keys.delete(e.key.toLowerCase());
      this.updateMovement();
    });
  }

  private setupTouchAndMouseListeners(): void {
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    window.addEventListener('pointerdown', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      // Don't intercept UI clicks
      if ((e.target as HTMLElement).closest('.ui-interactive')) return;
      this.isTouchActive = true;
      this.touchOrigin = { x: e.clientX, y: e.clientY };
      this.touchCurrent = { x: e.clientX, y: e.clientY };
      this.updateMovement();
    });

    window.addEventListener('pointermove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      if (!this.isTouchActive || !this.touchOrigin) return;
      this.touchCurrent = { x: e.clientX, y: e.clientY };
      this.updateMovement();
    });

    const endTouch = () => {
      this.isTouchActive = false;
      this.touchOrigin = null;
      this.touchCurrent = null;
      this.updateMovement();
    };

    window.addEventListener('pointerup', endTouch);
    window.addEventListener('pointercancel', endTouch);
  }

  public consumeSpaceTrigger(): boolean {
    if (this.spaceTriggered) {
      this.spaceTriggered = false;
      return true;
    }
    return false;
  }

  public triggerSpaceManual(): void {
    this.spaceTriggered = true;
  }

  private updateMovement(): void {
    let x = 0;
    let y = 0;

    // 1. Keyboard Inputs
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.keys.has('w')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.keys.has('s')) y += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.keys.has('a')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.keys.has('d')) x += 1;

    // 2. Touch / Pointer Joystick Inputs
    if (this.isTouchActive && this.touchOrigin && this.touchCurrent) {
      const touchDx = this.touchCurrent.x - this.touchOrigin.x;
      const touchDy = this.touchCurrent.y - this.touchOrigin.y;
      const dist = Math.hypot(touchDx, touchDy);

      if (dist > 5) {
        const factor = Math.min(1.0, dist / this.joystickRadius);
        x = (touchDx / dist) * factor;
        y = (touchDy / dist) * factor;
      }
    }

    // Normalize diagonal keyboard speed
    const len = Math.hypot(x, y);
    if (len > 1.0) {
      x /= len;
      y /= len;
    }

    this.moveVector.x = x;
    this.moveVector.y = y;

    if (len > 0.05) {
      this.facingAngle = Math.atan2(y, x);
      if (x > 0.05) this.lastFacingX = 1;
      else if (x < -0.05) this.lastFacingX = -1;
      if (Math.abs(y) > 0.05) this.lastFacingY = y > 0 ? 1 : -1;
    }
  }

  public getJoystickVisual(): { origin: { x: number; y: number }; current: { x: number; y: number } } | null {
    if (this.isTouchActive && this.touchOrigin && this.touchCurrent) {
      return { origin: this.touchOrigin, current: this.touchCurrent };
    }
    return null;
  }
}
