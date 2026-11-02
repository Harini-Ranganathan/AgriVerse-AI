export function translateText(text, language) {
  if (language === "தமிழ்") {
    const tamilMap = {
      "Crop AI": "பயிர் AI",
      "Crop Doctor": "பயிர் மருத்துவர்",
      "Weather": "வானிலை",
      "Market Price": "சந்தை விலை",
      "Add Land": "நிலம் சேர்க்க",
      "Logout": "வெளியேறு",
      "Farmer Dashboard": "விவசாயி டாஷ்போர்டு",
    }

    return tamilMap[text] || text
  }

  if (language === "हिन्दी") {
    const hindiMap = {
      "Crop AI": "फसल AI",
      "Crop Doctor": "फसल डॉक्टर",
      "Weather": "मौसम",
      "Market Price": "बाजार मूल्य",
      "Add Land": "भूमि जोड़ें",
      "Logout": "लॉग आउट",
      "Farmer Dashboard": "किसान डैशबोर्ड",
    }

    return hindiMap[text] || text
  }

  return text
}