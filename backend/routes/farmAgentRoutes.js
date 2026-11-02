const express = require("express")
const { generateFarmAdvice } = require("../services/farmAgentService")

const router = express.Router()

router.post("/advice", async (req, res) => {
  try {
    const advice = await generateFarmAdvice(req.body)
    res.json(advice)
  } catch (error) {
    console.error("Farm agent error:", error)
    res.status(500).json({
      summary: "Farm agent failed to generate advice.",
      recommendedCrops: [],
      nextActions: [],
      warning: "Backend farm agent error. Check terminal.",
    })
  }
})

module.exports = router