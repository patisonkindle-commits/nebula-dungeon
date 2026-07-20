// Upgrade / Meta-progression scene — spent gold between runs

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
    
    // Ensure all upgrade keys exist
    for (const u of UPGRADES) {
      if (this.upgrades[u.id] === undefined) this.upgrades[u.id] = 0;
    }
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0a1a);
    
    // Title
    this.add.text(CONFIG.WIDTH / 2, 30, 'CAMP — UPGRADES', {
      fontSize: '16px', color: COLORS.TEXT_BLUE, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);
    
    // Gold display
    this.add.text(CONFIG.WIDTH / 2, 50, `✦ ${this.heroGold} Gold`, {
      fontSize: '12px', color: COLORS.TEXT_GOLD, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);
    
    // Depth info
    this.add.text(CONFIG.WIDTH / 2, 65, `Floor ${this.currentDepth} reached | Hero Lv.${this.heroLevel}`, {
      fontSize: '9px', color: COLORS.TEXT_DIM, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(10);
    
    // Upgrade buttons
    this.upgradeButtons = [];
    this.createUpgradeList();
    
    // Descend button
    this.createDescendButton();
    
    // Store gold for button updates
    this.goldTextHUD = this.children.list.find(c => c.type === 'Text' && c.text.includes('Gold'));
  }

  createUpgradeList() {
    const startY = 90;
    const itemH = 55;
    
    for (let i = 0; i < UPGRADES.length; i++) {
      const u = UPGRADES[i];
      const rank = this.upgrades[u.id];
      const cost = Math.floor(u.baseCost * Math.pow(u.costMult, rank));
      const maxed = rank >= u.maxRank;
      
      const y = startY + i * itemH;
      
      // Background
      const bg = this.add.graphics();
      bg.fillStyle(0x111122, 0.8);
      bg.fillRoundedRect(10, y, CONFIG.WIDTH - 20, itemH - 4, 4);
      bg.lineStyle(1, 0x334466, 0.5);
      bg.strokeRoundedRect(10, y, CONFIG.WIDTH - 20, itemH - 4, 4);
      
      // Upgrade name + rank
      this.add.text(18, y + 5, `${u.name} (${rank}/${u.maxRank})`, {
        fontSize: '10px', color: COLORS.TEXT_WHITE, fontFamily: 'monospace',
      });
      
      // Description
      this.add.text(18, y + 20, u.desc, {
        fontSize: '8px', color: COLORS.TEXT_DIM, fontFamily: 'monospace',
      });
      
      if (!maxed) {
        // Cost + Buy button
        const canAfford = this.heroGold >= cost;
        const btnText = this.add.text(CONFIG.WIDTH - 20, y + 12, 
          canAfford ? `✦ ${cost} BUY` : `✦ ${cost}`, {
          fontSize: '10px', color: canAfford ? COLORS.TEXT_GOLD : '#555555', 
          fontFamily: 'monospace',
        }).setOrigin(1, 0.5);
        
        if (canAfford) {
          btnText.setInteractive({ useHandCursor: true });
          btnText.on('pointerover', () => btnText.setColor('#ffdd88'));
          btnText.on('pointerout', () => btnText.setColor(COLORS.TEXT_GOLD));
          btnText.on('pointerdown', () => this.buyUpgrade(u.id, cost));
        }
      } else {
        this.add.text(CONFIG.WIDTH - 20, y + 12, 'MAXED', {
          fontSize: '10px', color: '#44ff88', fontFamily: 'monospace',
        }).setOrigin(1, 0.5);
      }
    }
  }

  buyUpgrade(id, cost) {
    if (this.heroGold < cost) return;
    
    this.heroGold -= cost;
    this.upgrades[id] = (this.upgrades[id] || 0) + 1;
    
    // Rebuild scene
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
    
    // Big "Descend" button
    const bg = this.add.graphics();
    bg.fillStyle(0x224466, 0.9);
    bg.fillRoundedRect(60, y, CONFIG.WIDTH - 120, 44, 8);
    bg.lineStyle(2, COLORS.UI_ACCENT, 0.8);
    bg.strokeRoundedRect(60, y, CONFIG.WIDTH - 120, 44, 8);
    
    const txt = this.add.text(CONFIG.WIDTH / 2, y + 22, '▶ DESCEND TO FLOOR ' + (this.currentDepth + 1), {
      fontSize: '13px', color: COLORS.TEXT_BLUE, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerover', () => {
      txt.setColor('#88bbff');
      bg.clear();
      bg.fillStyle(0x335577, 0.9);
      bg.fillRoundedRect(60, y, CONFIG.WIDTH - 120, 44, 8);
      bg.lineStyle(2, 0x88bbff, 0.8);
      bg.strokeRoundedRect(60, y, CONFIG.WIDTH - 120, 44, 8);
    });
    txt.on('pointerout', () => {
      txt.setColor(COLORS.TEXT_BLUE);
      bg.clear();
      bg.fillStyle(0x224466, 0.9);
      bg.fillRoundedRect(60, y, CONFIG.WIDTH - 120, 44, 8);
      bg.lineStyle(2, COLORS.UI_ACCENT, 0.8);
      bg.strokeRoundedRect(60, y, CONFIG.WIDTH - 120, 44, 8);
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
