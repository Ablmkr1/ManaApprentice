
const introPopup = document.getElementById("introPopup");
const continueBtn = document.getElementById("continueBtn");
const game = {exploreCount: 0};

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
    },
    water: {
        label :"Water",
        value: 0,
        maxValue: 10,
        perClick: 1,
        perSecond: 0,
        display: null,
        perClickDisplay: null,
        perSecondDisplay: null,
    },
    food: {
        label :"Food",
        value: 0,
        maxValue: 10,
        perClick: 1,
        perSecond: 0,
        display: null,
        perClickDisplay: null,
        perSecondDisplay: null,
    },
    wood: {
        label :"Wood",
        value: 0,
        maxValue: 10,
        perClick: 1,
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
        duration: 1,
        cost: {
            Energy: 10
        },
        unlocked: true,
        running: false,

        button: null,
        progressBar: null,
        metaProgressBar: null,

        onStart: function(){},
        onComplete: function (){}
    },

    catchBreath: {
        label: "Catch Breath",
        duration: 1,
        cost: {},
        unlocked: true,
        running: false,

        button: null,
        progressBar: null,
        metaProgressBar: null,

        onStart: function(){},
        onComplete: function () {
        }
    }
};

const storyLog = {
    forest: [
        "You need water, food, shelter.",
        "You stumble forward, mind in a daze...",
        "The forest clears ahead..."
    ],
    clearing: [
        "You can rest here."
    ]

}


