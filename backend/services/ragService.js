const fs = require("fs")
const path = require("path")

// Fallback in-memory dataset to prevent server crash if JSON files are missing
const defaultCropKB = [
  {
    crop: "paddy",
    soil: "clay loam",
    water: "high",
    season: "kharif",
    solution: [
      "Maintain a 2-5 cm water level during the tillering stage.",
      "Apply balanced NPK fertilizers (e.g., 120:60:60 kg/ha).",
      "Treat yellowing leaves with zinc sulfate spray if micro-deficiency occurs."
    ],
    prevention: [
      "Avoid excess nitrogen application.",
      "Inspect weekly for stem borer and leaf folder symptoms."
    ]
  },
  {
    crop: "rice",
    soil: "clay loam",
    water: "high",
    season: "kharif",
    solution: [
      "Ensure proper field drainage if leaves show brown spot fungal symptoms.",
      "Apply recommended fungicides if sheath blight appears."
    ],
    prevention: [
      "Use certified disease-free seeds.",
      "Maintain proper field spacing to allow adequate airflow."
    ]
  },
  {
    crop: "tomato",
    soil: "well-drained loamy",
    water: "moderate",
    season: "all season",
    solution: [
      "Check leaf curling for whitefly vectors; spray neem oil if present.",
      "Avoid overhead watering to prevent leaf mold and early blight fungal spores."
    ],
    prevention: [
      "Stake tomato plants for ground separation.",
      "Apply organic mulch to retain soil moisture and regulate soil temperature."
    ]
  }
]

const defaultDiseaseKB = [
  {
    crop: "paddy",
    disease: "Yellowing / Zinc Deficiency / Bacterial Leaf Blight",
    symptoms: ["yellowing", "yellow leaves", "curling", "brown spots"],
    cause: "Nutritional deficiency or excessive moisture stagnation.",
    solution: [
      "Spray 0.5% Zinc Sulfate + 1% Urea solution on leaves.",
      "Drain excess stagnant water for 2 days to re-oxygenate soil roots."
    ],
    prevention: [
      "Perform soil test prior to sowing.",
      "Maintain balanced potash and nitrogen ratios."
    ]
  },
  {
    crop: "tomato",
    disease: "Leaf Curl Virus / Early Blight",
    symptoms: ["leaf curl", "curling leaves", "yellow spots", "wilting"],
    cause: "Whitefly vector transmission or fungal leaf pathogen.",
    solution: [
      "Spray organic neem seed kernel extract (NSKE 5%).",
      "Remove and destroy severely affected leaves to prevent crop-wide spread."
    ],
    prevention: [
      "Use yellow sticky traps to catch vector insects.",
      "Avoid planting near old nightshade fields."
    ]
  }
]

function loadDataset(fileName, fallback) {
  const possiblePaths = [
    path.join(__dirname, "../datasets", fileName),
    path.join(__dirname, "../data", fileName),
  ]

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8")
        return JSON.parse(raw)
      } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message)
      }
    }
  }

  return fallback
}

const cropKnowledgeBase = loadDataset("cropKnowledgeBase.json", defaultCropKB)
const diseaseKnowledgeBase = loadDataset("diseaseKnowledgeBase.json", defaultDiseaseKB)

function searchAgricultureKnowledge(question) {
  const q = (question || "").toLowerCase()

  const cropMatches = cropKnowledgeBase.filter((item) => {
    return (
      (item.crop && q.includes(item.crop.toLowerCase())) ||
      (item.soil && q.includes(item.soil.toLowerCase())) ||
      (item.water && q.includes(item.water.toLowerCase())) ||
      (item.season && q.includes(item.season.toLowerCase()))
    )
  })

  const diseaseMatches = diseaseKnowledgeBase.filter((item) => {
    return (
      (item.crop && q.includes(item.crop.toLowerCase())) ||
      (item.disease && q.includes(item.disease.toLowerCase())) ||
      (Array.isArray(item.symptoms) &&
        item.symptoms.some((symptom) => q.includes(symptom.toLowerCase())))
    )
  })

  return {
    cropMatches,
    diseaseMatches,
  }
}

module.exports = {
  searchAgricultureKnowledge,
}