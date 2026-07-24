// Combat system — enhanced with critical hits, colored damage, gold cascade
// Tier 1.1 + 1.2: Critical hits (Gold/Orange), gold splash cascade

export class CombatSystem {
  constructor(scene) {
    this.scene = scene;
    this.damageNumbers = [];
    this.heroAttackTimer = 0;
  }

  update(dt, hero, enemies) {
    if (!hero.alive) return;

    this.heroAttackTimer -= dt;

    // Find nearest enemy
    let nearestEnemy = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = hero.x - enemy.x;
      const dy = hero.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }

    // Hero attacks
    if (nearestEnemy && nearestDist < 200 && this.heroAttackTimer <= 0) {
      const isCrit = Math.random() < 0.2; // 20% crit chance
      const dmg = isCrit ? 50 : 25;
      const color = isCrit ? '#ffaa00' : '#ffffff';

      const result = nearestEnemy.takeDamage(dmg);
      this.heroAttackTimer = 0.8;

      // Colored damage number (crit = bigger + ⚡)
      this.showDamage(nearestEnemy.x, nearestEnemy.y, dmg, color, isCrit);

      // Hero attack visual burst
      if (this.scene.showHeroAttack) {
        this.scene.showHeroAttack(hero.x, hero.y, nearestEnemy.x, nearestEnemy.y, isCrit);
      }

      if (result.killed) {
        // Gold cascade! 3-5 gold numbers fly out
        hero.gold += result.gold;
        this.showGoldCascade(nearestEnemy.x, nearestEnemy.y, result.gold);
        this.showDamage(nearestEnemy.x, nearestEnemy.y - 20, result.exp, '#44ff88');

        this.scene.time.delayedCall(300, () => {
          if (nearestEnemy.alive === false) nearestEnemy.destroy();
        });
      }
    }

    // Enemies attack hero
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const now = this.scene.time.now;
      const timeSinceLast = (now - enemy.lastAttackTime) / 1000;
      if (enemy.canAttack(hero) && timeSinceLast > enemy.attackCooldown) {
        const dmg = enemy.attackDmg;
        hero.takeDamage(dmg);
        enemy.lastAttackTime = now;
        this.showDamage(hero.x, hero.y - 20, dmg, '#ff6666'); // red-variant for hero hits
      }
    }

    // Update floating numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dn = this.damageNumbers[i];
      dn.y += dn.vy * dt;
      dn.x += dn.vx * dt;
      dn.life -= dt;
      dn.text.setPosition(dn.x, dn.y);
      const alpha = Math.min(1, dn.life * 2);
      dn.text.setAlpha(alpha);
      if (dn.life <= 0) {
        dn.text.destroy();
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  showDamage(x, y, amount, color = '#ffffff', isCrit = false) {
    const fontSize = isCrit ? '15px' : '10px';
    const label = isCrit ? `⚡${amount}!` : `${amount}`;
    const txt = this.scene.add.text(x, y, label, {
      fontSize, color, fontFamily: 'monospace',
      stroke: '#000', strokeThickness: isCrit ? 4 : 2,
      fontStyle: isCrit ? 'bold' : 'normal',
    }).setOrigin(0.5).setDepth(50);

    this.damageNumbers.push({
      x, y,
      vx: (Math.random() - 0.5) * 15,
      vy: -60 + Math.random() * -20,
      life: 1.0,
      text: txt,
    });
  }

  showGoldCascade(x, y, totalGold) {
    const count = 3 + Math.floor(Math.random() * 3); // 3-5 pieces
    const perGold = Math.max(1, Math.floor(totalGold / count));
    for (let i = 0; i < count; i++) {
      const txt = this.scene.add.text(
        x + (Math.random() - 0.5) * 50,
        y + (Math.random() - 0.5) * 30,
        `✦${perGold}`,
        {
          fontSize: '9px', color: '#ffd700', fontFamily: 'monospace',
          stroke: '#000', strokeThickness: 2,
        }
      ).setOrigin(0.5).setDepth(50);

      this.damageNumbers.push({
        x: txt.x, y: txt.y,
        vx: (Math.random() - 0.5) * 40,
        vy: -70 + Math.random() * -20,
        life: 1.2,
        text: txt,
      });
    }
  }

  destroy() {
    for (const dn of this.damageNumbers) {
      dn.text.destroy();
    }
    this.damageNumbers = [];
  }
}
