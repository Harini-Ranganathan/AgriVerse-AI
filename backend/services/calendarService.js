function generateCalendarTasks(crop) {
  const tasks = {
    Paddy: [
      {
        day: 1,
        task: "Prepare land and begin irrigation",
      },

      {
        day: 7,
        task: "Sow paddy seeds",
      },

      {
        day: 20,
        task: "Apply first fertilizer",
      },

      {
        day: 35,
        task: "Monitor weeds and pests",
      },

      {
        day: 60,
        task: "Check water levels carefully",
      },
    ],

    Groundnut: [
      {
        day: 1,
        task: "Prepare red soil",
      },

      {
        day: 5,
        task: "Sow groundnut seeds",
      },

      {
        day: 25,
        task: "Apply nutrients",
      },

      {
        day: 40,
        task: "Monitor fungal symptoms",
      },
    ],
  }

  return tasks[crop] || []
}

module.exports = {
  generateCalendarTasks,
}