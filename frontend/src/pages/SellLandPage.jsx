import { useEffect, useState } from "react"

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom"

import {
  MapPin,
  Phone,
  User,
  ImagePlus,
  Leaf,
  CheckCircle2,
  Trash2,
  IndianRupee,
} from "lucide-react"

function SellLandPage() {

  const navigate = useNavigate()

  const { landId: routeLandId } = useParams()
  const landId = routeLandId || new URLSearchParams(window.location.search).get("landId")

  const isEditMode = !!landId

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("agriverseCurrentUser") || "{}") || {} }
    catch { return {} }
  })()

  const [images, setImages] =
    useState([])
  const [uploading, setUploading] = useState(false)

  const [title, setTitle] =
    useState("")

  const [location, setLocation] =
    useState("")

  const [area, setArea] =
    useState("")

  const [city, setCity] =
  useState("")

  const [state, setState] =
  useState("")

  const [price, setPrice] =
    useState("")

  const [water, setWater] =
    useState("")

  const [soil, setSoil] =
    useState("")

  const [description, setDescription] =
    useState("")

  const [landType, setLandType] =
    useState("Agricultural")

  const [
    irrigationType,
    setIrrigationType,
  ] = useState("Borewell")

  const [
    previousCrops,
    setPreviousCrops,
  ] = useState("")

  const [
    roadAccess,
    setRoadAccess,
  ] = useState("Yes")

  const [
    electricity,
    setElectricity,
  ] = useState("Yes")

  const [sellerName, setSellerName] =
    useState("")

  const [
    sellerPhone,
    setSellerPhone,
  ] = useState("")

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {

    if (!isEditMode) return

    fetch(
      "/api/marketplace-lands"
    )
      .then((res) => res.json())
      .then((data) => {
        const lands = Array.isArray(data) ? data : (data.lands || data.data || [])
        const land =
          lands.find(
            (item) =>
              item._id === landId
          )

        if (!land) return

        setTitle(land.title || "")
        setLocation(land.location || "")
        setArea(land.area || "")
        setState(land.state || "")
        setCity(land.city || "")
        setPrice(land.price || "")
        setWater(land.water || "")
        setSoil(land.soil || "")
        setDescription(
          land.description || ""
        )

        setLandType(
          land.landType ||
            "Agricultural"
        )

        setIrrigationType(
          land.irrigationType ||
            "Borewell"
        )

        setPreviousCrops(
          land.previousCrops || ""
        )

        setRoadAccess(
          land.roadAccess || "Yes"
        )

        setElectricity(
          land.electricity || "Yes"
        )

        setSellerName(
          land.sellerName || ""
        )

        setSellerPhone(
          land.sellerPhone || ""
        )

        setImages(land.images?.length ? land.images : (land.image ? [land.image] : []))
      })
      .catch((error) =>
        console.error(error)
      )

  }, [landId])

  async function handleImages(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const token = sessionStorage.getItem("agriverseToken");
    if (!token) { alert("Please log in again before uploading images."); return; }
    setUploading(true);
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const preview = URL.createObjectURL(file);
      setImages((previous) => [...previous, preview]);
      try {
        const formData = new FormData();
        formData.append("image", file);
        const response = await fetch("/api/upload/image", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await response.json();
        const url = data.imageUrl || data.url || data.secure_url;
        if (!response.ok || !url) throw new Error(data.message || "Upload failed");
        setImages((previous) => previous.map((item) => item === preview ? url : item));
      } catch (error) {
        setImages((previous) => previous.filter((item) => item !== preview));
        alert(error.message || "Image upload failed");
      } finally {
        URL.revokeObjectURL(preview);
      }
    }
    setUploading(false);
  }

  function removeImage(index) {
    const updatedImages = [...images]

    updatedImages.splice(index, 1)

    setImages(updatedImages)
  }

  async function publishLand() {
    if (uploading || loading) return;
    const token = sessionStorage.getItem("agriverseToken");
    if (!token) { alert("Please log in again before saving."); return; }

  if (
    !title ||
    !location ||
    !area ||
    !price ||
    !sellerName ||
    !sellerPhone
  ) {
    alert(
      "Please fill all important land details."
    )

    return
  }

  if (!/^[+0-9()\s-]{7,30}$/.test(sellerPhone.trim())) {
    alert("Please enter a valid seller phone number.")
    return
  }

  setLoading(true)

  const newLand = {

    sellerUsername:
      currentUser.username,

    title,

    location,

    area,

    city,

    state,

    price,

    water,

    soil,

    description,

    landType,

    irrigationType,

    previousCrops,

    roadAccess,

    electricity,

    sellerName,

    sellerPhone: sellerPhone.trim(),

    createdAt:
      new Date().toLocaleString(),

    image:
      images[0] || "",

    images,
  }

  try {

    if (isEditMode) {

      const response = await fetch(
        `/api/marketplace-lands/${landId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(
            newLand
          ),
        }
      )

      const result = await response.json()
      if (!response.ok || result.success === false) throw new Error(result.message || "Land update failed")
      alert("Land updated successfully.")

    } else {

      const response = await fetch(
        "/api/marketplace-lands/add",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(
            newLand
          ),
        }
      )

      const result = await response.json()
      if (!response.ok || result.success === false) throw new Error(result.message || "Land publication failed")
      alert("Land listing published successfully.")
    }

    navigate("/land-marketplace", { replace: true })

  } catch (error) {

    console.error(error)

    alert(error.message || "Land could not be saved.")
  }

  setLoading(false)
}

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/land-marketplace"
          className="text-green-700 font-bold"
        >
          ← Back to Marketplace
        </Link>

        <div className="bg-white rounded-[3rem] p-10 mt-6 border border-green-100 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center">
              <Leaf
                className="text-green-700"
                size={42}
              />
            </div>

            <div>
              <h1 className="text-5xl font-extrabold text-green-700">
                {isEditMode ? "Edit Farm Land Listing" : "Sell Farm Land"}
              </h1>

              <p className="text-gray-600 mt-3 text-lg">
                Publish your agricultural land
                for direct farmer-to-farmer sale.
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-[3rem] p-8 mt-10 border border-green-100">
            <h2 className="text-3xl font-extrabold text-black">
              Upload Land Images
            </h2>

            <label className="block mt-8 cursor-pointer">
              <div className="border-2 border-dashed border-green-200 rounded-[2rem] p-12 bg-white text-center hover:bg-green-50 transition">
                <ImagePlus
                  className="mx-auto text-green-700"
                  size={42}
                />

                <h3 className="text-2xl font-bold text-black mt-5">
                  Upload Farm Images
                </h3>

                <p className="text-gray-600 mt-3">
                  Add multiple land photos for
                  buyers.
                </p>
              </div>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImages}
                className="hidden"
              />
            </label>

            {images.length > 0 && (
              <div className="grid md:grid-cols-4 gap-5 mt-8">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative"
                  >
                    <img
                      src={image}
                      alt="Land"
                      className="h-52 w-full object-cover rounded-3xl"
                    />

                    <button
                      onClick={() =>
                        removeImage(index)
                      }
                      className="absolute top-3 right-3 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-10">
            <div className="space-y-5">
              <div>
                <label className="font-bold text-gray-700">
                  Land Title
                </label>

                <div className="flex items-center gap-3 border border-green-200 rounded-2xl px-5 py-4 mt-2">
                  <Leaf
                    className="text-green-700"
                    size={20}
                  />

                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                    placeholder="Example: Fertile Paddy Land"
                    className="w-full outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Exact Land Address
                </label>

                <div className="flex items-start gap-3 border border-green-200 rounded-2xl px-4 py-4 mt-2 bg-white">
                  <MapPin
                    className="text-green-700 mt-1"
                    size={20}
                  />

                  <textarea
                    value={location}
                    onChange={(e) =>
                      setLocation(
                        e.target.value
                      )
                    }
                    placeholder="Example: No. 12, Lake View Farm Road,
                  Near Red Hills."
                    className="w-full outline-none min-h-[90px] resize-none"
                  />
                </div>

                
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  City / District
                </label>

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  placeholder="Example: Chennai"
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  State
                </label>

                <input
                  value={state}
                  onChange={(e) =>
                    setState(e.target.value)
                  }
                  placeholder="Example: Tamil Nadu"
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Total Area
                </label>

                <input
                  value={area}
                  onChange={(e) =>
                    setArea(e.target.value)
                  }
                  placeholder="Example: 5 Acres"
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Expected Price
                </label>

                <div className="flex items-center gap-3 border border-green-200 rounded-2xl px-5 py-4 mt-2">
                  <IndianRupee
                    className="text-green-700"
                    size={20}
                  />

                  <input
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value
                      )
                    }
                    placeholder="Example: 25 Lakhs"
                    className="w-full outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Soil Type
                </label>

                <select
                  value={soil}
                  onChange={(e) =>
                    setSoil(e.target.value)
                  }
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                >
                  <option value="">
                    Select Soil Type
                  </option>

                  <option>
                    Black Soil
                  </option>

                  <option>
                    Red Soil
                  </option>

                  <option>
                    Clay Soil
                  </option>

                  <option>
                    Sandy Soil
                  </option>

                  <option>
                    Loamy Soil
                  </option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Water Availability
                </label>

                <select
                  value={water}
                  onChange={(e) =>
                    setWater(
                      e.target.value
                    )
                  }
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                >
                  <option value="">
                    Select Water Status
                  </option>

                  <option>
                    Excellent
                  </option>

                  <option>
                    Moderate
                  </option>

                  <option>Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="font-bold text-gray-700">
                  Land Type
                </label>

                <select
                  value={landType}
                  onChange={(e) =>
                    setLandType(
                      e.target.value
                    )
                  }
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                >
                  <option>
                    Agricultural
                  </option>

                  <option>
                    Coconut Farm
                  </option>

                  <option>
                    Banana Farm
                  </option>

                  <option>
                    Commercial Farm
                  </option>

                  <option>
                    Plantation
                  </option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Irrigation Type
                </label>

                <select
                  value={irrigationType}
                  onChange={(e) =>
                    setIrrigationType(
                      e.target.value
                    )
                  }
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                >
                  <option>
                    Borewell
                  </option>

                  <option>
                    River Canal
                  </option>

                  <option>
                    Rain Fed
                  </option>

                  <option>
                    Drip Irrigation
                  </option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Previous Crops
                </label>

                <input
                  value={previousCrops}
                  onChange={(e) =>
                    setPreviousCrops(
                      e.target.value
                    )
                  }
                  placeholder="Example: Paddy, Banana"
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Road Access
                </label>

                <select
                  value={roadAccess}
                  onChange={(e) =>
                    setRoadAccess(
                      e.target.value
                    )
                  }
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                >
                  <option>Yes</option>

                  <option>No</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Electricity Available
                </label>

                <select
                  value={electricity}
                  onChange={(e) =>
                    setElectricity(
                      e.target.value
                    )
                  }
                  className="w-full border border-green-200 rounded-2xl px-5 py-4 mt-2 outline-none"
                >
                  <option>Yes</option>

                  <option>No</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Seller Name
                </label>

                <div className="flex items-center gap-3 border border-green-200 rounded-2xl px-5 py-4 mt-2">
                  <User
                    className="text-green-700"
                    size={20}
                  />

                  <input
                    value={sellerName}
                    onChange={(e) =>
                      setSellerName(
                        e.target.value
                      )
                    }
                    placeholder="Your Name"
                    className="w-full outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700">
                  Seller Phone
                </label>

                <div className="flex items-center gap-3 border border-green-200 rounded-2xl px-5 py-4 mt-2">
                  <Phone
                    className="text-green-700"
                    size={20}
                  />

                  <input
                    value={sellerPhone}
                    onChange={(e) =>
                      setSellerPhone(
                        e.target.value
                      )
                    }
                    placeholder="Phone Number"
                    className="w-full outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <label className="font-bold text-gray-700">
              Land Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Describe the land, crops grown, surroundings, road access, farming facilities..."
              className="w-full border border-green-200 rounded-[2rem] p-6 mt-3 outline-none min-h-[220px]"
            />
          </div>

          <button
  type="button"
  onClick={publishLand}
  disabled={loading || uploading}
  className={`w-full mt-10 py-5 rounded-[2rem] font-extrabold text-2xl flex items-center justify-center gap-3 transition cursor-pointer ${
    (loading || uploading)
      ? "bg-gray-400 text-white cursor-not-allowed"
      : "bg-green-700 hover:bg-green-800 text-white"
  }`}
  style={{
    pointerEvents: "auto",
    position: "relative",
    zIndex: 50,
  }}
>
  <CheckCircle2 size={28} />

  {loading
    ? "Saving Land..."
    : uploading ? "Uploading Images..."
    : isEditMode ? "Update Land Listing" : "Publish Land Listing"}
</button>
            
        </div>
      </div>
    </div>
  )
}

export default SellLandPage