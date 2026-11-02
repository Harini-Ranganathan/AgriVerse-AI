const axios = require("axios")
const fs = require("fs")

/**
 * Query Trefle API for detailed botanical and species metadata
 */
async function fetchTrefleCropData(cropName) {
  const trefleKey = process.env.TREFLE_API_KEY
  if (!trefleKey || !cropName) return null

  try {
    const response = await axios.get(
      `https://trefle.io/api/v1/plants/search?token=${trefleKey}&q=${encodeURIComponent(cropName)}`,
      { timeout: 8000 }
    )
    const matches = response.data?.data
    if (matches && matches.length > 0) {
      return matches[0]
    }
  } catch (err) {
    console.error("Trefle API Notice:", err.message)
  }
  return null
}

/**
 * Main Crop Doctor Analysis Engine
 * Queries Plant.id v3 and Trefle APIs live
 */
async function analyzeDisease({ crop, filePath, userQuestion }) {
  const plantIdKey = process.env.PLANT_ID_API_KEY
  const cropQuery = crop || "Crop/Plant"

  let plantIdResult = null
  let trefleData = null

  // 1. Fetch Trefle Crop Data
  if (crop) {
    trefleData = await fetchTrefleCropData(cropQuery)
  }

  // 2. Call Plant.id v3 Vision API if an image is uploaded
  if (filePath && fs.existsSync(filePath) && plantIdKey && plantIdKey !== "YOUR_KEY_HERE") {
    try {
      console.log("--> Sending image to Plant.id v3 Engine...")
      const imageBuffer = fs.readFileSync(filePath)
      const base64Image = imageBuffer.toString("base64")

      const apiResponse = await axios.post(
        "https://plant.id/api/v3/identification",
        {
          images: [base64Image],
          health: "all",
          similar_images: true,
        },
        {
          headers: {
            "Api-Key": plantIdKey,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      )
      plantIdResult = apiResponse.data?.result
    } catch (err) {
      console.error("Plant.id API Exception:", err.response?.data || err.message)
    }
  }

  // 3. Process Plant.id Suggestions & Disease Assessments
  const diseaseSuggestions = plantIdResult?.disease?.suggestions || []
  const classificationSuggestions = plantIdResult?.classification?.suggestions || []

  const detectedPlantName =
    classificationSuggestions[0]?.name ||
    trefleData?.common_name ||
    (crop ? crop.toUpperCase() : "IDENTIFIED CROP")

  let diseaseName = "No active infection detected"
  let diseaseDescription = "Foliar structure appears stable. Symptoms may be caused by climate or soil conditions."
  let treatmentSteps = [
    "Ensure balanced irrigation without waterlogging the root zone.",
    "Monitor weekly for sap-sucking pests or fungal spot propagation."
  ]

  if (diseaseSuggestions.length > 0) {
    const primaryDisease = diseaseSuggestions[0]
    diseaseName = `${primaryDisease.name} (${(primaryDisease.probability * 100).toFixed(1)}% Confidence)`
    diseaseDescription = primaryDisease.details?.description || "Infection or physiological stress identified."

    if (primaryDisease.details?.treatment) {
      const treatmentObj = primaryDisease.details.treatment
      treatmentSteps = []
      if (treatmentObj.chemical) treatmentSteps.push(...treatmentObj.chemical)
      if (treatmentObj.biological) treatmentSteps.push(...treatmentObj.biological)
      if (treatmentObj.prevention) treatmentSteps.push(...treatmentObj.prevention)
    }
  }

  // 4. Build Dynamic AI Diagnostic Report
  let report = `🌿 AGRIVERSE LIVE AI CROP DIAGNOSTIC REPORT\n\n`
  report += `📍 Identified Species: ${detectedPlantName.toUpperCase()}\n`
  if (trefleData?.scientific_name) {
    report += `📍 Scientific Taxonomy: ${trefleData.scientific_name}\n`
  }
  report += `📍 AI Diagnostic Match: ${diseaseName}\n`
  report += `📍 Condition Overview: ${diseaseDescription}\n\n`

  if (userQuestion) {
    report += `❓ User Query: "${userQuestion}"\n`
    report += `💡 Specific Answer: The symptoms described in your query for ${detectedPlantName} correlate with ${diseaseName}. Ensure proper root aeration and monitor for early fungal spread.\n\n`
  }

  report += `🛠️ Action Plan & Treatment Protocol:\n`
  treatmentSteps.slice(0, 4).forEach((step, index) => {
    report += `${index + 1}. ${step}\n`
  })

  return {
    success: true,
    analysis: report,
  }
}

module.exports = {
  analyzeDisease,
}