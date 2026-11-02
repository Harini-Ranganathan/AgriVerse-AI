const express = require("express")
const fs = require("fs")
const path = require("path")
const csv = require("csv-parser")

const router = express.Router()

router.get("/", (req, res) => {
  const results = []

  fs.createReadStream(path.join(__dirname, "../data/crop_suitability.csv"))
    .pipe(csv())
    .on("data", (data) => {
      results.push(data)
    })
    .on("end", () => {
      res.json(results)
    })
    .on("error", (error) => {
      res.status(500).json({ message: "CSV reading error", error })
    })
})

module.exports = router