
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Trash2,
  Tractor,
  MapPin,
  X,
} from "lucide-react";

const EQUIPMENT_API = "/api/rental-equipment";
const CART_API = "/api/rental-cart";

function getUser() {
  try {
    return JSON.parse(
      localStorage.getItem("agriverseCurrentUser") || "{}"
    ) || {};
  } catch {
    return {};
  }
}

function getId(value) {
  if (!value) return "";

  return typeof value === "object"
    ? String(value._id || value.id || "")
    : String(value);
}

function getOwnerId(item) {
  return getId(
    item.owner ||
    item.seller ||
    item.createdBy
  );
}

function nameOf(item) {
  return (
    item.name ||
    item.equipmentName ||
    item.title ||
    "Rental Equipment"
  );
}

function imageOf(item) {
  const image =
    item.image ||
    item.imageUrl ||
    item.images?.[0];

  return typeof image === "string"
    ? image
    : image?.url || "";
}

function priceOf(item) {
  return (
    item.rentAmount ??
    item.pricePerDay ??
    item.rentPerDay ??
    item.rentalPrice ??
    item.price
  );
}

function money(value) {
  const amount = Number(value);

  return value != null &&
    value !== "" &&
    Number.isFinite(amount)
    ? `₹${amount.toLocaleString("en-IN")}`
    : "Price unavailable";
}

function EquipmentImage({ item, small = false }) {
  const image = imageOf(item);
  const height = small ? "h-36" : "h-48";

  return image ? (
    <img
      src={image}
      alt={nameOf(item)}
      className={`w-full ${height} object-cover`}
      loading="lazy"
    />
  ) : (
    <div
      className={`w-full ${height} bg-green-100 flex items-center justify-center`}
    >
      <Tractor size={44} className="text-green-700" />
    </div>
  );
}

async function getJSON(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed."
    );
  }

  return data;
}

function getEquipment(data) {
  if (Array.isArray(data)) return data;

  const result =
    data.equipment ||
    data.equipments ||
    data.items ||
    data.listings ||
    data.data;

  if (!Array.isArray(result)) {
    throw new Error(
      data.message || "Invalid equipment response."
    );
  }

  return result;
}

function getCartItems(data) {
  if (
    !data.success ||
    !Array.isArray(data.cart?.items)
  ) {
    throw new Error(
      data.message || "Invalid cart response."
    );
  }

  return data.cart.items;
}

