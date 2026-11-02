
const commercial = {
  cotton: {
    cropName: "Cotton",
    durationDays: 170,
    category: "Commercial Crop",

    suitableSoils: [
      "Black Soil",
      "Red Soil",
      "Loamy Soil",
    ],

    waterNeed: "Medium",

    suitableIrrigation: [
      "Medium Water Availability",
      "Borewell Irrigation",
      "Drip Irrigation",
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
          "Prepare fertile field for cotton cultivation.",
      },

      {
        day: 5,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Select healthy cotton seeds.",
      },

      {
        day: 7,
        time: "6:00 AM",
        icon: "🌱",
        task:
          "Sow cotton seeds in rows.",
      },

      {
        day: 15,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Maintain irrigation during germination stage.",
      },

      {
        day: 30,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Apply fertilizer and remove weeds.",
      },

      {
        day: 60,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect crop for bollworm.",
      },

      {
        day: 90,
        time: "6:00 AM",
        icon: "🌸",
        task:
          "Monitor flowering stage.",
      },

      {
        day: 130,
        time: "7:00 AM",
        icon: "🌾",
        task:
          "Check boll opening stage.",
      },

      {
        day: 170,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature cotton bolls.",
      },
    ],
  },

  sugarcane: {
    cropName: "Sugarcane",

    durationDays: 365,

    category: "Commercial Crop",

    suitableSoils: [
      "Loamy Soil",
      "Clay Soil",
      "Black Soil",
    ],

    waterNeed: "High",

    suitableIrrigation: [
      "High Water Availability",
      "Canal Irrigation",
      "Borewell Irrigation",
    ],

    seasons: [
      "January",
      "February",
      "June",
      "July",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Prepare deep fertile field for sugarcane.",
      },

      {
        day: 7,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Plant sugarcane setts.",
      },

      {
        day: 25,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Maintain irrigation during germination.",
      },

      {
        day: 50,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Apply fertilizer and remove weeds.",
      },

      {
        day: 90,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect for shoot borer.",
      },

      {
        day: 150,
        time: "6:00 AM",
        icon: "🌿",
        task:
          "Do earthing up around plants.",
      },

      {
        day: 220,
        time: "7:00 AM",
        icon: "🌾",
        task:
          "Monitor cane growth stage.",
      },

      {
        day: 300,
        time: "5:00 PM",
        icon: "🌾",
        task:
          "Reduce excess irrigation.",
      },

      {
        day: 365,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature sugarcane.",
      },
    ],
  },

  tea: {
    cropName: "Tea",

    durationDays: 365,

    category: "Commercial Crop",

    suitableSoils: [
      "Loamy Soil",
      "Red Soil",
    ],

    waterNeed: "High",

    suitableIrrigation: [
      "Rain-fed",
      "Drip Irrigation",
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
          "Prepare shaded area for tea plantation.",
      },

      {
        day: 15,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Plant healthy tea saplings.",
      },

      {
        day: 40,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Maintain moisture and mulch.",
      },

      {
        day: 70,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Remove weeds and prune weak shoots.",
      },

      {
        day: 120,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect for tea mosquito bug.",
      },

      {
        day: 220,
        time: "6:00 AM",
        icon: "🍃",
        task:
          "Monitor healthy leaf growth.",
      },

      {
        day: 365,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Start selective harvesting of tea leaves.",
      },
    ],
  },

  coffee: {
    cropName: "Coffee",

    durationDays: 365,

    category: "Commercial Crop",

    suitableSoils: [
      "Loamy Soil",
      "Red Soil",
    ],

    waterNeed: "Medium",

    suitableIrrigation: [
      "Rain-fed",
      "Drip Irrigation",
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
          "Prepare shaded fertile land for coffee.",
      },

      {
        day: 20,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Plant healthy coffee saplings.",
      },

      {
        day: 50,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Maintain soil moisture around roots.",
      },

      {
        day: 90,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Remove weeds and prune branches.",
      },

      {
        day: 160,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect for berry borer.",
      },

      {
        day: 240,
        time: "6:00 AM",
        icon: "☕",
        task:
          "Monitor berry ripening.",
      },

      {
        day: 365,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature coffee cherries.",
      },
    ],
  },

  pepper: {
    cropName: "Pepper",
    durationDays: 365,
    category: "Commercial Crop",

    suitableSoils: [
      "Forest Soil",
      "Loamy Soil",
    ],

    waterNeed: "High",

    suitableIrrigation: [
      "Rain-fed",
      "High Water Availability",
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
          "Prepare shaded support area for pepper vines.",
      },

      {
        day: 10,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Plant healthy pepper cuttings.",
      },

      {
        day: 30,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Maintain moisture around vines.",
      },

      {
        day: 90,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect for quick wilt disease.",
      },

      {
        day: 200,
        time: "6:00 AM",
        icon: "🌾",
        task:
          "Monitor spike development.",
      },

      {
        day: 365,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature pepper spikes.",
      },
    ],
  },

  ginger: {
    cropName: "Ginger",
    durationDays: 240,
    category: "Commercial Crop",

    suitableSoils: [
      "Loamy Soil",
      "Red Soil",
    ],

    waterNeed: "Medium",

    suitableIrrigation: [
      "Drip Irrigation",
      "Rain-fed",
    ],

    seasons: [
      "April",
      "May",
      "June",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Prepare raised beds for ginger.",
      },

      {
        day: 7,
        time: "7:00 AM",
        icon: "🌱",
        task:
          "Plant ginger rhizomes.",
      },

      {
        day: 25,
        time: "6:00 AM",
        icon: "💧",
        task:
          "Maintain moisture during sprouting.",
      },

      {
        day: 60,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Apply mulch and remove weeds.",
      },

      {
        day: 100,
        time: "5:00 PM",
        icon: "🐛",
        task:
          "Inspect for rhizome rot.",
      },

      {
        day: 180,
        time: "6:00 AM",
        icon: "🌾",
        task:
          "Monitor rhizome development.",
      },

      {
        day: 240,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature ginger rhizomes.",
      },
    ],
  },

  cinnamon: {
    cropName: "Cinnamon",
    durationDays: 365,
    category: "Commercial Crop",

    suitableSoils: [
      "Loamy Soil",
      "Forest Soil",
    ],

    waterNeed: "Medium",

    suitableIrrigation: [
      "Rain-fed",
      "Drip Irrigation",
    ],

    seasons: [
      "June",
      "July",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🌱",
        task:
          "Plant cinnamon saplings.",
      },

      {
        day: 90,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Remove weeds and prune branches.",
      },

      {
        day: 200,
        time: "5:00 PM",
        icon: "🌳",
        task:
          "Monitor bark maturity.",
      },

      {
        day: 365,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature cinnamon bark.",
      },
    ],
  },

  cloves: {
    cropName: "Cloves",
    durationDays: 365,
    category: "Commercial Crop",

    suitableSoils: [
      "Forest Soil",
      "Loamy Soil",
    ],

    waterNeed: "High",

    suitableIrrigation: [
      "Rain-fed",
      "High Water Availability",
    ],

    seasons: [
      "June",
      "July",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🌱",
        task:
          "Plant clove saplings.",
      },

      {
        day: 100,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Apply manure and remove weeds.",
      },

      {
        day: 240,
        time: "5:00 PM",
        icon: "🌸",
        task:
          "Monitor flower bud development.",
      },

      {
        day: 365,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature cloves.",
      },
    ],
  },

  fennel: {
    cropName: "Fennel",
    durationDays: 120,
    category: "Commercial Crop",

    suitableSoils: [
      "Loamy Soil",
      "Sandy Soil",
    ],

    waterNeed: "Low",

    suitableIrrigation: [
      "Low Water Availability",
      "Drip Irrigation",
    ],

    seasons: [
      "October",
      "November",
    ],

    lifecycle: [
      {
        day: 1,
        time: "6:00 AM",
        icon: "🌱",
        task:
          "Sow fennel seeds.",
      },

      {
        day: 30,
        time: "7:00 AM",
        icon: "🌿",
        task:
          "Remove weeds and apply fertilizer.",
      },

      {
        day: 70,
        time: "5:00 PM",
        icon: "🌾",
        task:
          "Monitor seed formation.",
      },

      {
        day: 120,
        time: "6:00 AM",
        icon: "🚜",
        task:
          "Harvest mature fennel seeds.",
      },
    ],
  },
}

export default commercial

