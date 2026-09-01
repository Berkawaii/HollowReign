/**
 * 2D Spatial Hash Grid for O(1) amortized neighborhood lookups and collision detection.
 */
export class SpatialHashGrid<T extends { id: number; x: number; y: number; radius: number }> {
  private cellSize: number;
  private grid: Map<string, T[]> = new Map();

  constructor(cellSize: number = 64) {
    this.cellSize = cellSize;
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX}:${cellY}`;
  }

  public clear(): void {
    this.grid.clear();
  }

  public insert(entity: T): void {
    const key = this.getKey(entity.x, entity.y);
    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    cell.push(entity);
  }

  /**
   * Queries all entities within a given circular radius of (x, y).
   */
  public queryRadius(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellY = Math.floor((y - radius) / this.cellSize);
    const maxCellY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx}:${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (let i = 0; i < cell.length; i++) {
            const entity = cell[i];
            const dx = entity.x - x;
            const dy = entity.y - y;
            const combinedRadius = radius + entity.radius;
            if (dx * dx + dy * dy <= combinedRadius * combinedRadius) {
              results.push(entity);
            }
          }
        }
      }
    }

    return results;
  }
}
