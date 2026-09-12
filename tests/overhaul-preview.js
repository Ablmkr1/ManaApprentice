// Disposable preview: served with a separate save key and all saving suppressed.
window.addEventListener('load', () => {
saveSuppressed = true;
jumpToDevTier(4.5);
gameState.equipment = newEquipmentCollection();
const previewCollection = gameState.equipment;
for (const [slot, baseGearId, family] of [
  ['chest','leatherShirt','reservoirWeave'], ['legs','leatherPants','resistingWeave'],
  ['feet','travelBoots','swiftstep'], ['pack','repairedLeatherBackpack','expansive'], ['belt','reinforcedTonicBelt','potency']
]) {
  const item = {id:'gear-'+previewCollection.nextId++,baseGearId,family,grade:'standard'};
  previewCollection.items.push(item); previewCollection.equipped[slot]=item.id;
}
for (const slot of ['leftRing','rightRing']) {
  const item={id:'gear-'+previewCollection.nextId++,core:'mana',grade:'standard',rune:null};
  previewCollection.items.push(item);previewCollection.equipped[slot]=item.id;
}
previewCollection.items.push({id:'gear-'+previewCollection.nextId++,baseGearId:'leatherShirt',family:null,grade:'standard'});
syncEquippedBaseStats(); recalculateCharacterStats();
gameState.tower.selectedId='room:enchantingStudy';
refreshGameUIAfterLoad();
});
