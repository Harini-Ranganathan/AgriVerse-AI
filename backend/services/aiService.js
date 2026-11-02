const cropKnowledgeBase = require("../datasets/cropKnowledgeBase.json")
const {
  generateCalendarTasks,
} = require("./calendarService")
async function generateCropAdvice(data) {
  const {
    crop,
    soil,
    water,
    budget,
    season,
    language,
  } = data

  const matches = cropKnowledgeBase.filter((item) => {
    return (
      item.crop.toLowerCase().includes(crop.toLowerCase()) ||
      item.soil.toLowerCase().includes(soil.toLowerCase()) ||
      item.water.toLowerCase().includes(water.toLowerCase())
    )
  })

  let retrievedAdvice = ""

  if (matches.length > 0) {
    retrievedAdvice = matches
      .map((item) => item.advice)
      .join("\n\n")
  } else {
    retrievedAdvice =
      "No exact dataset match found. Future AI will use larger agriculture databases."
  }

  let response = `
AI Dataset Analysis:

Crop:
${crop}

Soil:
${soil}

Water:
${water}

Season:
${season}

Budget:
₹${budget}

Knowledge Base Result:
${retrievedAdvice}

Future production version:
- IBM Granite reasoning
- Vector database
- RAG pipelines
- Weather intelligence
- Market prediction
- Disease prevention
`

  if (language === "தமிழ்") {
    response = `
AI தரவு பகுப்பாய்வு:

பயிர்:
${crop}

மண்:
${soil}

நீர்:
${water}

தரவுத்தள முடிவு:
${retrievedAdvice}

எதிர்கால அமைப்பு:
- IBM Granite
- RAG
- வானிலை நுண்ணறிவு
`
  }

  if (language === "हिन्दी") {
    response = `
AI डेटा विश्लेषण:

फसल:
${crop}

मिट्टी:
${soil}

पानी:
${water}

डेटासेट परिणाम:
${retrievedAdvice}

भविष्य प्रणाली:
- IBM Granite
- RAG
- मौसम विश्लेषण
`
  }

  return {
  advice: response,

  tasks: generateCalendarTasks(crop),
}
}

module.exports = {
  generateCropAdvice,
}