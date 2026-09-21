// Run with tests/serve-preview.cjs and Playwright on NODE_PATH. All saves use
// the existing disposable QA key; the real player save is never loaded.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.WEST_SCREENSHOT_DIR || path.join(__dirname, 'west-screenshots');
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
          Object.assign(getExpeditionLocation(id), { discovered: true, explored, explorationProgress: explored ? getExpeditionLocation(id).explorationRequired : 0 });
          setCurrentLocation(id); lockAction('travel'); unlockAction('returnToCamp'); setPackingActionsAvailable(false);
          this.refresh();
        },
        advance(fraction = 1) {
          gameState.activity.startTime = getGameTime() - Math.ceil(gameState.activity.duration * 1000 * fraction) - (fraction >= 1 ? 1 : 0);
          processActivityTick(); ExpeditionScene.render();
        },
      };
      expeditionQA.camp(); selectRegion('west'); ExpeditionScene.render();
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
      await page.evaluate(()=>window.scrollTo(0,0));
      return root.screenshot({ path: path.join(output, name + '.png'), style: '.top-bar, #mainViewTabs, .notification-stack, .notification-toast { visibility: hidden !important; }' });
    };
    const snapshot = () => page.evaluate(() => JSON.stringify({ expedition: gameState.expedition, activity: gameState.activity, resources: Object.fromEntries(Object.entries(getResourceDefinitions()).map(([id, r]) => [id, r.value])) }));
    const visible = async locator => assert(await locator.isVisible(), 'visible: ' + locator);

    await page.evaluate(() => {
      gameState.archiveDoorOpened=false; Object.assign(getLocationObject('arcaneArchive','sealedArchiveDoor'),{progress:0,spellCharges:{},manaSenseCharges:0});
      Object.assign(getTowerNodeState('west'),getDefaultTowerNodeState('west'));
      for(const id of ['roadsideRuin','silentGearworks','arcaneArchive'])getExpeditionLocation(id).discovered=false;
      Object.assign(getExpeditionLocation('roadsideRuin'),{discovered:true,explored:false});expeditionQA.refresh();
    });
    assert.equal(await marker('roadsideRuin').count(),1);assert.equal(await marker('arcaneArchive').count(),0);
    await visible(action('beginExpedition'));let before=await snapshot();await chooseMarker('roadsideRuin');assert.equal(await snapshot(),before);await shot('map-early-desktop');
    await page.setViewportSize({width:390,height:844});await shot('map-early-mobile');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1360,height:1000});
    for(const id of ['roadsideRuin','silentGearworks','arcaneArchive']){
      await page.evaluate(id=>expeditionQA.location(id,false),id);assert.equal(await marker('node').count(),0);assert.equal(await page.locator('.expedition-node-overlay').count(),0);
      await chooseMarker('survey');await shot(id+'-before');
      const count=await page.evaluate(id=>getExpeditionLocation(id).explorationRequired,id);
      for(let i=0;i<count;i++){await action('exploreLocation').click();await page.evaluate(()=>expeditionQA.advance());}
      assert((await marker('survey').getAttribute('class')).includes('is-complete'));await shot(id+'-explored');
      await chooseMarker(id==='arcaneArchive'?'door':'entrance');await shot(id+'-entrance');
      assert.equal(await page.evaluate(id=>canEnterLocationDungeon(id),id),id!=='arcaneArchive');
      if(id!=='arcaneArchive'){
        await action('enterDungeon').click();await page.evaluate(()=>{if(isActivityActive())expeditionQA.advance();});assert.equal(await page.evaluate(()=>ExpeditionScene.mode()),'dungeon');
        await action('leaveDungeon').click();await page.evaluate(()=>{if(isActivityActive())expeditionQA.advance();});assert.equal(await page.evaluate(()=>ExpeditionScene.mode()),'location');
      }
    }
    await page.evaluate(()=>{const o=getLocationObject('arcaneArchive','sealedArchiveDoor');o.progress=0;o.spellCharges={};o.manaSenseCharges=0;expeditionQA.refresh();});
    await chooseMarker('door');
    await panel.getByRole('button',{name:/Cast Mana Sense/}).click();await page.evaluate(()=>{expeditionQA.advance();expeditionQA.refresh();});
    await page.evaluate(()=>{expeditionQA.camp();expeditionQA.location('arcaneArchive');});
    assert(await page.evaluate(()=>Object.values(getLocationObject('arcaneArchive','sealedArchiveDoor').spellCharges).every(v=>v===0)),'charges reset on leaving');
    await chooseMarker('door');
    await shot('archive-ritual-ready');
    await page.setViewportSize({width:390,height:844});await shot('archive-ritual-mobile');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1360,height:1000});
    for(const spell of ['Mana Sense','Arcane Force','Imbue','Attunement']){
      await panel.getByRole('button',{name:new RegExp('Cast '+spell)}).click();
      await panel.evaluate(n=>n.scrollTop=50);const scroll=await panel.evaluate(n=>n.scrollTop);
      await page.evaluate(()=>{window.westFocus=document.activeElement;expeditionQA.advance(.5);for(let i=0;i<10;i++)ExpeditionScene.render();});
      assert(await page.evaluate(()=>document.activeElement===window.westFocus));assert.equal(await panel.evaluate(n=>n.scrollTop),scroll);
      await page.evaluate(()=>{expeditionQA.advance();expeditionQA.refresh();});assert.equal(await marker('door').getAttribute('aria-pressed'),'true');await shot('archive-ritual-'+spell.replaceAll(' ','-'));
    }
    await panel.locator('[data-location-object="sealedArchiveDoor"]').click();await page.evaluate(()=>{expeditionQA.advance();expeditionQA.refresh();});
    assert(await page.evaluate(()=>gameState.archiveDoorOpened));assert.equal(await marker('door').getAttribute('aria-pressed'),'true');await shot('archive-open');
    await action('enterDungeon').click();await page.evaluate(()=>{if(isActivityActive())expeditionQA.advance();});assert.equal(await page.evaluate(()=>ExpeditionScene.mode()),'dungeon');
    await action('leaveDungeon').click();await page.evaluate(()=>{if(isActivityActive())expeditionQA.advance();});assert.equal(await page.evaluate(()=>ExpeditionScene.mode()),'location');
    for(const [state,flags] of [['discovered',{activated:true,researchUnlocked:false,built:false}],['unbuilt',{activated:true,researchUnlocked:true,built:false}],['built',{activated:true,researchUnlocked:true,built:true}]]){
      await page.evaluate(flags=>{Object.assign(getTowerNodeState('west'),flags);if(flags.built){const n=getTowerNodeState('west');n.deposits={...getTowerNodeDefinition('west').materials};n.imbueProgress=getTowerNodeDefinition('west').imbueRequired;}expeditionQA.refresh();},flags);
      await chooseMarker('node');assert.equal(await page.locator('#expeditionSurface').getAttribute('data-node-state'),state);assert((await page.locator('#expeditionDetailInfo').innerText()).includes('Western'));await shot('archive-node-'+state);
    }
    await page.setViewportSize({width:390,height:844});
    for(const [id,hotspot] of [['roadsideRuin','entrance'],['silentGearworks','entrance'],['arcaneArchive','door'],['arcaneArchive','node']]){
      await page.evaluate(id=>expeditionQA.location(id),id);await chooseMarker(hotspot);await shot(id+'-'+hotspot+'-mobile');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    before=await snapshot();await page.locator('#expeditionBrowse').click();await chooseMarker('silentGearworks');assert.equal(await snapshot(),before);assert.equal(await action('enterDungeon').isVisible(),false);await shot('map-known-mobile');
    await page.evaluate(()=>expeditionQA.location('roadsideRuin'));assert.equal(await page.locator('#westArchiveRitual').isVisible(),false);
    assert.deepEqual(errors,[]);console.log('West focused checks passed');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});


