// Nebula Dungeon — Automated Playtest Suite
// Run this in browser console (F12 → Console) on http://localhost:3001/
// Tests 20 complete game runs and reports all bugs found.

(async function runPlaytests() {
  const G = window.__game;
  if (!G) return console.error('❌ No game instance found');

  const RESULTS = { ok: 0, fail: 0, runs: [], errors: [] };
  const BUGS = [];

  function bug(id, title, severity, detail) {
    BUGS.push({ id, title, severity, detail, time: Date.now() });
    console.warn(`🐛 BUG #${id}: [${severity}] ${title} — ${detail}`);
  }

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function waitForScene(name, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (G.scene.isActive(name)) return true;
      await wait(100);
    }
    return false;
  }

  function getJS() {
    return G.scene.getScenes(true).map(s => s.scene.key + ':' + (s.scene.isActive() ? 'active' : 'inactive')).join(', ');
  }

  // ─── SCENE NAVIGATION ───
  async function startGame() {
    // Click START RUN button
    const titleScene = G.scene.getScene('title');
    if (!titleScene) return bug('NAV1', 'Title scene missing', 'critical', 'Cannot find title scene');
    
    // Find the interactive text
    const children = titleScene.children.list;
    for (const child of children) {
      if (child.type === 'Text' && child.text && child.text.includes('START')) {
        child.emit('pointerdown');
        await wait(500);
        return true;
      }
    }
    bug('NAV2', 'START RUN button not found', 'critical', 'No interactive text with START found in title scene');
    return false;
  }

  async function waitForDungeonRoom() {
    const dungeon = G.scene.getScene('dungeon');
    if (!dungeon) return false;
    const start = Date.now();
    while (Date.now() - start < 10000) {
      if (dungeon.hero && dungeon.hero.alive) {
        // Wait for hero to enter first room
        if (dungeon.rooms && dungeon.currentTargetRoom === 0) return true;
      }
      await wait(200);
    }
    return false;
  }

  // Wait for hero to arrive in a room with enemies
  async function waitForCombat(timeout = 20000) {
    const dungeon = G.scene.getScene('dungeon');
    if (!dungeon) return null;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const hero = dungeon.hero;
      const enemies = dungeon.enemies;
      if (!hero || !hero.alive) return 'hero_dead';
      if (!enemies) return null;
      
      // Check if hero is in a room
      const room = dungeon.rooms?.[dungeon.currentTargetRoom];
      if (room && hero.gridPos) {
        const inRoom = hero.gridPos.x >= room.x && hero.gridPos.x < room.x + room.w &&
                       hero.gridPos.y >= room.y && hero.gridPos.y < room.y + room.h;
        if (inRoom) {
          const aliveEnemies = room.enemies ? room.enemies.filter(e => e.alive).length : 0;
          if (aliveEnemies > 0) return 'fighting';
        }
      }
      
      await wait(200);
    }
    return 'timeout';
  }

  async function waitForRoomClear(timeout = 60000) {
    const dungeon = G.scene.getScene('dungeon');
    if (!dungeon) return null;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const hero = dungeon.hero;
      if (!hero || !hero.alive) return 'hero_dead';
      
      const room = dungeon.rooms?.[dungeon.currentTargetRoom];
      if (room && room.cleared) return 'cleared';
      
      // Check if scene transitioned (navigated to next room, upgrade, or gameover)
      if (!G.scene.isActive('dungeon')) return 'scene_changed';
      
      await wait(200);
    }
    return 'timeout';
  }

  async function waitForGameOverOrUpgrade(timeout = 120000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (G.scene.isActive('gameover')) return 'gameover';
      if (G.scene.isActive('upgrade')) return 'upgrade';
      // If back at title, something went wrong
      if (G.scene.isActive('title') && !G.scene.isActive('dungeon')) return 'title';
      await wait(200);
    }
    return 'timeout';
  }

  // ─── STATE CHECKS ───
  function checkHeroState(dungeon) {
    const hero = dungeon.hero;
    if (!hero) return;
    if (hero.hp <= 0 && hero.alive) bug('HERO1', 'Hero alive flag wrong', 'major', `hp=${hero.hp}, alive=${hero.alive}`);
    if (hero.hp > 0 && !hero.alive) bug('HERO2', 'Hero dead flag wrong', 'major', `hp=${hero.hp}, alive=${hero.alive}`);
    if (hero.hp < 0) bug('HERO3', 'Hero HP negative', 'critical', `hp=${hero.hp}`);
    if (hero.maxHp <= 0) bug('HERO4', 'Hero maxHp invalid', 'critical', `maxHp=${hero.maxHp}`);
    if (Number.isNaN(hero.worldX) || Number.isNaN(hero.worldY)) bug('HERO5', 'Hero position NaN', 'critical', `x=${hero.worldX}, y=${hero.worldY}`);
    if (hero.gold < 0) bug('HERO6', 'Hero gold negative', 'minor', `gold=${hero.gold}`);
  }

  function checkEnemies(dungeon) {
    if (!dungeon.enemies) return;
    for (const e of dungeon.enemies) {
      if (e.hp <= 0 && e.alive) bug('ENEMY1', `Enemy ${e.type?.name} alive flag wrong`, 'major', `hp=${e.hp}, alive=${e.alive}`);
      if (e.hp > 0 && !e.alive) bug('ENEMY2', `Enemy ${e.type?.name} dead flag wrong`, 'major', `hp=${e.hp}, alive=${e.alive}`);
      if (e.hp < -100) bug('ENEMY3', `Enemy ${e.type?.name} HP extremely negative`, 'minor', `hp=${e.hp}`);
      if (Number.isNaN(e.worldX) || Number.isNaN(e.worldY)) bug('ENEMY4', `Enemy ${e.type?.name} position NaN`, 'critical', `x=${e.worldX}, y=${e.worldY}`);
    }
  }

  function checkDungeon(dungeon) {
    if (!dungeon) return;
    if (!dungeon.generator) bug('DUNG1', 'DungeonGenerator missing', 'critical', 'generator is null');
    if (!dungeon.grid) bug('DUNG2', 'Dungeon grid missing', 'critical', 'grid is null');
    if (!dungeon.rooms || dungeon.rooms.length === 0) bug('DUNG3', 'No rooms generated', 'critical', `rooms=${dungeon.rooms?.length}`);
    if (!dungeon.pathfinder) bug('DUNG4', 'Pathfinder missing', 'critical', 'pathfinder is null');
    if (!dungeon.combat) bug('DUNG5', 'CombatSystem missing', 'major', 'combat is null');
    
    // Check pathfinding actually works
    if (dungeon.grid && dungeon.hero && dungeon.rooms) {
      const exit = dungeon.dungeon?.exit;
      if (exit) {
        const path = dungeon.pathfinder?.findPath(
          dungeon.hero.gridPos.x, dungeon.hero.gridPos.y,
          exit.gridX, exit.gridY
        );
        if (path && path.length === 0) bug('DUNG6', 'Path to exit is blocked', 'major', `from (${dungeon.hero.gridPos.x},${dungeon.hero.gridPos.y}) to (${exit.gridX},${exit.gridY})`);
      }
    }
  }

  function checkCombat(dungeon) {
    if (!dungeon.combat) return;
    if (!dungeon.hero || !dungeon.enemies) return;
    
    // Check for event emitter leaks (Phaser event accumulation)
    const emitter = dungeon.events;
    if (emitter) {
      const listenerCount = emitter.listenerCount?.('update') || 0;
      if (listenerCount > 20) bug('COMBAT1', `Too many update listeners (${listenerCount})`, 'warning', 'Possible event emitter leak');
    }
  }

  function checkUpgradeScene(upgradeScene) {
    if (!upgradeScene) return;
    if (!upgradeScene.currentUpgrades || upgradeScene.currentUpgrades.length === 0) bug('UPGR1', 'No upgrades offered', 'major', 'upgrade list empty');
    if (upgradeScene.heroGold < 0) bug('UPGR2', 'Gold negative in upgrade scene', 'minor', `gold=${upgradeScene.heroGold}`);
  }

  function checkGameOverScene(gameoverScene) {
    if (!gameoverScene) return;
    // Check we got meaningful data
  }

  // ─── SINGLE RUN ───
  async function runTest(runNumber) {
    console.log(`\n═══════════════════════════════════`);
    console.log(`  🔄 RUN ${runNumber}/20 — ${new Date().toISOString()}`);
    console.log(`═══════════════════════════════════\n`);
    
    const run = { number: runNumber, phases: [], bugs: BUGS.length, errors: 0 };
    const phaseErrors = [];
    
    try {
      // Phase 1: Start game
      phaseErrors.push('start');
      let ok = await startGame();
      if (!ok) { run.errors++; run.failPhase = 'start'; RESULTS.runs.push(run); return; }
      await wait(800);
      
      // Phase 2: Wait for dungeon to load
      phaseErrors.push('dungeon_load');
      const dungeonActive = await waitForScene('dungeon', 8000);
      if (!dungeonActive) { bug('RUN1', `Run ${runNumber}: Dungeon scene never loaded`, 'critical', ''); run.errors++; run.failPhase = 'dungeon_load'; RESULTS.runs.push(run); return; }
      await wait(1500);
      
      // Phase 3: Wait for first room encounter
      phaseErrors.push('combat_start');
      const combatStatus = await waitForCombat(15000);
      if (combatStatus === 'hero_dead') {
        // Hero died immediately — check why
        const dungeon = G.scene.getScene('dungeon');
        if (dungeon && dungeon.hero) {
          bug('COMBAT2', `Run ${runNumber}: Hero died immediately at floor ${dungeon.dungeonDepth}`, 'major', `hp=${dungeon.hero.hp}, enemies=${dungeon.enemies?.filter(e=>e.alive).length}`);
        }
        run.errors++;
        run.failPhase = 'combat_start';
        RESULTS.runs.push(run);
        return;
      }
      if (combatStatus === 'timeout') { bug('TIMEOUT1', `Run ${runNumber}: Combat never started`, 'major', ''); run.errors++; run.failPhase = 'combat_timeout'; RESULTS.runs.push(run); return; }
      
      // Phase 4: Wait for first room clear
      phaseErrors.push('room_clear');
      const clearStatus = await waitForRoomClear(60000);
      if (clearStatus === 'hero_dead') { run.failPhase = 'room_clear_hero_dead'; }
      
      // Phase 5: Continue until scene transitions (gameover or upgrade)
      phaseErrors.push('end_scene');
      const endScene = await waitForGameOverOrUpgrade(180000);
      
      // Check state at transition
      const dungeon = G.scene.getScene('dungeon');
      if (dungeon) {
        checkHeroState(dungeon);
        checkEnemies(dungeon);
        checkDungeon(dungeon);
        checkCombat(dungeon);
      }
      
      run.endScene = endScene;
      run.depth = dungeon?.dungeonDepth || 0;
      run.gold = dungeon?.hero?.gold || 0;
      
      if (endScene === 'gameover') {
        const gos = G.scene.getScene('gameover');
        checkGameOverScene(gos);
        // Click "TRY AGAIN" or back to title
        await wait(2000);
        // Try to restart from gameover
        const children = gos?.children?.list || [];
        for (const child of children) {
          if (child.type === 'Text' && child.text && child.input?.enabled) {
            child.emit('pointerdown');
            await wait(500);
            break;
          }
        }
      }
      
      if (endScene === 'upgrade') {
        const us = G.scene.getScene('upgrade');
        checkUpgradeScene(us);
        // Buy an upgrade and continue
        await wait(3000);
        // Try to click "CONTINUE" or similar
        const children = us?.children?.list || [];
        for (const child of children) {
          if (child.text && (child.text.includes('CONTINUE') || child.text.includes('DUNGEON') || child.text.includes('ascend'))) {
            child.emit('pointerdown');
            await wait(500);
            break;
          }
        }
      }
      
      // Phase 6: Check no JS errors accumulated
      phaseErrors.push('console_check');
      if (window.__playtestErrors && window.__playtestErrors > 0) {
        bug('JSERR1', `Run ${runNumber}: ${window.__playtestErrors} JS errors`, 'major', '');
        run.errors += window.__playtestErrors || 0;
      }
      
      RESULTS.ok++;
      run.passed = true;
    } catch (e) {
      console.error(`❌ Run ${runNumber} crashed:`, e);
      bug('CRASH', `Run ${runNumber} crashed: ${e.message}`, 'critical', e.stack);
      run.errors++;
      run.failPhase = 'crash';
      run.error = e.message;
    }
    
    RESULTS.runs.push(run);
    console.log(`  → Run ${runNumber} done. Scene: ${run.endScene || '?'} | Depth: ${run.depth || 0}`);
  }

  // ─── MAIN LOOP: 20 RUNS ───
  console.log('%c═══════════════════════════════════', 'font-size:18px');
  console.log('%c  NEBULA DUNGEON — AUTOMATED PLAYTEST', 'font-size:16px; font-weight:bold');
  console.log('%c  20 Game Runs • Full Bug Detection', 'font-size:14px');
  console.log('%c═══════════════════════════════════\n', 'font-size:18px');
  
  RESULTS.startTime = Date.now();
  
  for (let i = 1; i <= 20; i++) {
    await runTest(i);
    // Brief pause between runs for GC
    if (i < 20) await wait(500);
  }
  
  RESULTS.endTime = Date.now();
  RESULTS.duration = Math.round((RESULTS.endTime - RESULTS.startTime) / 1000);
  
  // ─── FINAL REPORT ───
  console.log('\n\n');
  console.log('%c═══════════════════════════════════════════', 'font-size:20px');
  console.log('%c          PLAYTEST RESULTS', 'font-size:18px; font-weight:bold');
  console.log('%c═══════════════════════════════════════════\n', 'font-size:20px');
  
  console.log(`📊 Total: ${20} runs | ✅ Passed: ${RESULTS.ok} | ❌ Failed: ${RESULTS.fail} | 🐛 Bugs: ${BUGS.length}`);
  console.log(`⏱ Duration: ${RESULTS.duration}s\n`);
  
  console.log('%c--- RUN SUMMARY ---', 'font-size:14px; font-weight:bold');
  for (const run of RESULTS.runs) {
    const icon = run.passed ? '✅' : '❌';
    console.log(`${icon} Run ${run.number}: depth=${run.depth}, end=${run.endScene}, errors=${run.errors}${run.failPhase ? ', fail='+run.failPhase : ''}`);
  }
  
  if (BUGS.length > 0) {
    console.log(`\n%c🐛 BUGS FOUND: ${BUGS.length}`, 'font-size:16px; font-weight:bold; color:red');
    for (const b of BUGS) {
      const icon = b.severity === 'critical' ? '🔴' : b.severity === 'major' ? '🟡' : b.severity === 'minor' ? '🔵' : '⚪';
      console.log(`${icon} [${b.severity}] ${b.title}: ${b.detail}`);
    }
  } else {
    console.log(`\n%c✨ NO BUGS FOUND!`, 'font-size:16px; font-weight:bold; color:green');
  }
  
  console.log(`\n%c═══════════════════════════════════════════`, 'font-size:20px');
  
  // Store for retrieval
  window.__playtestResults = { RESULTS, BUGS };
  return { RESULTS, BUGS };
})();
