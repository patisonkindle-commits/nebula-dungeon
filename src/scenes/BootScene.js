// Boot scene — loads spritesheets and creates animations
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

    // Load hero animated spritesheet
    // 64x64 image = 4 columns × 4 rows of 16×16 tiles (16 frames total)
    // Row 0: Front-facing (idle, walk1, walk2, attack)
    // Row 1: Right-facing (idle, walk1, walk2, attack)
    // Row 2: Left-facing (idle, walk1, walk2, attack)
    // Row 3: Back-facing (idle, walk1, walk2, attack)
    this.load.spritesheet('hero', 'assets/hero.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  create() {
    // ── Hero walk animations (looping) ──────────────────────
    const walkRate = 8; // fps

    this.anims.create({
      key: 'hero-walk-front',
      frames: [
        { key: 'hero', frame: 0 },
        { key: 'hero', frame: 1 },
        { key: 'hero', frame: 0 },
        { key: 'hero', frame: 2 },
      ],
      frameRate: walkRate,
      repeat: -1,
    });

    this.anims.create({
      key: 'hero-walk-right',
      frames: [
        { key: 'hero', frame: 4 },
        { key: 'hero', frame: 5 },
        { key: 'hero', frame: 4 },
        { key: 'hero', frame: 6 },
      ],
      frameRate: walkRate,
      repeat: -1,
    });

    this.anims.create({
      key: 'hero-walk-left',
      frames: [
        { key: 'hero', frame: 8 },
        { key: 'hero', frame: 9 },
        { key: 'hero', frame: 8 },
        { key: 'hero', frame: 10 },
      ],
      frameRate: walkRate,
      repeat: -1,
    });

    this.anims.create({
      key: 'hero-walk-back',
      frames: [
        { key: 'hero', frame: 12 },
        { key: 'hero', frame: 13 },
        { key: 'hero', frame: 12 },
        { key: 'hero', frame: 14 },
      ],
      frameRate: walkRate,
      repeat: -1,
    });

    // ── Hero attack animations (single-shot) ────────────────
    const atkRate = 12; // fps

    this.anims.create({
      key: 'hero-attack-front',
      frames: [
        { key: 'hero', frame: 0 },
        { key: 'hero', frame: 3 },
        { key: 'hero', frame: 0 },
      ],
      frameRate: atkRate,
      repeat: 0,
    });

    this.anims.create({
      key: 'hero-attack-right',
      frames: [
        { key: 'hero', frame: 4 },
        { key: 'hero', frame: 7 },
        { key: 'hero', frame: 4 },
      ],
      frameRate: atkRate,
      repeat: 0,
    });

    this.anims.create({
      key: 'hero-attack-left',
      frames: [
        { key: 'hero', frame: 8 },
        { key: 'hero', frame: 11 },
        { key: 'hero', frame: 8 },
      ],
      frameRate: atkRate,
      repeat: 0,
    });

    this.anims.create({
      key: 'hero-attack-back',
      frames: [
        { key: 'hero', frame: 12 },
        { key: 'hero', frame: 15 },
        { key: 'hero', frame: 12 },
      ],
      frameRate: atkRate,
      repeat: 0,
    });

    // Go to title screen
    this.scene.start('title');
  }
}
