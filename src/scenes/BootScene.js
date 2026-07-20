// Boot scene — generates pixel art textures programmatically

import Phaser from 'phaser';
import { CONFIG } from '../config.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create() {
    this.generateTextures();
    this.scene.start('title');
  }

  generateTextures() {
    // Hero sprite — 16x16 pixel art knight
    this.generateHeroTexture();
    
    // We'll generate more textures as needed
  }

  generateHeroTexture() {
    // Create a simple 16x16 pixel art hero
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Pixel data (simple knight silhouette)
    // Each row is 16 pixels
    const pixels = [
      // 0: empty, 1: blue armor, 2: dark blue, 3: skin, 4: sword (gray), 5: gold trim
      '0000000000000000',
      '0000111111000000',
      '0001222222100000',
      '0001222222100000',
      '0011133331110000',
      '0111513351110000',
      '0112222222110000',
      '0112522252110000',
      '0012222222100000',
      '0001111111000000',
      '0011111111000000',
      '0111111111100000',
      '0114444441100000',
      '0014400441000000',
      '0001000010000000',
      '0001111110000000',
    ];
    
    const colorMap = {
      '0': 'transparent',
      '1': '#2a6ebb',   // armor outline
      '2': '#4a9eff',   // armor main
      '3': '#ffcc99',   // skin
      '4': '#8899aa',   // sword
      '5': '#ffd700',   // gold trim
    };
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = pixels[y]?.[x] || '0';
        if (c !== '0') {
          ctx.fillStyle = colorMap[c] || '#ff00ff';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    this.textures.addCanvas('hero', canvas);
    
    // Also create a pixel-art enemy as texture
    this.generateEnemyTexture('slime', [
      '0000000000000000',
      '0000333300000000',
      '0003333300000000',
      '0033333333000000',
      '0033333333000000',
      '0333333333300000',
      '0333333333300000',
      '0333333333300000',
      '0333333333300000',
      '0033333333000000',
      '0003333333000000',
      '0000000000000000',
    ]);
  }

  generateEnemyTexture(key, pixels) {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const colorMap = {
      '0': 'transparent',
      '3': '#44dd44',   // slime green
    };
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = pixels[y]?.[x] || '0';
        if (c !== '0') {
          ctx.fillStyle = colorMap[c] || '#ff00ff';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    this.textures.addCanvas(key, canvas);
  }
}
