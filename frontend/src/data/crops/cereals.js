
const cereals = {
  paddy: {
    cropName: "Paddy",
    durationDays: 125,
    category: "Cereal",
    suitableSoils: [
      "Clay Soil",
      "Loamy Soil",
      "Alluvial Soil",
    ],
    waterNeed: "High",
    suitableIrrigation: [
      "High Water Availability",
      "Canal Irrigation",
      "Borewell Irrigation",
    ],
    seasons: [
      "June",
      "July",
      "August",
      "September",
      "October",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Prepare and level the field for paddy cultivation.",
      },

      {
        day: 3,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Select healthy paddy seeds and prepare for sowing.",
      },

      {
        day: 5,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Soak seeds and maintain moisture for germination.",
      },

      {
        day: 7,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Sow paddy seeds in nursery bed.",
      },

      {
        day: 15,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Check nursery irrigation and remove weak seedlings.",
      },

      {
        day: 21,
        time: "6:00 AM",
        icon: "🌾",
        task:
          "Transplant healthy seedlings into the main field.",
      },

      {
        day: 30,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Apply first fertilizer dose and maintain standing water.",
      },

      {
        day: 40,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect crop for pests and leaf diseases.",
      },

      {
        day: 50,
        time: "6:00 AM",
        icon: "🌿",
        task:
          "Remove weeds and check water level.",
      },

      {
        day: 65,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Apply second fertilizer dose.",
      },

      {
        day: 80,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Check for stem borer and fungal infection.",
      },

      {
        day: 100,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Reduce irrigation as grains mature.",
      },

      {
        day: 115,
        time: "7:00 AM",
        icon: "🌾",
        task:
          "Prepare harvesting tools.",
      },

      {
        day: 125,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature paddy crop.",
      },
    ],
  },

  wheat: {
    cropName: "Wheat",
    durationDays: 120,
    category: "Cereal",

    suitableSoils: [
      "Loamy Soil",
      "Clay Soil",
      "Black Soil",
    ],

    waterNeed: "Medium",

    suitableIrrigation: [
      "Medium Water Availability",
      "Canal Irrigation",
      "Borewell Irrigation",
    ],

    seasons: [
      "November",
      "December",
      "January",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Prepare seed bed for wheat cultivation.",
      },

      {
        day: 5,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Sow wheat seeds with proper spacing.",
      },

      {
        day: 15,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Provide first irrigation after germination.",
      },

      {
        day: 30,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Apply fertilizer during tillering stage.",
      },

      {
        day: 50,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Check for aphids and rust disease.",
      },

      {
        day: 70,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Provide irrigation during flowering stage.",
      },

      {
        day: 95,
        time: "7:00 AM",
        icon: "🌾",
        task:
          "Monitor grain filling stage.",
      },

      {
        day: 120,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature wheat crop.",
      },
    ],
  },

  maize: {
    cropName: "Maize",

    durationDays: 100,

    category: "Cereal",

    suitableSoils: [
      "Red Soil",
      "Black Soil",
      "Loamy Soil",
    ],

    waterNeed: "Medium",

    suitableIrrigation: [
      "Medium Water Availability",
      "Borewell Irrigation",
      "Drip Irrigation",
      "Rain-fed",
    ],

    seasons: [
      "June",
      "July",
      "August",
      "September",
      "January",
      "February",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Prepare ridges and fertile soil for maize cultivation.",
      },

      {
        day: 4,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Select healthy maize seeds.",
      },

      {
        day: 6,
        time: "6:00 AM",
        icon: "🌱",
        task:
          "Sow maize seeds with proper spacing.",
      },

      {
        day: 14,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Check germination and maintain soil moisture.",
      },

      {
        day: 25,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Apply first fertilizer dose.",
      },

      {
        day: 35,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect crop for stem borer.",
      },

      {
        day: 50,
        time: "6:00 AM",
        icon: "🌿",
        task:
          "Remove weeds and support crop growth.",
      },

      {
        day: 65,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Provide irrigation during flowering stage.",
      },

      {
        day: 85,
        time: "7:00 AM",
        icon: "🌽",
        task:
          "Monitor cob development.",
      },

      {
        day: 100,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature maize cobs.",
      },
    ],
  },

  ragi: {
    cropName: "Ragi",

    durationDays: 110,

    category: "Cereal",

    suitableSoils: [
      "Red Soil",
      "Sandy Soil",
      "Loamy Soil",
    ],

    waterNeed: "Low",

    suitableIrrigation: [
      "Low Water Availability",
      "Rain-fed",
      "Drip Irrigation",
    ],

    seasons: [
      "June",
      "July",
      "August",
      "September",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Prepare fine tilth for ragi cultivation.",
      },

      {
        day: 5,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Sow ragi seeds evenly.",
      },

      {
        day: 15,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Check moisture and germination.",
      },

      {
        day: 30,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Remove weeds and weak seedlings.",
      },

      {
        day: 50,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect crop for blast disease.",
      },

      {
        day: 75,
        time: "6:00 AM",
        icon: "🌾",
        task:
          "Monitor ear head formation.",
      },

      {
        day: 95,
        time: "7:00 AM",
        icon: "🌾",
        task:
          "Check grain maturity.",
      },

      {
        day: 110,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature ragi crop.",
      },
    ],
  },

  bajra: {
    cropName: "Bajra",

    durationDays: 90,

    category: "Cereal",

    suitableSoils: [
      "Sandy Soil",
      "Red Soil",
      "Loamy Soil",
    ],

    waterNeed: "Low",

    suitableIrrigation: [
      "Low Water Availability",
      "Rain-fed",
      "Medium Water Availability",
    ],

    seasons: [
      "June",
      "July",
      "August",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Prepare dry land field for bajra cultivation.",
      },

      {
        day: 5,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Sow bajra seeds.",
      },

      {
        day: 15,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Maintain light irrigation if needed.",
      },

      {
        day: 30,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Remove weeds and support healthy tillers.",
      },

      {
        day: 50,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect for shoot fly damage.",
      },

      {
        day: 70,
        time: "6:00 AM",
        icon: "🌾",
        task:
          "Monitor flowering and grain formation.",
      },

      {
        day: 90,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature bajra crop.",
      },
    ],
  },

  jowar: {
    cropName: "Jowar",

    durationDays: 115,

    category: "Cereal",

    suitableSoils: [
      "Black Soil",
      "Red Soil",
      "Loamy Soil",
    ],

    waterNeed: "Low",

    suitableIrrigation: [
      "Rain-fed",
      "Low Water Availability",
    ],

    seasons: [
      "June",
      "July",
      "August",
      "September",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Prepare field for jowar cultivation.",
      },

      {
        day: 5,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Sow jowar seeds with proper spacing.",
      },

      {
        day: 18,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Check field moisture and germination.",
      },

      {
        day: 35,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Remove weeds and support tiller growth.",
      },

      {
        day: 50,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect crop for stem borer.",
      },

      {
        day: 75,
        time: "6:00 AM",
        icon: "🌾",
        task:
          "Monitor panicle emergence.",
      },

      {
        day: 100,
        time: "7:00 AM",
        icon: "🌾",
        task:
          "Check grain maturity.",
      },

      {
        day: 115,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature jowar crop.",
      },
    ],
  },
}

export default cereals

