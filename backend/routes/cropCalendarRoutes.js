const express = require("express")
const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")

const router = express.Router()

router.get("/:cropName", (req, res) => {
  const cropName = req.params.cropName.toLowerCase()
  const results = []

  fs.createReadStream(
    path.join(__dirname, "../data/crop_calendar_tamilnadu.csv")
  )
    .pipe(csv())
    .on("data", (data) => {
      if (!data.crop) return

      if (data.crop.trim().toLowerCase() === cropName) {
        results.push(data)
      }
    })
    .on("end", () => {
      res.json(results)
    })
    .on("error", (error) => {
      res.status(500).json({ message: "CSV reading error", error })
    })
})

module.exports = router