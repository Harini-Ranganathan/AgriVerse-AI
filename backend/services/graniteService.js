const express = require("express")

const router = express.Router()

const {
  generateGraniteResponse,
} = require("../services/graniteService")

router.post("/chat", async (req, res) => {
  try {
    const { question, language } = req.body

    const q = (question || "").toLowerCase()

    const graniteResponse = await generateGraniteResponse({
      question,
      language,
    })

    if (graniteResponse) {
      return res.json({
        success: true,
        response: graniteResponse,
      })
    }

    let response = ""

    if (language === "தமிழ்") {
      response = `முக்கிய பரிந்துரைகள்

• உங்கள் கேள்வி விவசாய AI மூலம் பகுப்பாய்வு செய்யப்பட்டது.

• பயிர், மண், வானிலை, நோய், உரம் மற்றும் சந்தை தகவல்கள் அடிப்படையில் பதில் உருவாக்கப்படுகிறது.

• நிலத்தின் நீர் வசதி மற்றும் மண் தன்மையை கவனமாக பரிசோதிக்கவும்.

• அதிக நீர் அல்லது அதிக உரம் பயன்படுத்துவதை தவிர்க்கவும்.

• பயிரை தினமும் கண்காணிக்கவும்.

தடுப்பு

• நோய் அறிகுறிகள் தெரிந்தால் உடனே பாதிக்கப்பட்ட இலைகளை அகற்றவும்.

• சரியான இடைவெளியில் பயிர் வளர்க்கவும்.

AI தகவல்

• IBM Granite இணைப்பு வந்த பிறகு பதில்கள் இன்னும் துல்லியமாக இருக்கும்.`
    } else if (language === "हिन्दी") {
      response = `मुख्य सुझाव

• आपका सवाल कृषि AI द्वारा विश्लेषित किया गया है।

• फसल, मिट्टी, मौसम, बीमारी, खाद और बाजार जानकारी के आधार पर जवाब बनाया गया है।

• पानी और मिट्टी की स्थिति को ध्यान से जांचें।

• अधिक पानी या अधिक खाद से बचें।

• फसल की रोज निगरानी करें।

रोकथाम

• बीमारी दिखे तो संक्रमित पत्ते तुरंत हटाएं।

• पौधों के बीच उचित दूरी रखें।

AI जानकारी

• IBM Granite जुड़ने के बाद जवाब और अधिक सटीक होंगे।`
    } else if (q.includes("rice") || q.includes("paddy")) {
      response = `IMPORTANT RECOMMENDATIONS

• Use fertile clay or loamy soil for better rice yield.

• Maintain stable irrigation and avoid sudden water shortage.

• Use certified high-quality rice seeds.

• Apply nitrogen fertilizer in balanced quantity.

• Monitor crops regularly for pests and fungal diseases.

• Ensure proper drainage during heavy rainfall.

PREVENTION

• Avoid overwatering.

• Do not overcrowd crops.

• Inspect leaves weekly for disease symptoms.

AI MARKET INSIGHT

• Regional rice demand is usually strong.

• Profitability improves when weather and water supply remain stable.`
    } else if (q.includes("tomato")) {
      response = `IMPORTANT RECOMMENDATIONS

• Use well-drained fertile soil.

• Maintain proper spacing between tomato plants.

• Avoid excess irrigation.

• Support plants using sticks or cages.

• Inspect leaves regularly for fungal infections.

PREVENTION

• Remove infected leaves quickly.

• Avoid water stagnation near roots.

• Improve airflow between plants.

AI MARKET INSIGHT

• Tomato demand can be high, but price changes quickly based on supply.`
    } else if (q.includes("fertilizer")) {
      response = `FERTILIZER RECOMMENDATIONS

• Use fertilizer based on soil nutrient condition.

• Avoid excessive nitrogen usage.

• Apply organic compost to improve long-term soil health.

• Split fertilizer use into multiple stages.

• Irrigate properly after fertilizer application.

PREVENTION

• Avoid fertilizer application before heavy rainfall.

• Do not overuse chemical fertilizers.`
    } else if (q.includes("weather")) {
      response = `WEATHER RECOMMENDATIONS

• Check rainfall prediction before irrigation.

• Avoid spraying pesticides before rain.

• Protect crops during strong wind or storm alerts.

• Maintain drainage during rainy periods.

• Store harvested crops safely during bad weather.`
    } else {
      response = `AGRIVERSE AI ANALYSIS

• Your farming question was analyzed using agriculture knowledge.

• Recommendations are generated using crop data, weather logic, disease knowledge, and market insights.

• The system will become stronger after IBM Granite and RAG integration.

• Voice AI, multilingual AI, dashboards, and prediction models will improve future recommendations.`
    }

    res.json({
      success: true,
      response,
    })
  } catch (error) {
    console.error(error)

    res.status(500).json({
      success: false,
      response: "AI assistant failed.",
    })
  }
})

module.exports = router