// Boot scene — loads Tiny Dungeon tileset spritesheet
// Kenney Tiny Dungeon pack (CC0): https://kenney.nl/assets/tiny-dungeon

import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    // Load Kenney Tiny Dungeon packed tilemap as spritesheet
    // 192x176 image = 12 columns × 11 rows of 16×16 tiles
    // Indexed left-to-right, top-to-bottom (frames 0—131)
    this.load.spritesheet('tiles', 'assets/tiles.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    this.scene.start('title');
  }
}
