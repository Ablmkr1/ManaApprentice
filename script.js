
const introPopup = document.getElementById("introPopup");
const continueBtn = document.getElementById("continueBtn");

const resources = {
    Energy: {
        label: "Energy",
        value: 0,
        maxValue: 10,
        perClick: 1,
        perSecond: 0,
        display: null,
        perClickDisplay: null,
        perSecondDisplay: null,
    },
    health: {
        label: "Health",
        value: 0,
        maxValue: 100,
        perClick: 10,
        perSecond: 0,
        display: null,
        perClickDisplay: null,
        perSecondDisplay: null,
    }
};

const upgrades = {
    EnergyFocus: {
        label: "Cardio",
        cost: 10,
        costMultiplier: 1.5,
        effect: function () {
            resources.Energy.perSecond += 1;
        },
        display: null,
    },
    healthHabit: {
        label: "Build Habit",
        cost: 10,
        costMultiplier: 1.5,
        effect: function () {
            resources.health.perSecond += 1;
        },
        display: null,
    }
};

const actions = {
    explore: {
        label: "Explore",
        duration: 5,
        cost: {
            Energy: 10
        },
        unlocked: true,
        running: false,

        button: null,
        progressBar: null,

        complete: function () {}
    },

    catchBreath: {
        label: "Catch Breath",
        duration: 1,
        cost: {
            Energy: -1
        },
        unlocked: true,
        running: false,

        button: null,
        progressBar: null,

        complete: function () {}
    }
};


