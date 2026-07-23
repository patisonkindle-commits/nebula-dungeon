// Procedural dungeon generator
// Generates rooms + corridors layout, returns 2D grid

export class DungeonGenerator {
  constructor(cols = 5, rows = 4) {
    this.roomsX = cols;
    this.roomsY = rows;
  }

  // Generate a floor: returns { grid, rooms, entrance, exit }
  generate(seed = Date.now()) {
    let _seed = seed;
    const rng = () => {
      _seed = (_seed * 16807 + 0) % 2147483647;
      return _seed / 2147483647;
    };
    
    const RW = 7; // room interior width (tiles)
    const RH = 7; // room interior height
    const corridorLen = 2; // tiles between rooms
    
    // Total grid size
    const gridW = this.roomsX * (RW + corridorLen) + corridorLen;
    const gridH = this.roomsY * (RH + corridorLen) + corridorLen;
    
    // Initialize grid with walls
    const grid = [];
    for (let y = 0; y < gridH; y++) {
      grid[y] = [];
      for (let x = 0; x < gridW; x++) {
        grid[y][x] = 1; // wall
      }
    }
    
    const rooms = [];
    const connections = [];
    
    // Carve rooms
    for (let ry = 0; ry < this.roomsY; ry++) {
      for (let rx = 0; rx < this.roomsX; rx++) {
        const ox = corridorLen + rx * (RW + corridorLen);
        const oy = corridorLen + ry * (RH + corridorLen);
        const room = { x: ox, y: oy, w: RW, h: RH, rx, ry, isBoss: false, cleared: false, enemies: [] };
        rooms.push(room);
        
        // Carve floor tiles
        for (let y = oy; y < oy + RH; y++) {
          for (let x = ox; x < ox + RW; x++) {
            grid[y][x] = 0; // floor
          }
        }
      }
    }
    
    // Connect rooms with corridors (horizontal then vertical)
    for (let ry = 0; ry < this.roomsY; ry++) {
      for (let rx = 0; rx < this.roomsX; rx++) {
        const idx = ry * this.roomsX + rx;
        
        // Right neighbor
        if (rx < this.roomsX - 1) {
          const rightIdx = ry * this.roomsX + (rx + 1);
          connections.push([idx, rightIdx]);
        }
        
        // Bottom neighbor
        if (ry < this.roomsY - 1) {
          const botIdx = (ry + 1) * this.roomsX + rx;
          connections.push([idx, botIdx]);
        }
      }
    }
    
    // Carve corridors for each connection
    for (const [a, b] of connections) {
      const roomA = rooms[a];
      const roomB = rooms[b];
      
      const ax = roomA.x + Math.floor(RW / 2);
      const ay = roomA.y + Math.floor(RH / 2);
      const bx = roomB.x + Math.floor(RW / 2);
      const by = roomB.y + Math.floor(RH / 2);
      
      // H corridor, then V
      for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
        if (grid[ay][x] === 1) grid[ay][x] = 3; // corridor
      }
      for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
        if (grid[y][bx] === 1) grid[y][bx] = 3; // corridor
        // Also carve 1px below for wider corridors
        if (y + 1 < gridH && grid[y+1][bx] === 1) grid[y+1][bx] = 3;
      }
    }
    
    // Place doors at room edges where corridors connect
    for (const [a, b] of connections) {
      const ra = rooms[a];
      const rb = rooms[b];
      
      if (ra.ry === rb.ry) {
        // Horizontal connection — door at room edge
        const doorY = ra.y + Math.floor(RH / 2);
        const doorX = Math.max(ra.x + RW, rb.x);
        if (grid[doorY][doorX] === 1 || grid[doorY][doorX] === 3) {
          grid[doorY][doorX] = 2; // door
        }
      } else {
        // Vertical connection
        const doorX = ra.x + Math.floor(RW / 2);
        const doorY = Math.max(ra.y + RH, rb.y);
        if (grid[doorY][doorX] === 1 || grid[doorY][doorX] === 3) {
          grid[doorY][doorX] = 2; // door
        }
      }
    }
    
    // Set entrance = center of first room
    const entrance = {
      x: rooms[0].x + Math.floor(RW / 2),
      y: rooms[0].y + Math.floor(RH / 2),
      gridX: rooms[0].x + Math.floor(RW / 2),
      gridY: rooms[0].y + Math.floor(RH / 2),
    };
    
    // Boss = last room in snake (serpentine) traversal order
    const lastRow = this.roomsY - 1;
    const bossCol = lastRow % 2 === 0 ? (this.roomsX - 1) : 0;
    const bossIdx = lastRow * this.roomsX + bossCol;
    rooms[bossIdx].isBoss = true;
    
    // Exit in boss room
    const exit = {
      x: rooms[bossIdx].x + Math.floor(RW / 2),
      y: rooms[bossIdx].y + Math.floor(RH / 2),
      gridX: rooms[bossIdx].x + Math.floor(RW / 2),
      gridY: rooms[bossIdx].y + Math.floor(RH / 2),
    };
    
    // INJECT DECORATION PROPS
    // We will pick a few random "premium" props from the DebtsInTheDepthsAssets folder
    // These will be placed in every room that isn't a boss room.
    const decor_props = ['sprGoldVein', 'sprRock', 'sprLava', 'sprWater'];
    
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      if (room.isBoss) continue;
      
      const count = 1 + Math.floor(Math.random() * 3);
      for (let d = 0; d < count; d++) {
        const dx = room.x + 1 + Math.floor(Math.random() * (room.w - 2));
        const dy = room.y + 1 + Math.floor(Math.random() * (room.h - 2));
        
        if (grid[dy] && grid[dy][dx] === 0) {
          const prop = decor_props[Math.floor(Math.random() * decor_props.length)];
          // We store this as a custom property for the scene to render
          room.props = room.props || [];
          room.props.push({ x: dx, y: dy, type: prop });
        }
      }
    }
    
    return { grid, rooms, entrance, exit, gridW, gridH, roomsX: this.roomsX, roomsY: this.roomsY };
  }
}
