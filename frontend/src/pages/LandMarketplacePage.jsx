import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Search, ShoppingCart, Trash2, X, Mountain } from "lucide-react";

const API = "/api/marketplace-lands";

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("agriverseCurrentUser") || "null") ||
      JSON.parse(localStorage.getItem("agriverseUser") || "null") || {};
  } catch {
    return {};
  }
}
function idOf(value) {
  if (!value) return "";
  return typeof value === "object" ? String(value._id || value.id || "") : String(value);
}
function landId(land) { return idOf(land._id || land.id); }
function imageOf(land) {
  const image = land.image || land.images?.[0];
  return typeof image === "string" ? image : image?.url || "";
}
function priceNumber(price) {
  const text = String(price ?? "").toLowerCase();
  const amount = Number(text.replace(/[^\d.]/g, "")) || 0;
  if (text.includes("crore")) return amount * 10000000;
  if (text.includes("lakh")) return amount * 100000;
  return amount;
}
function areaNumber(area) { return Number(String(area || "").replace(/[^\d.]/g, "")) || 0; }
function readSavedCart(key) {
  try {
    const entries = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}
function LandImage({ land, height = "h-56" }) {
  const image = imageOf(land);
  return image ? (
    <img src={image} alt={land.title || "Farmland"} loading="lazy" className={`w-full ${height} object-cover`} />
  ) : (
    <div className={`w-full ${height} bg-green-100 flex justify-center items-center`}>
      <Mountain size={48} className="text-green-700" />
    </div>
  );
}

export default function LandMarketplacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = currentUser();
  const username = String(user.username || user.name || user.sellerName || "").trim();
  const userId = idOf(user._id || user.id);
  const dashboard = user.role === "buyer" ? "/customer-dashboard" : "/farmer-dashboard";
  const cartKey = `agriverseLandCart_${username || userId || "guest"}`;
  const pagePath = location.pathname + location.search;

  const [lands, setLands] = useState([]);
  const [cart, setCart] = useState(() => readSavedCart(cartKey));
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [soilFilter, setSoilFilter] = useState("All");
  const [waterFilter, setWaterFilter] = useState("All");
  const [priceSort, setPriceSort] = useState("Newest");
  const [sizeSort, setSizeSort] = useState("Default");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => { setCart(readSavedCart(cartKey)); }, [cartKey]);
  useEffect(() => {
    const controller = new AbortController();
    async function loadLands() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(API, { signal: controller.signal });
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); }
        catch { throw new Error("The land marketplace returned an invalid response."); }
        if (!response.ok || data?.success === false) {
          throw new Error(data?.message || "Unable to load the land marketplace.");
        }
        const listings = Array.isArray(data)
          ? data
          : data.lands || data.listings || data.data;
        if (!Array.isArray(listings)) throw new Error("Unexpected land listing response.");
        if (!controller.signal.aborted) setLands(listings.filter((land) => land.isPublished !== false));
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadLands();
    return () => controller.abort();
  }, []);

  function isOwner(land) {
    const ownerId = idOf(land.owner || land.seller || land.createdBy);
    if (userId && ownerId) return ownerId === userId;
    const listedUsername = String(land.sellerUsername || land.ownerUsername || land.username || "").trim().toLowerCase();
    return Boolean(username && listedUsername && listedUsername === username.toLowerCase());
  }

  function saveCart(next) {
    try {
      localStorage.setItem(cartKey, JSON.stringify(next));
      setCart(next);
      return true;
    } catch {
      setError("Unable to save the land cart.");
      return false;
    }
  }
  function addToCart(land) {
    setError("");
    setNotice("");
    if (isOwner(land)) return setError("You cannot add your own land to the cart.");
    if (cart.some((item) => landId(item) === landId(land))) {
      setShowCart(true);
      return;
    }
    if (saveCart([...cart, land])) setNotice("Land added to cart.");
  }
  function removeFromCart(id) {
    if (saveCart(cart.filter((item) => landId(item) !== id))) setNotice("Land removed from cart.");
  }
  function clearCart() {
    if (!cart.length || !window.confirm("Clear your saved lands?")) return;
    if (saveCart([])) setNotice("Cart cleared.");
  }
  function openLand(land) {
    navigate(`/marketplace-land/${encodeURIComponent(landId(land))}`, {
      state: { from: pagePath },
    });
  }
  function goBack() {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(dashboard, { replace: true });
  }

  const currentLands = useMemo(
    () => new Map(lands.map((land) => [landId(land), land])), [lands]
  );
  const filteredLands = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const locationText = locationFilter.trim().toLowerCase();
    const result = lands.filter((land) => {
      const haystack = [land.title, land.location, land.city, land.state, land.district, land.description]
        .join(" ").toLowerCase();
      const places = [land.location, land.city, land.state, land.district].join(" ").toLowerCase();
      return (!keyword || haystack.includes(keyword)) &&
        (!locationText || places.includes(locationText)) &&
        (soilFilter === "All" || land.soil === soilFilter) &&
        (waterFilter === "All" || land.water === waterFilter);
    });
    return result.sort((a, b) => {
      if (sizeSort === "Small to Large") return areaNumber(a.area) - areaNumber(b.area);
      if (sizeSort === "Large to Small") return areaNumber(b.area) - areaNumber(a.area);
      if (priceSort === "Low to High") return priceNumber(a.price) - priceNumber(b.price);
      if (priceSort === "High to Low") return priceNumber(b.price) - priceNumber(a.price);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [lands, search, locationFilter, soilFilter, waterFilter, priceSort, sizeSort]);

  const filterClass = "w-full border border-green-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500";

  return (
    <main className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-green-700 font-bold">
          <ArrowLeft size={18} /> Back
        </button>
        <section className="bg-white border border-green-200 rounded-3xl p-5 md:p-9 shadow-sm mt-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-green-800">Farm Land Marketplace</h1>
              
            </div>
            <button type="button" onClick={() => setShowCart((value) => !value)}
              className="flex items-center gap-2 bg-green-700 text-white px-5 py-3 rounded-xl font-bold">
              <ShoppingCart size={19} /> Cart ({cart.length})
            </button>
          </div>

          {error && <p role="alert" className="mt-5 bg-red-50 rounded-xl p-4 text-red-700">{error}</p>}
          {notice && <p role="status" className="mt-5 bg-green-100 rounded-xl p-4 text-green-800">{notice}</p>}

          {showCart && (
            <section className="bg-green-50 border border-green-200 rounded-2xl p-5 mt-7">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-green-800">Saved Lands</h2>
                <button type="button" aria-label="Close cart" onClick={() => setShowCart(false)}><X size={22} /></button>
              </div>
              {cart.length === 0 ? (
                <p className="mt-5 text-gray-600">No saved lands.</p>
              ) : (
                <>
                  <div className="flex gap-4 overflow-x-auto pb-4 mt-6">
                    {cart.map((saved) => {
                      const id = landId(saved);
                      const land = currentLands.get(id) || saved;
                      const available = currentLands.has(id);
                      return (
                        <article key={id} className="w-64 shrink-0 bg-white border border-green-200 rounded-xl overflow-hidden">
                          {available ? (
                            <button type="button" onClick={() => openLand(land)} className="block w-full text-left">
                              <LandImage land={land} height="h-36" />
                              <div className="p-4">
                                <h3 className="font-bold text-green-800">{land.title || "Agricultural Land"}</h3>
                                <p className="mt-2">{land.price || "Contact seller"}</p>
                                <p className="mt-2 text-gray-600">{land.location || land.city || "Location not specified"}</p>
                              </div>
                            </button>
                          ) : (
                            <div className="p-4"><h3 className="font-bold">{land.title || "Land"}</h3><p className="text-red-700 mt-2">Listing unavailable</p></div>
                          )}
                          <button type="button" onClick={() => removeFromCart(id)} className="m-4 text-red-700 font-bold flex gap-2 items-center">
                            <Trash2 size={16} /> Remove
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  <button type="button" onClick={clearCart} className="font-bold text-red-700">Clear Cart</button>
                </>
              )}
            </section>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mt-8">
            <label className="flex gap-2 items-center border border-green-200 rounded-xl px-4">
              <Search size={18} className="text-green-700 shrink-0" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lands" className="w-full py-3 outline-none" />
            </label>
            <input value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="Location" aria-label="Filter by location" className={filterClass} />
            <select value={soilFilter} onChange={(e) => setSoilFilter(e.target.value)} aria-label="Soil filter" className={filterClass}>
              <option value="All">All Soil Types</option>
              {["Black Soil", "Red Soil", "Clay Soil", "Sandy Soil", "Loamy Soil"].map((soil) => <option key={soil} value={soil}>{soil}</option>)}
            </select>
            <select value={waterFilter} onChange={(e) => setWaterFilter(e.target.value)} aria-label="Water availability" className={filterClass}>
              <option value="All">All Water Levels</option>
              {["Excellent", "Moderate", "Low"].map((water) => <option key={water} value={water}>{water}</option>)}
            </select>
            <select value={priceSort} onChange={(e) => setPriceSort(e.target.value)} aria-label="Sort by price" className={filterClass}>
              <option value="Newest">Newest</option>
              <option value="Low to High">Price: Low to High</option>
              <option value="High to Low">Price: High to Low</option>
            </select>
            <select value={sizeSort} onChange={(e) => setSizeSort(e.target.value)} aria-label="Sort by area" className={filterClass}>
              <option value="Default">Default Land Size</option>
              <option value="Small to Large">Small to Large</option>
              <option value="Large to Small">Large to Small</option>
            </select>
          </div>

          {loading ? <p className="mt-8 text-green-700 font-semibold">Loading lands...</p>
            : lands.length === 0 ? <p className="mt-8 p-8 rounded-xl bg-green-50 text-center text-gray-600">No lands available yet.</p>
            : filteredLands.length === 0 ? <p className="mt-8 p-8 rounded-xl bg-green-50 text-center text-gray-600">No matching lands found.</p>
            : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {filteredLands.map((land) => {
                  const id = landId(land);
                  const own = isOwner(land);
                  const inCart = cart.some((saved) => landId(saved) === id);
                  return (
                    <article key={id} className="bg-green-50 border border-green-200 rounded-2xl overflow-hidden hover:shadow-lg transition">
                      <button type="button" onClick={() => openLand(land)} className="block w-full text-left focus:outline-none focus:ring-2 focus:ring-green-600" aria-label={`Open ${land.title || "land listing"}`}>
                        <LandImage land={land} />
                        <div className="p-5">
                          <h3 className="text-xl font-bold text-green-800">{land.title || "Agricultural Land"}</h3>
                          <p className="text-green-700 font-bold mt-2">{land.price || "Contact seller"}</p>
                          <p className="mt-3 text-gray-700 flex items-center gap-2"><MapPin size={17} /> {land.location || land.city || "Location not specified"}</p>
                          <p className="mt-2 text-gray-600"><b>Area:</b> {land.area || "Not specified"}</p>
                          <p className="mt-2 text-gray-600"><b>Soil:</b> {land.soil || "Not specified"}</p>
                          <p className="mt-2 text-gray-600"><b>Water:</b> {land.water || "Not specified"}</p>
                        </div>
                      </button>
                      <div className="px-5 pb-5">
                        <button type="button" disabled={own} onClick={() => inCart ? setShowCart(true) : addToCart(land)}
                          className="w-full bg-green-700 text-white rounded-xl px-5 py-3 font-bold disabled:opacity-50 flex gap-2 items-center justify-center">
                          <ShoppingCart size={18} /> {own ? "Your Land" : inCart ? "View in Cart" : "Add to Cart"}
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