window.onload = function () {
  

  //Hook to UI Function
    function hookStatsToUI () {
        for (let resourceName in resources) {
            const resource = resources[resourceName];

            resource.display = document.getElementById(resourceName + "Amount");
            resource.perClickDisplay = document.getElementById(resourceName + "PerClickDisplay");
            resource.perSecondDisplay = document.getElementById(resourceName + "PerSecondDisplay");

        };

    };

    function hookUpgradesToUi () {
        for (let upgradeName in upgrades) {
            const upgradeUI = upgrades[upgradeName];

            upgradeUI.display = document.getElementById(upgradeName + "UpgradeText");

            console.log(upgradeName, upgradeUI.display);
        }
    };

  //Add Resource Function
    function addResource(resourceName, amount) {
        const resource = resources[resourceName];

        resource.value += amount;
        if (resource.value >= resource.maxValue) {
            resource.value = resource.maxValue;
        }

        updateResource(resourceName);
        
    }


  //Reusable Upgrade Function
    function buyUpgrade(upgradeName) {
        console.log("Buying Upgrade:", upgradeName);
        console.log(upgrades[upgradeName]);
        
        const upgrade = upgrades[upgradeName];

        const resourceKey =
        upgradeName === "EnergyFocus" ? "Energy" : "health";

        const resource = resources[resourceKey];

        if (resource.value >= upgrade.cost) {
            resource.value -= upgrade.cost;

            upgrade.effect();

            upgrade.cost = Math.floor(upgrade.cost * upgrade.costMultiplier);

            upgrade.display.textContent =
            `(+1 ${resourceKey}/sec) - Cost: ${upgrade.cost}`;

            updateResource(resourceKey);
        }

    };

  //State Engine
    const gameState = {
        resting: false,

        discoveredClearning: false,
        discoveredRiver: false,
        discoveredBerryBush: false,
        discoveredDeadfall: false,

        hasCamp: false
    };




  //Establish Buttons
    const studyBtn = document.getElementById("studyBtn");
    const exerciseBtn = document.getElementById("exerciseBtn");
    const upgradeBtn = document.getElementById("upgradeBtn");
    const habitBtn = document.getElementById("habitBtn");
    const nergyUpgradeText = document.getElementById("nergyUpgradeText");
    const healthUpgradeText = document.getElementById("healthUpgradeText");
    const restBtn = document.getElementById("restBtn");
    const clearingPopup = document.getElementById("clearingPopup");
    const clearingContinueBtn = document.getElementById("clearingContinueBtn");

  //Popup Function Clearing
    function showClearingPopup() {
        clearingPopup.style.display = "flex";
    };

    clearingContinueBtn.addEventListener("click", function() {
        clearingPopup.style.display = "none";
        document.getElementById("catchBreathBtn").style.display = "none";
        restBtn.style.display = "inline-block";
        updateRestButton();
    });

    actions.explore.complete = function () {
        if (!gameState.discoveredClearing) {

            gameState.discoveredClearing = true;

            showClearingPopup();
        };
    };


    //Hook Actions
    for (let actionName in actions) {
        const action = actions[actionName];

        action.button = document.getElementById(actionName + "Btn");

        action.progressBar = action.button.querySelector(".progressFill");

        action.button.addEventListener("click", function () {
            startAction(actionName);
        });
    }

  //Initial Hook Call and Resource Update
    hookStatsToUI();
    hookUpgradesToUi();
    updateResource("Energy");
    updateResource("health");

  //Gerneral Update Function
    function updateResource(resourceName) {
        const resource = resources[resourceName];

        resource.display.textContent = resource.label + ": " + resource.value + " / " + resource.maxValue;
        resource.perClickDisplay.textContent = "+" + resource.perClick + " /Click";
        resource.perSecondDisplay.textContent = "+" + resource.perSecond + " /Sec";
    };

  //Action Function
    function startAction(actionName) {
        const action =actions[actionName];

        if(actionName === "explore") {
            gameState.resting = false;
            updateRestButton();
        }

        //Check Cost
        for (let resourceName in action.cost) {

            const costAmount = action.cost[resourceName];

            if (resources[resourceName].value < costAmount) {
                return; //not enough resources
            }
        }

        // Spend Cost
        for (let resourceName in action.cost) {
            const costAmount = action.cost[resourceName];
            addResource(resourceName, -costAmount);
        }

        action.running = true;

        if (action.button) {
            action.button.disabled = true;
        }

        startProgress(action)

        setTimeout(function () {
            action.complete();
            action.running = false;
            if(action.button) {
                action.button.disabled = false;
            }
        }, action.duration * 1000);

    };

  //Progress Funtion
    function startProgress(action) {
        const duration = action.duration * 1000;
        let startTime = Date.now();

        const interval = setInterval(function() {
            let elapsed = Date.now() - startTime;
            let progress = Math.min(elapsed / duration, 1);

            if (action.progressBar) {
                action.progressBar.style.width = (progress*100) + "%";
            }

            if (progress >=1) {
                clearInterval(interval);

                if (action.progressBar) {
                    action.progressBar.style.width = "0%";
                }
            }
        }, 50);
    }


  //Event Listeners - What makes the buttons work
    studyBtn.addEventListener("click", function () {
        addResource("Energy", resources.Energy.perClick)
    });

    exerciseBtn.addEventListener("click", function () {
        const health = resources.health
        health.value += health.perClick;
        updateResource("health");
    });

    upgradeBtn.addEventListener("click", function () {
        buyUpgrade("EnergyFocus");
    });

    habitBtn.addEventListener("click", function () {
        buyUpgrade("healthHabit");
    });

    continueBtn.addEventListener("click", function () {
        introPopup.style.display = "none";
    });

    restBtn.addEventListener("click", function () {
        gameState.resting = !gameState.resting;
        updateRestButton();
    });

  //Rest Button Text Toggle
    function updateRestButton() {
        if (gameState.resting) {
            restBtn.textContent = "Leave Camp";
        } else {
            restBtn.textContent = "Rest at Camp";
        }
    };


  //Passive Interval Function - Drives the passive resource updates
    function gameTick() {
        for (let resourceName in resources) {
            addResource(resourceName, resources[resourceName].perSecond);
        };

        if(gameState.resting) {
            addResource("Energy",1)
        };

    };

  setInterval (gameTick,1000);
  
  updateResource("Energy");
  updateResource("health");
};