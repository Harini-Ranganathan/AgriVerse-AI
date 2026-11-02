import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  ShoppingBasket,
  ImagePlus,
  MapPin,
  MoreVertical,
  ShoppingCart,
} from "lucide-react"

function SellProductsPage() {
  const fileInputRef = useRef(null)

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

  const cartKey = `agriverseCart_${currentUser.username}`

  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pendingImage, setPendingImage] = useState(null)
  const [error, setError] = useState("")
  const [cartItems, setCartItems] = useState([])
  const [showCart, setShowCart] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [sortBy, setSortBy] = useState("Newest")

  const [image, setImage] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("Crop")
  const [quantity, setQuantity] = useState("")
  const [unit, setUnit] = useState("kg")
  const [price, setPrice] = useState("")
  const [district, setDistrict] = useState("")
  const [description, setDescription] = useState("")
  const [harvestDate, setHarvestDate] = useState("")
  const [delivery, setDelivery] = useState("No")

  const categories = [
    "All",
    "Crop",
    "Vegetable",
    "Fruit",
    "Seeds",
    "Fertilizer",
    "Equipment",
    "Rental Machinery",
  ]

  useEffect(() => {
    loadProducts()
    loadCart()
  }, [])

  async function loadProducts() {
    setLoadingProducts(true)
    setError("")
    try {
      const response = await fetch("/api/product-listings")
      if (!response.ok) throw new Error("Unable to load marketplace products.")
      const items = await response.json()
      if (!Array.isArray(items)) throw new Error("Invalid marketplace response.")
      const ownedIds = (() => {
        try {
          const stored = JSON.parse(localStorage.getItem(`agriverseOwnedProductIds_${currentUser.username}`) || "[]")
          return Array.isArray(stored) ? stored : []
        } catch { return [] }
      })()
      setProducts(items.map((item) => ({
        ...item,
        id: String(item._id),
        name: item.name || item.productName || "",
        sellerUsername: item.sellerUsername || (ownedIds.includes(String(item._id)) ? currentUser.username : ""),
        image: item.image || "",
      })))
    } catch (err) {
      setError(err.message || "Unable to load products.")
    } finally {
      setLoadingProducts(false)
    }
  }

  function loadCart() {
    const saved =
      JSON.parse(localStorage.getItem(cartKey)) || []

    setCartItems(saved)
  }

  function saveCart(updatedCart) {
    setCartItems(updatedCart)
    localStorage.setItem(cartKey, JSON.stringify(updatedCart))
  }

  function addToCart(product) {
    const alreadyAdded = cartItems.some((item) => item.id === product.id)

    if (alreadyAdded) {
      alert("Product already added to cart.")
      return
    }

    const updatedCart = [product, ...cartItems]
    saveCart(updatedCart)

    alert("Product added to cart.")
  }

  function removeFromCart(productId) {
    const updatedCart = cartItems.filter((item) => item.id !== productId)
    saveCart(updatedCart)
  }

  function resetForm() {
    setEditingId(null)
    setImage("")
    setPendingImage(null)
    setError("")
    setName("")
    setCategory("Crop")
    setQuantity("")
    setUnit("kg")
    setPrice("")
    setDistrict("")
    setDescription("")
    setHarvestDate("")
    setDelivery("No")
  }

  function openAddForm() {
    resetForm()
    setShowForm(true)
    setShowCart(false)
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type)) || file.size > 5 * 1024 * 1024) {
      setError("Select a JPG, PNG or WebP image smaller than 5 MB.")
      return
    }
    setPendingImage(file)
    const reader = new FileReader()
    reader.onload = () => { if (typeof reader.result === "string") setImage(reader.result) }
    reader.readAsDataURL(file)
  }

  async function saveProduct() {
    if (saving) return
    const token = sessionStorage.getItem("agriverseToken")
    if (!token) { setError("Please log in to publish products."); return }
    if (!["farmer", "buyer"].includes(currentUser.role)) { setError("Only farmers and buyers can publish products."); return }
    if (!name.trim() || !quantity.trim() || !district.trim() || price === "" || !Number.isFinite(Number(price)) || Number(price) < 0) {
      setError("Enter a name, quantity, valid price and district.")
      return
    }
    setSaving(true)
    setError("")
    try {
      let imageUrl = image.startsWith("https://") ? image : ""
      if (pendingImage) {
        const form = new FormData()
        form.append("image", pendingImage)
        const uploadResponse = await fetch("/api/upload/image", {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
        })
        const uploadData = await uploadResponse.json()
        if (!uploadResponse.ok || !uploadData.imageUrl) throw new Error(uploadData.message || "Image upload failed.")
        imageUrl = uploadData.imageUrl
      }
      const payload = {
        name: name.trim(), productName: name.trim(), category,
        quantity: quantity.trim(), unit, price: Number(price),
        district: district.trim(), description: description.trim(),
        harvestDate, delivery, image: imageUrl,
      }
      const endpoint = editingId ? `/api/product-listings/${editingId}` : "/api/product-listings/add"
      const response = await fetch(endpoint, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || "Saving product failed.")
      const id = String(result.listing?._id || editingId)
      const key = `agriverseOwnedProductIds_${currentUser.username}`
      let owned = []
      try { owned = JSON.parse(localStorage.getItem(key) || "[]") } catch {}
      localStorage.setItem(key, JSON.stringify([...new Set([...(Array.isArray(owned) ? owned : []), id])]))
      resetForm()
      setShowForm(false)
      await loadProducts()
      alert(editingId ? "Product updated successfully." : "Product published successfully.")
    } catch (err) {
      setError(err.message || "Unable to save product.")
    } finally {
      setSaving(false)
    }
  }

  function editProduct(product) {
    setEditingId(product.id)
    setImage(product.image || "")
    setPendingImage(null)
    setName(product.name || "")
    setCategory(product.category || "Crop")
    setQuantity(product.quantity || "")
    setUnit(product.unit || "kg")
    setPrice(product.price || "")
    setDistrict(product.district || "")
    setDescription(product.description || "")
    setHarvestDate(product.harvestDate || "")
    setDelivery(product.delivery || "No")
    setShowForm(true)
    setShowCart(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function deleteProduct(productId) {
    if (!window.confirm("Delete this product permanently?")) return
    const token = sessionStorage.getItem("agriverseToken")
    if (!token) { setError("Please log in again."); return }
    try {
      const response = await fetch(`/api/product-listings/${productId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || "Delete failed.")
      const key = `agriverseOwnedProductIds_${currentUser.username}`
      try {
        const ids = JSON.parse(localStorage.getItem(key) || "[]")
        localStorage.setItem(key, JSON.stringify(ids.filter((id) => String(id) !== String(productId))))
      } catch {}
      await loadProducts()
    } catch (err) { setError(err.message || "Unable to delete product.") }
  }

  const myProducts = products.filter(
    (product) => product.sellerUsername === currentUser.username
  )

  let filteredProducts = products.filter((product) => {
    const productName = product.name || ""
    const productDistrict = product.district || ""

    const matchSearch =
      productName.toLowerCase().includes(search.toLowerCase()) ||
      productDistrict.toLowerCase().includes(search.toLowerCase())

    const matchCategory =
      categoryFilter === "All" || product.category === categoryFilter

    return matchSearch && matchCategory
  })

  if (sortBy === "Low to High") {
    filteredProducts = [...filteredProducts].sort(
      (a, b) => Number(a.price) - Number(b.price)
    )
  }

  if (sortBy === "High to Low") {
    filteredProducts = [...filteredProducts].sort(
      (a, b) => Number(b.price) - Number(a.price)
    )
  }

  if (sortBy === "Newest") {
    filteredProducts = [...filteredProducts].sort(
      (a, b) => Number(b.id) - Number(a.id)
    )
  }
  

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link to={dashboardPath} className="text-green-700 font-bold">
          ← Back to Dashboard
        </Link>

        {error && <div role="alert" className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-2xl mt-6">{error}</div>}
        {loadingProducts && <p className="mt-4 text-green-700">Loading marketplace products...</p>}
        <div className="bg-white rounded-[3rem] p-10 mt-6 border border-green-100 shadow-xl">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-green-100 flex items-center justify-center">
                <ShoppingBasket className="text-green-700" size={34} />
              </div>

              <div>
                <h1 className="text-5xl font-extrabold text-green-700">
                  Buy / Sell Products
                </h1>

                <p className="text-gray-600 mt-2 text-lg">
                  Publish your farm products and explore products from other farmers.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowCart(!showCart)
                  setShowForm(false)
                }}
                className="bg-green-700 text-xl text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2 relative"
              >
                <ShoppingCart size={20} />
                Cart

                {cartItems.length > 0 && (
                  <span className="absolute -top-3 -right-3 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {cartItems.length}
                  </span>
                )}
              </button>

              <button
                onClick={openAddForm}
                className="bg-green-700 text-xl text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-2"
              >
                <Plus size={30} />
                Add Product
              </button>
            </div>
          </div>

          {showCart && (
            <div className="bg-green-50 rounded-[3rem] p-8 mt-10 border border-green-600">
              <h2 className="text-3xl font-extrabold text-black">
                My Saved Cart
              </h2>

              {cartItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 mt-6">
                  No products saved in cart yet.
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  {cartItems.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-3xl overflow-hidden border border-green-100"
                    >
                      <Link to={`/product/${product.id}?view=marketplace`}>
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-[220px] object-cover"
                          />
                        ) : (
                          <div className="w-full h-[220px] bg-green-100 flex items-center justify-center">
                            <ShoppingBasket
                              className="text-green-700"
                              size={42}
                            />
                          </div>
                        )}

                        <div className="p-6">
                          <h3 className="text-2xl font-bold text-green-700">
                            {product.name}
                          </h3>

                          <p className="mt-3 font-bold text-green-700">
                            ₹{product.price}
                          </p>

                          <p className="mt-3">
                            <b>Seller:</b> {product.sellerName}
                          </p>

                          <p className="flex items-center gap-2 mt-3">
                            <MapPin size={16} />
                            {product.district}
                          </p>
                        </div>
                      </Link>

                      <div className="px-6 pb-6">
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="bg-red-500 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showForm && (
            <div className="bg-green-50 rounded-[3rem] p-8 mt-10 border border-green-100">
              <h2 className="text-3xl font-extrabold text-black">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>

              <div className="grid md:grid-cols-2 gap-5 mt-8">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="md:col-span-2 h-64 rounded-3xl border-2 border-dashed border-green-200 bg-white overflow-hidden flex items-center justify-center"
                >
                  {image ? (
                    <img
                      src={image}
                      alt="product"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <ImagePlus
                        className="mx-auto text-green-700 mb-3"
                        size={36}
                      />

                      <p className="font-semibold text-gray-700">
                        Upload product image
                      </p>
                    </div>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Product name"
                  className="border border-green-200 rounded-2xl px-5 py-4 outline-none"
                />

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="border border-green-200 rounded-2xl px-5 py-4 outline-none"
                >
                  {categories
                    .filter((item) => item !== "All")
                    .map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                </select>

                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantity"
                  className="border border-green-200 rounded-2xl px-5 py-4 outline-none"
                />

                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="border border-green-200 rounded-2xl px-5 py-4 outline-none"
                >
                  <option>kg</option>
                  <option>ton</option>
                  <option>bag</option>
                  <option>piece</option>
                  <option>day rent</option>
                </select>

                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price"
                  type="number"
                  className="border border-green-200 rounded-2xl px-5 py-4 outline-none"
                />

                <input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="District / City"
                  className="border border-green-200 rounded-2xl px-5 py-4 outline-none"
                />

                <div>
                  <label className="block font-bold text-gray-700 mb-2">
                    Harvest Date / Available From
                  </label>

                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full border border-green-200 rounded-2xl px-5 py-4 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-2">
                    Delivery Available?
                  </label>

                  <select
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value)}
                    className="w-full border border-green-200 rounded-2xl px-5 py-4 outline-none"
                  >
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="md:col-span-2 border border-green-200 rounded-2xl px-5 py-4 outline-none min-h-[120px]"
                />
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={saveProduct}
                  disabled={saving}
                  className="bg-green-700 text-white px-8 py-4 rounded-2xl font-bold disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Product" : "Publish Product"}
                </button>

                <button
                  onClick={() => {
                    resetForm()
                    setShowForm(false)
                  }}
                  className="bg-gray-200 text-black px-8 py-4 rounded-2xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg- rounded-[3rem] p-8 mt-10 border border-green-600 shadow-sm">
            <h2 className="text-3xl font-extrabold text-black">
              My Products
            </h2>

            {myProducts.length === 0 ? (
              <div className="bg-green-50 rounded-3xl p-8 mt-6">
                <p className="text-gray-700 text-lg ">
                  You have not published any products yet.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6 mt-8 ">
                {myProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showOwnerButtons={true}
                    viewMode="owner"
                    onEdit={editProduct}
                    onDelete={deleteProduct}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[3rem] p-8 mt-15 border border-green-600 shadow-sm">
            <h2 className="text-3xl font-extrabold text-black">
              Explore Marketplace
            </h2>

            <div className="grid md:grid-cols-4 gap-4 mt-8">
              <div className="md:col-span-2 flex items-center gap-3 border border-green-600 rounded-2xl px-5 py-4">
                <Search className="text-green-700" size={22} />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products or district..."
                  className="w-full outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-green-600 rounded-2xl px-5 py-4 outline-none"
              >
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-green-600 rounded-2xl px-5 py-4 outline-none"
              >
                <option>Newest</option>
                <option>Low to High</option>
                <option>High to Low</option>
              </select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-green-50 rounded-3xl p-8 mt-8">
                <p className="text-gray-700 text-lg">No products found.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                {filteredProducts.map((product) => (
                  <CompactProductCard
                    key={product.id}
                    product={product}
                    addToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const currentUser =
  JSON.parse(localStorage.getItem("agriverseCurrentUser")) || {
    username: "defaultUser",
  }

  const dashboardPath =
  currentUser.role === "farmer"
    ? "/farmer-dashboard"
    : "/customer-dashboard"

function ProductCard({
  product,
  showOwnerButtons,
  viewMode,
  onEdit,
  onDelete,
}) {
  const unreadCount = (product.buyerRequests || []).filter(
    (request) => !request.seenBySeller
  ).length

  return (
    <div className="bg-green-50 rounded-3xl overflow-visible border border-green-100 relative">
      {unreadCount > 0 && (
        <div className="absolute -top-8 right-6 z-30 w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center text-4xl font-extrabold shadow-2xl border-4 border-white">
          {unreadCount}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-[220px] object-cover"
          />
        ) : (
          <div className="w-full h-[220px] bg-green-100 flex items-center justify-center">
            <ShoppingBasket className="text-green-700" size={42} />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-green-700">
                {product.name}
              </h3>

              <p className="text-gray-600 text-sm mt-1">
                {product.category}
              </p>
            </div>

            <span className="bg-white text-green-700 px-3 py-2 rounded-xl font-bold">
              ₹{product.price}
            </span>
          </div>

          <div className="space-y-2 mt-5 text-gray-700">
            <p>
              <b>Quantity:</b> {product.quantity} {product.unit}
            </p>

            <p>
              <b>Seller:</b> {product.sellerName}
            </p>

            <p className="flex items-center gap-2">
              <MapPin size={16} />
              {product.district}
            </p>

            <p>
              <b>Delivery:</b> {product.delivery || "No"}
            </p>

            <p>
              <b>Harvest:</b> {product.harvestDate || "Not mentioned"}
            </p>
          </div>

          <p className="text-gray-600 mt-4 line-clamp-2">
            {product.description}
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to={`/product/${product.id}?view=${viewMode}`}
              className="bg-green-700 text-white px-5 py-3 rounded-2xl font-bold"
            >
              View Details
            </Link>

            {showOwnerButtons && (
              <>
                <button
                  onClick={() => onEdit(product)}
                  className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2"
                >
                  <Edit3 size={16} />
                  Edit
                </button>

                <button
                  onClick={() => onDelete(product.id)}
                  className="bg-red-500 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CompactProductCard({ product, addToCart }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="relative bg-green-50 rounded-3xl overflow-hidden border border-green-100 hover:shadow-lg transition">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="absolute top-4 right-4 z-20 bg-white/90 text-green-700 w-11 h-11 rounded-full flex items-center justify-center shadow-md border border-green-800"
      >
        <MoreVertical size={24} />
      </button>

      {showMenu && (
        <div className="absolute top-16 right-4 z-30 bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
          <button
            onClick={() => {
              addToCart(product)
              setShowMenu(false)
            }}
            className="px-5 py-3 font-bold text-green-700 hover:bg-green-50 flex items-center gap-2"
          >
            <ShoppingCart size={22} />
            Add to Cart
          </button>
        </div>
      )}

      <Link to={`/product/${product.id}?view=marketplace`} className="block">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-[220px] object-cover"
          />
        ) : (
          <div className="w-full h-[220px] bg-green-100 flex items-center justify-center">
            <ShoppingBasket className="text-green-700" size={42} />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-2xl font-bold text-green-700">
              {product.name}
            </h3>

            <span className="bg-white text-green-700 px-3 py-2 rounded-xl font-bold">
              ₹{product.price}
            </span>
          </div>

          <p className="mt-4 text-gray-700">
            <b>Seller:</b> {product.sellerName}
          </p>

          <p className="flex items-center gap-2 text-gray-700 mt-3">
            <MapPin size={16} />
            {product.district}
          </p>
        </div>
      </Link>
    </div>
  )
}

export default SellProductsPage