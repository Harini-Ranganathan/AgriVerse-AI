const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")

function loadCropSuitabilityData() {
  return new Promise((resolve, reject) => {
    const results = []

    fs.createReadStream(path.join(__dirname, "../data/crop_suitability.csv"))
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error))
  })
}

function getBudgetLevel(budget) {
  const amount = Number(budget)

  if (!amount || amount < 10000) return "Low"
  if (amount < 40000) return "Medium"
  return "High"
}

async function generateFarmAdvice({
  crop,
  soilType,
  waterAvailability,
  budget,
  season,
  weather,
}) {
  const cropData = await loadCropSuitabilityData()
  const budgetLevel = getBudgetLevel(budget)

  const matches = cropData.filter((item) => {
    const soilMatch = !soilType || item.soil_type === soilType
    const waterMatch = !waterAvailability || item.water_need === waterAvailability
    const seasonMatch = !season || item.season === season
    const budgetMatch = !budget || item.budget_level === budgetLevel
    const cropMatch = !crop || item.crop.toLowerCase().includes(crop.toLowerCase())

    return soilMatch && waterMatch && seasonMatch && budgetMatch && cropMatch
  })

  const recommendations = matches.length > 0 ? matches : cropData.slice(0, 5)

  return {
    summary:
      "The farm agent matched your soil, water, season, and budget with crop suitability data.",
    recommendedCrops: recommendations.map((item) => ({
      crop: item.crop,
      reason: item.reason,
      waterNeed: item.water_need,
      budgetLevel: item.budget_level,
      season: item.season,
      soilType: item.soil_type,
    })),
    nextActions: [
      "Select one suitable crop from the recommended list.",
      "Add sowing date for the selected crop.",
      "Generate land-level calendar using crop calendar dataset.",
      "Check weather forecast before irrigation or pesticide application.",
    ],
    warning:
      "This uses a starter dataset. Next upgrades should use official agriculture datasets, weather APIs, market prices, and IBM Granite/RAG for deeper reasoning.",
  }
}

module.exports = { generateFarmAdvice }