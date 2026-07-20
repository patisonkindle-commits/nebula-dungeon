// Nebula Dungeon — Idle Roguelike RPG
// Phaser 3 + Vite entry point

import Phaser from 'phaser';
import { CONFIG } from './config.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import DungeonScene from './scenes/DungeonScene.js';
import UpgradeScene from './scenes/UpgradeScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#0a0a1a',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, DungeonScene, UpgradeScene, GameOverScene],
};

const game = new Phaser.Game(config);
window.__game = game; // expose for debugging
