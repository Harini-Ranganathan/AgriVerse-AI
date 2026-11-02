export function generateCropCalendar(cropName, sowingDate) {
  if (!cropName || !sowingDate) return []

  const crop = cropName.toLowerCase()
  const startDate = new Date(sowingDate)

  let taskTemplate = []

  if (crop.includes("paddy")) {
    taskTemplate = [
      { day: 1, task: "Prepare nursery bed", time: "6:00 AM" },
      { day: 7, task: "Check seedling growth", time: "7:00 AM" },
      { day: 20, task: "Transplant seedlings", time: "6:30 AM" },
      { day: 30, task: "First fertilizer application", time: "8:00 AM" },
      { day: 45, task: "Weed removal", time: "7:00 AM" },
      { day: 60, task: "Pest and disease inspection", time: "5:00 PM" },
      { day: 90, task: "Grain filling stage check", time: "6:00 AM" },
      { day: 120, task: "Harvest planning", time: "7:00 AM" },
    ]
  } else if (crop.includes("groundnut")) {
    taskTemplate = [
      { day: 1, task: "Sow groundnut seeds", time: "6:00 AM" },
      { day: 10, task: "Check germination", time: "7:00 AM" },
      { day: 25, task: "Remove weeds", time: "6:30 AM" },
      { day: 35, task: "Gypsum application", time: "8:00 AM" },
      { day: 50, task: "Pest inspection", time: "5:00 PM" },
      { day: 90, task: "Check pod maturity", time: "7:00 AM" },
      { day: 110, task: "Harvest preparation", time: "6:00 AM" },
    ]
  } else {
    taskTemplate = [
      { day: 1, task: "Sowing / planting", time: "6:00 AM" },
      { day: 7, task: "Check germination or plant establishment", time: "7:00 AM" },
      { day: 20, task: "Weed inspection", time: "6:30 AM" },
      { day: 30, task: "Nutrient check", time: "8:00 AM" },
      { day: 45, task: "Pest and disease inspection", time: "5:00 PM" },
      { day: 60, task: "Growth stage review", time: "7:00 AM" },
      { day: 90, task: "Harvest planning", time: "6:00 AM" },
    ]
  }

  return taskTemplate.map((item) => {
    const taskDate = new Date(startDate)
    taskDate.setDate(startDate.getDate() + item.day - 1)

    return {
      ...item,
      date: taskDate.toISOString().split("T")[0],
    }
  })
}