const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const files = [
  "state.js",
  "expeditionData.js",
  "content.js",
  "definitions.js",
  "resources.js",
  "skills.js",
  "camp.js", "equipment.js",
  "expedition.js",
  "actions.js",
  "combat.js",
  "combat-scene.js",
  "save.js",
];

const browserStubs = `
const emptyClassList = { add() {}, remove() {}, toggle() {} };
function combatElement() {
  const el = { style: { setProperty(k, v) { this[k] = v; } }, dataset: {}, children: [], attributes: {}, listeners: {}, className: '', textContent: '',
    addEventListener(type, fn) { this.listeners[type] = fn; }, querySelector() { return null; },
    setAttribute(k, v) { this.attributes[k] = v; },
    append(...nodes) { nodes.forEach(node => { node.parent = this; this.children.push(node); }); },
    appendChild(node) { this.append(node); },
    replaceChildren(...nodes) { this.children.forEach(n => n.parent = null); this.children = []; this.append(...nodes); },
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); this.parent = null; }
  };
  el.classList = { add(name) { el.className += ' ' + name; }, remove(name) { el.className = el.className.split(' ').filter(n => n !== name).join(' '); },
    contains(name) { return el.className.split(' ').includes(name); }, toggle(name, on) { if (on) this.add(name); else this.remove(name); } };
  return el;
}
const ui = {
  combatPanel: combatElement(), combatEnemyName: combatElement(), combatEnemyHealthText: combatElement(),
  combatEnemyHealthFill: combatElement(), combatWardText: combatElement(), combatAttackTimer: combatElement(),
  combatStatus: combatElement(), combatRecallBtn: combatElement(), closeCombatBtn: combatElement(),
  manaBoltBtn: combatElement(), manaBoltProgressFill: combatElement(),
  manaMissileBtn: combatElement(), manaMissileProgressFill: combatElement(),
  manaLanceBtn: combatElement(), manaLanceProgressFill: combatElement(),
};
const resourceElements = {};
let testGameTime = 1000;
function getGameTime() { return testGameTime; }
function updateResource() {}
function unlockResource(name) { discoverResource(name); }
function safeSetText(element, value) { if (element) element.textContent = value; }
function updateAllResources() {}
function updateTrainingUI() {}
function updateEquipmentSlotUI() {}
function updateAllActionButtons() {}
function updateCraftingButtons() {}
function updateLocationStorageUI() {}
function updateCampResourcesSectionVisibility() {}
function updateExpeditionUI() {}
function updateCurrentGoalUI() {}
function updateWorkTabsVisibility() {}
function updateExpeditionLoadoutVisibility() {}
function syncMainViewAvailability() {}
function refreshExpeditionUI() {}
function refreshBoundEarthElementalUI() {}
function addStoryEntry() {}
function addJournalEntry() {}
function announceUiStatus() {}
function showElement() {}
function hideElement() {}
const localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const sceneElements = {};
const document = { querySelector() { return null; }, createElement() { return combatElement(); },
  getElementById(id) { return ui[id] || (sceneElements[id] ||= combatElement()); } };
`;

