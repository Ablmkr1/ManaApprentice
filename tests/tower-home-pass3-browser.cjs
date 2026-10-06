const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

const outputDir = process.env.PASS3_SCREENSHOT_DIR;

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      const interval = window.setInterval;
      window.setInterval = (fn, ...args) => fn.name === 'gameTick' ? 0 : interval(fn, ...args);
    });
    await page.goto('http://localhost:8765/tests/overhaul-preview.html');
    await page.waitForFunction(() => typeof updateTowerRoomNavigation === 'function');

    await page.evaluate(() => {
      resetActivity(); resetCombatEncounter(); endExpedition('recall');
      gameState.towerHome = { relocated:false, legacyFuelNoticeShown:false, establishmentPresented:false };
      gameState.discoveredClearing = true;
      gameState.hasCamp = false;
      gameState.phase = 'clearing';
      gameState.magicUnlocked = false;
      gameState.towerConstructionUnlocked = false;
      gameState.wardenCoreRecovered = false;
      Object.assign(getResearch('longRangeNetwork'), {unlocked:false, completed:false});
      for (const upgrade of Object.values(getCampUpgradeDefinitions())) { upgrade.purchased = false; upgrade.unlocked = false; }
      for (const project of Object.values(gameState.projects || {})) { project.completed = false; project.unlocked = false; project.level = 0; }
      refreshGameUIAfterLoad();
      setMainView('home', {userSelected:true});
      document.getElementById('notificationStack').replaceChildren();
    });
    assert.match(await page.locator('#homeClearingTitle').innerText(), /Clearing/);
    if (outputDir) await page.screenshot({ path:path.join(outputDir, 'pass3-early-camp-desktop.png'), fullPage:true });
    await page.setViewportSize({width:390,height:844});
    if (outputDir) await page.screenshot({ path:path.join(outputDir, 'pass3-early-camp-mobile.png'), fullPage:true });
    await page.setViewportSize({width:1365,height:900});

    await page.evaluate(() => {
      gameState.hasCamp = true;
      gameState.phase = 'expedition';
      for (const id of ['smallFire','crudeLeanTo','workbench','researchSpot','practiceCircle','storageCache']) {
        const upgrade = getCampUpgrade(id); if (upgrade) { upgrade.unlocked = true; upgrade.purchased = true; }
      }
      refreshGameUIAfterLoad(); setMainView('home', {userSelected:true});
      document.getElementById('notificationStack').replaceChildren();
    });
    assert.equal(await page.locator('#homeClearingTitle').innerText(), 'The Clearing');
    assert(await page.locator('[data-home-area="campfire"]').isVisible(), 'established camp stations remain visible before relocation');
    if (outputDir) await page.screenshot({ path:path.join(outputDir, 'pass3-established-camp-desktop.png'), fullPage:true });
    await page.setViewportSize({width:390,height:844});
    if (outputDir) await page.screenshot({ path:path.join(outputDir, 'pass3-established-camp-mobile.png'), fullPage:true });
    await page.setViewportSize({width:1365,height:900});

    await page.evaluate(() => {
      gameState.towerHome = { relocated:true, legacyFuelNoticeShown:false, establishmentPresented:true };
      gameState.towerConstructionUnlocked = true;
      for (const id of ['towerFoundation','towerBasement','towerFloor1','towerFloor2','towerFloor3']) {
        Object.assign(getProjectState(id), {unlocked:true, completed:true, level:1});
      }
      for (const id of ['bedroom','workshop','forge','library','alchemyRoom','enchantingStudy','longRangeGate']) {
        Object.assign(getTowerRoomState(id), { unlocked:true, level:1, completed:id === 'longRangeGate' ? false : true });
      }
      window.__originalIsCraftAvailable = isCraftAvailable;
      isCraftAvailable = (type, id) => type === 'research' && id === 'manaCycling' ? true : window.__originalIsCraftAvailable(type, id);
      gameState.homeAttention = {seen:{crafting:[],research:[],training:[]}};
      refreshGameUIAfterLoad(); setMainView('home', {userSelected:true});
      document.getElementById('notificationStack').replaceChildren();
    });
    assert.equal(await page.evaluate(() => currentMainView), 'tower');
    assert.equal(await page.locator('#homeViewTab').innerText(), 'Tower Home');
    assert(!await page.locator('#towerViewTab').isVisible(), 'duplicate Tower top-level tab retires');
    assert.equal(await page.locator('#towerHomeTitle').innerText(), 'Tower Home');
    assert(await page.locator('#towerGroundsBtn').isVisible() && await page.locator('#towerExpeditionBtn').isVisible(), 'home destinations are obvious');
    assert(await page.locator('[data-tower-destination="room:library"]').evaluate(node => node.classList.contains('has-tower-attention')), 'research notification routes to Library');
    assert(await page.locator('#towerStructure [data-room="library"]').evaluate(node => node.classList.contains('has-tower-attention')), 'research notification appears on the illustrated Library');
    await page.locator('[data-tower-destination="room:library"]').click();
    assert.equal(await page.evaluate(() => gameState.tower.selectedId), 'room:library');
    assert(!await page.locator('[data-tower-destination="room:library"]').evaluate(node => node.classList.contains('has-tower-attention')), 'opening Library acknowledges its notification');
    await page.locator('[data-tower-destination="room:forge"]').click();
    assert(await page.getByText('Powered by the Tower Heart · No fuel required', {exact:true}).isVisible());
    assert(!await page.locator('#processingFuelSection').isVisible(), 'fuel controls remain absent');
    if (outputDir) await page.screenshot({ path:path.join(outputDir, 'pass3-tower-home-desktop.png'), fullPage:true });

    await page.locator('#towerGroundsBtn').click();
    assert.equal(await page.locator('#homeClearingTitle').innerText(), 'Tower Grounds');
    assert(await page.locator('[data-home-area="tower"]').isVisible());
    for (const retired of ['campfire','shelter','workbench','study','processing','meditation','training']) {
      assert(!await page.locator('[data-home-area="' + retired + '"]').isVisible(), retired + ' hotspot retired');
    }
    assert.equal(await page.locator('.home-camp-traces').getAttribute('aria-hidden'), 'true');
    if (outputDir) await page.screenshot({ path:path.join(outputDir, 'pass3-tower-grounds-desktop.png'), fullPage:true });

    await page.setViewportSize({width:390,height:844});
    if (outputDir) await page.screenshot({ path:path.join(outputDir, 'pass3-tower-grounds-mobile.png'), fullPage:true });
    await page.locator('[data-home-area="tower"]').click();
    assert(await page.locator('#towerRoomNav').isVisible());
    const navBox = await page.locator('#towerRoomNav').boundingBox();
    assert(navBox && navBox.width <= 390, 'mobile room navigation stays within viewport');
    await page.locator('[data-tower-destination="room:bedroom"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => gameState.tower.selectedId), 'room:bedroom', 'room shortcuts support keyboard activation');
    if (outputDir) await page.screenshot({ path:path.join(outputDir, 'pass3-tower-home-mobile.png'), fullPage:true });

    await page.evaluate(() => {
      gameState.towerHome.establishmentPresented = false;
      showTowerEstablishedPresentation();
    });
    assert(await page.locator('#towerEstablishedPopup').isVisible());
    assert.equal(await page.locator('#towerEstablishedPopup h2').innerText(), 'Tower Established');
    await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'towerEstablishedPopupTitle');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'towerEstablishedPopupTitle', 'move-in overlay receives focus');
    await page.locator('#towerEstablishedContinueBtn').click();
    await page.evaluate(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(createSaveData())); loadGame(); });
    assert(!await page.locator('#towerEstablishedPopup').isVisible(), 'move-in story does not repeat after reload');
    assert.deepEqual(errors, []);
    console.log('Tower home pass 3 browser checks passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
