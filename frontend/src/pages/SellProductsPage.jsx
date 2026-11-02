
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Search,
  ShoppingBasket,
  ShoppingCart,
  MapPin,
  MoreVertical,
  Trash2,
  ArrowLeft,
} from "lucide-react"

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

function getCurrentUser() {
  try {
    return (
      JSON.parse(
        localStorage.getItem("agriverseCurrentUser") || "null"
      ) || {}
    )
  } catch {
    return {}
  }
}

function getStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function normalizeProduct(item) {
  return {
    ...item,
    id: String(item._id || item.id || ""),
    name: item.name || item.productName || "",
    sellerName:
      item.sellerName ||
      item.sellerUsername ||
      "Seller",
    sellerUsername:
      item.sellerUsername ||
      item.seller?.username ||
      "",
    image: item.image || "",
    district: item.district || item.location || "",
    category: item.category || "Crop",
    price: Number(item.price) || 0,
  }
}

function SellProductsPage() {
  const currentUser = getCurrentUser()

  const dashboardPath =
    currentUser.role === "buyer"
      ? "/customer-dashboard"
      : "/farmer-dashboard"

  const cartKey = `agriverseCart_${currentUser.username || "guest"}`

  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState("")

  const [cartItems, setCartItems] = useState(() =>
    getStoredArray(cartKey)
  )

  const [showCart, setShowCart] = useState(false)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [sortBy, setSortBy] = useState("Newest")

  useEffect(() => {
    let active = true

    async function loadProducts() {
      setLoadingProducts(true)
      setError("")

      try {
        const response = await fetch("/api/product-listings")

        if (!response.ok) {
          throw new Error("Unable to load marketplace products.")
        }

        const data = await response.json()

        if (!Array.isArray(data)) {
          throw new Error("Invalid marketplace response.")
        }

        if (active) {
          setProducts(data.map(normalizeProduct))
        }
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load marketplace products."
          )
        }
      } finally {
        if (active) {
          setLoadingProducts(false)
        }
      }
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [])

  const myProductIds = useMemo(() => {
    const stored = getStoredArray(
      `agriverseOwnedProductIds_${currentUser.username}`
    )

    return new Set(stored.map(String))
  }, [currentUser.username])

  const marketplaceProducts = useMemo(() => {
    const username = String(
      currentUser.username || ""
    ).toLowerCase()

    const currentUserId = String(
      currentUser._id || currentUser.id || ""
    )

    return products.filter((product) => {
      const sellerUsername = String(
        product.sellerUsername || ""
      ).toLowerCase()

      const sellerId = String(
        product.seller?._id ||
          product.seller ||
          ""
      )

      const isOwnerByUsername =
        username &&
        sellerUsername &&
        username === sellerUsername

      const isOwnerById =
        currentUserId &&
        sellerId &&
        currentUserId === sellerId

      const isOwnerByStoredId =
        myProductIds.has(product.id)

      return !(
        isOwnerByUsername ||
        isOwnerById ||
        isOwnerByStoredId
      )
    })
  }, [
    products,
    currentUser.username,
    currentUser._id,
    currentUser.id,
    myProductIds,
  ])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    const result = marketplaceProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.district.toLowerCase().includes(query)

      const matchesCategory =
        categoryFilter === "All" ||
        product.category === categoryFilter

      return matchesSearch && matchesCategory
    })

    if (sortBy === "Low to High") {
      return [...result].sort(
        (a, b) => a.price - b.price
      )
    }

    if (sortBy === "High to Low") {
      return [...result].sort(
        (a, b) => b.price - a.price
      )
    }

    return [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()

      return dateB - dateA
    })
  }, [
    marketplaceProducts,
    search,
    categoryFilter,
    sortBy,
  ])

  function saveCart(updatedCart) {
    setCartItems(updatedCart)
    localStorage.setItem(
      cartKey,
      JSON.stringify(updatedCart)
    )
  }

  function addToCart(product) {
    const alreadyAdded = cartItems.some(
      (item) => String(item.id) === String(product.id)
    )

    if (alreadyAdded) {
      alert("Product already added to cart.")
      return
    }

    const updatedCart = [product, ...cartItems]

    saveCart(updatedCart)

    alert("Product added to cart.")
  }

  function removeFromCart(productId) {
    const updatedCart = cartItems.filter(
      (item) => String(item.id) !== String(productId)
    )

    saveCart(updatedCart)
  }

  return (
    <div className="min-h-screen bg-green-50 px-4 py-8 md:px-8">
      <div className="max-w-7xl mx-auto">
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-2 text-green-700 font-bold hover:text-green-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-3xl md:rounded-[3rem] p-5 md:p-10 mt-6 border border-green-100 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-green-100 flex items-center justify-center">
                <ShoppingBasket
                  className="text-green-700"
                  size={30}
                />
              </div>

              <div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-green-700">
                  Buy / Sell Products
                </h1>

                <p className="text-gray-600 mt-2 text-sm md:text-base">
                  Explore agricultural products published
                  by Farmers and Buyers.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCart((previous) => !previous)}
              className="relative bg-green-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-green-800"
            >
              <ShoppingCart size={20} />
              Cart ({cartItems.length})
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-2xl mt-6"
            >
              {error}
            </div>
          )}

          {showCart ? (
            <section className="bg-white rounded-3xl p-4 md:p-8 mt-10 border border-green-200">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                  My Saved Cart
                </h2>

                <button
                  type="button"
                  onClick={() => setShowCart(false)}
                  className="text-green-700 font-bold hover:underline"
                >
                  Back to Marketplace
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="bg-green-50 rounded-2xl p-8 mt-6 text-center text-gray-600">
                  No products saved in cart yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {cartItems.map((product) => (
                    <div
                      key={product.id}
                      className="bg-green-50 rounded-3xl overflow-hidden border border-green-100"
                    >
                      <Link
                        to={`/product/${product.id}?view=marketplace`}
                        className="block"
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-52 object-cover"
                          />
                        ) : (
                          <div className="w-full h-52 bg-green-100 flex items-center justify-center">
                            <ShoppingBasket
                              className="text-green-700"
                              size={42}
                            />
                          </div>
                        )}

                        <div className="p-5">
                          <h3 className="text-xl font-bold text-green-700">
                            {product.name}
                          </h3>

                          <p className="mt-2 font-bold text-green-700">
                            ₹{product.price}
                          </p>

                          <p className="text-gray-700 mt-3">
                            <b>Seller:</b> {product.sellerName}
                          </p>

                          <p className="flex items-center gap-2 text-gray-700 mt-2">
                            <MapPin size={16} />
                            {product.district}
                          </p>
                        </div>
                      </Link>

                      <div className="px-5 pb-5">
                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(product.id)
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="bg-white rounded-3xl p-4 md:p-8 mt-10 border border-green-200">
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                Explore Marketplace
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                <div className="md:col-span-2 flex items-center gap-3 border border-green-300 rounded-2xl px-4 py-3">
                  <Search
                    className="text-green-700"
                    size={20}
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search products or district..."
                    className="w-full bg-transparent outline-none text-sm md:text-base"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value)
                  }
                  className="border border-green-300 rounded-2xl px-4 py-3 outline-none bg-white"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  className="border border-green-300 rounded-2xl px-4 py-3 outline-none bg-white"
                >
                  <option value="Newest">Newest</option>
                  <option value="Low to High">
                    Low to High
                  </option>
                  <option value="High to Low">
                    High to Low
                  </option>
                </select>
              </div>

              {loadingProducts ? (
                <div className="bg-green-50 rounded-2xl p-8 mt-8 text-center text-gray-600">
                  Loading marketplace products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-green-50 rounded-2xl p-8 mt-8 text-center text-gray-600">
                  {marketplaceProducts.length === 0
                    ? "No products yet."
                    : "No matching products found."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {filteredProducts.map((product) => (
                    <CompactProductCard
                      key={product.id}
                      product={product}
                      addToCart={addToCart}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
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
        type="button"
        onClick={() => setShowMenu((previous) => !previous)}
        aria-label={`Options for ${product.name}`}
        aria-expanded={showMenu}
        className="absolute top-4 right-4 z-20 bg-white/90 text-green-700 w-11 h-11 rounded-full flex items-center justify-center shadow-md border border-green-200"
      >
        <MoreVertical size={22} />
      </button>

      {showMenu && (
        <div className="absolute top-16 right-4 z-30 bg-white rounded-2xl shadow-xl border border-green-100 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              addToCart(product)
              setShowMenu(false)
            }}
            className="px-5 py-3 font-bold text-green-700 hover:bg-green-50 flex items-center gap-2 whitespace-nowrap"
          >
            <ShoppingCart size={19} />
            Add to Cart
          </button>
        </div>
      )}

      <Link
        to={`/product/${product.id}?view=marketplace`}
        className="block"
      >
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

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-bold text-green-700 break-words">
              {product.name}
            </h3>

            <span className="bg-white text-green-700 px-3 py-2 rounded-xl font-bold text-sm whitespace-nowrap">
              ₹{product.price}
            </span>
          </div>

          <p className="mt-4 text-gray-700 text-sm">
            <b>Seller:</b> {product.sellerName}
          </p>

          <p className="flex items-center gap-2 text-gray-700 mt-3 text-sm">
            <MapPin size={16} />
            {product.district || "Location not specified"}
          </p>
        </div>
      </Link>
    </div>
  )
}

export default SellProductsPage
