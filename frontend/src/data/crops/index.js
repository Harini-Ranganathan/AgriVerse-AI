import cereals from "./cereals"
import pulses from "./pulses"
import oilSeeds from "./oilSeeds"
import commercial from "./commercial"
import vegetables from "./vegetables"
import plantation from "./plantation"
import spices from "./spices"

const cropLifecycleData = {
  ...cereals,
  ...pulses,
  ...oilSeeds,
  ...commercial,
  ...vegetables,
  ...plantation,
  ...spices,
}

export default cropLifecycleData

export function getCropLifecycle(cropName) {
  if (!cropName) return null

  const key = cropName
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim()

  return cropLifecycleData[key] || null
}

export function checkCropSuitability(
  cropName,
  soilType,
  irrigation,
  startDate
) {
  const crop = getCropLifecycle(cropName)

  if (!crop) {
    return {
      suitable: false,
      message:
        "This crop lifecycle is not added yet. Please use Crop AI for recommendation.",
    }
  }

  const startMonth = new Date(startDate).toLocaleString(
    "default",
    {
      month: "long",
    }
  )

  const soilOk =
    crop.suitableSoils.includes(
      soilType
    )

  const irrigationOk =
    crop.suitableIrrigation.includes(
      irrigation
    )

  const seasonOk =
    crop.seasons.includes(
      startMonth
    )

  if (
    soilOk &&
    irrigationOk &&
    seasonOk
  ) {
    return {
      suitable: true,
      message: `${crop.cropName} is suitable for this land and season.`,
    }
  }

  const problems = []

  if (!soilOk) {
    problems.push(
      `soil type (${soilType}) may not be suitable`
    )
  }

  if (!irrigationOk) {
    problems.push(
      `water availability (${irrigation}) may not be suitable`
    )
  }

  if (!seasonOk) {
    problems.push(
      `season/month (${startMonth}) may not be suitable`
    )
  }

  return {
    suitable: false,
    message: `${crop.cropName} may not be suitable because ${problems.join(
      ", "
    )}.`
  }
}

export function generateLifecycleTasks(
  cropName,
  startDate,
  landName
) {
  const crop =
    getCropLifecycle(
      cropName
    )

  if (
    !crop ||
    !startDate
  ) {
    return []
  }

  return crop.lifecycle.map(
    (
      item,
      index
    ) => {
      const date =
        new Date(
          startDate
        )

      date.setDate(
        date.getDate() +
          item.day -
          1
      )

      return {
        id:
          Date.now() +
          index,

        crop:
          crop.cropName,

        landName,

        taskDay:
          item.day,

        day:
          date.getDate(),

        month:
          date.getMonth(),

        year:
          date.getFullYear(),

        date:
          date.toLocaleDateString(
            "en-GB"
          ),

        time:
          item.time,

        icon:
          item.icon,

        task:
          item.task,
      }
    }
  )
}

export function getUpcomingTasks(
  allTasks
) {
  const today =
    new Date()

  return allTasks.filter(
    (
      task
    ) => {
      const taskDate =
        new Date(
          task.year,
          task.month,
          task.day
        )

      return (
        taskDate >=
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        )
      )
    }
  )
}