// Upgrade / Meta-progression scene — premium styling

import Phaser from 'phaser';
import { CONFIG, COLORS } from '../config.js';

const UPGRADES = [
  { id: 'damage', name: '⚔ Gladiator', desc: '+15% damage per rank', maxRank: 10, baseCost: 50, costMult: 1.6 },
  { id: 'hp', name: '🛡 Guardian', desc: '+20% max HP per rank', maxRank: 10, baseCost: 40, costMult: 1.5 },
  { id: 'speed', name: '👟 Runner', desc: '+10% move speed per rank', maxRank: 8, baseCost: 60, costMult: 1.7 },
  { id: 'gold', name: '💰 Merchant', desc: '+20% gold earned per rank', maxRank: 10, baseCost: 45, costMult: 1.55 },
  { id: 'attackSpeed', name: '🗡 Berserker', desc: '+12% attack speed per rank', maxRank: 8, baseCost: 70, costMult: 1.7 },
  { id: 'defense', name: '🛡 Armorer', desc: '+3 defense per rank', maxRank: 8, baseCost: 55, costMult: 1.6 },
  { id: 'regen', name: '💚 Healer', desc: '+0.2 HP/sec regen per rank', maxRank: 8, baseCost: 50, costMult: 1.5 },
];

export default class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('upgrade');
  }

  init(data) {
    this.currentDepth = data?.depth || 1;
    this.heroGold = data?.gold || 0;
    this.totalGold = data?.totalGold || 0;
    this.upgrades = data?.upgrades || {};
    this.heroLevel = data?.heroLevel || 1;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0c1a);
    
    this.add.text(CONFIG.WIDTH / 2, 40, 'CAMP — UPGRADES', {
      fontSize: '22px', color: '#88bbff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);
    
    this.add.text(CONFIG.WIDTH / 2, 70, `✦ ${this.heroGold}`, {
      fontSize: '16px', color: '#ffd700', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);
    
    this.add.text(CONFIG.WIDTH / 2, 90, `Floor ${this.currentDepth} reached | Hero Lv.${this.heroLevel}`, {
      fontSize: '10px', color: '#8899aa', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(10);
    
    this.createUpgradeList();
    this.createDescendButton();
  }

  createUpgradeList() {
    const startY = 130;
    const itemH = 70;
    
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i];
      const rank = this.upgrades[u.id] || 0;
      const cost = Math.floor(u.baseCost * Math.pow(u.costMult, rank));
      const maxed = rank >= u.maxRank;
      
      const y = startY + i * itemH;
      
      const bg = this.add.graphics();
      bg.fillStyle(0x1a2a3a, 0.9);
      bg.fillRoundedRect(20, y, CONFIG.WIDTH - 40, itemH - 10, 8);
      bg.lineStyle(2, 0x4a9eff, 0.6);
      bg.strokeRoundedRect(20, y, CONFIG.WIDTH - 40, itemH - 10, 8);
      
      this.add.text(30, y + 10, `${u.name} (${rank}/${u.maxRank})`, {
        fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
      });
      
      this.add.text(30, y + 30, u.desc, {
        fontSize: '9px', color: '#8899aa', fontFamily: 'monospace',
      });
      
      if (!maxed) {
        const canAfford = this.heroGold >= cost;
        const btnText = this.add.text(CONFIG.WIDTH - 30, y + 20, 
          canAfford ? `✦ ${cost} BUY` : `✦ ${cost}`, {
            fontSize: '12px', color: canAfford ? '#ffd700' : '#555555', 
            fontFamily: 'monospace',
          }).setOrigin(1, 0.5);
        
        if (canAfford) {
          btnText.setInteractive({ useHandCursor: true });
          btnText.on('pointerover', () => {
            btnText.setColor('#ffdd88');
            bg.fillStyle(0x224466, 1);
            bg.fillRoundedRect(20, y, CONFIG.WIDTH - 40, itemH - 10, 8);
          });
          btnText.on('pointerout', () => {
            btnText.setColor('#ffd700');
            bg.fillStyle(0x1a2a3a, 0.9);
            bg.fillRoundedRect(20, y, CONFIG.WIDTH - 40, itemH - 10, 8);
          });
          btnText.on('pointerdown', () => this.buyUpgrade(u.id, cost));
        }
      } else {
        this.add.text(CONFIG.WIDTH - 30, y + 20, 'MAXED', {
          fontSize: '12px', color: '#44ff88', fontFamily: 'monospace',
        }).setOrigin(1, 0.5);
      }
    }
  }

  buyUpgrade(id, cost) {
    if (this.heroGold < cost) return;
    this.heroGold -= cost;
    this.upgrades[id] = (this.upgrades[id] || 0) + 1;
    this.scene.restart({
      depth: this.currentDepth,
      gold: this.heroGold,
      totalGold: this.totalGold,
      upgrades: this.upgrades,
      heroLevel: this.heroLevel,
    });
  }

  createDescendButton() {
    const y = CONFIG.HEIGHT - 80;
    const bg = this.add.graphics();
    bg.fillStyle(0x224466, 1);
    bg.fillRoundedRect(60, y, CONFIG.WIDTH - 120, 50, 10);
    bg.lineStyle(3, 0x4a9eff, 1);
    bg.strokeRoundedRect(60, y, CONFIG.WIDTH - 120, 50, 10);
    
    const txt = this.add.text(CONFIG.WIDTH / 2, y + 25, `▶ DESCEND TO FLOOR ${this.currentDepth + 1}`, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerover', () => {
      txt.setColor('#88bbff');
      bg.fillStyle(0x335577, 1);
    });
    txt.on('pointerout', () => {
      txt.setColor('#ffffff');
      bg.fillStyle(0x224466, 1);
    });
    txt.on('pointerdown', () => {
      this.scene.start('dungeon', {
        depth: this.currentDepth + 1,
        gold: this.heroGold,
        upgrades: this.upgrades,
      });
    });
  }
}
