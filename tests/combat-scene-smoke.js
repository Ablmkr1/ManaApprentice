const { browserStubs, source } = require('./combat-content-smoke');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const test = String.raw`
let reduced = false;
function matchMedia() { return { matches: reduced }; }
let passed = 0;
function assert(value, message) { if (!value) throw new Error(message); passed++; }
const el = id => document.getElementById('combat' + id);
const has = (id, name) => el(id).className.includes(name);
const log = () => el('EventLog').children.map(n => n.textContent).join('\n');
const effects = () => el('Effects').children;
function tick(ms) { testGameTime += ms; processCombatTick(); }
function setup(enemy) {
  resetCombatEncounter(); testGameTime = 0;
  getArcaneForceProgressState().xp = 150;
  Object.assign(ensureArcaneForceRankTwoState(), { rank: 2, rankTwoLevel: 10, rankTwoXp: 500 });
  for (const name of ['mana', 'ward']) Object.assign(getResource(name), { value: 1000, maxValue: 1000 });
  startCombatEncounter(enemy);
}
function cast(id) { assert(startArcaneCombatCast(id), id + ' starts'); tick(gameState.combat.cast.endTime - testGameTime); }
updateLocationActions = updatePlacePanel = checkResearchDiscoveries = beginReturnToCamp = function () {};
for (const [enemy, region] of [['minorEarthElemental', 'north'], ['thornfang', 'east'], ['blightedBriar', 'south'], ['brokenWarden', 'west']]) {
  setup(enemy);
  assert(has('Scene', 'arena-' + region) && has('EnemyActor', 'enemy-' + enemy), 'Actor and region: ' + enemy);
  assert(el('EnemyArt').innerHTML.includes('<svg') && !el('EnemyArt').innerHTML.includes('undefined'), 'Local SVG art: ' + enemy);
  assert(!effects().length, 'New combat starts clean');
}
setup('thornfang');
for (const [value, state] of [[1000, 'healthy'], [450, 'low'], [200, 'critical'], [0, 'broken']]) {
  getResource('ward').value = value; renderCombatUI();
  assert(has('PlayerActor', 'ward-' + state), 'Ward state ' + state);
  assert(el('WardFill').style.width === value / 10 + '%', 'Ward bar agrees with state');
}
getResource('ward').value = 1000;
tick(4000);
assert(!el('Intent').hidden && el('IntentLabel').textContent === 'Preparing Pounce', 'Pounce intent from state');
assert(el('IntentTime').textContent === '3.0s' && has('Intent', 'is-interruptible'), 'Intent countdown and interruptibility');
assert(has('EnemyActor', 'preparing-pounce'), 'Persistent Pounce crouch');
cast('manaMissile'); tick(200);
assert(effects().filter(n => n.className.includes('spell-manaMissile')).length === 3, 'Three distinct Missile projectiles');
assert(new Set(effects().filter(n => n.className.includes('spell-manaMissile')).map(n => n.dataset.eventId)).size === 3, 'Hit identity preserved');
assert(log().includes('1/3') && log().includes('2/3') && log().includes('3/3'), 'Each Missile hit gets a log entry');
assert(log().includes('Pounce interrupted') && has('EnemyActor', 'is-staggered'), 'Interrupted posture and durable text');
const effectCount = effects().length;
renderCombatUI(); assert(effects().length === effectCount, 'Repeated render never replays effects');
assert(el('Intent').hidden, 'Interrupted intent hidden');
setup('blightedBriar'); tick(5000);
assert(el('Defenses').children.length === 3 && el('Conditions').children.some(n => n.textContent === '3 Protective Buds'), 'Buds are individual elements and text');
assert(!has('Intent', 'is-interruptible') && has('EnemyActor', 'preparing-regrowth'), 'Regrowth uses correct noninterruptible warning');
cast('manaMissile');
assert(el('Defenses').children.length === 2, 'First Missile removes one bud');
tick(100); assert(el('Defenses').children.length === 1, 'Second Missile removes one bud');
tick(100); assert(el('Defenses').children.length === 0, 'Third Missile removes last bud');
assert(effects().filter(n => n.className.includes('fx-absorbedHit')).length === 3, 'Three absorbed hit effects');
assert(log().split('destroyed a Protective Bud').length === 4, 'Three bud log entries without duplicate destruction events');
setup('blightedBriar'); gameState.combat.enemyHealth = 100; tick(10000);
assert(log().includes('Regrowth restored 30') && effects().some(n => n.className.includes('fx-healing')), 'Real healing produces feedback');
setup('brokenWarden'); tick(0);
assert(log().includes('Crushing Blow prepares') && has('EnemyActor', 'phase-armored'), 'Armored windup shown');
cast('manaLance');
assert(has('EnemyActor', 'phase-repair') && el('Defenses').children.length === 3, 'Shell break transitions to repair sigils');
assert(effects().some(n => n.className.includes('fx-shellBroken')) && log().includes('shell shattered'), 'Distinct shell break feedback');
cast('manaMissile'); assert(el('Defenses').children.length === 2, 'First sigil removed');
tick(100); assert(el('Defenses').children.length === 1, 'Second sigil removed');
tick(100);
assert(has('EnemyActor', 'phase-exposed') && el('Defenses').children.length === 0, 'Last sigil exposes core');
assert(el('Conditions').children.some(n => n.textContent === 'Core Exposed — 12.0s'), 'Exposed core countdown');
assert(log().split('destroyed a Repair Sigil').length === 4, 'Every sigil interaction retained');
const mechanics = JSON.stringify(gameState.combat); renderCombatUI();
assert(JSON.stringify(gameState.combat) === mechanics, 'Presentation never mutates combat state');
recallFromCombat();
assert(!effects().length && !el('EventLog').children.length && !el('Defenses').children.length, 'Recall clears effects, history and defenses');
setup('brokenWarden'); tick(0); assert(has('EnemyActor', 'phase-armored'), 'Repeated encounter restores actor state');
gameState.combat.enemyHealth = 1; cast('manaBolt');
assert(!effects().length && el('Outcome').textContent === 'Victory', 'Victory clears transients and presents result');
assert(log().includes('Victory'), 'Victory remains in event history');
closeCombatEncounter(); assert(!effects().length && !el('EventLog').children.length, 'Close clears visual state');
setup('thornfang'); getResource('ward').value = 1; tick(3000);
assert(!effects().length && el('Outcome').textContent.includes('Ward broken'), 'Defeat cleans effects and announces Ward break');
setup('thornfang'); endCombatForRecall();
assert(!effects().length && el('Outcome').textContent === 'Recalled to Camp', 'External Recall cleans effects');
setup('blightedBriar'); reduced = true; tick(5000); cast('manaMissile'); tick(200);
assert(has('Scene', 'reduced-motion'), 'Reduced motion state');
assert(effects().filter(n => n.className.includes('spell-manaMissile')).every(n => n.className.includes('is-static')), 'Reduced motion uses static feedback for every hit');
assert(log().includes('1/3') && log().includes('3/3'), 'Reduced motion retains individual text interactions');
const effect = effects()[0]; effect.listeners.animationend({ target: effect });
assert(!effects().includes(effect), 'Animation completion removes effect node');
assert(el('EventLog').children.length <= 6, 'Durable history stays bounded');
console.log('Combat scene smoke checks passed (' + passed + ').');
`;
vm.runInNewContext(browserStubs + '\n' + source + '\n' + test, { console, structuredClone, setTimeout, clearTimeout });
const css = fs.readFileSync(path.join(__dirname, '../combat-scene.css'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
assert(css.includes('@media (prefers-reduced-motion: reduce)') && css.includes('animation: none !important'), 'Motion has a CSS fallback');
assert(!/id="combatPanel"[^>]*aria-live/.test(html), 'Whole scene does not flood live region');
assert(/id="combatAnnouncement"[^>]*role="status"/.test(html), 'Dedicated major-event live region');
