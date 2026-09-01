/**
 * 2D Game Camera with smooth tracking, screen boundaries, and trauma-based Screen Shake.
 */
export class Camera {
  public x: number = 0;
  public y: number = 0;
  public viewportWidth: number;
  public viewportHeight: number;

  // Screen shake variables
  private shakeTrauma: number = 0;
  private shakeOffset: { x: number; y: number } = { x: 0, y: 0 };

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  public resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public update(targetX: number, targetY: number, dt: number): void {
    // Smooth camera lerp tracking
    const lerpSpeed = 8.0;
    this.x += (targetX - this.x) * Math.min(1.0, lerpSpeed * dt);
    this.y += (targetY - this.y) * Math.min(1.0, lerpSpeed * dt);

    // Decay trauma over time
    if (this.shakeTrauma > 0) {
      this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.5);
      const shakeAmount = this.shakeTrauma * this.shakeTrauma; // non-linear quadratic shake
      const maxAngle = 18; // max pixel offset
      this.shakeOffset.x = (Math.random() * 2 - 1) * maxAngle * shakeAmount;
      this.shakeOffset.y = (Math.random() * 2 - 1) * maxAngle * shakeAmount;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
    }
  }

  /**
   * Adds trauma (0.0 to 1.0) to induce screen shake.
   */
  public addShake(trauma: number): void {
    this.shakeTrauma = Math.min(1.0, this.shakeTrauma + trauma);
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX - this.x + this.viewportWidth / 2 + this.shakeOffset.x,
      y: worldY - this.y + this.viewportHeight / 2 + this.shakeOffset.y,
    };
  }

  public isVisible(worldX: number, worldY: number, radius: number = 32): boolean {
    const minX = this.x - this.viewportWidth / 2 - radius;
    const maxX = this.x + this.viewportWidth / 2 + radius;
    const minY = this.y - this.viewportHeight / 2 - radius;
    const maxY = this.y + this.viewportHeight / 2 + radius;
    return worldX >= minX && worldX <= maxX && worldY >= minY && worldY <= maxY;
  }
}
