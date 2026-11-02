import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { landsStore } from "../data/landsStore"

function MonthlyCalendarPage() {
  const { landId } = useParams()
  const land = landsStore.find((item) => String(item.id) === landId)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarTasks, setCalendarTasks] = useState([])

  useEffect(() => {
  if (!land?.crop) return

  fetch(`http://localhost:5000/api/crop-calendar/${land.crop}`)
    .then((res) => res.json())
    .then((data) => setCalendarTasks(data))
    .catch((error) => console.error("Monthly calendar fetch error:", error))
}, [land])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthName = currentDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  })

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const calendarDays = []

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  function goToPreviousMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  function goToNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  function isToday(day) {
    const today = new Date()

    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  function hasTaskOnDay(day) {
  if (!land?.sowingDate) return false

  return calendarTasks.some((task) => {
    const taskDate = new Date(land.sowingDate)
    taskDate.setDate(
      taskDate.getDate() + Number(task.day_after_sowing) - 1
    )

    return (
      taskDate.getDate() === day &&
      taskDate.getMonth() === month &&
      taskDate.getFullYear() === year
    )
  })
}

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to={`/land/${landId}`}
          className="text-green-700 font-semibold hover:underline"
        >
          ← Back to Land
        </Link>

        <div className="bg-white rounded-3xl p-6 border border-green-100 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-green-700">
                Monthly Calendar
              </h1>

              <p className="text-gray-600 mt-1">
                {land?.name || "Land"} work calendar
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={goToPreviousMonth}
                className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200"
              >
                <ChevronLeft className="text-green-700" size={22} />
              </button>

              <h2 className="text-xl font-bold text-gray-900 min-w-44 text-center">
                {monthName}
              </h2>

              <button
                onClick={goToNextMonth}
                className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200"
              >
                <ChevronRight className="text-green-700" size={22} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border border-green-100 rounded-2xl overflow-hidden">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="bg-green-100 text-green-800 font-bold text-center py-3 border border-green-100"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-28 p-3 border border-green-100 bg-white ${
                  day ? "hover:bg-green-50" : "bg-gray-50"
                }`}
              >
                {day && (
  <>
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
        isToday(day)
          ? "bg-green-700 text-white"
          : "text-gray-800"
      }`}
    >
      {day}
    </div>

    {hasTaskOnDay(day) && (
      <div className="mt-3 flex flex-wrap gap-1">
        <span className="text-xs bg-green-200 text-green-700 px-5 py-1 rounded-full">
          🌱
        </span>
      </div>
    )}
  </>
)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyCalendarPage