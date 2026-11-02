
import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ImagePlus,
  Tractor,
} from "lucide-react";

const API = "/api/rental-equipment";

function currentUser() {
  try {
    return (
      JSON.parse(
        localStorage.getItem(
          "agriverseCurrentUser"
        ) || "{}"
      ) || {}
    );
  } catch {
    return {};
  }
}

function idOf(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(
      value._id || value.id || ""
    );
  }

  return String(value);
}

async function parseJSON(response) {
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "The server returned an invalid response."
    );
  }

  if (
    !response.ok ||
    data.success === false
  ) {
    throw new Error(
      data.message ||
        `Request failed (${response.status}).`
    );
  }

  return data;
}

function listingArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of [
    "equipment",
    "equipments",
    "listings",
    "items",
    "data",
  ]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  throw new Error(
    data?.message ||
      "Could not read your equipment listings."
  );
}

function savedImageUrl(item) {
  const image =
    item?.image ||
    item?.imageUrl ||
    item?.images?.[0];

  return typeof image === "string"
    ? image
    : image?.url || "";
}

export default function AddRentalEquipmentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { equipmentId } = useParams();
  const [searchParams] = useSearchParams();

  const editId =
    equipmentId ||
    searchParams.get("id");

  const isEditing = Boolean(editId);

  const user = currentUser();

  const dashboard =
    user.role === "buyer"
      ? "/customer-dashboard"
      : "/farmer-dashboard";

  const detailsPath = editId
    ? `/rental-equipment/${encodeURIComponent(editId)}`
    : null;

  const requestedReturn = location.state?.from;

  const returnPath =
    typeof requestedReturn === "string" &&
    requestedReturn.startsWith("/") &&
    !requestedReturn.startsWith("//")
      ? requestedReturn
      : isEditing
        ? detailsPath
        : dashboard;

  const [image, setImage] = useState("");
  const [imageFile, setImageFile] =
    useState(null);

  const [name, setName] = useState("");
  const [category, setCategory] =
    useState("Tractor");

  const [rentAmount, setRentAmount] =
    useState("");

  const [rentType, setRentType] =
    useState("Per Day");

  const [address, setAddress] =
    useState("");

  const [district, setDistrict] =
    useState("");

  const [state, setState] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(isEditing);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [ready, setReady] =
    useState(!isEditing);

  useEffect(() => {
    if (!editId) {
      setReady(true);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const token = sessionStorage.getItem(
      "agriverseToken"
    );

    async function loadOwnedEquipment() {
      setLoading(true);
      setReady(false);
      setError("");

      if (!token) {
        setError(
          "Please log in again to edit your equipment."
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API}/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await parseJSON(response);

        const found = listingArray(data).find(
          (item) =>
            idOf(item._id || item.id) ===
            String(editId)
        );

        if (!found) {
          throw new Error(
            "Equipment not found among your listings. Open it from My Equipment on your dashboard."
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        setImage(savedImageUrl(found));
        setImageFile(null);

        setName(
          found.name ||
            found.equipmentName ||
            ""
        );

        setCategory(
          found.category || "Tractor"
        );

        setRentAmount(
          found.rentAmount ??
            found.pricePerDay ??
            found.rentalPrice ??
            ""
        );

        setRentType(
          found.rentType || "Per Day"
        );

        setAddress(
          found.address ||
            found.location ||
            ""
        );

        setDistrict(
          found.district || ""
        );

        setState(
          found.state || ""
        );

        setDescription(
          found.description || ""
        );

        setReady(true);
      } catch (err) {
        if (
          err.name !== "AbortError" &&
          !controller.signal.aborted
        ) {
          setError(
            err.message ||
              "Unable to load equipment."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOwnedEquipment();

    return () => controller.abort();
  }, [editId]);

  function chooseImage(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please choose an image file."
      );
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        "Please select an image smaller than 10 MB."
      );
      return;
    }

    setError("");
    setImageFile(file);

    setImage(
      URL.createObjectURL(file)
    );
  }

  async function saveEquipment(event) {
    event.preventDefault();

    if (
      saving ||
      loading ||
      !ready
    ) {
      return;
    }

    const token = sessionStorage.getItem(
      "agriverseToken"
    );

    if (!token) {
      setError("Please log in again.");
      return;
    }

    if (
      !name.trim() ||
      !district.trim() ||
      rentAmount === "" ||
      !Number.isFinite(Number(rentAmount)) ||
      Number(rentAmount) < 0
    ) {
      setError(
        "Enter an equipment name, district and valid rental amount."
      );
      return;
    }

    setError("");
    setSaving(true);

    try {
      let uploadedImage = imageFile
        ? ""
        : image;

      if (imageFile) {
        const form = new FormData();

        form.append(
          "image",
          imageFile
        );

        const uploadResponse = await fetch(
          "/api/upload/image",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: form,
          }
        );

        const uploadResult = await parseJSON(
          uploadResponse
        );

        uploadedImage =
          uploadResult.imageUrl ||
          uploadResult.url ||
          "";

        if (!uploadedImage) {
          throw new Error(
            "Image upload did not return a URL."
          );
        }
      }

      const body = {
        name: name.trim(),
        category,
        rentAmount: Number(rentAmount),
        rentType,
        address: address.trim(),
        district: district.trim(),
        state: state.trim(),
        description: description.trim(),
        image: uploadedImage,
      };

      const endpoint = isEditing
        ? `${API}/${encodeURIComponent(editId)}`
        : `${API}/add`;

      const response = await fetch(endpoint, {
        method: isEditing
          ? "PUT"
          : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(body),
      });

      const data = await parseJSON(response);

      const savedId =
        idOf(
          data.equipment?._id ||
            data.equipment?.id
        ) || editId;

      if (savedId) {
        navigate(
          `/rental-equipment/${encodeURIComponent(savedId)}`,
          {
            replace: true,
            state: {
              from:
                location.state?.from &&
                location.state.from !==
                  `/rental-equipment/${savedId}`
                  ? location.state.from
                  : dashboard,
            },
          }
        );
      } else {
        navigate(dashboard, {
          replace: true,
        });
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to save equipment."
      );
    } finally {
      setSaving(false);
    }
  }

  const field =
    "border border-green-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500 w-full";

  return (
    <main className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(returnPath)}
          className="text-green-700 font-bold inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <section className="bg-white rounded-3xl p-6 md:p-10 mt-6 border border-green-100 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-green-100 flex items-center justify-center">
              <Tractor
                className="text-green-700"
                size={34}
              />
            </div>

            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-green-700">
                {isEditing
                  ? "Edit Rental Equipment"
                  : "Add Rental Equipment"}
              </h1>

              <p className="text-gray-600 mt-2 text-lg">
                {isEditing
                  ? "Update your saved equipment details."
                  : "Publish farming machinery for rent."}
              </p>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4"
            >
              {error}
            </p>
          )}

          {loading && (
            <p className="mt-6 text-green-700 font-semibold">
              Loading your equipment details...
            </p>
          )}

          {(!isEditing || ready) && (
            <form onSubmit={saveEquipment}>
              <div className="grid md:grid-cols-2 gap-5 mt-10">
                <label className="md:col-span-2 h-64 rounded-3xl border-2 border-dashed border-green-200 bg-green-50 overflow-hidden flex items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={chooseImage}
                    className="hidden"
                  />

                  {image ? (
                    <img
                      src={image}
                      alt="Equipment preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <ImagePlus
                        className="mx-auto text-green-700 mb-3"
                        size={36}
                      />

                      <p className="font-semibold text-gray-700">
                        Upload equipment image
                      </p>
                    </div>
                  )}
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Equipment name"
                  aria-label="Equipment name"
                  required
                  className={field}
                />

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  aria-label="Equipment category"
                  className={field}
                >
                  {Array.from(
                    new Set([
                      category,
                      "Tractor",
                      "Harvester",
                      "Rotavator",
                      "Sprayer",
                      "Seeder",
                      "Pump Set",
                      "Drone",
                      "Other",
                    ])
                  ).map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rentAmount}
                  onChange={(event) =>
                    setRentAmount(event.target.value)
                  }
                  placeholder="Rent amount"
                  aria-label="Rent amount"
                  required
                  className={field}
                />

                <select
                  value={rentType}
                  onChange={(event) =>
                    setRentType(event.target.value)
                  }
                  aria-label="Rent type"
                  className={field}
                >
                  {Array.from(
                    new Set([
                      rentType,
                      "Per Day",
                      "Per Week",
                      "Per Month",
                    ])
                  ).map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  placeholder="Street / Area / Exact Address"
                  aria-label="Equipment address"
                  className={`md:col-span-2 ${field}`}
                />

                <input
                  value={district}
                  onChange={(event) =>
                    setDistrict(event.target.value)
                  }
                  placeholder="District"
                  aria-label="District"
                  required
                  className={field}
                />

                <input
                  value={state}
                  onChange={(event) =>
                    setState(event.target.value)
                  }
                  placeholder="State"
                  aria-label="State"
                  className={field}
                />

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Description"
                  aria-label="Description"
                  className={`md:col-span-2 min-h-[140px] ${field}`}
                />
              </div>

              <button
                type="submit"
                disabled={saving || loading}
                className="bg-green-700 text-white px-8 py-4 rounded-2xl font-bold mt-8 disabled:opacity-50"
              >
                {saving
                  ? "Saving Equipment..."
                  : isEditing
                    ? "Update Equipment"
                    : "Publish Equipment"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
