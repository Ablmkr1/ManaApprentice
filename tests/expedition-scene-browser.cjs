// Run with tests/serve-preview.cjs and Playwright on NODE_PATH. All saves use
// the existing disposable QA key; the real player save is never loaded.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.EXPEDITION_SCREENSHOT_DIR || path.join(__dirname, 'expedition-screenshots');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let page;
  try {
    page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Advance activity explicitly so interaction and progress assertions are deterministic.
    await page.addInitScript(() => {
      const interval = window.setInterval;
      window.setInterval = (callback, ...args) => callback.name === 'gameTick' ? 0 : interval(callback, ...args);
    });
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => gameState.towerConstructionUnlocked);
    await page.evaluate(() => {
      window.expeditionQA = {
        refresh() {
          updateLocationActions(); updateCraftingUIForCurrentContext(); updatePlacePanel();
          updateAllActionButtons(); refreshExpeditionUI(); updateRegionalMapVisibility();
          setMainView('expedition', { userSelected: true }); ExpeditionScene.render(); ExpeditionMap.close();
          document.querySelectorAll('.popup').forEach(n => n.style.display = 'none');
        },
        camp() { resetCombatEncounter(); resetActivity(); endExpedition('recall'); gameState.phase = 'expedition'; this.refresh(); },
        location(id, explored = true) {
          resetCombatEncounter(); resetActivity();
          gameState.expedition.dungeon.active = false;
          gameState.expedition.active = true;
          gameState.expedition.regionId = getLocationRegionId(getExpeditionLocation(id));
          gameState.expedition.destination = null;
          Object.assign(getExpeditionLocation(id), { discovered: true, explored });
          setCurrentLocation(id); lockAction('travel'); unlockAction('returnToCamp'); setPackingActionsAvailable(false);
          this.refresh();
        },
        advance(fraction = 1) {
          gameState.activity.startTime = getGameTime() - Math.ceil(gameState.activity.duration * 1000 * fraction) - (fraction >= 1 ? 1 : 0);
          processActivityTick(); ExpeditionScene.render();
        },
      };
      expeditionQA.camp(); selectRegion('north'); ExpeditionScene.render();
    });
    const root = page.locator('#expeditionPanel');
    const marker = id => page.locator('[data-landmark="' + id + '"]');
    const action = id => page.locator('[data-direct-key="action:' + id + '"]:visible, [data-action="' + id + '"]:visible');
    const panel = page.locator('#expeditionDetail');
    const chooseMarker = async id => {
      // The panel overlays the opposite side of the painting. Close it before
      // choosing another landmark, just as a pointer user does.
      if (await panel.isVisible()) await page.locator('#expeditionDetailClose').click();
      await marker(id).evaluate(n => n.scrollIntoView({ block: 'center' }));
      if (await marker(id).getAttribute('aria-controls') === 'expeditionDetail') {
        await marker(id).click(); await visible(panel);
      } else {
        // Direct actions need no inspection step. Focus here; the test clicks
        // the action below and verifies its actual gameplay result.
        await marker(id).focus(); assert.equal(await panel.isVisible(), false);
      }
    };
    const checkReadability = async () => {
      const failures = await page.locator('#expeditionDetail p, #expeditionDetail h3, #expeditionDetail h4, #expeditionDetail .ui-action-label, #expeditionDetail .ui-action-cost, #expeditionDetail .ui-action-reason, #expeditionDetail .resource-pill, .expedition-status span, .expedition-local-tools h3, .expedition-local-tools p, .expedition-direct-actions strong, .expedition-direct-actions small').evaluateAll(nodes => {
        const rgb = v => (v.match(/[\d.]+/g) || []).map(Number);
        const luminance = c => c.slice(0, 3).map(x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
        return nodes.filter(n => n.getBoundingClientRect().width && n.getBoundingClientRect().height && n.textContent.trim()).flatMap(n => {
          const layers = []; let base = [255, 255, 255];
          for (let p = n; p; p = p.parentElement) {
            const style = getComputedStyle(p);
            if (style.backgroundImage.includes('gradient')) { base = [234, 223, 202]; break; }
            const c = rgb(style.backgroundColor), alpha = c[3] ?? 1;
            if (alpha === 1) { base = c; break; }
            if (alpha) layers.push(c);
          }
          for (const c of layers.reverse()) base = base.map((v, i) => c[i] * c[3] + v * (1 - c[3]));
          const f = luminance(rgb(getComputedStyle(n).color)), b = luminance(base);
          const ratio = (Math.max(f, b) + .05) / (Math.min(f, b) + .05);
          return ratio >= 4.5 ? [] : [{ text: n.textContent.slice(0, 70), ratio }];
        });
      });
      assert.deepEqual(failures, [], 'ordinary panel/status text meets AA contrast');
    };
    const shot = async name => {
      await checkReadability();
      await page.locator('#expeditionArt img').evaluateAll(imgs => Promise.all(imgs.map(i => i.decode())));
      if (await panel.isVisible()) await panel.evaluate(n => n.scrollTop = 0);
      return root.screenshot({ path: path.join(output, name + '.png'), style: '.top-bar, #mainViewTabs, .notification-stack, .notification-toast { visibility: hidden !important; }' });
    };
    const snapshot = () => page.evaluate(() => JSON.stringify({ expedition: gameState.expedition, activity: gameState.activity, resources: Object.fromEntries(Object.entries(getResourceDefinitions()).map(([id, r]) => [id, r.value])) }));
    const visible = async locator => assert(await locator.isVisible(), 'visible: ' + locator);
    // Pre-North access and original open exploration.
    await page.evaluate(() => { gameState.tier3Unlocked = false; gameState.world.selectedRegion = 'outskirts'; expeditionQA.refresh(); });
    await visible(action('beginExpedition'));
    assert.equal(await page.locator('#expeditionSurface').isVisible(), true, 'Outskirts retains its illustrated regional scene before North unlocks');
    await action('beginExpedition').click();
    await page.evaluate(() => { if (isActivityActive()) expeditionQA.advance(); });
    assert.equal(await page.evaluate(() => ExpeditionScene.mode()), 'preparing');
    await visible(action('packFood'));
    await action('packFood').click();
    await page.evaluate(() => { if (isActivityActive()) expeditionQA.advance(); });
    assert((await page.evaluate(() => getCarriedTotal())) > 0);
    await action('travel').click();
    await page.evaluate(() => { if (gameState.activity.kind === 'action') expeditionQA.advance(); });
    assert.equal(await page.evaluate(() => ExpeditionScene.mode()), 'traveling');
    await page.evaluate(() => expeditionQA.advance());
    await action('travel').click();
    assert.equal(await page.evaluate(() => ExpeditionScene.mode()), 'paused');
    await visible(action('returnToCamp'));
    await action('returnToCamp').click();
    await page.evaluate(() => { if (isActivityActive()) expeditionQA.advance(); setMainView('expedition', { userSelected: true }); ExpeditionMap.close(); });
    assert.equal(await page.evaluate(() => gameState.expedition.active), false);
    // North names and art are absent until discovered, including selection reset.
    await page.evaluate(() => {
      gameState.tier3Unlocked = true; getRegionState('north').unlocked = true;
      for (const id of ['foothillScree', 'minersCamp', 'ironMine']) getExpeditionLocation(id).discovered = false;
      selectRegion('north'); expeditionQA.refresh();
    });
    assert.equal(await page.locator('[data-landmark]').count(), 0);
    assert(!await page.locator('#expeditionSurface').innerText().then(t => /Iron Mine|Miners|Foothill/.test(t)));
    await visible(action('beginExpedition'));
    await page.evaluate(() => { getExpeditionLocation('foothillScree').discovered = true; updateDestinationActions(); ExpeditionScene.render(); });
    assert.equal(await page.locator('[data-landmark]').count(), 1);
    await shot('north-map-only-scree-desktop');
    await page.evaluate(() => { for (const id of ['foothillScree', 'minersCamp', 'ironMine']) getExpeditionLocation(id).discovered = true; updateDestinationActions(); ExpeditionScene.render(); });
    await shot('north-map-all-discovered-desktop');
    assert.equal(await page.locator('#expeditionArt svg').count(), 0, 'no SVG scenery');
    assert.equal(await page.locator('#expeditionArt .expedition-background').count(), 1);
    const beforeMap = await snapshot();
    await chooseMarker('foothillScree');
    assert.equal(await snapshot(), beforeMap, 'destination inspection does not mutate gameplay');
    await visible(panel.locator('[data-expedition-destination="foothillScree"]'));
    assert.match(await panel.innerText(), /145/);
    await page.keyboard.press('Escape');
    assert.equal(await panel.isVisible(), false);
    assert.equal(await marker('foothillScree').evaluate(n => n === document.activeElement), true);
    await chooseMarker('minersCamp');
    assert.match(await panel.innerText(), /Northern Node.*Jump/);
    await shot('north-map-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot('north-map-mobile');
    assert.equal(await root.evaluate(n => n.scrollWidth > n.clientWidth + 1), false, 'mobile map fits');
    assert.equal(await page.locator('#regionalMap').evaluate(n => n.scrollWidth > n.clientWidth + 1), false, 'all region selectors fit without clipping');
    await page.setViewportSize({ width: 1360, height: 1000 });
    // Existing node preparation and jump handlers, with current costs.
    await panel.getByRole('button', { name: /Prepare Northern Node Jump/ }).click();
    await page.evaluate(() => expeditionQA.advance());
    assert.equal(await page.evaluate(() => isTowerNodeJumpExpedition()), true);
    await action('travel').click();
    assert.equal(await page.evaluate(() => gameState.expedition.currentLocation), 'minersCamp');
    // Local node/golem owner remains the camp in this branch.
    await chooseMarker('node');
    await visible(panel.locator('#towerNodePanel'));
    assert.match(await panel.innerText(), /Northern Node Online/);
    await shot('northern-node-desktop');
    await page.evaluate(() => {
      getBoundEarthElementalState().owned = 6;
      getResearch('elementalBinding').completed = true;
      gameState.expedition.carriedItems.stone = 2;
      getResource('stone').value = 0;
      expeditionQA.refresh();
    });
    await panel.getByRole('button', { name: 'Assign one elemental to Stone', exact: true }).click();
    assert.equal(await page.evaluate(() => getBoundEarthElementalAssignmentCount({ type: 'node', nodeName: 'north', jobName: 'stone' })), 1);
    await panel.locator('[data-tower-node-advanced-recall="north"]').click();
    await visible(page.locator('#advancedRecallPopup'));
    await page.locator('#advancedRecallOptions').getByRole('button', { name: /Send Stone/ }).click();
    assert.equal(await page.evaluate(() => gameState.expedition.carriedItems.stone || 0), 0);
    assert.equal(await page.evaluate(() => gameState.expedition.currentLocation), 'minersCamp');
    await page.evaluate(() => hideAdvancedRecallPopup());
    await page.setViewportSize({ width: 390, height: 844 });
    await panel.evaluate(n => n.scrollTop = 0);
    await shot('northern-node-mobile');
    assert.equal(await panel.evaluate(n => n.scrollWidth > n.clientWidth + 1), false, 'node controls fit mobile');
    await panel.evaluate(n => n.scrollTop = 260);
    const nodeScroll = await panel.evaluate(n => n.scrollTop);
    await page.evaluate(() => { for (let i = 0; i < 30; i++) ExpeditionScene.render(); });
    assert.equal(await panel.evaluate(n => n.scrollTop), nodeScroll, 'tick refresh preserves panel scroll');
    await page.setViewportSize({ width: 1360, height: 1000 });
    // Discovery, unbuilt, and built node states use the existing node flags.
    await page.evaluate(() => { Object.assign(getTowerNodeState('north'), { activated: false, researchUnlocked: false, built: false }); expeditionQA.refresh(); });
    assert.equal(await marker('node').count(), 0);
    assert.equal(await page.locator('.expedition-node-overlay').count(), 0);
    await shot('northern-node-hidden-desktop');
    await page.evaluate(() => { getTowerNodeState('north').activated = true; ExpeditionScene.render(); });
    await chooseMarker('node'); assert.match(await panel.innerText(), /Discovered/);
    await shot('northern-node-discovered-desktop');
    await page.evaluate(() => { getTowerNodeState('north').researchUnlocked = true; expeditionQA.refresh(); });
    assert.match(await panel.innerText(), /Unbuilt/);
    await visible(panel.locator('#towerNodePanel'));
    await shot('northern-node-unbuilt-desktop');
    await page.evaluate(() => { Object.assign(getTowerNodeState('north'), { built: true, advancedRecallUnlocked: true }); expeditionQA.refresh(); });
    await chooseMarker('smelter');
    // Strike the Anvil stays next to its exact existing Mana Sense requirements.
    await page.evaluate(() => { const o = getLocationObject('minersCamp', 'studySmelterHeat'); o.progress = 0; o.spellCharges = {}; expeditionQA.refresh(); });
    assert.match(await panel.innerText(), /Strike the Anvil/);
    await visible(action('storeOre')); await visible(action('takeIron'));
    await page.evaluate(() => { gameState.expedition.carriedItems.ore = 5; expeditionQA.refresh(); });
    await action('storeOre').click(); await page.evaluate(() => { if (isActivityActive()) expeditionQA.advance(); });
    await page.evaluate(() => { const s = getExpeditionLocation('minersCamp').storage; s.ore = 30; getResource('fuel').value = 30; expeditionQA.refresh(); });
    await visible(panel.locator('#ironCraftBtn'));
    await panel.locator('#ironCraftBtn').click();
    assert.equal(await page.evaluate(() => gameState.activity.kind), 'craft');
    await page.evaluate(() => expeditionQA.advance(.5));
    assert(parseFloat(await panel.locator('#ironCraftBtn .progressFill').evaluate(n => n.style.width)) > 0);
    await page.evaluate(() => expeditionQA.advance());
    await visible(panel);
    assert.equal(await page.locator('#expeditionDetailTitle').innerText(), 'Smelter & stores');
    await page.evaluate(() => resetActivity());
    await shot('miners-camp-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await chooseMarker('smelter');
    await page.screenshot({ path: path.join(output, 'mobile-viewport.png'), style: '.notification-stack, .notification-toast { visibility: hidden !important; }' });
    await shot('miners-camp-mobile');
    assert.equal(await root.evaluate(n => n.scrollWidth > n.clientWidth + 1), false, 'mobile camp fits');
    await page.evaluate(() => { getLocationObject('minersCamp', 'studySmelterHeat').spellCharges.manaSense = 3; expeditionQA.refresh(); });
    await panel.locator('[data-location-object="studySmelterHeat"]').click();
    await page.evaluate(() => expeditionQA.advance());
    assert.equal(await panel.locator('[data-location-object="studySmelterHeat"]').count(), 0, 'completed investigation removes its action');
    await visible(panel.locator('#ironCraftBtn'));
    // Scree survey gates gathering; Stone Sense and repeated gathering stay local.
    await page.setViewportSize({ width: 1360, height: 1000 });
    await page.evaluate(() => expeditionQA.location('foothillScree', false));
    await chooseMarker('survey'); await visible(action('exploreLocation'));
    await action('exploreLocation').click(); await page.evaluate(() => expeditionQA.advance());
    assert.equal(await page.evaluate(() => getExpeditionLocation('foothillScree').explored), true);
    assert.match(await marker('survey').innerText(), /Exploration complete/);
    await chooseMarker('scree');
    await visible(action('gatherStone'));
    assert.match(await page.locator('.expedition-local-tools').innerText(), new RegExp('Per gathering cycle: ' + await page.evaluate(() => getGatherStoneAmount()) + ' Stone')); 
    await page.evaluate(() => { window.qaManaSenseUnlocked = getSpell('manaSense').unlocked; getSpell('manaSense').unlocked = false; expeditionQA.refresh(); });
    assert.equal(await page.locator('[data-direct-key="spell:stoneSense"]:visible').count(), 0);
    assert.equal(await page.locator('.stone-sense-active').count(), 0);
    await shot('foothill-scree-sense-unavailable');
    await page.evaluate(() => { getSpell('manaSense').unlocked = qaManaSenseUnlocked; expeditionQA.refresh(); });
    assert.match(await page.locator('.expedition-local-tools').innerText(), /Stone Sense/);
    await shot('foothill-scree-sense-available');
    const stoneMagic = page.locator('[data-direct-key="spell:stoneSense"]');
    await stoneMagic.click(); await page.evaluate(() => expeditionQA.advance());
    assert.equal(await page.evaluate(() => hasStoneSenseActive()), true);
    assert.match(await page.locator('.expedition-local-tools').innerText(), /Stone Sense: active/);
    assert.equal(await page.locator('.stone-sense-active').count(), 1);
    await action('gatherStone').click();
    await page.evaluate(() => { window.qaGatherButton = getAction('gatherStone').button; window.qaArt = document.querySelector('#expeditionArt .expedition-background'); });
    await page.evaluate(() => expeditionQA.advance(.5));
    assert(parseFloat(await action('gatherStone').locator('.progressFill').evaluate(n => n.style.width)) > 0);
    await shot('foothill-scree-active-progress');
    await action('gatherStone').focus();
    await page.evaluate(() => { for (let i = 0; i < 30; i++) ExpeditionScene.render(); });
    assert.equal(await action('gatherStone').evaluate(n => document.activeElement === n), true);
    await page.evaluate(() => expeditionQA.advance());
    assert.equal(await page.evaluate(() => document.querySelector('#expeditionArt .expedition-background') === qaArt && getAction('gatherStone').button === qaGatherButton), true);
    assert.equal(await panel.isVisible(), false);
    const activeSnapshot = await snapshot();
    await page.locator('#expeditionBrowse').click();
    await chooseMarker('ironMine');
    assert.equal(await snapshot(), activeSnapshot, 'browsing during gathering preserves action, resources, progress');
    assert.equal(await action('gatherStone').isVisible(), false, 'no remote gathering');
    assert.match(await marker('foothillScree').innerText(), /You are here/);
    await page.locator('#expeditionBrowse').click(); await chooseMarker('scree');
    await shot('foothill-scree-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await shot('foothill-scree-mobile');
    assert.equal(await root.evaluate(n => n.scrollWidth > n.clientWidth + 1), false, 'mobile scree fits');
    // Intra-region travel uses its original distance and arrives at the target.
    await page.evaluate(() => resetActivity());
    await page.locator('#expeditionBrowse').click(); await chooseMarker('ironMine');
    assert.match(await panel.innerText(), /205/);
    await panel.getByRole('button', { name: /Travel to Iron Mine/ }).click();
    assert.equal(await page.evaluate(() => gameState.expedition.routeType), 'intraRegion');
    await page.evaluate(() => {
      gameState.expedition.distance = gameState.expedition.targetDistance - .1;
      expeditionQA.advance();
    });
    assert.equal(await page.evaluate(() => gameState.expedition.currentLocation), 'ironMine');
    await chooseMarker('mine'); await visible(action('mineStone')); await visible(action('mineIron'));
    for (const id of ['mineStone', 'mineIron']) {
      await action(id).click();
      assert.equal(await page.evaluate(() => gameState.activity.id), id);
      await page.evaluate(() => { expeditionQA.advance(); stopAutoAction(); resetActivity(); updateAllActionButtons(); });
    }
    await shot('iron-mine-mobile');
    await page.setViewportSize({ width: 1360, height: 1000 }); await shot('iron-mine-desktop');
    // The node lives at the camp in authoritative gameplay. Iron Mine must
    // stay node-free before discovery, after discovery, and after construction.
    for (const [name, flags] of [['hidden', { activated: false, researchUnlocked: false, built: false }], ['unbuilt', { activated: true, researchUnlocked: true, built: false }], ['built', { activated: true, researchUnlocked: true, built: true }]]) {
      await page.evaluate(flags => { Object.assign(getTowerNodeState('north'), flags); expeditionQA.refresh(); }, flags);
      assert.equal(await marker('node').count(), 0);
      assert.equal(await page.locator('.expedition-node-overlay').count(), 0);
      await shot('iron-mine-node-' + name + '-desktop');
    }
    // Disturbance gate, investigation, encounter and existing combat precedence.
    await page.evaluate(() => { gameState.northernDisturbance.triggered = false; expeditionQA.refresh(); });
    assert.equal(await marker('disturbance').count(), 0);
    await page.evaluate(() => { Object.assign(gameState.northernDisturbance, { triggered: true, resolved: false, investigated: false }); expeditionQA.refresh(); });
    await chooseMarker('disturbance'); await visible(action('investigateNorthernDisturbance'));
    await action('investigateNorthernDisturbance').click();
    await page.evaluate(() => { if (isActivityActive()) expeditionQA.advance(); ExpeditionScene.render(); });
    assert.equal(await page.evaluate(() => ExpeditionScene.mode()), 'combat');
    await visible(page.locator('#combatScene'));
    await page.evaluate(() => { gameState.combat.enemyHealth = 0; resolveCombatVictory(); expeditionQA.refresh(); });
    await page.locator('#closeCombatBtn').click();
    await page.evaluate(() => ExpeditionScene.render());
    await chooseMarker('disturbance');
    await visible(action('challengeEarthElemental'));
    await action('challengeEarthElemental').click();
    await page.evaluate(() => { if (isActivityActive()) expeditionQA.advance(); ExpeditionScene.render(); });
    assert.equal(await page.evaluate(() => ExpeditionScene.mode()), 'combat');
    assert.equal(await root.isVisible(), false);
    await visible(page.locator('#combatScene'));
    await page.evaluate(() => { endCombatForRecall(); beginReturnToCamp(); if (isActivityActive()) expeditionQA.advance(); });
    assert.equal(await page.evaluate(() => isCombatActive()), false);
    // Retained regions and dungeon actions survive switching back out of North.
    await page.evaluate(() => { expeditionQA.camp(); selectRegion('east'); expeditionQA.refresh(); });
    assert.equal(await page.locator('#expeditionSurface').isVisible(), true);
    assert((await page.locator('#expeditionLandmarks button:visible').count()) > 0);
    await shot('retained-east-desktop');
    await page.evaluate(() => expeditionQA.location('roadsideRuin'));
    await chooseMarker('entrance');
    await visible(action('enterDungeon')); await action('enterDungeon').click();
    await page.evaluate(() => { if (isActivityActive()) expeditionQA.advance(); ExpeditionScene.render(); });
    assert.equal(await page.evaluate(() => ExpeditionScene.mode()), 'dungeon');
    await visible(page.locator('#dungeonSection')); await visible(action('leaveDungeon'));
    await shot('retained-dungeon-desktop');
    await page.setViewportSize({ width: 320, height: 740 });
    await shot('retained-dungeon-mobile');
    assert.equal(await root.evaluate(n => n.scrollWidth > n.clientWidth + 1), false, 'retained dungeon fits narrow mobile');
    await action('leaveDungeon').click();
    await page.evaluate(() => { if (isActivityActive()) expeditionQA.advance(); ExpeditionScene.render(); });
    assert.equal(await page.evaluate(() => ExpeditionScene.mode()), 'location');
    // Real save/load keeps durable progress; the existing loader clears live activities.
    await page.evaluate(() => { expeditionQA.location('foothillScree'); });
    await chooseMarker('scree'); await action('gatherStone').click();
    const loaded = await page.evaluate(() => {
      saveSuppressed = false;
      const saved = createSaveData(); localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
      const ok = loadGame(); saveSuppressed = true;
      return { ok, location: gameState.expedition.currentLocation, discovered: getExpeditionLocation('ironMine').discovered, explored: getExpeditionLocation('foothillScree').explored, kind: gameState.activity.kind };
    });
    assert.equal(loaded.ok, true); assert.equal(loaded.location, 'foothillScree'); assert.equal(loaded.discovered, true);
    assert.equal(loaded.explored, true); assert.equal(loaded.kind, null);
    await page.evaluate(() => { expeditionQA.camp(); selectRegion('north'); expeditionQA.refresh(); });
    await marker('foothillScree').focus(); await page.keyboard.press('Enter');
    await visible(panel);
    assert.equal(await root.evaluate(n => n.scrollWidth > n.clientWidth + 1), false, 'North fits 320px');
    assert.equal(await page.locator('#regionalMap').evaluate(n => n.scrollWidth > n.clientWidth + 1), false);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await marker('foothillScree').evaluate(n => getComputedStyle(n).transitionDuration), '0s');
    for (const [id, landmark] of [['foothillScree', 'scree'], ['minersCamp', 'smelter'], ['ironMine', 'mine']]) {
      await page.evaluate(id => expeditionQA.location(id), id);
      await chooseMarker(landmark);
      assert.equal(await root.evaluate(n => n.scrollWidth > n.clientWidth + 1), false, id + ' fits 320px');
      assert.equal(await panel.evaluate(n => n.scrollWidth > n.clientWidth + 1), false, id + ' panel fits 320px');
      if (await panel.isVisible()) await page.locator('#expeditionDetailClose').click();
      const beforeRoute = await snapshot();
      await marker('route').click();
      assert.equal(await snapshot(), beforeRoute, 'trail hotspot only inspects routes');
      await page.locator('#expeditionBrowse').click();
    }
    assert.deepEqual(errors, []);
    console.log('Expedition browser checks passed: progression gates, no-op inspection, preparation/packing/travel/arrival/Recall/jump, all North actions, processing/gather progress, stable focus/art, combat, retained regions/dungeons, saves, desktop/mobile.');
    console.log('Screenshots: ' + output);
  } catch (error) {
    if (page) {
      await page.screenshot({path: path.join(output, 'failure.png')});
      console.error(await page.evaluate(() => ['expeditionSceneWindow','expeditionArt','expeditionLandmarks','expeditionSurface','expeditionDetail'].map(id => { const n=document.getElementById(id);return {id,rect:n.getBoundingClientRect().toJSON(),scrollTop:n.scrollTop,scrollLeft:n.scrollLeft,style:n.getAttribute('style')}; })));
    }
    throw error;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

