const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
// Keep the established browser stubs identical to the steel/combat integration suite.
const source = fs.readFileSync(path.join(__dirname, 'steelworking-smoke.js'), 'utf8');
const stubs = source.split('const browserStubs = `')[1].split('`;')[0];
module.exports = function run(test) {
  const files = ['state.js', 'expeditionData.js', 'content.js', 'definitions.js', 'resources.js', 'skills.js', 'camp.js', 'equipment.js', 'expedition.js', 'actions.js', 'combat.js', 'save.js'];
  const setup = `
    updateCraftingUIForCurrentContext = function() {};
    updateDungeonUI = function() {};
    normalizeBoundEarthElementalAssignments = function() {};
    ensureEquipmentCollection();
    function assert(ok, message) { if (!ok) throw Error(message); passed++; }
    function near(a,b) { return Math.abs(a-b) < 0.00001; }
    function funds() { Object.values(getResourceDefinitions()).forEach(r => { r.maxValue = Math.max(r.maxValue, 10000); r.value = 5000; }); }
    function room(id, level) { Object.assign(getTowerRoomState(id), { level, completed: level === 2, unlocked: true }); }
    function finish(op) { assert(startEquipmentOperation(op), 'start ' + JSON.stringify(op)); const paid = structuredClone(gameState.activity.context); const ok = completeEquipmentOperation(paid); resetActivity(); syncEquippedBaseStats(); recalculateCharacterStats(); return {ok, paid}; }
    function seed(baseGearId, family=null, grade='standard') { const c=ensureEquipmentCollection(); const i={id:'gear-'+c.nextId++,baseGearId,family,grade}; c.items.push(i); return i; }
    function ring(core, rune=null, grade='standard') { const c=ensureEquipmentCollection(); const i={id:'gear-'+c.nextId++,core,rune,grade}; c.items.push(i); return i; }
    let passed=0;
  `;
  vm.runInNewContext(stubs + files.map(file => fs.readFileSync(path.join(root,file),'utf8')).join('\n') + setup + test, { console, structuredClone, setTimeout, clearTimeout, Date, Math, Map, Set }, { filename: 'overhaul.vm.js' });
};
