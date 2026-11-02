
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ImagePlus,
  ShoppingBasket,
  Save,
} from "lucide-react";

const API = "/api/product-listings";

function getCurrentUser() {
  try {
    return JSON.parse(
      localStorage.getItem("agriverseCurrentUser") || "{}"
    ) || {};
  } catch {
    return {};
  }
}

const initialForm = {
  productName: "",
  category: "Crop",
  quantity: "",
  unit: "kg",
  price: "",
  district: "",
  state: "",
  location: "",
  phone: "",
  description: "",
  image: "",
};

function AddProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEditing = Boolean(id);
  const token = sessionStorage.getItem("agriverseToken");
  const user = getCurrentUser();

  const dashboardPath =
    user.role === "farmer"
      ? "/farmer-dashboard"
      : "/customer-dashboard";

  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ownerVerified, setOwnerVerified] =
    useState(!isEditing);

  useEffect(() => {
    if (!isEditing) return;

    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      setOwnerVerified(false);
      setError("");

      try {
        if (!token) {
          throw new Error("Please log in again.");
        }

        const response = await fetch(`${API}/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          throw new Error(
            data.message || "Unable to load your products."
          );
        }

        const product = data.find(
          (item) => String(item._id) === String(id)
        );

        if (!product) {
          throw new Error(
            "Product not found or you are not its owner."
          );
        }

        if (controller.signal.aborted) return;

        setForm({
          productName:
            product.productName || product.name || "",
          category: product.category || "Crop",
          quantity: String(product.quantity ?? ""),
          unit: product.unit || "kg",
          price: String(product.price ?? ""),
          district: product.district || "",
          state: product.state || "",
          location: product.location || "",
          phone: product.phone || "",
          description: product.description || "",
          image: product.image || "",
        });

        setPreview(product.image || "");
        setOwnerVerified(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message || "Unable to load product details."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => controller.abort();
  }, [id, isEditing, token]);

  useEffect(() => {
    if (!imageFile) return;

    const objectUrl = URL.createObjectURL(imageFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.type)) {
      setError("Select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setImageFile(file);
    setError("");
  }

  async function uploadImage() {
    if (!imageFile) {
      return form.image;
    }

    const uploadForm = new FormData();
    uploadForm.append("image", imageFile);

    const response = await fetch("/api/upload/image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: uploadForm,
    });

    const data = await response.json();

    if (
      !response.ok ||
      !data.success ||
      !data.imageUrl
    ) {
      throw new Error(
        data.message || "Unable to upload product image."
      );
    }

    if (!String(data.imageUrl).startsWith("https://")) {
      throw new Error(
        "The image upload did not return a secure URL."
      );
    }

    return data.imageUrl;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || loading) return;

    setError("");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    if (!ownerVerified) {
      setError("Product ownership could not be verified.");
      return;
    }

    if (form.productName.trim().length < 2) {
      setError("Enter a valid product name.");
      return;
    }

    if (!form.category.trim()) {
      setError("Select a product category.");
      return;
    }

    if (!form.quantity.trim()) {
      setError("Enter the available quantity.");
      return;
    }

    if (
      form.price.trim() === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) < 0 ||
      Number(form.price) > 1000000000
    ) {
      setError("Enter a valid product price.");
      return;
    }

    if (!form.district.trim()) {
      setError("Enter your district.");
      return;
    }

    if (
      form.phone.trim() &&
      !/^[+0-9()\s-]{7,30}$/.test(form.phone.trim())
    ) {
      setError("Enter a valid phone number.");
      return;
    }

    setSaving(true);

    try {
      const imageUrl = await uploadImage();

      const payload = {
        productName: form.productName.trim(),
        category: form.category.trim(),
        quantity: form.quantity.trim(),
        unit: form.unit,
        price: Number(form.price),
        district: form.district.trim(),
        state: form.state.trim(),
        location: form.location.trim(),
        phone: form.phone.trim(),
        description: form.description.trim(),
        image: imageUrl || "",
      };

      const response = await fetch(
        isEditing
          ? `${API}/${encodeURIComponent(id)}`
          : `${API}/add`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          (isEditing
            ? "Unable to update product."
            : "Unable to publish product.")
        );
      }

      navigate("/sell-products", {
        replace: true,
        state: {
          productNotice: isEditing
            ? "Product updated successfully."
            : "Product published successfully.",
        },
      });
    } catch (err) {
      setError(
        err.message || "Unable to save your product."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-green-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500";

  return (
    <main className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/sell-products"
          className="inline-flex items-center gap-2 text-green-700 font-bold"
        >
          <ArrowLeft size={18} />
          Back to Buy / Sell Products
        </Link>

        <section className="bg-white rounded-3xl p-6 md:p-10 mt-6 border border-green-200 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
              <ShoppingBasket
                size={34}
                className="text-green-700"
              />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-green-800">
                {isEditing
                  ? "Edit Product"
                  : "Add Product"}
              </h1>

              <p className="text-gray-600 mt-2">
                {isEditing
                  ? "Update your published product details."
                  : "Publish a product for other users to buy."}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-5">
            Both Farmers and Buyers can publish products.
            Only the listing owner can edit them.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-7 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700"
            >
              {error}
            </div>
          )}

          {loading ? (
            <p className="mt-8 text-green-700 font-semibold">
              Loading product details...
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-9 space-y-6"
            >
              <label className="block h-64 rounded-3xl border-2 border-dashed border-green-200 bg-green-50 overflow-hidden cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {preview ? (
                  <img
                    src={preview}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <ImagePlus
                      size={40}
                      className="text-green-700"
                    />

                    <span className="font-semibold text-gray-700 mt-4">
                      Upload Product Image
                    </span>

                    <span className="text-sm text-gray-500 mt-2">
                      JPG, PNG or WebP (up to 5 MB)
                    </span>
                  </div>
                )}
              </label>

              <div className="grid md:grid-cols-2 gap-5">
                <label className="block">
                  <span className="block font-semibold mb-2">
                    Product Name
                  </span>

                  <input
                    value={form.productName}
                    onChange={(event) =>
                      updateField(
                        "productName",
                        event.target.value
                      )
                    }
                    placeholder="Example: Organic Rice"
                    required
                    maxLength={200}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="block font-semibold mb-2">
                    Category
                  </span>

                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateField(
                        "category",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Crop">Crop</option>
                    <option value="Vegetable">Vegetable</option>
                    <option value="Fruit">Fruit</option>
                    <option value="Grain">Grain</option>
                    <option value="Seed">Seed</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="block">
                  <span className="block font-semibold mb-2">
                    Available Quantity
                  </span>

                  <input
                    value={form.quantity}
                    onChange={(event) =>
                      updateField(
                        "quantity",
                        event.target.value
                      )
                    }
                    placeholder="Example: 50"
                    maxLength={100}
                    required
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="block font-semibold mb-2">
                    Unit
                  </span>

                  <select
                    value={form.unit}
                    onChange={(event) =>
                      updateField(
                        "unit",
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="ton">ton</option>
                    <option value="litre">litre</option>
                    <option value="piece">piece</option>
                    <option value="bag">bag</option>
                    <option value="box">box</option>
                    <option value="quintal">quintal</option>
                  </select>
                </label>

                <label className="block">
                  <span className="block font-semibold mb-2">
                    Price (₹ per unit)
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateField(
                        "price",
                        event.target.value
                      )
                    }
                    placeholder="Enter product price"
                    required
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="block font-semibold mb-2">
                    Contact Number
                  </span>

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField(
                        "phone",
                        event.target.value
                      )
                    }
                    placeholder="Contact number"
                    maxLength={30}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="block font-semibold mb-2">
                    District
                  </span>

                  <input
                    value={form.district}
                    onChange={(event) =>
                      updateField(
                        "district",
                        event.target.value
                      )
                    }
                    placeholder="District"
                    required
                    maxLength={200}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className="block font-semibold mb-2">
                    State
                  </span>

                  <input
                    value={form.state}
                    onChange={(event) =>
                      updateField(
                        "state",
                        event.target.value
                      )
                    }
                    placeholder="State"
                    maxLength={200}
                    className={inputClass}
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="block font-semibold mb-2">
                    Area / Location
                  </span>

                  <input
                    value={form.location}
                    onChange={(event) =>
                      updateField(
                        "location",
                        event.target.value
                      )
                    }
                    placeholder="Example: T. Nagar, Chennai"
                    maxLength={500}
                    className={inputClass}
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="block font-semibold mb-2">
                    Description
                  </span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Describe the product, quality and other details"
                    rows={5}
                    maxLength={5000}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={saving || !ownerVerified}
                  className="bg-green-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={19} />

                  {saving
                    ? "Saving..."
                    : isEditing
                      ? "Update Product"
                      : "Publish Product"}
                </button>

                <Link
                  to="/sell-products"
                  className="bg-gray-100 text-gray-800 px-8 py-4 rounded-2xl font-bold"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </section>

        <div className="mt-5 text-center">
          <Link
            to={dashboardPath}
            className="text-green-700 font-semibold"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

export default AddProductPage;
