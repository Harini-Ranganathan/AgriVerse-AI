const express = require("express")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const router = express.Router()

const { analyzeDisease } = require("../services/diseaseService")

// Ensure backend/uploads folder exists
const uploadDir = path.join(__dirname, "../uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const upload = multer({ dest: uploadDir })

async function handleDiseaseAnalysis(req, res) {
  console.log("--> Crop Doctor API Endpoint Invoked")

  const filePath = req.file ? req.file.path : null
  const cropName = req.body.crop || ""
  const userQuestion = req.body.question || ""

  try {
    const analysisResult = await analyzeDisease({
      crop: cropName,
      filePath: filePath,
      userQuestion: userQuestion,
    })

    // Clean up temporary upload file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    return res.json({
      success: true,
      analysis: analysisResult.analysis,
      result: analysisResult.analysis,
      response: analysisResult.analysis,
    })
  } catch (error) {
    console.error("Route Processing Error:", error)

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    return res.status(500).json({
      success: false,
      analysis: "Internal diagnostic server error while communicating with AI engines.",
      result: "Internal diagnostic server error while communicating with AI engines.",
    })
  }
}

router.post("/analyze-disease", upload.single("image"), handleDiseaseAnalysis)
router.post("/detect", upload.single("image"), handleDiseaseAnalysis)

module.exports = router