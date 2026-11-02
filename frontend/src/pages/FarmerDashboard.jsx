import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import {
  Sprout,
  Stethoscope,
  CloudSun,
  Users,
  TrendingUp,
  Thermometer,
  Droplets,
  LogOut,
  ShoppingBasket,
  CalendarDays,
  Map,
  Trash2,
  Tractor,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react"

function FarmerDashboard() {
  const currentUser =
    JSON.parse(localStorage.getItem("agriverseCurrentUser")) ||
    JSON.parse(localStorage.getItem("agriverseUser")) || {
      username: "defaultUser",
    }

  const currentUsername =
    currentUser.username || currentUser.name || "defaultUser"

  const [lands, setLands] = useState([])
  const [deletingLandId, setDeletingLandId] = useState(null)
  const [openLandMenuId, setOpenLandMenuId] = useState(null)
  const [allTasks, setAllTasks] = useState([])
  const [products, setProducts] = useState([])
  const [openProductMenuId, setOpenProductMenuId] = useState(null)
  const [deletingProductId, setDeletingProductId] = useState(null)
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState("")
  const [productNotice, setProductNotice] = useState("")
  const [publishingProductId, setPublishingProductId] = useState(null)
  const [marketplaceLands, setMarketplaceLands] = useState([])
  const [openMarketplaceLandMenuId, setOpenMarketplaceLandMenuId] = useState(null)
  const [deletingMarketplaceLandId, setDeletingMarketplaceLandId] = useState(null)
  const [marketplaceLandError, setMarketplaceLandError] = useState("")

  const [farmLocation, setFarmLocation] = useState(() => {
    const saved = localStorage.getItem(
      `agriverseFarmLocation_${currentUsername}`
    )

    return saved ? JSON.parse(saved) : null
  })

  const [temperature, setTemperature] = useState("---")
  const [humidity, setHumidity] = useState("---")

  const [rentalEquipments, setRentalEquipments] = useState([])
  const [openEquipmentMenuId, setOpenEquipmentMenuId] = useState(null)
  const [equipmentLoading, setEquipmentLoading] = useState(true)
  const [equipmentError, setEquipmentError] = useState("")
  const [equipmentNotice, setEquipmentNotice] = useState("")
  const [deletingEquipmentId, setDeletingEquipmentId] = useState(null)

  useEffect(() => {
    loadDashboard()
    loadMyProducts()
    loadMarketplaceLands()
    loadMyEquipments()

    const savedLocation = localStorage.getItem(
      `agriverseFarmLocation_${currentUsername}`
    )

    if (savedLocation) {
      const parsedLocation = JSON.parse(savedLocation)

      setFarmLocation(parsedLocation)

      if (parsedLocation.latitude && parsedLocation.longitude) {
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${parsedLocation.latitude}&longitude=${parsedLocation.longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto&forecast_days=1`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.current) {
              setTemperature(`${data.current.temperature_2m}°C`)
              setHumidity(`${data.current.relative_humidity_2m}%`)
            }
          })
          .catch((error) => console.error(error))
      }
    }
  }, [])

  async function loadMarketplaceLands() {
    const token = sessionStorage.getItem("agriverseToken")
    if (!token) {
      setMarketplaceLandError("Please log in again to view your published lands.")
      return
    }
    try {
      const response = await fetch("/api/marketplace-lands/mine", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to load your land listings.")
      }
      const listings = Array.isArray(data) ? data : (data.lands || data.listings || data.data || [])
      if (!Array.isArray(listings)) throw new Error("Invalid land listings response.")
      setMarketplaceLands(listings)
      setMarketplaceLandError("")
    } catch (error) {
      setMarketplaceLandError(error.message || "Unable to load your published lands.")
    }
  }

  async function deleteMarketplaceLand(land) {
    const id = String(land._id || land.id || "")
    if (!id || deletingMarketplaceLandId) return
    setOpenMarketplaceLandMenuId(null)
    if (!window.confirm(`Delete ${land.title || "this land listing"} permanently?`)) return
    const token = sessionStorage.getItem("agriverseToken")
    if (!token) {
      setMarketplaceLandError("Please log in again.")
      return
    }
    setDeletingMarketplaceLandId(id)
    setMarketplaceLandError("")
    try {
      const response = await fetch(`/api/marketplace-lands/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to delete land.")
      }
      setMarketplaceLands(previous => previous.filter(item => String(item._id || item.id) !== id))
    } catch (error) {
      setMarketplaceLandError(error.message || "Unable to delete land.")
    } finally {
      setDeletingMarketplaceLandId(null)
    }
  }

  function loadDashboard() {
    const savedLands =
      JSON.parse(localStorage.getItem(`agriverseLands_${currentUsername}`)) ||
      []

    setLands(savedLands)

    // Keep existing browser-only land details such as photos and daily tasks.
    // Also load server-owned lands so successful MongoDB saves appear here.
    const token = sessionStorage.getItem("agriverseToken")
    if (token) {
      fetch("/api/lands", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Could not load server lands")
          return response.json()
        })
        .then((serverLands) => {
          if (!Array.isArray(serverLands)) return

          const localById = new Map(
            savedLands.map((land) => [String(land._id || land.id), land])
          )
          const serverIds = new Set(serverLands.map((land) => String(land._id)))
          const combined = serverLands.map((land) => {
            const local = localById.get(String(land._id)) || {}
            return {
              ...land,
              ...local,
              id: land._id,
              _id: land._id,
              landName: local.landName || land.name,
              image: local.image || land.image,
            }
          })

          // Preserve legacy browser-only lands until a deliberate migration.
          combined.push(
            ...savedLands.filter(
              (land) => !serverIds.has(String(land._id || land.id))
            )
          )
          setLands(combined)
          const serverTasks = []
          combined.forEach((land) => {
            (land.dailyTasks || []).forEach((task) => {
              serverTasks.push({
                ...task,
                landName: land.landName || land.name,
                landId: land.id,
              })
            })
          })
          setAllTasks(serverTasks)
        })
        .catch(() => {
          // Retain existing local dashboard data when the API is unavailable.
        })
    }

    const collectedTasks = []

    savedLands.forEach((land) => {
      const tasks = land.dailyTasks || []

      tasks.forEach((task) => {
        collectedTasks.push({
          ...task,
          landName: land.landName,
          landId: land.id,
        })
      })
    })

    setAllTasks(collectedTasks)


  }

  async function loadMyProducts() {
    setProductsLoading(true)
    setProductsError("")
    const token = sessionStorage.getItem("agriverseToken")
    if (!token) {
      setProducts([])
      setProductsError("Please log in to view your products.")
      setProductsLoading(false)
      return
    }
    try {
      const response = await fetch("/api/product-listings/mine", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !Array.isArray(result)) {
        throw new Error(result.message || "Could not load your products.")
      }
      setProducts(result)
    } catch (error) {
      setProducts([])
      setProductsError(error.message || "Could not load your products.")
    } finally {
      setProductsLoading(false)
    }
  }

  async function enableLocation() {
    if (!navigator.geolocation) {
      alert("GPS not supported on this device.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude

          let streetName = "Exact street not found"

          try {
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            )

            const geoData = await geoResponse.json()

            streetName =
              geoData.address?.road ||
              geoData.address?.pedestrian ||
              geoData.address?.footway ||
              geoData.address?.residential ||
              geoData.address?.suburb ||
              geoData.address?.neighbourhood ||
              geoData.display_name ||
              "Exact street not found"
          } catch (error) {
            console.error(error)
          }

          const fullLocation = {
            status: "Location Enabled",
            streetName,
            latitude,
            longitude,
          }

          localStorage.setItem(
            `agriverseFarmLocation_${currentUsername}`,
            JSON.stringify(fullLocation)
          )

          setFarmLocation(fullLocation)

          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto&forecast_days=1`
          )

          const weatherData = await weatherResponse.json()

          if (weatherData.current) {
            setTemperature(`${weatherData.current.temperature_2m}°C`)
            setHumidity(`${weatherData.current.relative_humidity_2m}%`)
          }

          alert("GPS location enabled successfully.")
        } catch (error) {
          console.error(error)
          alert("Unable to fetch live weather data.")
        }
      },
      () => {
        alert("Please allow location access.")
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }


  async function loadMyEquipments() {
    const token = sessionStorage.getItem("agriverseToken")
    setEquipmentLoading(true)
    setEquipmentError("")
    if (!token) {
      setRentalEquipments([])
      setEquipmentError("Please log in again to view your equipment.")
      setEquipmentLoading(false)
      return
    }
    try {
      const response = await fetch("/api/rental-equipment/mine", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      const mine = Array.isArray(data)
        ? data
        : (data.equipment || data.equipments || data.listings)
      if (!response.ok || !Array.isArray(mine)) {
        throw new Error(data.message || "Could not load your equipment.")
      }
      setRentalEquipments(mine)
    } catch (error) {
      setEquipmentError(error.message || "Could not load your equipment.")
    } finally {
      setEquipmentLoading(false)
    }
  }

  async function deleteEquipment(equipment) {
    const id = String(equipment._id || equipment.id || "")
    if (!id || deletingEquipmentId) return
    setOpenEquipmentMenuId(null)
    if (!window.confirm(`Delete ${equipment.name || "this equipment"}? Listings with rental bookings may not be deletable.`)) return
    const token = sessionStorage.getItem("agriverseToken")
    if (!token) {
      setEquipmentError("Please log in again.")
      return
    }
    setDeletingEquipmentId(id)
    setEquipmentError("")
    setEquipmentNotice("")
    try {
      const response = await fetch(`/api/rental-equipment/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not delete equipment.")
      }
      setRentalEquipments(previous => previous.filter(item => String(item._id || item.id) !== id))
      setEquipmentNotice("Equipment deleted successfully.")
    } catch (error) {
      setEquipmentError(error.message || "Could not delete equipment.")
    } finally {
      setDeletingEquipmentId(null)
    }
  }

  function startEditLand(land) {
    setOpenLandMenuId(null)
    const landId = land._id || land.id
    if (!land._id) {
      alert("This land is saved only in browser storage. Please synchronize it before editing through the database.")
      return
    }
    window.location.assign(`/add-land?edit=${encodeURIComponent(String(landId))}`)
  }

  async function changeProductPublication(product) {
    const id = String(product._id || product.id)
    const publish = product.isPublished === false
    if (publishingProductId || deletingProductId) return
    if (!window.confirm(publish ? "Publish this product in the marketplace?" : "Unpublish this product? Existing enquiries and orders will remain available.")) return

    const token = sessionStorage.getItem("agriverseToken")
    if (!token) {
      setProductsError("Please log in again.")
      return
    }

    setOpenProductMenuId(null)
    setPublishingProductId(id)
    setProductsError("")
    setProductNotice("")
    try {
      const response = await fetch(`/api/product-listings/${encodeURIComponent(id)}/publication`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublished: publish }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to change publication status.")
      setProducts(previous => previous.map(item => String(item._id || item.id) === id ? { ...item, isPublished: publish } : item))
      setProductNotice(publish ? "Product published successfully." : "Product unpublished. Its order history remains available.")
    } catch (error) {
      setProductsError(error.message || "Unable to change publication status.")
    } finally {
      setPublishingProductId(null)
    }
  }

  async function deleteProduct(product) {
    setOpenProductMenuId(null)
    if (!window.confirm(`Delete ${product.productName || product.name || "this product"}? This cannot be undone.`)) return
    const token = sessionStorage.getItem("agriverseToken")
    if (!token) { alert("Please log in again."); return }
    setDeletingProductId(String(product._id))
    try {
      const response = await fetch(`/api/product-listings/${encodeURIComponent(String(product._id))}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to delete product")
      await loadMyProducts()
    } catch (error) {
      alert(error.message || "Unable to delete product")
    } finally {
      setDeletingProductId(null)
    }
  }

  async function deleteLand(id) {
    if (deletingLandId !== null) return

    const landToDelete = lands.find((item) => String(item.id) === String(id))
    if (!landToDelete) return

    const confirmDelete = window.confirm(
      "Delete this land? This action cannot be undone."
    )
    if (!confirmDelete) return

    setDeletingLandId(String(id))
    try {
      if (landToDelete._id) {
        const token = sessionStorage.getItem("agriverseToken")
        if (!token) {
          alert("Your session has expired. Please log in again.")
          return
        }

        const response = await fetch(
          `/api/lands/${encodeURIComponent(String(landToDelete._id))}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (!response.ok) {
          let message = "Unable to delete this land. Please try again."
          try {
            const result = await response.json()
            if (typeof result.message === "string") message = result.message
          } catch {
            // A response may not contain JSON.
          }
          alert(message)
          return
        }
      }

      const updated = lands.filter((item) => String(item.id) !== String(id))
      const storageKey = `agriverseLands_${currentUsername}`

      // Keep browser-only details such as images and tasks for remaining lands.
      // If browser storage fails after database deletion, the API deletion
      // succeeded; tell the user rather than attempting a duplicate deletion.
      try {
        const existingStored = JSON.parse(localStorage.getItem(storageKey) || "[]")
        if (Array.isArray(existingStored)) {
          const kept = existingStored.filter(
            (item) => String(item._id || item.id) !== String(landToDelete._id || id)
          )
          localStorage.setItem(storageKey, JSON.stringify(kept))
        }
      } catch {
        alert("Land deletion completed, but the browser's saved copy could not be updated.")
      }

      setLands(updated)
      setAllTasks(
        updated.flatMap((land) =>
          (land.dailyTasks || []).map((task) => ({
            ...task,
            landName: land.landName || land.name,
            landId: land.id,
          }))
        )
      )
    } catch {
      alert(
        "Could not confirm deletion. Check your connection and refresh before trying again."
      )
    } finally {
      setDeletingLandId(null)
    }
  }

  function deleteTask(taskToDelete) {
    const confirmDelete = window.confirm("Delete this task?")

    if (!confirmDelete) return

    const updatedLands = lands.map((land) => {
      if (land.id !== taskToDelete.landId) return land

      return {
        ...land,
        dailyTasks: (land.dailyTasks || []).filter(
          (task) =>
            !(
              task.day === taskToDelete.day &&
              task.month === taskToDelete.month &&
              task.year === taskToDelete.year &&
              task.time === taskToDelete.time &&
              task.task === taskToDelete.task
            )
        ),
      }
    })

    localStorage.setItem(
      `agriverseLands_${currentUsername}`,
      JSON.stringify(updatedLands)
    )

    setLands(updatedLands)

    const collectedTasks = []

    updatedLands.forEach((land) => {
      ;(land.dailyTasks || []).forEach((task) => {
        collectedTasks.push({
          ...task,
          landName: land.landName,
          landId: land.id,
        })
      })
    })

    setAllTasks(collectedTasks)
  }

  function getMarketplaceLandImage(land) {
    if (land.images && land.images.length > 0) {
      return land.images[0]
    }

    return (
      land.image ||
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef"
    )
  }

  const quickActions = [
    {
      title: "Farm AI",
      icon: Sprout,
      path: "/farm-ai-assistant",
    },
    {
      title: "Crop Doctor",
      icon: Stethoscope,
      path: "/disease-detection",
    },
    {
      title: "Weather",
      icon: CloudSun,
      path: "/weather",
    },
    {
      title: "Network",
      icon: Users,
      path: "/farmer-network",
    },
    {
      title: "Market Price",
      icon: TrendingUp,
      path: "/market-price",
    },
  ]

  const currentMonth = new Date().toLocaleString("default", {
    month: "long",
  })

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
  <div>
    <h1 className="text-5xl font-extrabold text-green-700">
      Farmer Dashboard
    </h1>

    <p className="text-gray-700 mt-3">
      AI-powered agriculture ecosystem.
    </p>
  </div>

  <div className="flex items-center gap-5">
    <Link
      to="/help-support"
      className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-800 transition"
    >
      Help & Support
    </Link>

    <button
      onClick={() => {
        sessionStorage.removeItem("agriverseToken");
        localStorage.removeItem("agriverseCurrentUser");
        localStorage.removeItem("agriverseUser");
        localStorage.removeItem("agriverseLoggedIn");
        window.location.href = "/";
      }}
      className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
    >
      <LogOut size={18} />
      Logout
    </button>
  </div>
</div>

        <div className="grid md:grid-cols-3 gap-5 mt-10">
          <div className="bg-green-100 rounded-3xl p-6 border border-orange-200">
            <div className="flex items-start gap-2">
              <div className="text-3xl">📍</div>

              <div>
                <h2 className="font-bold text-xl">Farm Location</h2>

                <p className="text-lg mt-3">
                  {farmLocation ? "Location Enabled" : "---"}
                </p>

                <button
                  onClick={enableLocation}
                  className="mt-4 bg-sky-600 text-white px-3 py-3 rounded-xl text-sm font-semibold"
                >
                  {farmLocation ? "Update GPS Location" : "Enable GPS Location"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-green-100 rounded-3xl p-6 border border-orange-200">
            <div className="flex gap-3">
              <Thermometer className="text-orange-500" />

              <div>
                <h2 className="font-bold text-xl">Temperature</h2>

                <p className="text-4xl mt-4">{temperature}</p>

                <p className="text-xs text-gray-500 mt-2">
                  Live GPS-based weather
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-100 rounded-3xl p-6 border border-orange-200">
            <div className="flex gap-3">
              <Droplets className="text-sky-600" />

              <div>
                <h2 className="font-bold text-xl">Humidity</h2>

                <p className="text-4xl mt-4">{humidity}</p>

                <p className="text-xs text-gray-500 mt-2">
                  Live GPS-based weather
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-5 gap-5 mt-10">
          {quickActions.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className="bg-white rounded-3xl p-7 border border-green-100 hover:shadow-lg transition"
            >
              <item.icon className="text-green-700 mb-5" size={38} />

              <h2 className="font-bold text-lg">{item.title}</h2>
            </Link>
          ))}
        </div>

        <div className="border border-green-300 bg-white rounded-[3rem] p-8 mt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-extrabold">My Farm Lands</h2>

            <Link
              to="/add-land"
              className="bg-green-700 text-white px-6 py-3 rounded-2xl font-bold"
            >
              + Add Land
            </Link>
          </div>

          {lands.length === 0 ? (
            <div className="bg-green-50 rounded-3xl p-8 mt-6">
              No lands added yet.
            </div>
          ) : (
            <div className="flex gap-5 overflow-x-auto overscroll-x-contain pb-5 mt-8">
              {lands.map((land) => (
                <div
                  key={land.id}
                  className="bg-green-50 rounded-3xl overflow-hidden border border-green-100 relative flex-none w-[270px] sm:w-[310px]"
                >
                  <div onMouseLeave={() => setOpenLandMenuId(null)} className="absolute top-4 right-4 z-20">
                    <button
                      type="button"
                      onClick={() => setOpenLandMenuId((previous) => previous === String(land.id) ? null : String(land.id))}
                      disabled={deletingLandId !== null}
                      aria-label={`Options for ${land.landName || land.name || "land"}`}
                      aria-expanded={openLandMenuId === String(land.id)}
                      className="bg-black/50 text-white w-10 h-10 rounded-full text-3xl flex items-center justify-center"
                    >
                      ⋮
                    </button>
                    {openLandMenuId === String(land.id) && (
                      <div className="absolute right-0 mt-2 min-w-36 rounded-xl bg-white shadow-xl border border-green-100 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => startEditLand(land)}
                          className="w-full px-4 py-3 text-left text-green-800 hover:bg-green-50 flex items-center gap-2"
                        >
                          <Pencil size={17} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => { setOpenLandMenuId(null); deleteLand(land.id) }}
                          className="w-full px-4 py-3 text-left text-red-700 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={17} /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <Link to={`/land/${land.id}`}>
                    <img
                      src={
                        land.image ||
                        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1200"
                      }
                      alt={land.landName}
                      className="w-full h-[260px] object-cover"
                    />

                    <div className="p-6">
                      <h3 className="text-3xl font-bold text-green-700">
                        {land.landName}
                      </h3>

                      <div className="space-y-3 mt-5">
                        <p>
                          <b>Location:</b> {land.location}
                        </p>

                        <p>
                          <b>Soil Type:</b> {land.soilType}
                        </p>

                        <p>
                          <b>Irrigation:</b> {land.irrigation}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[3rem] p-8 mt-12 border border-green-300">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-blue-600" />

            <h2 className="text-3xl font-extrabold">AI Daily Tasks</h2>
          </div>

          {allTasks.length === 0 ? (
            <div className="bg-green-50 rounded-3xl p-8 mt-6">
              No AI tasks generated yet.
            </div>
          ) : (
            <div className="space-y-8 mt-8">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const currentDate = new Date()

                currentDate.setDate(currentDate.getDate() + dayIndex)

                const currentDay = currentDate.getDate()
                const currentMonthIndex = currentDate.getMonth()
                const currentYear = currentDate.getFullYear()

                const tasksForThisDay = allTasks.filter((task) => {
                  return (
                    task.day === currentDay &&
                    task.month === currentMonthIndex &&
                    task.year === currentYear
                  )
                })

                if (tasksForThisDay.length === 0) return null

                const dayName = currentDate.toLocaleDateString("en-US", {
                  weekday: "long",
                })

                const fullDate = currentDate.toLocaleDateString("en-GB")

                let title = `${fullDate} (${dayName})`

                if (dayIndex === 0) {
                  title = `Today • ${fullDate} (${dayName})`
                }

                if (dayIndex === 1) {
                  title = `Tomorrow • ${fullDate} (${dayName})`
                }

                return (
                  <div
                    key={dayIndex}
                    className="border border-green-600 bg-green-50 rounded-3xl p-6"
                  >
                    <h3 className="text-xl font-extrabold text-gray-900">
                      {title}
                    </h3>

                    <div className="space-y-4 mt-6">
                      {tasksForThisDay.map((task, index) => (
                        <div
                          key={`${task.landId}-${task.time}-${index}`}
                          className="bg-white rounded-2xl p-5 border border-green-400 flex justify-between items-start"
                        >
                          <div>
                            <p className="font-bold text-lg text-green-700">
                              {task.time}
                            </p>

                            <p className="text-lg mt-2 font-semibold">
                              {task.landName}
                            </p>

                            <p className="text-lg mt-1 text-gray-700">
                              {task.task}
                            </p>
                          </div>

                          <button
                            onClick={() => deleteTask(task)}
                            className="text-red-500"
                          >
                            <Trash2 />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border border-green-300 bg-white rounded-[3rem] p-8 mt-12">
          <h2 className="text-3xl font-extrabold text-purple-800">
            {currentMonth} Monthly Calendar
          </h2>

          <div className="grid grid-cols-7 gap-4 mt-8">
            {Array.from({
              length: new Date(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                0
              ).getDate(),
            }).map((_, index) => {
              const dayNumber = index + 1
              const currentMonthIndex = new Date().getMonth()
              const currentYear = new Date().getFullYear()

              const hasTask = allTasks.some((task) => {
                return (
                  task.day === dayNumber &&
                  task.month === currentMonthIndex &&
                  task.year === currentYear
                )
              })

              return (
                <div
                  key={dayNumber}
                  className="bg-green-50 rounded-2xl h-25 p-3 border border-green-300"
                >
                  <p className="font-bold text-xl text-green-800">
                    {dayNumber}
                  </p>

                  {hasTask && <div className="text-3xl mt-2">🌱</div>}
                </div>
              )
            })}
          </div>
        </div>

        <div className="border border-green-300 bg-white rounded-[3rem] p-8 mt-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBasket className="text-green-700" />

              <h2 className="text-3xl font-extrabold">
                Buy / Sell Farm Products
              </h2>
            </div>

            <Link
              to="/sell-products"
              className="bg-green-700 text-white px-6 py-3 rounded-2xl font-bold"
            >
              Open
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/add-product" className="bg-green-100 text-green-800 px-5 py-3 rounded-xl font-bold">
              + Add Product
            </Link>
            <Link to="/order-tracking" className="bg-orange-100 text-orange-900 px-5 py-3 rounded-xl font-bold">
              My Orders
            </Link>
          </div>
          {productNotice && <div role="status" className="bg-green-100 text-green-800 rounded-xl p-4 mt-5">{productNotice}</div>}
          {productsError && <div role="alert" className="bg-red-50 text-red-700 rounded-xl p-4 mt-5">{productsError}</div>}
          {productsLoading ? (
            <div className="bg-green-50 rounded-3xl p-8 mt-6">Loading your products...</div>
          ) : products.length === 0 ? (
            <div className="bg-green-50 rounded-3xl p-8 mt-6">No products uploaded yet.</div>
          ) : (
            <div className="flex gap-5 overflow-x-auto overscroll-x-contain pb-5 mt-8">
              {products.map((product) => (
                <div
                  key={product._id}
                  onMouseLeave={() => setOpenProductMenuId(null)}
                  className="bg-green-50 rounded-3xl overflow-hidden border border-green-100 relative flex-none w-[260px] sm:w-[290px]"
                >
                  <div className="absolute right-3 top-3 z-20">
                    <button
                      type="button"
                      aria-label={`Options for ${product.productName || product.name || "product"}`}
                      aria-expanded={openProductMenuId === String(product._id)}
                      onClick={() => setOpenProductMenuId(previous => previous === String(product._id) ? null : String(product._id))}
                      className="w-10 h-10 rounded-full bg-black/60 text-white text-2xl"
                    >⋮</button>
                    {openProductMenuId === String(product._id) && (
                      <div className="absolute right-0 mt-2 min-w-36 rounded-xl bg-white shadow-xl border overflow-hidden">
                        <Link to={`/product/${product._id}?view=owner`} className="block px-4 py-3 text-green-800 hover:bg-green-50">View / Requests</Link>
                        <Link to={`/edit-product/${product._id}`} className="block px-4 py-3 text-green-800 hover:bg-green-50">Edit</Link>
                        <button type="button" onClick={() => changeProductPublication(product)} disabled={publishingProductId !== null || deletingProductId !== null} className="flex items-center gap-2 w-full text-left px-4 py-3 text-green-800 hover:bg-green-50 disabled:opacity-50">
                          {product.isPublished === false ? <Eye size={16} /> : <EyeOff size={16} />}
                          {product.isPublished === false ? "Publish" : "Unpublish"}
                        </button>
                        <button type="button" onClick={() => deleteProduct(product)} disabled={deletingProductId !== null || publishingProductId !== null} className="block w-full text-left px-4 py-3 text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
                      </div>
                    )}
                  </div>
                  <Link to={`/product/${product._id}?view=owner`} aria-label={`View ${product.productName || product.name || "product"}`} className="block">
                  <div className="absolute left-3 top-3 z-10 rounded-lg bg-white/95 px-3 py-1 text-xs font-bold text-green-900">
                    {product.isPublished === false ? "Unpublished" : "Published"}
                  </div>
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.productName || product.name || "Product"}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-44 flex items-center justify-center bg-green-100">
                      <ShoppingBasket className="text-green-700" size={40} />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-green-700">
                      {product.productName || product.name || "Product"}
                    </h3>
                    <p className="mt-2 font-medium">₹ {product.price} / {product.unit || "kg"}</p>
                    <p className="text-sm text-gray-600 mt-1">{product.quantity || ""} {product.unit || ""}</p>
                  </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[3rem] p-8 border border-green-300 shadow-sm mt-12">
  <div className="flex items-center justify-between">
    
    <div className="flex items-center gap-4">
      
      <Tractor
        className="text-green-700"
        size={34}
      />

      <div>
        <h2 className="text-3xl font-extrabold text-black">
          Equipment Rental
        </h2>

        <p className="text-gray-600 mt-2 text-lg">
          Rent and explore tractors and farming machinery.
        </p>
      </div>

    </div>

    <Link
      to="/equipment-rental"
      className="bg-green-700 text-white px-7 py-4 rounded-2xl font-bold"
    >
      Open
    </Link>

  </div>

  <div className="flex flex-wrap gap-3 mt-6">
    <Link to="/add-rental-equipment" className="rounded-xl bg-green-100 text-green-800 px-5 py-3 font-bold">+ Add Equipment</Link>
    <Link to="/rental-orders" className="rounded-xl bg-orange-100 text-orange-900 px-5 py-3 font-bold">Rental Orders</Link>
  </div>

  {equipmentError && <p role="alert" className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{equipmentError}</p>}
  {equipmentNotice && <p role="status" className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">{equipmentNotice}</p>}
  {equipmentLoading ? (
    <p className="mt-8 text-green-700">Loading your equipment...</p>
  ) : rentalEquipments.length > 0 ? (
    <div className="flex gap-5 overflow-x-auto overscroll-x-contain mt-8 pb-5">
      {rentalEquipments.map((equipment) => {
        const equipmentId = String(equipment._id || equipment.id)
        return (
          <div key={equipmentId} onMouseLeave={() => setOpenEquipmentMenuId(null)} className="relative flex-none w-[260px] sm:w-[290px] bg-green-50 rounded-3xl border border-green-100 hover:shadow-lg transition">
            <Link to={`/rental-equipment/${encodeURIComponent(equipmentId)}?owner=true`} className="block h-full overflow-hidden rounded-3xl">
              {equipment.image ? <img src={equipment.image} alt={equipment.name || "Equipment"} className="w-full h-[180px] object-cover" /> : <div className="w-full h-[180px] bg-green-100 flex items-center justify-center"><Tractor size={42} className="text-green-700" /></div>}
              <div className="p-5">
                <h3 className="text-xl font-bold text-green-700">{equipment.name || "Equipment"}</h3>
                <p className="text-gray-700 mt-2">₹{equipment.rentAmount ?? equipment.price ?? "—"} {equipment.rentType || ""}</p>
                <p className="text-sm text-gray-600 mt-2">{equipment.district || equipment.address || ""}</p>
              </div>
            </Link>
            <div className="absolute top-3 right-3 z-20">
              <button type="button" aria-label={`Options for ${equipment.name || "equipment"}`} aria-expanded={openEquipmentMenuId === equipmentId} disabled={Boolean(deletingEquipmentId)} onClick={() => setOpenEquipmentMenuId(prev => prev === equipmentId ? null : equipmentId)} className="w-10 h-10 rounded-full bg-black/60 text-white text-2xl disabled:opacity-50">⋮</button>
              {openEquipmentMenuId === equipmentId && (
                <div className="absolute right-0 mt-1 min-w-40 bg-white rounded-xl border shadow-xl overflow-hidden">
                  <Link to={`/rental-equipment/${encodeURIComponent(equipmentId)}?owner=true`} className="block px-4 py-3 hover:bg-green-50">View / Requests</Link>
                  <Link to={`/edit-rental-equipment/${encodeURIComponent(equipmentId)}`} className="block px-4 py-3 hover:bg-green-50">Edit</Link>
                  <button type="button" onClick={() => deleteEquipment(equipment)} className="block w-full text-left px-4 py-3 text-red-700 hover:bg-red-50">Delete</button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  ) : (
    <div className="bg-green-50 rounded-3xl p-8 mt-8">You have not published any rental equipment yet.</div>
  )}
</div>

        <div className="bg-white rounded-[3rem] p-8 border border-green-300 shadow-sm mt-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-4">
              <Map className="text-orange-500 shrink-0" size={34} />
              <div>
                <h2 className="text-3xl font-extrabold text-black">Farm Land Marketplace</h2>
                <p className="text-gray-600 mt-2 text-lg">
                  Buy and sell agricultural lands directly from farmers.
                </p>
              </div>
            </div>
            <Link to="/land-marketplace" className="bg-green-700 text-white px-6 py-3 rounded-2xl font-bold self-start">Open</Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/sell-land" className="bg-green-100 text-green-800 px-5 py-3 rounded-xl font-bold">+ Add Land</Link>
            <Link to="/land-requests" state={{ from: "/farmer-dashboard" }} className="bg-orange-100 text-orange-900 px-5 py-3 rounded-xl font-bold">Requests</Link>
          </div>

          
          {marketplaceLandError && <p role="alert" className="mt-4 text-red-700">{marketplaceLandError}</p>}
          {marketplaceLands.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto overscroll-x-contain pb-5 mt-8">
              {marketplaceLands.map((land) => {
                const id = String(land._id || land.id)
                const label = land.title || land.landName || land.name || land.area || "Land Listing"
                const rawPrice = String(land.price ?? "").trim()
                const numericPrice = rawPrice.replace(/[,₹\s]/g, "")
                const shownPrice = /^\d+(?:\.\d+)?$/.test(numericPrice)
                  ? `₹${Number(numericPrice).toLocaleString("en-IN")}`
                  : `${rawPrice.startsWith("₹") ? "" : "₹"}${rawPrice}`
                return (
                  <div key={id} onMouseLeave={() => setOpenMarketplaceLandMenuId(null)} className="relative flex-none w-[270px] sm:w-[310px] bg-green-50 rounded-3xl overflow-hidden border border-green-100 hover:shadow-lg transition">
                    <Link
                      to={`/marketplace-land/${encodeURIComponent(id)}`}
                      state={{ from: "/farmer-dashboard" }}
                      className="block focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      <img src={getMarketplaceLandImage(land)} alt={label} className="w-full h-[190px] object-cover" />
                      <div className="p-5">
                        <h4 className="font-bold text-xl text-green-800">{label}</h4>
                        {(land.location || land.district || land.state) && <p className="text-gray-600 mt-2">{[land.location, land.district, land.state].filter(Boolean).join(", ")}</p>}
                        {rawPrice && <p className="font-semibold text-green-700 mt-2">{shownPrice}</p>}
                        {land.area && land.area !== label && <p className="text-gray-700 mt-2">{land.area}</p>}
                      </div>
                    </Link>
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        type="button"
                        aria-label={`Options for ${label}`}
                        aria-expanded={openMarketplaceLandMenuId === id}
                        disabled={Boolean(deletingMarketplaceLandId)}
                        onClick={() => setOpenMarketplaceLandMenuId(previous => previous === id ? null : id)}
                        className="w-10 h-10 rounded-full bg-black/60 text-white text-2xl disabled:opacity-50"
                      >⋮</button>
                      {openMarketplaceLandMenuId === id && (
                        <div className="absolute right-0 mt-1 min-w-44 bg-white rounded-xl border shadow-xl overflow-hidden">
                          <Link to={`/land-requests?landId=${encodeURIComponent(id)}`} className="block px-4 py-3 hover:bg-green-50">View Requests</Link>
                          <Link to={`/sell-land?landId=${encodeURIComponent(id)}`} className="block px-4 py-3 hover:bg-green-50">Edit</Link>
                          <button type="button" onClick={() => deleteMarketplaceLand(land)} className="block w-full text-left px-4 py-3 text-red-700 hover:bg-red-50">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-green-50 rounded-3xl p-8 mt-5">
              <p className="text-gray-700 text-lg">You have not published any land listings yet.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default FarmerDashboard