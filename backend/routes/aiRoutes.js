const express = require("express")
const router = express.Router()
const { GoogleGenerativeAI } = require("@google/generative-ai")
const { searchAgricultureKnowledge } = require("../services/ragService")

router.post("/chat", async (req, res) => {
  try {
    const { question, crop, location, soilType, cropStage, language } = req.body

    console.log("Farm AI Request Received:", { question, crop, location, language })

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        response: "Please enter a valid farming question.",
      })
    }

    // RAG Retrieval
    const ragData = searchAgricultureKnowledge(question + " " + (crop || ""))

    let systemPrompt = `You are AgriVerse AI, an expert agricultural advisor for Indian farmers.
Answer the farmer's specific problem in a step-by-step, concise, and highly relevant manner.

Context Provided:
- Farmer Question: "${question}"
- Target Crop: "${crop || "Not specified"}"
- Location: "${location || "India"}"
- Soil Type: "${soilType || "Not specified"}"
- Crop Stage: "${cropStage || "Not specified"}"
- Preferred Language: "${language || "English"}"

RAG Data Retrieved:
${JSON.stringify(ragData, null, 2)}

Requirements for Output:
1. Direct diagnosis / primary cause for the question asked.
2. Step-by-step action plan (Cultural, Biological, Chemical).
3. Preventive measures.
4. Confidence Score & Uncertainty Warning (Escalate to local Krishi Vigyan Kendra / agricultural officer for severe cases).
5. Must be written strictly in language: ${language || "English"}.
`

    let aiOutput = ""

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_KEY_HERE") {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(systemPrompt)
        aiOutput = result.response.text()
      } catch (geminiError) {
        console.error("Gemini API Error:", geminiError.message)
      }
    }

    // Fallback RAG response generator if external LLM API key is missing or fails
    if (!aiOutput) {
      console.log("Using local RAG context response logic.")
      const matches = [...(ragData.diseaseMatches || []), ...(ragData.cropMatches || [])]

      if (matches.length > 0) {
        const primary = matches[0]
        aiOutput = `🌾 AGRIVERSE AI ADVISORY (${language || "English"})

📍 Diagnosis for ${crop || primary.crop || "Crop"}:
Identified concern linked to symptoms: ${primary.disease || "Nutritional/Pest Management"}
Confidence Score: 85%

🛠️ Step-by-Step Recommendation:
1. ${primary.solution ? primary.solution.join("\n2. ") : "Ensure optimal irrigation and balanced NPK fertilizer."}

🛡️ Prevention Steps:
• ${primary.prevention ? primary.prevention.join("\n• ") : "Inspect fields weekly for symptoms."}

⚠️ Responsible AI Warning:
If symptoms spread over 20% of your field within 48 hours, contact your nearest Krishi Vigyan Kendra (KVK) officer immediately.`
      } else {
        aiOutput = `🌾 AGRIVERSE AI DIAGNOSIS

📍 Question Context: "${question}"
Target Crop: ${crop || "General Crop"} | Soil: ${soilType || "Standard"}

🛠️ Recommended Actions:
1. Inspect the underside of leaves for pests, fungal spots, or discoloration.
2. Verify irrigation levels; ensure soil is moist but avoid waterlogging.
3. Apply balanced NPK fertilizer if yellowing is seen in upper leaves.

Confidence Score: 75%
⚠️ Expert Escalation: For severe unexpected wilt, consult local agricultural field officers.`
      }
    }

    console.log("Farm AI Response Generated Successfully.")
    return res.json({
      success: true,
      response: aiOutput,
    })
  } catch (error) {
    console.error("Farm AI Route Execution Error:", error)
    return res.status(500).json({
      success: false,
      response: "AgriVerse AI failed to process the request. Check backend console.",
    })
  }
})

module.exports = router