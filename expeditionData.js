//Expedition Modifiers
const expeditionModifiers = {
  food: {
    storage: "carried",
    cost: {
      food: 0.1,
    },
    apply: function (step) {
      step.distance *= 2;
    },
  },

  water: {
    storage: "water",
    cost: 0.25,
    apply: function (step) {
      step.energyCost *= 0.5;
    },
  },
};
