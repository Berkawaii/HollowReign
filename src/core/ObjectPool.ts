/**
 * High-performance generic object pool to completely eliminate runtime garbage collection stutter.
 */
export class ObjectPool<T> {
  private factory: () => T;
  private resetFn?: (item: T) => void;
  private pool: T[] = [];
  private activeCount: number = 0;

  constructor(factory: () => T, initialSize: number = 100, resetFn?: (item: T) => void) {
    this.factory = factory;
    this.resetFn = resetFn;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }

  public acquire(): T {
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      item = this.factory();
    }
    this.activeCount++;
    if (this.resetFn) {
      this.resetFn(item);
    }
    return item;
  }

  public release(item: T): void {
    if (this.resetFn) {
      this.resetFn(item);
    }
    this.pool.push(item);
    this.activeCount = Math.max(0, this.activeCount - 1);
  }

  public clear(): void {
    this.pool.length = 0;
    this.activeCount = 0;
  }

  public getActiveCount(): number {
    return this.activeCount;
  }
}
