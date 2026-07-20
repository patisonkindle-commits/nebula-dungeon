// Pathfinding — simple BFS on grid

export class Pathfinder {
  constructor(grid) {
    this.grid = grid;
    this.width = grid[0].length;
    this.height = grid.length;
  }
  
  isWalkable(gx, gy) {
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return false;
    const cell = this.grid[gy][gx];
    return cell !== 1; // not wall
  }
  
  findPath(fromX, fromY, toX, toY) {
    if (!this.isWalkable(toX, toY)) return [];
    if (fromX === toX && fromY === toY) return [{ x: toX, y: toY }];
    
    const start = { x: fromX, y: fromY };
    const end = { x: toX, y: toY };
    
    const visited = new Set();
    const queue = [{ ...start, path: [] }];
    visited.add(`${start.x},${start.y}`);
    
    const dirs = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    
    while (queue.length > 0) {
      const curr = queue.shift();
      
      for (const d of dirs) {
        const nx = curr.x + d.x;
        const ny = curr.y + d.y;
        const key = `${nx},${ny}`;
        
        if (!this.isWalkable(nx, ny)) continue;
        if (visited.has(key)) continue;
        
        const newPath = [...curr.path, { x: nx, y: ny }];
        
        if (nx === end.x && ny === end.y) {
          return newPath;
        }
        
        visited.add(key);
        queue.push({ x: nx, y: ny, path: newPath });
      }
    }
    
    return []; // No path found
  }
}
