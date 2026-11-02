
import {
  useEffect,
  useState,
} from "react"

import {
  Link,
} from "react-router-dom"

function WeatherPage() {

  const currentUser =
  JSON.parse(
    localStorage.getItem(
      "agriverseCurrentUser"
    )
  ) || {}

const dashboardPath =
  currentUser.role === "buyer"
    ? "/customer-dashboard"
    : "/farmer-dashboard"

  const [
    forecastMap,
    setForecastMap,
  ] = useState({})

  const [
    currentMonthDate,
  ] = useState(
    new Date()
  )

  useEffect(() => {
    loadWeather()
  }, [])

  async function loadWeather() {

    try {

      const currentUser =
        JSON.parse(
          localStorage.getItem(
            "agriverseCurrentUser"
          )
        ) || {
          username:
            "defaultUser",
        }

      const savedLocation =
        localStorage.getItem(
          `agriverseFarmLocation_${currentUser.username}`
        )

      if (
        !savedLocation
      ) {

        alert(
          "Please enable GPS location from dashboard first."
        )

        return
      }

      const parsedLocation =
        JSON.parse(
          savedLocation
        )

      const latitude =
        parsedLocation.latitude

      const longitude =
        parsedLocation.longitude

      if (
        !latitude ||
        !longitude
      ) {

        alert(
          "GPS coordinates not found."
        )

        return
      }

      const weatherRes =
        await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=auto&forecast_days=16`
        )

      const weatherData =
        await weatherRes.json()

      if (
        !weatherData.daily
      ) {

        alert(
          "Weather API failed."
        )

        return
      }

      const map = {}

      weatherData.daily.time.forEach(
        (
          date,
          index
        ) => {

          map[date] = {

            max:
              weatherData.daily
                .temperature_2m_max[
                index
              ],

            min:
              weatherData.daily
                .temperature_2m_min[
                index
              ],

            wind:
              weatherData.daily
                .wind_speed_10m_max[
                index
              ],

            code:
              weatherData.daily
                .weather_code[
                index
              ],
          }
        }
      )

      setForecastMap(
        map
      )

    } catch (
      error
    ) {

      console.error(
        "Weather Error:",
        error
      )

      alert(
        "Failed to load weather."
      )
    }
  }

  function getWeather(
    code
  ) {

    if (
      code === 0
    ) {
      return {
        text: "Sunny",
        icon: "☀️",
      }
    }

    if (
      [
        1,
        2,
        3,
      ].includes(
        code
      )
    ) {
      return {
        text:
          "Cloudy",
        icon: "⛅",
      }
    }

    if (
      [
        51,
        53,
        55,
        61,
        63,
        65,
      ].includes(
        code
      )
    ) {
      return {
        text: "Rain",
        icon: "🌧️",
      }
    }

    if (
      [
        95,
        96,
        99,
      ].includes(
        code
      )
    ) {
      return {
        text: "Storm",
        icon: "⛈️",
      }
    }

    return {
      text:
        "Weather",
      icon: "🌤️",
    }
  }

  function formatDate(
    year,
    month,
    day
  ) {

    return `${year}-${String(
      month + 1
    ).padStart(
      2,
      "0"
    )}-${String(
      day
    ).padStart(
      2,
      "0"
    )}`
  }

  function renderCalendar(
    dateObj
  ) {

    const year =
      dateObj.getFullYear()

    const month =
      dateObj.getMonth()

    const monthName =
      dateObj.toLocaleString(
        "default",
        {
          month:
            "long",

          year:
            "numeric",
        }
      )

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate()

    return (

      <div className="bg-white rounded-[3rem] p-10 shadow-xl mt-8">

        <h1 className="text-5xl font-extrabold text-sky-700">
          {monthName} Weather Forecast
        </h1>

        <div className="grid grid-cols-7 gap-5 mt-12">

          {Array.from({
            length:
              daysInMonth,
          }).map(
            (
              _,
              index
            ) => {

              const dayNumber =
                index + 1

              const dateKey =
                formatDate(
                  year,
                  month,
                  dayNumber
                )

              const day =
                forecastMap[
                  dateKey
                ]

              const weather =
                day
                  ? getWeather(
                      day.code
                    )
                  : null

              return (

                <div
                  key={
                    dateKey
                  }

                  className="bg-sky-50 border border-sky-100 rounded-2xl p-4 h-56 flex flex-col"
                >

                  <div className="font-bold text-sky-700 text-lg">
                    {dayNumber}
                  </div>

                  {day ? (

                    <div className="flex flex-col items-center justify-center h-full text-center">

                      <div className="text-4xl">
                        {
                          weather.icon
                        }
                      </div>

                      <div className="font-bold text-gray-800 text-sm mt-2">
                        {
                          weather.text
                        }
                      </div>

                      <div className="text-sky-700 font-bold text-lg mt-1">
                        {
                          day.max
                        }
                        °
                      </div>

                      <div className="text-xs text-gray-600">
                        Min{" "}
                        {
                          day.min
                        }
                        °
                      </div>

                      <div className="text-xs text-gray-700 mt-1">
                        💨{" "}
                        {
                          day.wind
                        }{" "}
                        km/h
                      </div>

                    </div>

                  ) : (

                    <div className="flex-1"></div>

                  )}
                </div>
              )
            }
          )}
        </div>
      </div>
    )
  }

  const nextMonthDate =
    new Date(
      currentMonthDate.getFullYear(),

      currentMonthDate.getMonth() +
        1,

      1
    )

  return (

    <div className="min-h-screen bg-sky-50 p-8">

      <div className="max-w-7xl mx-auto">

        <Link
          to={dashboardPath}

          className="text-sky-700 font-bold"
        >
          ← Back to Dashboard
        </Link>

        {renderCalendar(
          currentMonthDate
        )}

        {renderCalendar(
          nextMonthDate
        )}

      </div>
    </div>
  )
}

export default WeatherPage

