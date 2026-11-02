import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import {
  CalendarDays,
  RotateCcw,
  CheckCircle2,
  MapPin,
  Droplets,
  Sprout,
} from "lucide-react"

function LandDetailsPage() {

  const { id } = useParams();
  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rotationPlan, setRotationPlan] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [startDate, setStartDate] = useState("");
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const [customCropEnabled, setCustomCropEnabled] = useState(false);

  function getCurrentUsername() {
    try {
      const user = JSON.parse(localStorage.getItem("agriverseCurrentUser") || "{}");
      return typeof user.username === "string" ? user.username : "";
    } catch {
      return "";
    }
  }

  const storageKey = `agriverseLands_${getCurrentUsername()}`;
  const dashboardPath = "/farmer-dashboard";

  function getLocalLands() {
    try {
      const lands = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(lands) ? lands : [];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadLand() {
      setLoading(true);
      setError("");
      const localLand = getLocalLands().find(
        (item) => String(item._id || item.id) === String(id)
      );
      const isMongoId = /^[a-f\d]{24}$/i.test(id || "");
      let foundLand = localLand;

      if (isMongoId) {
        const token = sessionStorage.getItem("agriverseToken");
        if (!token) {
          setError("Please log in again to view this land.");
          setLand(null);
          setLoading(false);
          return;
        }
        try {
          const response = await fetch(`/api/lands/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });
          if (!response.ok) {
            setError(response.status === 404
              ? "Land not found or access denied."
              : "Unable to load land details from the server.");
            setLand(null);
            return;
          }
          const dbLand = await response.json();
          foundLand = {
            ...dbLand,
            ...Object.fromEntries(
              ["rotationPlan", "dailyTasks", "rotationEnabled", "customCropEnabled", "selectedCrop", "startDate"]
                .filter((key) => localLand?.[key] !== undefined)
                .map((key) => [key, localLand[key]])
            ),
            landName: dbLand.name || "Untitled Land",
            image: dbLand.image || localLand?.image || "",
          };
        } catch (err) {
          if (err.name !== "AbortError") {
            setError("Could not reach the server. Try again later.");
            setLand(null);
          }
          return;
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }

      if (controller.signal.aborted) return;
      if (!foundLand) {
        setError("Land not found.");
        setLand(null);
      } else {
        setLand(foundLand);
        setRotationPlan(foundLand.rotationPlan || []);
        setDailyTasks(foundLand.dailyTasks || []);
        setRotationEnabled(Boolean(foundLand.rotationEnabled));
        setCustomCropEnabled(Boolean(foundLand.customCropEnabled));
        setSelectedCrop(foundLand.selectedCrop || "");
        setStartDate(foundLand.startDate || "");
      }
      setLoading(false);
    }

    loadLand();
    return () => controller.abort();
  }, [id]);

  function saveLandData(updatedData) {
    const allLands = getLocalLands();
    const targetId = String(id);
    const exists = allLands.some(
      (item) => String(item._id || item.id) === targetId
    );
    const baseLand = land || {};
    const updatedLands = exists
      ? allLands.map((item) =>
          String(item._id || item.id) === targetId
            ? { ...item, ...updatedData }
            : item
        )
      : [...allLands, { ...baseLand, id: baseLand._id || id, ...updatedData }];
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedLands));
      setLand((previous) => previous ? { ...previous, ...updatedData } : previous);
    } catch {
      setError("Could not save task details in this browser.");
    }
  }

  function getTaskDate(baseDate, extraDays) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + extraDays)

    return {
      fullDate: date.toLocaleDateString("en-GB"),
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
    }
  }

  function generateRotation() {
    if (!startDate) {
      alert("Please select start date.")
      return
    }

    const confirmPlan = window.confirm(
      "This farming schedule will generate AI farm tasks and monthly calendar. Continue?"
    )

    if (!confirmPlan) return

    const generatedPlan = [
      { period: "Jun 2026 - Sep 2026", crop: "Paddy" },
      { period: "Oct 2026 - Jan 2027", crop: "Groundnut" },
      { period: "Feb 2027 - May 2027", crop: "Millets" },
      { period: "Jun 2027 - Oct 2027", crop: "Cotton" },
    ]

    const d1 = getTaskDate(startDate, 1)
    const d2 = getTaskDate(startDate, 3)
    const d3 = getTaskDate(startDate, 5)
    const d4 = getTaskDate(startDate, 7)

    const generatedTasks = [
      {
        id: Date.now() + 1,
        day: d1.day,
        month: d1.month,
        year: d1.year,
        date: d1.fullDate,
        time: "6:00 AM",
        task: "Prepare soil for sowing",
      },
      {
        id: Date.now() + 2,
        day: d2.day,
        month: d2.month,
        year: d2.year,
        date: d2.fullDate,
        time: "7:00 AM",
        task: "Check irrigation flow",
      },
      {
        id: Date.now() + 3,
        day: d3.day,
        month: d3.month,
        year: d3.year,
        date: d3.fullDate,
        time: "5:00 PM",
        task: "Apply organic fertilizer",
      },
      {
        id: Date.now() + 4,
        day: d4.day,
        month: d4.month,
        year: d4.year,
        date: d4.fullDate,
        time: "6:00 AM",
        task: "Monitor pests and weeds",
      },
    ]

    setRotationPlan(generatedPlan)
    setDailyTasks(generatedTasks)
    setRotationEnabled(true)
    setCustomCropEnabled(false)

    saveLandData({
      rotationPlan: generatedPlan,
      dailyTasks: generatedTasks,
      rotationEnabled: true,
      customCropEnabled: false,
      selectedCrop: "",
      startDate,
    })
  }

  function startCustomCrop() {
    if (!selectedCrop || !startDate) {
      alert("Enter crop and start date.")
      return
    }

    const d1 = getTaskDate(startDate, 1)
    const d2 = getTaskDate(startDate, 3)
    const d3 = getTaskDate(startDate, 5)

    const tasks = [
      {
        id: Date.now() + 1,
        day: d1.day,
        month: d1.month,
        year: d1.year,
        date: d1.fullDate,
        time: "6:00 AM",
        task: `Prepare land for ${selectedCrop}`,
      },
      {
        id: Date.now() + 2,
        day: d2.day,
        month: d2.month,
        year: d2.year,
        date: d2.fullDate,
        time: "7:00 AM",
        task: `Start irrigation for ${selectedCrop}`,
      },
      {
        id: Date.now() + 3,
        day: d3.day,
        month: d3.month,
        year: d3.year,
        date: d3.fullDate,
        time: "5:00 PM",
        task: `Check soil moisture for ${selectedCrop}`,
      },
    ]

    setDailyTasks(tasks)
    setCustomCropEnabled(true)
    setRotationEnabled(false)
    setRotationPlan([])

    saveLandData({
      dailyTasks: tasks,
      customCropEnabled: true,
      rotationEnabled: false,
      rotationPlan: [],
      selectedCrop,
      startDate,
    })

    alert("AI crop tasks generated successfully.")
  }

  function deleteRotation() {
    const confirmDelete = window.confirm("Delete this farming schedule?")
    if (!confirmDelete) return

    setRotationPlan([])
    setDailyTasks([])
    setRotationEnabled(false)

    saveLandData({
      rotationPlan: [],
      dailyTasks: [],
      rotationEnabled: false,
    })
  }

  function deleteCustomCropPlan() {
    const confirmDelete = window.confirm("Delete this crop task plan?")
    if (!confirmDelete) return

    setDailyTasks([])
    setCustomCropEnabled(false)
    setSelectedCrop("")
    setStartDate("")

    saveLandData({
      dailyTasks: [],
      customCropEnabled: false,
      selectedCrop: "",
      startDate: "",
    })
  }

  function completeTask(taskId) {
    const confirmTask = window.confirm("Have you completed this task?")
    if (!confirmTask) return

    const updated = dailyTasks.filter((task) => task.id !== taskId)

    setDailyTasks(updated)

    saveLandData({
      dailyTasks: updated,
    })
  }

  const calendarDate = new Date()
  const calendarMonth = calendarDate.getMonth()
  const calendarYear = calendarDate.getFullYear()
  const monthName = calendarDate.toLocaleString("default", { month: "long" })
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()

  if (loading) {
    return <div className="p-10 text-xl">Loading land details...</div>;
  }

  if (!land) {
    return (
      <div className="p-10 text-xl text-red-700" role="alert">
        {error || "Land not found."}
        <div className="mt-4"><Link to={dashboardPath}>← Back to Dashboard</Link></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf7ef] p-10">
      <div className="max-w-6xl mx-auto">
        <Link to={dashboardPath} className="text-green-700 font-bold">
          ← Back to Dashboard
        </Link>

        {error && <p role="alert" className="mt-4 text-red-700">{error}</p>}
        <div className="bg-white rounded-[3rem] overflow-hidden shadow-xl mt-6">
          <img
            src={
              typeof land.image === "string" && land.image.trim() !== ""
                ? land.image
                : "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1400"
            }
            alt={land.landName || "Farm Land"}
            className="w-full h-[340px] object-cover bg-green-100"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1400"
            }}
          />

          <div className="p-10">
            <h1 className="text-5xl font-extrabold text-green-700">
              {land.landName}
            </h1>

            <div className="grid md:grid-cols-3 gap-5 mt-8">
              <div className="bg-green-50 rounded-3xl p-6 border border-green-100">
                <div className="flex items-center gap-3">
                  <MapPin className="text-red-500" />
                  <div>
                    <h2 className="font-bold text-lg">Location</h2>
                    <p className="text-gray-700">{land.location || "Not Added"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-3xl p-6 border border-green-100">
                <div className="flex items-center gap-3">
                  <Sprout className="text-green-700" />
                  <div>
                    <h2 className="font-bold text-lg">Soil Type</h2>
                    <p className="text-gray-700">{land.soilType || "Not Added"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-3xl p-6 border border-green-100">
                <div className="flex items-center gap-3">
                  <Droplets className="text-sky-600" />
                  <div>
                    <h2 className="font-bold text-lg">Irrigation</h2>
                    <p className="text-gray-700">{land.irrigation || "Not Added"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-[2rem] p-8 mt-10 border border-green-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCcw className="text-green-700" />
                  <h2 className="text-3xl font-extrabold">2-Year Crop Rotation</h2>
                </div>

                {rotationEnabled && (
                  <button
                    onClick={deleteRotation}
                    className="bg-red-500 text-white px-5 py-2 rounded-2xl font-semibold"
                  >
                    Delete Plan
                  </button>
                )}
              </div>

              {rotationPlan.length === 0 ? (
                <>
                  <p className="text-gray-700 mt-4 leading-7">
                    This AI farming schedule will be used to generate daily farm
                    tasks and calendar automatically.
                  </p>

                  <div className="grid md:grid-cols-2 gap-5 mt-8">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-green-200 rounded-2xl px-5 py-4"
                    />

                    <button
                      onClick={generateRotation}
                      className="bg-green-700 text-white rounded-2xl font-bold"
                    >
                      Generate AI Rotation
                    </button>
                  </div>

                  <div className="mt-10 border-t pt-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">
                          Already know your crop?
                        </h3>

                        <p className="text-gray-600 mt-2">
                          Need suggestions? Use Crop AI.
                        </p>
                      </div>

                      {customCropEnabled && (
                        <button
                          onClick={deleteCustomCropPlan}
                          className="bg-red-500 text-white px-5 py-2 rounded-2xl font-semibold"
                        >
                          Delete Crop Plan
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-5 mt-6">
                      <input
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        placeholder="Enter Crop Name"
                        className="border border-green-200 rounded-2xl px-5 py-4"
                      />

                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-green-200 rounded-2xl px-5 py-4"
                      />

                      <button
                        onClick={startCustomCrop}
                        className="bg-sky-600 text-white rounded-2xl font-bold"
                      >
                        Generate Crop Tasks
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-5 mt-8">
                  {rotationPlan.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-2xl p-5 border border-green-100"
                    >
                      <h3 className="font-bold text-xl text-green-700">
                        {item.crop}
                      </h3>
                      <p className="text-gray-700 mt-1">{item.period}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] p-8 mt-10 border border-green-700">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-blue-600" />
                <h2 className="text-3xl font-extrabold">
                  7-Day Daily Farm Tasks
                </h2>
              </div>

              {dailyTasks.length === 0 ? (
                <div className="bg-green-50 rounded-2xl p-6 mt-6">
                  No AI tasks generated yet.
                </div>
              ) : (
                <div className="space-y-5 mt-8">
                  {dailyTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-green-50 rounded-2xl p-5 flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-bold text-lg">{task.task}</h3>
                        <p className="text-lg text-gray-800 mt-1">
                          {task.date} - {task.time}
                        </p>
                      </div>

                      <button
                        onClick={() => completeTask(task.id)}
                        className="bg-green-700 text-white p-3 rounded-2xl"
                      >
                        <CheckCircle2 />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] p-8 mt-10 border border-green-700">
              <h2 className="text-3xl font-extrabold text-purple-800">
                {monthName} Monthly Calendar
              </h2>

              <p className="text-gray-600 mt-2">
                Icons appear only on dates having AI-generated tasks.
              </p>

              <div className="grid grid-cols-7 gap-4 mt-8">
                {Array.from({ length: daysInMonth }).map((_, index) => {
                  const dayNumber = index + 1

                  const hasTask = dailyTasks.some(
                    (task) =>
                      task.day === dayNumber &&
                      task.month === calendarMonth &&
                      task.year === calendarYear
                  )

                  return (
                    <div
                      key={index}
                      className="bg-green-50 rounded-2xl h-28 p-3 border border-green-100"
                    >
                      <div className="font-bold text-green-700">
                        {dayNumber}
                      </div>

                      {hasTask && (
                        <div className="text-3xl text-center mt-4">🌱</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandDetailsPage