
import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ImagePlus,
  Trash2,
  RefreshCw,
  Save,
  ArrowLeft,
} from "lucide-react";

const emptyLand = {
  name: "",
  location: "",
  latitude: "",
  longitude: "",
  area: "",
  crop: "",
  soilType: "",
  irrigation: "",
  sowingDate: "",
  image: "",
};

function AddLandPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);

  const [form, setForm] = useState(emptyLand);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  const token = sessionStorage.getItem("agriverseToken");

  useEffect(() => {
    const controller = new AbortController();

    setForm(emptyLand);
    setSelectedImage(null);
    setPreview("");
    setError("");
    setLoadFailed(false);

    if (!editId) {
      setLoading(false);
      return () => controller.abort();
    }

    async function loadExistingLand() {
      setLoading(true);

      try {
        if (!token) {
          throw new Error("Please log in again.");
        }

        const response = await fetch(
          `/api/lands/${encodeURIComponent(editId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load land details."
          );
        }

        if (controller.signal.aborted) return;

        setForm({
          name: data.name || data.landName || "",
          location: data.location || "",
          latitude: String(data.latitude ?? ""),
          longitude: String(data.longitude ?? ""),
          area: data.area || "",
          crop: data.crop || "",
          soilType: data.soilType || "",
          irrigation: data.irrigation || "",
          sowingDate: data.sowingDate
            ? String(data.sowingDate).slice(0, 10)
            : "",
          image: data.image || "",
        });

        setPreview(data.image || "");
      } catch (err) {
        if (err.name !== "AbortError") {
          setLoadFailed(true);
          setError(
            err.message || "Unable to load existing land."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadExistingLand();

    return () => controller.abort();
  }, [editId, token]);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        file.type
      )
    ) {
      setError("Only JPG, PNG, and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  function removeImage() {
    if (preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setSelectedImage(null);
    setPreview("");

    setForm((previous) => ({
      ...previous,
      image: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Location detection is not supported.");
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((previous) => ({
          ...previous,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));

        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setError(
          "Unable to detect your location. You can enter it manually."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  }

  async function uploadImage() {
    if (!selectedImage) {
      return form.image;
    }

    const uploadData = new FormData();
    uploadData.append("image", selectedImage);

    const response = await fetch("/api/upload/image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: uploadData,
    });

    const data = await response.json();

    if (!response.ok || !data.imageUrl) {
      throw new Error(
        data.message || "Unable to upload land image."
      );
    }

    return data.imageUrl;
  }

  async function saveLand(event) {
    event.preventDefault();

    if (saving || loading || loadFailed) return;

    setError("");

    if (!token) {
      setError("Please log in as a Farmer.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter a land name.");
      return;
    }

    if (
      form.latitude &&
      (!Number.isFinite(Number(form.latitude)) ||
        Number(form.latitude) < -90 ||
        Number(form.latitude) > 90)
    ) {
      setError("Latitude must be between -90 and 90.");
      return;
    }

    if (
      form.longitude &&
      (!Number.isFinite(Number(form.longitude)) ||
        Number(form.longitude) < -180 ||
        Number(form.longitude) > 180)
    ) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    setSaving(true);

    try {
      const imageUrl = await uploadImage();

      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        latitude: form.latitude.trim(),
        longitude: form.longitude.trim(),
        area: form.area.trim(),
        crop: form.crop.trim(),
        soilType: form.soilType,
        irrigation: form.irrigation,
        sowingDate: form.sowingDate,
        image: imageUrl || "",
      };

      const endpoint = isEditing
        ? `/api/lands/${encodeURIComponent(editId)}`
        : "/api/lands/add";

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to save land."
        );
      }

      const savedLand = result.land;
      const savedId = savedLand?._id || editId;

      // Keep the browser cache synchronized with MongoDB.
      // The database remains the authoritative record.
      try {
        const user = JSON.parse(
          localStorage.getItem("agriverseCurrentUser") || "{}"
        );

        if (user.username && savedId) {
          const cacheKey =
            `agriverseLands_${user.username}`;

          const previous = JSON.parse(
            localStorage.getItem(cacheKey) || "[]"
          );

          const cached = Array.isArray(previous)
            ? previous
            : [];

          const oldEntry = cached.find(
            (item) =>
              String(item._id || item.id) === String(savedId)
          );

          const updatedLand = {
            ...(oldEntry || {}),
            ...(savedLand || {}),
            ...payload,
            _id: savedId,
            id: savedId,
            landName: payload.name,
          };

          const remaining = cached.filter(
            (item) =>
              String(item._id || item.id) !== String(savedId)
          );

          localStorage.setItem(
            cacheKey,
            JSON.stringify([
              updatedLand,
              ...remaining,
            ])
          );
        }
      } catch (cacheError) {
        console.warn(
          "Local land cache could not be updated:",
          cacheError
        );
      }

      navigate("/farmer-dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message || "Unable to save land."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-green-200 rounded-2xl px-5 py-4 outline-none focus:border-green-600 bg-white";

  const labelClass =
    "block font-semibold text-gray-800 mb-2";

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-xl font-bold text-green-700">
          Loading land details...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/farmer-dashboard"
          className="inline-flex items-center gap-2 mb-6 text-green-700 font-semibold hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Farmer Dashboard
        </Link>

        <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-green-100 shadow-sm">
          <h1 className="text-3xl md:text-4xl font-extrabold text-green-700">
            {isEditing ? "Edit Land" : "Add New Land"}
          </h1>

          <p className="text-gray-600 mt-3">
            {isEditing
              ? "Update the existing details of your land."
              : "Enter the details of your new agricultural land."}
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl"
            >
              {error}
            </div>
          )}

          <form onSubmit={saveLand} className="mt-10">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="landName" className={labelClass}>
                  Land Name *
                </label>

                <input
                  id="landName"
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Land Name"
                  maxLength={200}
                  required
                  disabled={loadFailed}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="location" className={labelClass}>
                  District / Location
                </label>

                <input
                  id="location"
                  name="location"
                  value={form.location}
                  onChange={updateField}
                  placeholder="District / Location"
                  maxLength={500}
                  disabled={loadFailed}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="latitude" className={labelClass}>
                  Latitude
                </label>

                <input
                  id="latitude"
                  name="latitude"
                  value={form.latitude}
                  onChange={updateField}
                  placeholder="Latitude"
                  disabled={loadFailed}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="longitude" className={labelClass}>
                  Longitude
                </label>

                <input
                  id="longitude"
                  name="longitude"
                  value={form.longitude}
                  onChange={updateField}
                  placeholder="Longitude"
                  disabled={loadFailed}
                  className={inputClass}
                />
              </div>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locationLoading || loadFailed}
                className="md:col-span-2 flex items-center justify-center gap-3 bg-green-100 text-green-700 px-5 py-4 rounded-2xl font-semibold hover:bg-green-200 disabled:opacity-50"
              >
                <RefreshCw size={19} />
                {locationLoading
                  ? "Detecting Location..."
                  : "Use My Current Location"}
              </button>

              <div>
                <label htmlFor="area" className={labelClass}>
                  Land Area (Acre)
                </label>

                <input
                  id="area"
                  name="area"
                  value={form.area}
                  onChange={updateField}
                  placeholder="Example: 2.5"
                  maxLength={100}
                  disabled={loadFailed}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="crop" className={labelClass}>
                  Current Crop
                </label>

                <input
                  id="crop"
                  name="crop"
                  value={form.crop}
                  onChange={updateField}
                  placeholder="Example: Rice"
                  maxLength={200}
                  disabled={loadFailed}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="soilType" className={labelClass}>
                  Soil Type
                </label>

                <select
                  id="soilType"
                  name="soilType"
                  value={form.soilType}
                  onChange={updateField}
                  disabled={loadFailed}
                  className={inputClass}
                >
                  <option value="">Select Soil Type</option>
                  <option value="Red Soil">Red Soil</option>
                  <option value="Black Soil">Black Soil</option>
                  <option value="Clay Soil">Clay Soil</option>
                  <option value="Sandy Soil">Sandy Soil</option>
                  <option value="Loamy Soil">Loamy Soil</option>
                </select>
              </div>

              <div>
                <label htmlFor="irrigation" className={labelClass}>
                  Water Availability / Irrigation
                </label>

                <select
                  id="irrigation"
                  name="irrigation"
                  value={form.irrigation}
                  onChange={updateField}
                  disabled={loadFailed}
                  className={inputClass}
                >
                  <option value="">
                    Water Availability / Irrigation
                  </option>
                  <option value="High Water Availability">
                    High Water Availability
                  </option>
                  <option value="Medium Water Availability">
                    Medium Water Availability
                  </option>
                  <option value="Low Water Availability">
                    Low Water Availability
                  </option>
                  <option value="Rain-fed">Rain-fed</option>
                  <option value="Borewell Irrigation">
                    Borewell Irrigation
                  </option>
                  <option value="Canal Irrigation">
                    Canal Irrigation
                  </option>
                  <option value="Drip Irrigation">
                    Drip Irrigation
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="sowingDate" className={labelClass}>
                  Sowing Date
                </label>

                <input
                  id="sowingDate"
                  name="sowingDate"
                  type="date"
                  value={form.sowingDate}
                  onChange={updateField}
                  disabled={loadFailed}
                  className={inputClass}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>
                  Land Image
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={loadFailed}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loadFailed}
                  className="w-full h-72 border-2 border-dashed border-green-200 rounded-[2rem] bg-green-50 overflow-hidden flex items-center justify-center disabled:opacity-50"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Land preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <ImagePlus
                        className="text-green-700 mx-auto mb-4"
                        size={40}
                      />
                      <p className="font-semibold text-gray-800 text-lg">
                        Click to upload land image
                      </p>
                      <p className="text-gray-500 mt-2">
                        JPG, PNG or WebP, maximum 5 MB
                      </p>
                    </div>
                  )}
                </button>

                {preview && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loadFailed}
                      className="bg-green-100 text-green-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >
                      <RefreshCw size={17} />
                      Change Image
                    </button>

                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={loadFailed}
                      className="bg-red-50 text-red-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >
                      <Trash2 size={17} />
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-10 border-t border-gray-200 pt-7">
              <button
                type="submit"
                disabled={saving || loadFailed}
                className="flex-1 bg-green-700 text-white px-7 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-green-800 disabled:opacity-50"
              >
                <Save size={20} />
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Add Land"}
              </button>

              <Link
                to="/farmer-dashboard"
                className="flex-1 bg-gray-100 text-gray-800 px-7 py-4 rounded-2xl font-bold text-center hover:bg-gray-200"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddLandPage;
