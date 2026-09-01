import { ObjectPool } from '../../core/ObjectPool';
import { Camera } from '../../core/Camera';

export type ParticleType =
  | 'spark'
  | 'ember'
  | 'dust'
  | 'magic_star'
  | 'blood'
  | 'bone'
  | 'soul'
  | 'shockwave';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  maxLife: number;
  life: number;
  type: ParticleType;
  alpha: number;
  scale: number;
  decay: number;
  gravity?: number;
  rotation?: number;
  rotSpeed?: number;
  active: boolean;
}

export interface GhostTrail {
  x: number;
  y: number;
  spriteId: string;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
  facingX: number;
  active: boolean;
}

export class ParticleSystem {
  private particlePool: ObjectPool<Particle>;
  public particles: Particle[] = [];
  public ghostTrails: GhostTrail[] = [];
  private static instance: ParticleSystem;

  constructor(maxParticles: number = 500) {
    ParticleSystem.instance = this;
    this.particlePool = new ObjectPool<Particle>(
      () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: '#ffffff',
        size: 3,
        maxLife: 0.5,
        life: 0.5,
        type: 'spark',
        alpha: 1,
        scale: 1,
        decay: 2.0,
        gravity: 0,
        rotation: 0,
        rotSpeed: 0,
        active: false,
      }),
      maxParticles,
      (p) => {
        p.active = false;
        p.gravity = 0;
        p.rotation = 0;
        p.rotSpeed = 0;
      }
    );
  }

  public static get(): ParticleSystem {
    return ParticleSystem.instance;
  }

  public reset(): void {
    for (const p of this.particles) {
      this.particlePool.release(p);
    }
    this.particles.length = 0;
    this.ghostTrails.length = 0;
  }

  public spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number = 3,
    life: number = 0.5,
    type: ParticleType = 'spark',
    extra: Partial<Particle> = {}
  ): Particle {
    const p = this.particlePool.acquire();
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.color = color;
    p.size = size;
    p.maxLife = life;
    p.life = life;
    p.type = type;
    p.alpha = 1.0;
    p.scale = 1.0;
    p.decay = 1.0 / life;
    p.gravity = extra.gravity || 0;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 8;
    p.active = true;

    Object.assign(p, extra);
    this.particles.push(p);
    return p;
  }

  public spawnBurst(
    x: number,
    y: number,
    color: string,
    count: number = 10,
    speed: number = 120,
    size: number = 3,
    type: ParticleType = 'spark'
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const life = 0.25 + Math.random() * 0.35;
      const gravity = type === 'blood' || type === 'bone' ? 180 : 0;
      this.spawn(x, y, vx, vy, color, size, life, type, { gravity });
    }
  }

  public spawnShockwave(
    x: number,
    y: number,
    color: string = '#fde047',
    maxRadius: number = 45,
    life: number = 0.35
  ): void {
    this.spawn(x, y, 0, 0, color, maxRadius, life, 'shockwave');
  }

  public spawnGhostTrail(
    x: number,
    y: number,
    spriteId: string,
    color: string = '#60a5fa',
    facingX: number = 1
  ): void {
    this.ghostTrails.push({
      x,
      y,
      spriteId,
      color,
      alpha: 0.65,
      maxLife: 0.3,
      life: 0.3,
      facingX,
      active: true,
    });
  }

  public update(dt: number): void {
    // 1. UPDATE PARTICLES
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        p.active = false;
        this.particlePool.release(p);
        this.particles.splice(i, 1);
        continue;
      }

      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'shockwave') {
        const progress = 1 - p.life / p.maxLife;
        p.scale = progress;
      } else {
        if (p.gravity) {
          p.vy += p.gravity * dt;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Friction / Drag
        p.vx *= Math.max(0, 1 - 4 * dt);
        p.vy *= Math.max(0, 1 - 4 * dt);

        if (p.rotSpeed) {
          p.rotation = (p.rotation || 0) + p.rotSpeed * dt;
        }
      }
    }

    // 2. UPDATE GHOST TRAILS
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const g = this.ghostTrails[i];
      g.life -= dt;
      g.alpha = Math.max(0, (g.life / g.maxLife) * 0.65);

      if (g.life <= 0) {
        g.active = false;
        this.ghostTrails.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // 1. RENDER GHOST TRAILS (Behind player)
    for (let i = 0; i < this.ghostTrails.length; i++) {
      const g = this.ghostTrails[i];
      if (!camera.isVisible(g.x, g.y, 40)) continue;

      const screenPos = camera.worldToScreen(g.x, g.y);
      ctx.save();
      ctx.globalAlpha = g.alpha;
      ctx.translate(screenPos.x, screenPos.y);
      if (g.facingX < 0) {
        ctx.scale(-1, 1);
      }
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = g.color;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. RENDER PARTICLES
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!camera.isVisible(p.x, p.y, p.size * 2 + 10)) continue;

      const screenPos = camera.worldToScreen(p.x, p.y);

      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'shockwave') {
        const currentRadius = p.size * p.scale;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1, 3 * (1 - p.scale));
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'magic_star') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        const s = p.size * p.alpha;
        ctx.fillRect(screenPos.x - s / 2, screenPos.y - s / 2, s, s);
        ctx.fillRect(screenPos.x - s, screenPos.y - 0.5, s * 2, 1);
        ctx.fillRect(screenPos.x - 0.5, screenPos.y - s, 1, s * 2);
      } else if (p.type === 'ember') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 4;
        const s = Math.max(1.5, p.size * p.alpha);
        ctx.fillRect(screenPos.x - s / 2, screenPos.y - s / 2, s, s);
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        const s = p.size * (1 + (1 - p.alpha) * 0.8);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, s, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'bone') {
        ctx.fillStyle = p.color;
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillRect(-p.size / 2, -1, p.size, 2);
      } else {
        // spark, blood, soul
        ctx.fillStyle = p.color;
        const s = Math.max(1, p.size * p.alpha);
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, s, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