export default function RentalEquipmentPage() {
  const user = getUser();
  const token = sessionStorage.getItem(
    "agriverseToken"
  );

  const userId = getId(user._id || user.id);

  const navigate = useNavigate();
  const location = useLocation();

  const dashboard =
    user.role === "farmer"
      ? "/farmer-dashboard"
      : "/customer-dashboard";

  const currentPage =
    location.pathname + location.search;

  const [equipment, setEquipment] = useState([]);
  const [cart, setCart] = useState([]);

  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Newest");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function goBack() {
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(dashboard);
    }
  }

  const openEquipment = useCallback(
    (id) => {
      navigate(
        `/rental-equipment/${encodeURIComponent(id)}`,
        {
          state: {
            from: currentPage,
          },
        }
      );
    },
    [navigate, currentPage]
  );

  const loadEquipment = useCallback(
    async (signal) => {
      setLoading(true);

      try {
        const response = await fetch(
          EQUIPMENT_API,
          { signal }
        );

        const data = await getJSON(response);

        if (!signal.aborted) {
          setEquipment(getEquipment(data));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  const loadCart = useCallback(
    async (signal) => {
      setCartLoading(true);

      if (!token) {
        setCart([]);
        setCartLoading(false);
        return;
      }

      try {
        const response = await fetch(CART_API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        });

        const data = await getJSON(response);

        if (!signal.aborted) {
          setCart(getCartItems(data));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!signal.aborted) {
          setCartLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadEquipment(controller.signal);
    loadCart(controller.signal);

    return () => controller.abort();
  }, [loadEquipment, loadCart]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        equipment
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ],
    [equipment]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return equipment
      .filter((item) => {
        const matchesCategory =
          category === "All" ||
          item.category === category;

        const matchesSearch =
          !term ||
          [
            nameOf(item),
            item.category,
            item.location,
            item.address,
            item.district,
            item.state,
            item.ownerName,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(term)
          );

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === "Low to High") {
          return (
            Number(priceOf(a) || 0) -
            Number(priceOf(b) || 0)
          );
        }

        if (sort === "High to Low") {
          return (
            Number(priceOf(b) || 0) -
            Number(priceOf(a) || 0)
          );
        }

        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      });
  }, [equipment, search, category, sort]);

  const cartIds = useMemo(
    () =>
      new Set(
        cart.map((entry) =>
          getId(
            entry.equipmentId ||
            entry.equipment?._id
          )
        )
      ),
    [cart]
  );

  function ownEquipment(item) {
    return Boolean(
      userId &&
      getOwnerId(item) === userId
    );
  }

  async function addToCart(item) {
    const id = getId(item._id || item.id);

    if (busy || cartLoading) return;

    if (ownEquipment(item)) {
      setError(
        "You cannot rent your own equipment."
      );
      return;
    }

    setBusy(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        CART_API,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            equipmentId: id,
          }),
        }
      );

      const data = await getJSON(response);

      setCart(getCartItems(data));
      setNotice("Equipment added to cart.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function removeFromCart(id) {
    if (busy) return;

    setBusy(id);
    setError("");

    try {
      const response = await fetch(
        `${CART_API}/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await getJSON(response);

      setCart(getCartItems(data));
      setNotice("Equipment removed from cart.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function clearCart() {
    if (busy || cart.length === 0) return;

    if (
      !window.confirm("Clear your rental cart?")
    ) {
      return;
    }

    setBusy("clear");
    setError("");

    try {
      const response = await fetch(
        CART_API,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await getJSON(response);

      setCart(getCartItems(data));
      setNotice("Rental cart cleared.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const fieldClass =
    "w-full border border-green-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500";

  return (
    <main className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-green-700 font-bold"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <section className="bg-white border border-green-200 rounded-3xl p-5 md:p-9 mt-6 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-green-800">
                Equipment Rental
              </h1>

              <p className="text-gray-600 mt-2">
                Explore rental equipment published
                by Farmers and Buyers.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCart((value) => !value)
              }
              className="flex items-center gap-2 bg-green-700 text-white px-5 py-3 rounded-xl font-bold"
            >
              <ShoppingCart size={19} />
              Cart ({cart.length})
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 bg-red-50 rounded-xl p-4 text-red-700"
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="mt-5 bg-green-100 rounded-xl p-4 text-green-800"
            >
              {notice}
            </p>
          )}

          {showCart && (
            <section className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-7">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-green-800">
                  Equipment Cart
                </h2>

                <button
                  type="button"
                  onClick={() => setShowCart(false)}
                  aria-label="Close cart"
                >
                  <X size={22} />
                </button>
              </div>

              {cartLoading ? (
                <p className="mt-5">
                  Loading cart...
                </p>
              ) : cart.length === 0 ? (
                <p className="mt-5 text-gray-600">
                  Your cart is empty.
                </p>
              ) : (
                <>
                  <div className="flex gap-4 overflow-x-auto pb-4 mt-6">
                    {cart.map((entry) => {
                      const item =
                        entry.equipment || {};

                      const id = getId(
                        entry.equipmentId ||
                        item._id
                      );

                      return (
                        <article
                          key={id}
                          className="w-64 shrink-0 bg-white border border-green-200 rounded-xl overflow-hidden"
                        >
                          <div
                            role="link"
                            tabIndex={0}
                            onClick={() =>
                              openEquipment(id)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                openEquipment(id);
                              }
                            }}
                            className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600"
                          >
                            <EquipmentImage
                              item={item}
                              small
                            />

                            <div className="p-4">
                              <h3 className="font-bold text-green-800">
                                {nameOf(item)}
                              </h3>

                              <p className="mt-2">
                                {money(priceOf(item))}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() =>
                              removeFromCart(id)
                            }
                            className="ml-4 mb-4 text-red-700 flex gap-2 items-center disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                            Remove
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={clearCart}
                    className="text-red-700 font-bold disabled:opacity-50"
                  >
                    Clear Cart
                  </button>
                </>
              )}
            </section>
          )}

          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <label className="flex items-center gap-2 border border-green-200 rounded-xl px-4">
              <Search size={18} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search equipment or location"
                className="w-full py-3 outline-none"
              />
            </label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className={fieldClass}
            >
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
              className={fieldClass}
            >
              <option>Newest</option>
              <option>Low to High</option>
              <option>High to Low</option>
            </select>
          </div>

          {loading ? (
            <p className="mt-8 text-green-700 font-semibold">
              Loading rental equipment...
            </p>
          ) : equipment.length === 0 ? (
            <p className="mt-8 bg-green-50 rounded-2xl p-8 text-center text-gray-600">
              No rental equipment available yet.
            </p>
          ) : filtered.length === 0 ? (
            <p className="mt-8 bg-green-50 rounded-2xl p-8 text-center text-gray-600">
              No matching equipment found.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-7">
              {filtered.map((item) => {
                const id = getId(
                  item._id || item.id
                );

                const own = ownEquipment(item);
                const inCart = cartIds.has(id);

                return (
                  <article
                    key={id}
                    className="bg-green-50 border border-green-200 rounded-3xl overflow-hidden hover:shadow-lg transition"
                  >
                    <div
                      role="link"
                      tabIndex={0}
                      onClick={() =>
                        openEquipment(id)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();
                          openEquipment(id);
                        }
                      }}
                      className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      <EquipmentImage item={item} />

                      <div className="p-5">
                        <h3 className="font-bold text-xl text-green-800">
                          {nameOf(item)}
                        </h3>

                        <p className="font-bold text-green-700 mt-2">
                          {money(priceOf(item))}{" "}
                          {item.rentType || "Per Day"}
                        </p>

                        <p className="mt-3 flex gap-2 items-center text-gray-600">
                          <MapPin size={17} />
                          {item.location ||
                            item.address ||
                            item.district ||
                            "Not specified"}
                        </p>

                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <button
                        type="button"
                        disabled={
                          own ||
                          cartLoading ||
                          Boolean(busy)
                        }
                        onClick={() =>
                          inCart
                            ? setShowCart(true)
                            : addToCart(item)
                        }
                        className="w-full bg-green-700 text-white rounded-xl px-5 py-3 font-bold disabled:opacity-50"
                      >
                        {own
                          ? "Your Equipment"
                          : busy === id
                            ? "Adding..."
                            : inCart
                              ? "View in Cart"
                              : "Add to Cart"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
