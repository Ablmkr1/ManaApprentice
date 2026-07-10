function applyUnlock(unlock) {
  if (unlock.type === "resource") {
    unlockResource(unlock.id);
    return;
  }

  if (unlock.type === "action") {
    unlockAction(unlock.id);
    return;
  }

  if (unlock.type === "campUpgrade") {
    unlockCampUpgrade(unlock.id);
    return;
  }

  if (unlock.type === "panel") {
    unlockPanel(unlock.id);
    return;
  }

  console.warn("Unknown unlock type:", unlock.type);
}

function applyUnlocks(unlocks) {
  unlocks.forEach(applyUnlock);
}

// Hook Camp Upgrades to UI
function hookCampUpgradestoUI() {
  for (let upgradeName in campUpgrades) {
    const upgrade = campUpgrades[upgradeName];

    upgrade.button = document.getElementById(upgradeName + "Btn");
    upgrade.display = document.getElementById(upgradeName);

    if (upgrade.button) {
      upgrade.button.addEventListener("click", function () {
        buyCampUpgrade(upgradeName);
      });
    }

    updateCampUpgradeUI(upgradeName);
  }
}

function updateCampUpgradeUI(upgradeName) {
  const upgrade = campUpgrades[upgradeName];
  updateCampUpgradeDisplay(upgrade);
}

function setCampActionsAvailable(available) {
  if (available) {
    if (gameState.discoveredDeadfall) {
      unlockAction("gatherWood");
    }

    if (gameState.phase === "clearing") {
      unlockAction("explore");
    }

    ui.restBtn.style.display = "inline-block";
  } else {
    lockAction("gatherWood");
    lockAction("explore");
    ui.restBtn.style.display = "none";
  }
}

// Buy Camp Upgrade Function
function buyCampUpgrade(upgradeName) {
  const upgrade = campUpgrades[upgradeName];

  if (!upgrade || !upgrade.unlocked || upgrade.purchased) return;

  // Check and Spend Cost
  if (!spendCost(upgrade.cost)) return;

  upgrade.onComplete();
  upgrade.purchased = true;
  upgrade.unlocked = false;

  updateCampUpgradeUI(upgradeName);
  checkClearingComplete();
}

// Unlock Camp Upgrade Function
function unlockCampUpgrade(upgradeName) {
  const upgrade = campUpgrades[upgradeName];

  if (!upgrade) {
    console.warn("Unknown camp upgrade:", upgradeName);
    return;
  }

  upgrade.unlocked = true;
  updateCampUpgradeUI(upgradeName);
}

// Lock Camp Upgrade Function
function lockCampUpgrade(upgradeName) {
  const upgrade = campUpgrades[upgradeName];

  if (!upgrade) {
    console.warn("Unknown camp upgrade:", upgradeName);
    return;
  }

  upgrade.unlocked = false;
  updateCampUpgradeUI(upgradeName);
}

// Phase Helper
function setPhase(phaseName) {
  gameState.phase = phaseName;

  if (phaseName === "expedition") {
    lockAction("explore");

    applyUnlocks([
      { type: "panel", id: "expedition" },
      { type: "action", id: "packFood" },
      { type: "action", id: "packWater" },
      { type: "action", id: "beginExpedition" },
    ]);

    refreshExpeditionUI();
    updateDestinationActions();
  }
}

// Camp Upgrade Purchase Checker
function hasPurchasedCampUpgrade(upgradeName) {
  const upgrade = campUpgrades[upgradeName];

  return !!upgrade && upgrade.purchased;
}

// Check Clearing Complete Phase Helper
function checkClearingComplete() {
  const hasSmallFire = hasPurchasedCampUpgrade("smallFire");
  const hasCrudeLeanTo = hasPurchasedCampUpgrade("crudeLeanTo");

  if (gameState.phase === "clearing" && hasSmallFire && hasCrudeLeanTo) {
    setPhase("expedition");
    addStoryEntry("With fire and shelter established, the clearing feels less like a refuge and more like a camp. It is time to range farther.");
  }
}
