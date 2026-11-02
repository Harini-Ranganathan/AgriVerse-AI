const axios = require("axios")
async function searchCropInformation(query) {
  try {
    const response = await axios.get(
      "https://trefle.io/api/v1/plants/search",
      {
        params: {
          token: process.env.TREFLE_API_KEY,
          q: query,
        },
      }
    )
    return response.data.data || []
  }
  catch (error) {
    console.error(
      "Trefle API Error:",
      error.message
    )
    return []
  }
}
module.exports = {
  searchCropInformation,
}
