// Uses the preview server's disposable save key. Never reads the player save.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.DUNGEON_SCREENSHOT_DIR || path.join(__dirname, 'dungeon-screenshots');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      const interval = window.setInterval;
      window.setInterval = (fn, ...args) => fn.name === 'gameTick' ? 0 : interval(fn, ...args);
    });
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.evaluate(() => {
      window.dungeonQA = {
        refresh() {
          updateLocationActions(); updateCraftingUIForCurrentContext(); updatePlacePanel();
          updateAllActionButtons(); refreshExpeditionUI(); updateRegionalMapVisibility();
          setMainView('expedition', { userSelected: true }); ExpeditionScene.render(); ExpeditionMap.close();
          document.querySelectorAll('.popup').forEach(n => n.style.display = 'none');
        },
        advance() {
          gameState.activity.startTime = getGameTime() - gameState.activity.duration * 1000 - 1;
          processActivityTick(); this.refresh();
        },
        location(id) {
          resetActivity(); resetCombatEncounter(); gameState.phase = 'expedition';
          Object.assign(gameState.expedition, { active: true, regionId: 'west', destination: null });
          gameState.expedition.dungeon.active = false;
          Object.assign(getExpeditionLocation(id), { discovered: true, explored: true });
          setCurrentLocation(id); this.refresh();
        },
      };
      for (const [id, node] of Object.entries(getDungeon('roadsideRuinDepths').nodes)) {
        Object.assign(node, { discovered: id === 'entryStair', explored: id === 'entryStair', rewardClaimed: false, manaSenseCharges: 0, spellCharges: {} });
      }
      gameState.manaCrystalImbuingUnlocked = false;
      gameState.expedition.carriedItems = {};
      dungeonQA.location('roadsideRuin');
      window.topologyBefore = JSON.stringify(Object.fromEntries(Object.entries(getDungeonDefinitions()).map(([id, d]) => [id, Object.fromEntries(Object.entries(d.nodes).map(([id, n]) => [id, { x:n.x, y:n.y, exits:n.exits, requires:n.requires, search:n.search }]))])));
    });
    const root = page.locator('#dungeonSection');
    const topologyBefore = await page.evaluate(() => window.topologyBefore);
    const action = id => page.locator('[data-action="' + id + '"]');
    const hotspot = id => page.locator('[data-hotspot="' + id + '"]');
    const move = async id => { await hotspot(id).click(); assert.equal(await page.evaluate(() => getCurrentDungeonState().nodeId), id); };
    const shot = name => root.screenshot({ path: path.join(output, name + '.png'), style: '.top-bar, #mainViewTabs, .notification-stack, .notification-toast { visibility: hidden !important; }' });
    const enter = async () => {
      await page.locator('[data-landmark="entrance"]').click();
      await page.evaluate(() => { if (isActivityActive()) dungeonQA.advance(); dungeonQA.refresh(); });
    };
    await enter();
    const beforeRender = await page.evaluate(() => JSON.stringify({ state: gameState, rooms: createDungeonSaveData() }));
    await page.evaluate(() => { for (let i = 0; i < 5; i++) updateDungeonUI(); });
    assert.equal(await page.evaluate(() => JSON.stringify({ state: gameState, rooms: createDungeonSaveData() })), beforeRender, 'presentation refresh does not mutate saved state');
    assert.equal(await page.locator('#dungeonSceneTitle').textContent(), 'Entry Stair');
    assert.equal(await root.locator('.dungeon-room').count(), 3);
    assert.equal(await root.locator('.unknown').count(), 2);
    assert.equal(await root.locator('.dungeon-connections line').count(), 2);
    assert.equal(await root.locator('[data-node="crystalBindingAlcove"]').count(), 0);
    assert(!await root.innerText().then(t => t.includes('Cracked Hall')), 'unseen room name stays hidden');
    await shot('entry-desktop');
    await move('crackedHall');
    assert.equal(await page.locator('#dungeonSceneTitle').evaluate(n => n === document.activeElement), true, 'navigation restores keyboard focus');
    await hotspot('collapsedPassage').click();
    assert.equal(await page.evaluate(() => getCurrentDungeonState().nodeId), 'crackedHall');
    assert.match(await page.locator('#dungeonSceneNotice').textContent(), /Explore this room/);
    await shot('locked-desktop');
    await page.setViewportSize({ width: 1200, height: 900 });
    const hitBoxes = await root.locator('.dungeon-hotspot').evaluateAll(buttons => buttons.map(b => { const r = b.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom }; }));
    for (let i = 0; i < hitBoxes.length; i++) for (let j = i + 1; j < hitBoxes.length; j++) {
      const a = hitBoxes[i], b = hitBoxes[j];
      assert(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top, 'hotspots do not overlap on smaller desktop');
    }
    await shot('locked-small-desktop');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await root.locator('[data-node="entryStair"]').click(); // Original map still navigates.
    assert.equal(await page.evaluate(() => getCurrentDungeonState().nodeId), 'entryStair');
    await move('crackedHall');
    await page.evaluate(() => { getResource('energy').value = 0; updateDungeonUI(); });
    assert(await root.locator('[data-dungeon-action="exploreRoom"]').isDisabled());
    await page.evaluate(() => { getResource('energy').value = 200; updateDungeonUI(); });
    // Force the outcome only, leaving action timing, cost, rewards and progression real.
    await page.evaluate(() => { window.originalRandom = Math.random; Math.random = () => .999999; });
    const energy = await page.evaluate(() => getResource('energy').value);
    const cost = await page.evaluate(() => getDungeonSearchCost(getCurrentDungeonNode()).energy);
    await hotspot('search').click();
    assert.equal(await page.evaluate(() => getResource('energy').value), energy - cost);
    await page.evaluate(() => dungeonQA.advance());
    assert.equal(await page.evaluate(() => getCurrentDungeonNode().explored), false, 'failed search stays incomplete');
    // Existing Mana Sense is available inside the context panel and charges the room.
    await page.evaluate(() => { getResource('mana').value = getResource('mana').maxValue; dungeonQA.refresh(); });
    const sense = page.locator('#dungeonContext').getByRole('button', { name: /Cast Mana Sense/ }).first();
    await sense.click(); await page.evaluate(() => dungeonQA.advance());
    assert(await page.evaluate(() => getCurrentDungeonNode().manaSenseCharges > 0));
    await page.evaluate(() => { Math.random = () => 0; });
    const search = async () => {
      await hotspot('search').click();
      assert.equal(await page.evaluate(() => gameState.activity.kind), 'dungeonSearch');
      await page.evaluate(() => dungeonQA.advance());
      assert(await page.evaluate(() => getCurrentDungeonNode().explored));
      assert.equal(await root.locator('[data-dungeon-action="exploreRoom"]').count(), 0);
      assert.equal(await hotspot('search').count(), 0);
    };
    await search();
    assert(await page.evaluate(() => getCurrentDungeonNode().rewardClaimed));
    const loot = await page.evaluate(() => gameState.expedition.carriedItems.manaCrystal);
    await page.evaluate(() => { claimDungeonNodeReward(getCurrentDungeonNode()); });
    assert.equal(await page.evaluate(() => gameState.expedition.carriedItems.manaCrystal), loot, 'no duplicate reward');
    // Actual serialization + reload, with no presentation keys in the save schema.
    const saved = await page.evaluate(() => {
      const data = createSaveData(); localStorage.setItem('manaApprenticeOverhaulDisposableQA', JSON.stringify(data));
      return { rooms: data.dungeons.roadsideRuinDepths, state: data.gameState.expedition.dungeon, loot: data.gameState.expedition.carriedItems };
    });
    await page.reload(); await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.evaluate(() => { loadGame(); setMainView('expedition', { userSelected: true }); ExpeditionScene.render(); ExpeditionMap.close(); document.querySelectorAll('.popup').forEach(n => n.style.display = 'none'); });
    assert.deepEqual(await page.evaluate(() => createDungeonSaveData().roadsideRuinDepths), saved.rooms);
    assert.deepEqual(await page.evaluate(() => gameState.expedition.dungeon), saved.state);
    assert.deepEqual(await page.evaluate(() => gameState.expedition.carriedItems), saved.loot);
    // Pending loot stays visible and cannot be collected while the pack is full.
    await page.evaluate(() => {
      const node = getCurrentDungeonNode();
      node.rewardClaimed = false;
      node.pendingReward = { carried: { manaCrystal: 2 }, nonCarriedGranted: true };
      gameState.expedition.carriedItems = { wood: getEffectiveCarryCapacity() };
      updateDungeonUI();
    });
    const remainingLoot = root.locator('[data-dungeon-action="collectRemainingLoot"]');
    assert.match(await remainingLoot.textContent(), /Loot left behind: 2 Mana Crystals/);
    assert.match(await remainingLoot.textContent(), /Pack is full/);
    assert(await remainingLoot.isDisabled());
    await page.evaluate(() => { gameState.expedition.carriedItems = {}; updateDungeonUI(); });
    assert(!await remainingLoot.isDisabled());
    await remainingLoot.click();
    assert.equal(await page.evaluate(() => gameState.expedition.carriedItems.manaCrystal), 2);
    assert.equal(await remainingLoot.count(), 0, 'remaining-loot action is removed once everything is collected');
    // Reinstall only test helpers after full document reload.
    await page.evaluate(() => {
      window.dungeonQA = {
        refresh() { updateLocationActions(); updateCraftingUIForCurrentContext(); updatePlacePanel(); updateAllActionButtons(); refreshExpeditionUI(); setMainView('expedition', { userSelected: true }); ExpeditionScene.render(); ExpeditionMap.close(); document.querySelectorAll('.popup').forEach(n => n.style.display = 'none'); },
        advance() { gameState.activity.startTime = getGameTime() - gameState.activity.duration * 1000 - 1; processActivityTick(); this.refresh(); },
      };
      Math.random = () => 0;
    });
    await move('collapsedPassage'); await search();
    await move('crystalBindingAlcove'); await shot('alcove-desktop'); await search();
    assert(await page.evaluate(() => gameState.manaCrystalImbuingUnlocked));
    await move('collapsedPassage'); await move('crackedHall'); await move('entryStair'); await move('sideChamber');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot('side-chamber-mobile');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const button of await root.locator('.dungeon-hotspot').all()) {
      const box = await button.boundingBox(); assert(box.height >= 44 && box.width >= 44, 'touch target');
    }
    await search(); await move('emptyRoom'); await search();
    assert.equal(await page.locator('#dungeonMapProgress').textContent(), 'All rooms explored');
    await shot('complete-mobile');
    const rooms = await page.evaluate(() => createDungeonSaveData().roadsideRuinDepths);
    assert.equal(await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(getDungeonDefinitions()).map(([id, d]) => [id, Object.fromEntries(Object.entries(d.nodes).map(([id, n]) => [id, { x:n.x, y:n.y, exits:n.exits, requires:n.requires, search:n.search }]))])))), topologyBefore, 'all dungeon topology, requirements, search costs and reward definitions unchanged');
    await action('leaveDungeon').click(); await page.evaluate(() => { if(isActivityActive()) dungeonQA.advance(); dungeonQA.refresh(); });
    assert.equal(await page.evaluate(() => gameState.expedition.dungeon.active), false);
    assert.equal(await page.locator('.dungeon-scene-layout').count(), 0);
    assert.equal(await page.locator('#locationSpellActions').count(), 1);
    assert.equal(await page.locator('#craftingSpellActions').count(), 1);
    assert.equal(await page.locator('#expeditionArt img').getAttribute('src'), 'assets/expedition/roadside-ruin.png');
    await enter();
    assert.deepEqual(await page.evaluate(() => createDungeonSaveData().roadsideRuinDepths), rooms);
    assert.equal(await page.locator('.dungeon-map-panel').getAttribute('open'), null, 'map starts collapsed on mobile entry');
    await root.locator('summary').click();
    assert(await root.locator('#dungeonMap').isVisible());
    await shot('map-mobile');
    await page.setViewportSize({ width: 320, height: 740 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await shot('entry-small-mobile');
    // Unconverted dungeons use their original DOM and gates. Existing Archive combat round trip.
    await page.evaluate(() => {
      leaveCurrentDungeon(); setCurrentLocation('silentGearworks');
      Object.assign(gameState.expedition.dungeon, { active:true, dungeonId:'silentGearworksDepths', nodeId:'gaugeRoom' });
      setDungeonNodeSpellCharge(getDungeonNode('silentGearworksDepths','manaReservoir'), 'arcaneForce', 0);
      dungeonQA.refresh();
    });
    assert.equal(await page.locator('.dungeon-scene-layout').count(), 0);
    assert.equal(await page.evaluate(() => canMoveToDungeonNode('manaReservoir')), false);
    await page.evaluate(() => {
      setCurrentLocation('arcaneArchive');
      Object.assign(gameState.expedition.dungeon, { active:true, dungeonId:'arcaneArchiveDepths', nodeId:'deepRepository' });
      getCurrentDungeonNode().explored = true;
      gameState.northernDisturbance.resolved = true;
      gameState.regionalProgress.east.disturbanceResolved = true;
      gameState.regionalProgress.south.disturbanceResolved = true;
      dungeonQA.refresh();
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(await root.locator('[data-dungeon-action="challengeBrokenWarden"]').count(), 0);
    await page.evaluate(() => { leaveCurrentDungeon(); dungeonQA.refresh(); });
    await page.locator('[data-landmark="warden"]').click();
    await page.locator('#brokenWardenEncounter [data-location-action="challengeBrokenWarden"]').click();
    assert.equal(await page.evaluate(() => gameState.combat.enemyId), 'brokenWarden');
    assert(await page.locator('#combatPanel').isVisible());
    await page.evaluate(() => { gameState.combat.enemyHealth = 0; resolveCombatVictory(); });
    assert(await page.evaluate(() => gameState.brokenWardenDefeated && gameState.tierFourCompleted));
    await page.evaluate(() => { closeCombatEncounter(); dungeonQA.refresh(); });
    assert.equal(await page.evaluate(() => gameState.expedition.currentLocation), 'arcaneArchive');
    assert.equal(await root.locator('[data-dungeon-action="challengeBrokenWarden"]').count(), 0);
    assert.deepEqual(errors, []);
    console.log('Dungeon flow passed: entry, discovery, locks, backtracking, costs, failure/success, Mana Sense, pending loot, final unlock, reload, completion, exit/reentry, desktop/mobile, legacy dungeon and Archive combat return.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