window.onload = function () {
  

  //UI Saftety Function
    function safeSetText(el,text) {
        if (el) {
            el.textContent = text;
        }
    };
  

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

  //Action onComplete 
    actions.catchBreath.onComplete = function () {
        addResource("Energy" ,resources.Energy.perClick);
    }


  //Reusable Upgrade Function
    function buyUpgrade(upgradeName) {
        
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

        hasCamp: false,

        exploreCount:0,
        exploreRequired:3
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
    const campPanel = document.getElementById("campPanel");

  //Discover Clearing Popup & Function & CampDisplay
    function showClearingPopup() {
        clearingPopup.style.display = "flex";
    };

    function showCampPanel () {
        campPanel.style.display = "flex";
        
    }

    clearingContinueBtn.addEventListener("click", function() {
        clearingPopup.style.display = "none";

        const catchBreathButton = document.querySelector('[data-action="catchBreath"]');
        catchBreathButton.style.display = "none";

        restBtn.style.display = "inline-block";
        updateRestButton();
    });

    actions.explore.onComplete = function () {
        gameState.exploreCount++;
       
        if (gameState.exploreCount === 1) {
            addStoryEntry(storyLog.forest[1]);
        };

        if (gameState.exploreCount === 2) {
            addStoryEntry(storyLog.forest[2]);
        };

        if (gameState.exploreCount === 3) {
            addStoryEntry(storyLog.clearing[0]);
        };

        if (gameState.exploreCount >= gameState.exploreRequired && !gameState.discoveredClearning) {
            gameState.discoveredClearning = true;

            showClearingPopup();
            showCampPanel();
            hookStatsToUI();
        }
    };


    function addStoryEntry (text) {
        const storyLogPanel = document.getElementById("storyLog")

        const entry = document.createElement("div");
        entry.classList.add("story-entry");
        entry.textContent = text;
        storyLogPanel.appendChild(entry);
        storyLogPanel.scrollTop = storyLogPanel.scrollHeight;
    }

    //Hook Actions
    /*for (let actionName in actions) {
        const action = actions[actionName];

        action.button = document.getElementById(actionName + "Btn");

        action.progressBar = action.button.querySelector(".progressFill");

        action.metaProgressBar = action.button.querySelector(".metaProgressFill");

        action.button.addEventListener("click", function () {
            runAction(actionName);
        });
    }*/

  //Initial Hook Call and Resource Update
    hookStatsToUI();
    hookUpgradesToUi();
    updateResource("Energy");
    updateResource("health");
    hookActionButtons();

  //Gerneral Update Function
    function updateResource(resourceName) {
        const resource = resources[resourceName];

        safeSetText(resource.display, resource.label + ": " + resource.value + " / " + resource.maxValue);
        safeSetText(resource.perClickDisplay, "+" + resource.perClick + "/Click");
        safeSetText(resource.perSecondDisplay, "+" + resource.perSecond + "/Sec");

        //resource.display.textContent = resource.label + ": " + resource.value + " / " + resource.maxValue;
        //resource.perClickDisplay.textContent = "+" + resource.perClick + " /Click";
        //resource.perSecondDisplay.textContent = "+" + resource.perSecond + " /Sec";
    };

  //Action Function
    function hookActionButtons() {

        const buttons = document.querySelectorAll(".action-btn");

        buttons.forEach(btn => {

            const actionName = btn.dataset.action;
            const action = actions[actionName];

            if (!action) return;

            action.button = btn;
            action.progressBar = btn.querySelector(".progressFill");
            action.metaProgressBar = btn.querySelector(".metaProgressFill");

            btn.addEventListener("click", function () {
                runAction(actionName);
            });

        });
    }

  //Progress Funtion
    function runAction(actionName) {

        console.log("RUN ACTION FIRED:", actionName);
       
        const action = actions[actionName];

        console.log("ACTION FOUND:", action);

        //alert("Action triggered: " + actionName);

        if (!action || action.running) return;

        // Check cost
        for (let key in action.cost) {
            const resource = resources[key];
            if (resource.value < action.cost[key]) return;
        }

        // Pay cost
        for (let key in action.cost) {
            resources[key].value -= action.cost[key];
            updateResource(key);
        }

        action.running = true;

        const duration = action.duration * 1000;
        const startTime = Date.now();

        if (action.onStart) {
            action.onStart();
        }

        const interval = setInterval(() => {

            let elapsed = Date.now() - startTime;
            let progress = Math.min(elapsed / duration, 1);

            // 1. Main progress bar
            if (action.progressBar) {
                action.progressBar.style.width = (progress * 100) + "%";
            }

            // 2. Meta progress (if exists)
            if (action.metaProgressBar) {
                updateMetaProgress(action, progress);
            }

            // 3. Finish
            if (progress >= 1) {

                clearInterval(interval);

                action.running = false;

                if (action.progressBar) {
                    action.progressBar.style.width = "0%";
                }

                if (action.onComplete) {
                    action.onComplete();
                }
            }

        }, 50);
    }


  //Meta Progress Function
    function updateMetaProgress(action, progress) {

        const target = gameState.exploreRequired;

        const current = gameState.exploreCount;

        const interpolated =
            (current + progress) / target;

        if (action.metaProgressBar) {
            action.metaProgressBar.style.width =
                (interpolated * 100) + "%";
        }
    }

   function animateMetaBar (bar, target) {
        let current = parseFloat(bar.style.width) || 0;

        const interval = setInterval(() => {
            current += (target*100 - current)*.01;
            bar.style.width = current + "%";
            if (Math.abs(current - target * 100) < 0.5) {
                bar.style.width = (target * 100) + "%";
                clearInterval(interval);
            }

        }, 16);
   }

  //Event Listeners - What makes the buttons work
    /*studyBtn.addEventListener("click", function () {
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
    });*/

    continueBtn.addEventListener("click", function () {
        introPopup.style.display = "none";

        if (gameState.exploreCount === 0) {
            addStoryEntry(storyLog.forest[0]);
        };

    });

    restBtn.addEventListener("click", function () {
        gameState.resting = !gameState.resting;
        updateRestButton();
    });

  //Rest Button Text Toggle
    function updateRestButton() {
        if (gameState.resting) {
            restBtn.textContent = "Leave Clearing";
        } else {
            restBtn.textContent = "Rest in Clearing";
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

/*  //Progress Funtion
    function startProgress(action) {
        const duration = action.duration * 1000;
        let startTime = Date.now();

        const interval = setInterval(function() {
            let elapsed = Date.now() - startTime;
            let progress = Math.min(elapsed / duration, 1);

            if (action.progressBar) {
                action.progressBar.style.width = (progress*100) + "%";
            }

            if (action.metaProgressBar) {

                const metaTarget = gameState.exploreCount / gameState.exploreRequired;

                const metaProgress = (gameState.exploreCount + progress) / gameState.exploreRequired;

                action.metaProgressBar.style.width = (metaProgress * 100) + "%";
            }

            if (progress >=1) {
                clearInterval(interval);

                if (action.progressBar) {
                    action.progressBar.style.width = "0%";
                }

                updateExploreMetaProgress();
            }
        }, 50);
    }

    function updateExploreMetaProgress() {

        const action = actions.explore; 

        const target = gameState.exploreCount / gameState.exploreRequired;

        animateMetaBar(action.metaProgressBar, target);
    }


*/