const tests = String.raw`
(function () {
  let passed = 0;
  function assert(value, message) { if (!value) throw new Error(message); passed++; }
  function near(a, b) { return Math.abs(a - b) < 0.0001; }
  function tick(ms) { testGameTime += ms; processCombatTick(); }
  function rank(level) {
    getArcaneForceProgressState().xp = 150;
    const force = ensureArcaneForceRankTwoState();
    force.rank = level < 0 ? 1 : 2;
    force.rankTwoLevel = Math.max(0, level);
    force.rankTwoXp = Math.max(0, level) * 50;
  }
  function setup(enemy, level = 10, mana = 1000, ward = 1000) {
    resetCombatEncounter();
    testGameTime = 0;
    rank(level);
    getGearUpgrade('ironStaff').purchased = false;
    getGearUpgrade('steelStaff').purchased = false;
    getResource('mana').maxValue = mana; getResource('mana').value = mana;
    getResource('ward').maxValue = ward; getResource('ward').value = ward;
    assert(startCombatEncounter(enemy), 'Encounter starts: ' + enemy);
  }
  function cast(id) {
    assert(startArcaneCombatCast(id), 'Can cast ' + id);
    tick(gameState.combat.cast.endTime - testGameTime);
    if (id === 'manaMissile') tick(200);
  }
  function events(type) { return gameState.combat.events.filter(e => e.type === type); }
  function clean() {
    const c = gameState.combat;
    return !c.cast && !c.intent && !c.ability && !c.pendingHits.length && !Object.keys(c.conditions).length && !c.nextAttackTime && !c.nextAbilityTime;
  }
  // Real reward and return paths; only browser refresh hooks are inert.
  updateLocationActions = function () {};
  updatePlacePanel = function () {};
  checkResearchDiscoveries = function () {};
  beginReturnToCamp = function () {};
  setup('minorEarthElemental', -1, 30, 15);
  gameState.combat.storyEncounter = true;
  gameState.combat.reward = COMBAT_CONFIG.enemies.minorEarthElemental.reward;
  gameState.northernDisturbance = { triggered: true, resolved: false };
  const coreStart = getResource('earthElementalCore').value;
  isManaControlSystemEnabled = function () { return true; };
  gameState.magicUnlocked = true;
  const controlStart = getSkillState("manaControl").manaSpent || 0;
  assert(getArcaneCombatDamage('manaBolt') === 10, 'Base Bolt fixed 10');
  assert(getArcaneCombatManaCost('manaBolt') === 10 && getArcaneCombatCastTime('manaBolt') === 2, 'Base Bolt cost and duration');
  assert(!isManaMissileUnlocked() && !isManaLanceUnlocked(), 'Tutorial only unlocks Bolt');
  assert(startManaBoltCast(), 'First tutorial Bolt starts');
  tick(1999);
  completeManaBoltCast();
  assert(gameState.combat.enemyHealth === 30, 'No damage before cast completion, including direct completion calls');
  tick(1);
  assert(gameState.combat.enemyHealth === 20, 'First Bolt deals exactly 10');
  cast('manaBolt');
  assert(gameState.combat.enemyHealth === 10, 'Two Bolts leave exactly 10 health');
  cast('manaBolt');
  assert(gameState.combat.enemyHealth === 0 && gameState.combat.resolved, 'Exactly three Bolts defeat tutorial');
  assert(getResource('ward').value === 9 && events('wardDamage').length === 2, 'Tutorial costs six Ward');
  assert(getResource('mana').value === 0, 'Tutorial uses exactly 30 mana');
  assert(getSkillState("manaControl").manaSpent - controlStart === 30, 'Mana Control XP equals actual cast spend');
  assert(events('intentStarted').length === 0, 'Tutorial has no special ability');
  assert(gameState.northernDisturbance.resolved && getResource('earthElementalCore').value > coreStart && getGearUpgrade('ironStaff').unlocked, 'First victory preserves core, progression and Iron Staff unlock');
  assert(clean(), 'Victory clears all pending mechanics');
  const victoryEvents = events('wardDamage').length;
  tick(100000);
  assert(events('wardDamage').length === victoryEvents, 'Dead enemy never attacks');

  setup('thornfang', 3, 60, 40);
  getGearUpgrade('ironStaff').purchased = true;
  for (let i = 0; i < 6; i++) cast('manaBolt');
  assert(gameState.combat.resolved && gameState.combat.enemyHealth === 0, 'Six prepared Bolts defeat Thornfang');
  assert(getResource('ward').value >= 12 && getResource('ward').value <= 20, 'Baseline Thornfang costs 20–28 Ward');
  setup('thornfang');
  tick(3999); assert(!gameState.combat.intent, 'Pounce does not warn before 4 seconds');
  tick(1); assert(gameState.combat.intent.id === 'pounce' && gameState.combat.intent.resolveTime === 7000, 'Pounce warns at four seconds for three seconds');
  tick(3000);
  assert(events('wardDamage').filter(e => e.source === 'pounce').length === 1, 'Pounce deals damage at seven seconds');
  assert(events('wardDamage').find(e => e.source === 'pounce').damage === 12, 'Pounce fixed damage is 12');
  assert(!events('wardDamage').some(e => e.time === 7000 && e.source === 'basicAttack'), 'Pounce replaces rather than overlaps a normal attack');
  tick(7000); assert(gameState.combat.intent?.id === 'pounce', 'Next Pounce preparation starts at 14 seconds');
  setup('thornfang', 5);
  tick(4000); cast('manaMissile');
  assert(events('abilityInterrupted').length === 1 && gameState.combat.conditions.staggered, 'Three Missile hits during warning interrupt and stagger');
  assert(events('hit').length === 3 && events('hit')[2].time - events('hit')[0].time === 200, 'Missile hits remain separate with deterministic 100ms spacing');
  tick(4000);
  assert(!events('wardDamage').some(e => e.source === 'pounce') && !gameState.combat.conditions.staggered, 'Interrupted Pounce stays canceled and stagger expires');
  setup('thornfang', 5); tick(1500); cast('manaMissile'); tick(3000);
  assert(events('abilityInterrupted').length === 0 && events('wardDamage').some(e => e.source === 'pounce'), 'Hits outside the warning cannot count toward interruption');

  setup('blightedBriar', 5);
  tick(5000);
  assert(gameState.combat.conditions.buds.count === 3 && gameState.combat.intent.resolveTime === 10000, 'Three buds and five-second Regrowth warning at five seconds');
  const briarHealth = gameState.combat.enemyHealth;
  cast('manaMissile');
  assert(!gameState.combat.conditions.buds && gameState.combat.enemyHealth === briarHealth && events('absorbedHit').length === 3, 'One Missile absorbs three hits, clearing all buds without health damage');
  tick(10000 - testGameTime);
  assert(events('healing')[0].healing === 0, 'Cleared buds prevent Regrowth healing');
  tick(9000);
  assert(gameState.combat.conditions.buds.count === 3, 'Second bud cycle occurs at nineteen seconds');
  setup('blightedBriar', 5); gameState.combat.enemyHealth = 100; tick(5000); cast('manaBolt'); tick(3000);
  assert(gameState.combat.enemyHealth === 120 && events('healing')[0].survivingBuds === 2 && !gameState.combat.conditions.buds, 'Regrowth heals ten per surviving bud and removes buds');
  setup('blightedBriar'); gameState.combat.enemyHealth = 195; tick(10000);
  assert(gameState.combat.enemyHealth === 200 && events('healing')[0].healing === 5, 'Regrowth cannot exceed maximum health');
  recallFromCombat(); assert(clean() && !gameState.combat.events.length, 'Recall clears buds, intent, pending work and history');
  setup('blightedBriar'); assert(!gameState.combat.conditions.buds && !gameState.combat.intent, 'Repeat Briar starts without old mechanics');

  setup('brokenWarden'); tick(0);
  assert(gameState.combat.phase === 'armored' && gameState.combat.intent.id === 'crushingBlow' && gameState.combat.intent.resolveTime === 5000, 'Warden opens armored with five-second Crushing Blow warning');
  cast('manaBolt');
  assert(gameState.combat.enemyHealth === 842.5 && gameState.combat.shellBreakDamage === 7.5, 'Armored Bolt deals 25% health and shell-break damage');
  cast('manaLance');
  assert(gameState.combat.phase === 'repair' && gameState.combat.conditions.repairSigils.count === 3, 'Cap Lance breaks shell and creates three sigils');
  assert(gameState.combat.enemyHealth === 824.5 && events('shellBroken')[0].shellBreakDamage === 79.5, 'Lance bypasses armor for shell progress only');
  assert(events('abilityInterrupted').some(e => e.intentId === 'crushingBlow') && !events('wardDamage').length, 'Shell break cancels pending Crushing Blow');
  cast('manaMissile');
  assert(gameState.combat.phase === 'exposed' && !gameState.combat.intent && events('sigilDestroyed').length === 3, 'Missile destroys separate sigils and exposes core');
  const exposedEnd = gameState.combat.phaseEndTime;
  assert(exposedEnd === testGameTime + 12000, 'Core exposure lasts twelve seconds from final sigil');
  const exposedHealth = gameState.combat.enemyHealth;
  cast('manaBolt'); assert(gameState.combat.enemyHealth === exposedHealth - 30, 'Exposed core takes full Bolt damage');
  tick(exposedEnd - testGameTime - 1); assert(gameState.combat.phase === 'exposed', 'Core stays exposed until deadline');
  tick(1); assert(gameState.combat.phase === 'armored' && gameState.combat.shellBreakDamage === 0 && gameState.combat.intent.id === 'crushingBlow', 'Shell restores and next warning starts at exposure expiry');
  setup('brokenWarden'); cast('manaLance'); cast('manaBolt');
  assert(gameState.combat.conditions.repairSigils.count === 2, 'Bolt destroys one repair sigil');
  tick(gameState.combat.intent.resolveTime - testGameTime);
  assert(gameState.combat.phase === 'armored' && !gameState.combat.conditions.repairSigils, 'Surviving sigils restore armor after five seconds');
  setup('brokenWarden'); tick(5000);
  assert(events('wardDamage').length === 1 && events('wardDamage')[0].damage === 18, 'Uninterrupted Crushing Blow fixed 18, no basic overlap');
  tick(4000); assert(events('wardDamage')[1].damage === 8, 'Basic cadence resumes four seconds after Crushing Blow');
  setup('brokenWarden');
  for (let i = 0; i < 8; i++) cast('manaBolt');
  assert(events('shellBroken').length === 1, 'Eight cap Bolts can break shell without Lance');
  setup('brokenWarden');
  for (let i = 0; i < 7; i++) cast('manaMissile');
  assert(events('shellBroken').length >= 1, 'Missile can eventually break shell');
  setup('brokenWarden'); cast('manaLance');
  for (let i = 0; i < 3; i++) cast('manaBolt');
  assert(gameState.combat.phase === 'exposed', 'Three cap Bolts can clear sigils inside five-second repair window');
  setup('brokenWarden'); cast('manaLance'); cast('manaMissile');
  gameState.combat.enemyHealth = 1;
  cast('manaBolt');
  assert(gameState.brokenWardenDefeated && gameState.tierFourCompleted && clean(), 'Boss victory persists milestone and clears mechanics');
  setup('brokenWarden'); cast('manaLance'); startManaMissileCast(); recallFromCombat();
  assert(clean() && !gameState.combat.events.length, 'Boss Recall cancels pending cast, sigils, and attacks');
  setup('brokenWarden', 10, 100, 10); tick(5000);
  assert(gameState.combat.resolved && clean(), 'Ward defeat clears boss mechanics');
  setup('brokenWarden'); startManaMissileCast(); endCombatForRecall(); assert(clean(), 'External expedition Recall also cleans pending mechanics');
  setup('brokenWarden');
  const savedCombat = createGameStateSaveData();
  assert(!savedCombat.combat && savedCombat.brokenWardenDefeated && savedCombat.tierFourCompleted, 'Save preserves milestone but omits transient combat');
  gameState.brokenWardenDefeated = false; gameState.tierFourCompleted = false;
  applyGameStateSaveData(savedCombat);
  assert(gameState.brokenWardenDefeated && gameState.tierFourCompleted, 'Load restores western milestone');
  resetCombatEncounter();
  gameState.expedition.dungeon = { active: true, dungeonId: 'arcaneArchiveDepths', nodeId: 'deepRepository' };
  getCurrentDungeonNode().explored = false;
  assert(!canChallengeBrokenWarden(), 'Boss gate rejects unexplored final room');
  getCurrentDungeonNode().explored = true;
  rank(-1);
  assert(canChallengeBrokenWarden(), 'Existing completed repository save gains gate with no new spell lock');
  assert(startBrokenWardenCombat(), 'Final western gate starts repeat boss');

  setup('minorEarthElemental');
  getGearUpgrade('steelStaff').purchased = true;
  assert(getArcaneCombatDamage('manaBolt') === 30 && getArcaneCombatDamage('manaMissile') === 12 && getArcaneCombatDamage('manaLance') === 72, 'All Tier 4 damage targets are fixed');
  assert(near(getArcaneCombatManaCost('manaBolt'), 6.4) && near(getArcaneCombatManaCost('manaMissile'), 7.04) && near(getArcaneCombatManaCost('manaLance'), 10.24), 'Existing multiplicative cost modifiers remain exact');
  assert(near(getArcaneCombatCastTime('manaBolt'), 1.230769) && near(getArcaneCombatCastTime('manaMissile'), 1.476923) && near(getArcaneCombatCastTime('manaLance'), 1.846154), 'Existing multiplicative cast speed modifiers remain exact');
  cast('manaBolt'); assert(gameState.combat.resolved, 'Progressed player rapidly defeats early repeat encounter');

  for (const [id, health, interval, damage] of [['minorEarthElemental', 30, 2.5, 3], ['thornfang', 96, 3, 4], ['blightedBriar', 200, 4, 6], ['brokenWarden', 850, 4, 8]]) {
    const e = COMBAT_CONFIG.enemies[id];
    assert(e.maxHealth === health && e.attackIntervalSeconds === interval && e.attackDamage === damage, 'Fixed enemy configuration: ' + id);
  }
  assert(COMBAT_CONFIG.spells.manaMissile.damage === 8 && COMBAT_CONFIG.spells.manaMissile.manaCost === 11 && COMBAT_CONFIG.spells.manaMissile.castTimeSeconds === 2.4, 'Missile base values');
  assert(COMBAT_CONFIG.spells.manaLance.damage === 24 && COMBAT_CONFIG.spells.manaLance.manaCost === 16 && COMBAT_CONFIG.spells.manaLance.castTimeSeconds === 3, 'Lance base values');
  function snapshot(step) {
    setup('thornfang', 5);
    tick(4000); startManaMissileCast();
    for (let t = 0; t < 13000; t += step) tick(Math.min(step, 13000 - t));
    return JSON.stringify({ events: gameState.combat.events, health: gameState.combat.enemyHealth, ward: getResource('ward').value, mana: getResource('mana').value });
  }
  assert(snapshot(50) === snapshot(13000), 'Fine and delayed ticks produce identical hits, interrupts, attack chronology and resource totals');
  setup('thornfang', 5, 100, 1); tick(2000); startManaMissileCast(); tick(3000);
  assert(gameState.combat.resolved && near(getResource('mana').value, 100 - 11 / 2.4), 'Delayed lethal attack still charges only the mana committed before defeat');
  setup('minorEarthElemental'); gameState.combat.enemyHealth = 1; cast('manaMissile');
  assert(events('hit').length === 1 && clean(), 'First lethal Missile hit cancels remaining hits');
  setup('blightedBriar'); tick(5000); endCombatForRecall(); assert(clean(), 'External Recall clears Regrowth and buds');
  applyGameStateSaveData({});
  assert(!gameState.brokenWardenDefeated && !gameState.tierFourCompleted, 'Old saves default western milestone flags safely');

  const pacing = [];
  for (const [enemy, level, staff] of [['blightedBriar', 5, 'ironStaff'], ['brokenWarden', 10, 'steelStaff']]) {
    setup(enemy, level);
    getGearUpgrade(staff).purchased = true;
    let casts = 0;
    while (isCombatActive() && casts++ < 100) {
      const c = gameState.combat;
      const technique = c.phase === 'armored' ? 'manaLance' :
        c.conditions.buds?.count || c.conditions.repairSigils?.count ? 'manaMissile' : 'manaBolt';
      cast(technique);
    }
    assert(gameState.combat.enemyHealth === 0, 'Intended strategy defeats ' + enemy);
    const seconds = testGameTime / 1000;
    assert(enemy === 'brokenWarden' ? seconds >= 45 && seconds <= 60 : seconds >= 23 && seconds <= 30, 'Intended fight pacing: ' + enemy);
    pacing.push({ enemy, seconds: testGameTime / 1000, mana: 1000 - getResource('mana').value, ward: 1000 - getResource('ward').value });
  }
  console.log(JSON.stringify({ passed, pacing }));
})();
`;
const source = files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
if (require.main === module) vm.runInNewContext(browserStubs + '\n' + source + '\n' + tests, { console, structuredClone, setTimeout, clearTimeout });
module.exports = { browserStubs, source };

