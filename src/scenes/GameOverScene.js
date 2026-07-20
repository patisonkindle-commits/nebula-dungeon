// Game over scene

import Phaser from 'phaser';
import { CONFIG, COLORS } from '../config.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('gameover');
  }

  init(data) {
    this.floorReached = data?.floor || 1;
    this.gold = data?.gold || 0;
    this.upgrades = data?.upgrades || {};
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0a0a);
    
    this.add.text(CONFIG.WIDTH / 2, 180, 'HERO FELL', {
      fontSize: '28px', color: '#ff4444', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);
    
    this.add.text(CONFIG.WIDTH / 2, 220, `Floor ${this.floorReached}`, {
      fontSize: '16px', color: COLORS.TEXT_DIM, fontFamily: 'monospace',
    }).setOrigin(0.5);
    
    this.add.text(CONFIG.WIDTH / 2, 250, `✦ ${this.gold} Gold earned`, {
      fontSize: '12px', color: COLORS.TEXT_GOLD, fontFamily: 'monospace',
    }).setOrigin(0.5);
    
    // Retry button
    const btnY = 340;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x442222, 0.9);
    btnBg.fillRoundedRect(140, btnY, 200, 50, 8);
    btnBg.lineStyle(2, 0xff4444, 0.7);
    btnBg.strokeRoundedRect(140, btnY, 200, 50, 8);
    
    const btnText = this.add.text(CONFIG.WIDTH / 2, btnY + 25, '▶ TRY AGAIN', {
      fontSize: '14px', color: '#ff6666', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    
    btnText.setInteractive({ useHandCursor: true });
    btnText.on('pointerdown', () => {
      this.scene.start('title');
    });
    
    btnText.on('pointerover', () => {
      btnText.setColor('#ffaaaa');
      btnBg.clear();
      btnBg.fillStyle(0x553333, 0.9);
      btnBg.fillRoundedRect(140, btnY, 200, 50, 8);
      btnBg.lineStyle(2, 0xff6666, 0.7);
      btnBg.strokeRoundedRect(140, btnY, 200, 50, 8);
    });
    
    btnText.on('pointerout', () => {
      btnText.setColor('#ff6666');
      btnBg.clear();
      btnBg.fillStyle(0x442222, 0.9);
      btnBg.fillRoundedRect(140, btnY, 200, 50, 8);
      btnBg.lineStyle(2, 0xff4444, 0.7);
      btnBg.strokeRoundedRect(140, btnY, 200, 50, 8);
    });
    
    // Restart gold display
    this.add.text(CONFIG.WIDTH / 2, 280, `Upgrades preserved: ${Object.keys(this.upgrades).length}`, {
      fontSize: '9px', color: COLORS.TEXT_DIM, fontFamily: 'monospace',
    }).setOrigin(0.5);
  }
}
