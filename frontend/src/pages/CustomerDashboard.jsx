
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin, TrendingUp, Bell, ShoppingBag,
  Tractor, ArrowRight, LogOut, Map, CloudSun, Droplets, Thermometer,
  PackageCheck, Plus, MoreVertical, Eye, EyeOff,
  Pencil, Trash2, Leaf, Crown,
} from "lucide-react";

const getUser = () => { try { return JSON.parse(localStorage.getItem("agriverseCurrentUser") || "{}") || {}; } catch { return {}; } };
const getId = item => String(item?._id || item?.id || "");
const money = value => Number.isFinite(Number(value)) ? `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "Price unavailable";

function OwnerCard({ item, type, onDelete, onPublication, processing }) {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const id = getId(item);
  const equipment = type === "equipment";
  const title = equipment ? (item.equipmentName || item.name || item.title || "Equipment") : (item.productName || "Product");
  const destination = equipment ? `/rental-equipment/${id}` : `/product/${id}`;
  const edit = equipment ? `/edit-rental-equipment/${id}` : `/edit-product/${id}`;
  const image = item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : "");
  const published = item.isPublished !== false;
  return (
    <article className="relative shrink-0 w-[270px] sm:w-[310px] snap-start rounded-3xl border border-green-200 bg-green-50 overflow-hidden hover:shadow-lg transition cursor-pointer"
      role="link" tabIndex={0} onClick={() => navigate(destination)}
      onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); navigate(destination); } }}
      onMouseLeave={() => setMenu(false)}>
      <div className="h-44 bg-green-100 relative">
        {image ? <img src={image} alt={title} className="w-full h-full object-cover" /> : <div className="h-full flex justify-center items-center text-green-700">{equipment ? <Tractor size={46} /> : <ShoppingBag size={46} />}</div>}
        {!equipment && <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-bold ${published ? "bg-green-700 text-white" : "bg-amber-100 text-amber-900"}`}>{published ? "Published" : "Unpublished"}</span>}
        <button type="button" aria-label={`${title} options`} aria-expanded={menu} disabled={!!processing}
          className="absolute top-3 right-3 bg-white text-green-800 rounded-full p-2 shadow disabled:opacity-50"
          onClick={e => { e.stopPropagation(); setMenu(x => !x); }}><MoreVertical size={19} /></button>
      </div>
      {menu && <div className="absolute z-20 right-3 top-14 min-w-44 bg-white border border-green-200 shadow-xl rounded-xl p-2" onClick={e => e.stopPropagation()}>
        <button className="w-full text-left p-3 hover:bg-green-50 rounded-lg flex gap-2 items-center" onClick={() => navigate(destination)}><Eye size={17} /> View / Requests</button>
        <button className="w-full text-left p-3 hover:bg-green-50 rounded-lg flex gap-2 items-center" onClick={() => navigate(edit)}><Pencil size={17} /> Edit</button>
        {!equipment && <button className="w-full text-left p-3 hover:bg-green-50 rounded-lg flex gap-2 items-center" onClick={() => { setMenu(false); onPublication(item); }}>{published ? <EyeOff size={17} /> : <Eye size={17} />}{published ? "Unpublish" : "Publish"}</button>}
        <button className="w-full text-left p-3 hover:bg-red-50 text-red-700 rounded-lg flex gap-2 items-center" onClick={() => { setMenu(false); onDelete(item); }}><Trash2 size={17} /> Delete</button>
      </div>}
      <div className="p-5">
        <h3 className="text-xl font-extrabold text-green-800 truncate">{title}</h3>
        <p className="mt-3 text-green-700 font-bold">{money(equipment ? (item.pricePerDay ?? item.rentPerDay ?? item.dailyRate ?? item.price) : item.price)} {equipment ? "/ day" : `/ ${item.unit || "kg"}`}</p>
        <p className="mt-3 text-gray-600 text-sm">{equipment ? `Type: ${item.category || item.type || "Equipment"}` : `Quantity: ${item.quantity || "Not specified"}`}</p>
        <p className="mt-2 text-gray-600 text-sm flex items-center gap-2"><MapPin size={15} />{item.location || item.district || "Location not specified"}</p>
    
      </div>
    </article>
  );
}

function LandOwnerCard({ item, onDelete, processing }) {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const id = getId(item);
  const title = item.title || "Farm Land";
  const firstImage = Array.isArray(item.images) ? item.images[0] : item.image;
  const image = typeof firstImage === "string" ? firstImage : firstImage?.url || firstImage?.secure_url || "";
  return <article className="relative shrink-0 w-[270px] sm:w-[310px] snap-start rounded-3xl border border-green-200 bg-green-50 overflow-hidden">
    <button type="button" onClick={() => navigate(`/marketplace-land/${id}`)} className="w-full text-left">
      <div className="h-44 bg-green-100">{image ? <img src={image} alt={title} className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center"><Map size={44} className="text-green-700" /></div>}</div>
      <div className="p-5"><h3 className="text-xl font-bold text-green-800 truncate">{title}</h3><p className="mt-2 font-bold text-green-700">{item.price ? (String(item.price).startsWith("₹") ? item.price : `₹${item.price}`) : "Price on request"}</p><p className="mt-2 text-gray-600 text-sm">{item.location || "Location not specified"}</p></div>
    </button>
    <button type="button" aria-label={`${title} options`} onClick={() => setMenu(x => !x)} className="absolute top-3 right-3 bg-white rounded-full p-2 shadow"><MoreVertical size={19} /></button>
    {menu && <div className="absolute z-20 top-14 right-3 bg-white rounded-xl border border-green-200 shadow-xl p-2 min-w-40">
      <button onClick={() => navigate(`/marketplace-land/${id}`)} className="block w-full p-2 text-left">View</button>
      <button onClick={() => navigate(`/sell-land?landId=${encodeURIComponent(id)}`)} className="block w-full p-2 text-left">Edit</button>
      <button onClick={() => navigate(`/land-requests?landId=${encodeURIComponent(id)}`)} className="block w-full p-2 text-left">View Requests</button>
      <button disabled={!!processing} onClick={() => onDelete(item)} className="block w-full p-2 text-left text-red-700">Delete</button>
    </div>}
  </article>;
}

function CustomerDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const token = sessionStorage.getItem("agriverseToken");
  const [products, setProducts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [marketLands, setMarketLands] = useState([]);
  const [landLoading, setLandLoading] = useState(true);
  const [landError, setLandError] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");
  const [productLoading, setProductLoading] = useState(true);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [productError, setProductError] = useState("");
  const [equipmentError, setEquipmentError] = useState("");
  const [notice, setNotice] = useState("");
  const [processing, setProcessing] = useState("");
  const [locationEnabled, setLocationEnabled] = useState(Boolean(localStorage.getItem("agriverseCustomerLocation")));

  const loadOwned = useCallback(async (url, setItems, setError, setLoading, signal) => {
    setLoading(true);
    setError("");
    try {
      if (!token) throw new Error("Please log in again.");
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal });
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.lands || data.equipment || data.equipments || data.items || data.products || data.listings || data.data);
      if (!response.ok || data.success === false || !Array.isArray(items)) throw new Error(data.message || data.error || `Unable to load your listings (HTTP ${response.status}).`);
      if (!signal.aborted) setItems(items);
    } catch (error) { if (error.name !== "AbortError" && !signal.aborted) setError(error.message); }
    finally { if (!signal.aborted) setLoading(false); }
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    loadOwned("/api/product-listings/mine", setProducts, setProductError, setProductLoading, controller.signal);
    loadOwned("/api/rental-equipment/mine", setEquipment, setEquipmentError, setEquipmentLoading, controller.signal);
    loadOwned("/api/marketplace-lands/mine", setMarketLands, setLandError, setLandLoading, controller.signal);
    return () => controller.abort();
  }, [loadOwned]);

  const fetchSubscription = useCallback(async () => {
    try {
      if (!token) return;
      const response = await fetch('/api/marketplace-lands/access/me', {headers:{Authorization:`Bearer ${token}`}});
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.message || 'Could not load subscription');
      setSubscription(data);
    } catch(err) {setSubscriptionError(err.message);}
  },[token]);
  useEffect(()=>{fetchSubscription();},[fetchSubscription]);
  async function demoSubscribe() {
    if(subscriptionBusy || subscription?.subscriptionActive)return;
    if(!window.confirm('Activate demo subscription for ₹500? No real payment will be charged. Access lasts 30 days.'))return;
    setSubscriptionBusy(true);setSubscriptionError('');
    try {
      const response=await fetch('/api/marketplace-lands/access/demo-subscribe',{method:'POST',headers:{Authorization:`Bearer ${token}`}});
      const data=await response.json();
      if(!response.ok||data.success===false)throw new Error(data.message||'Demo payment failed');
      await fetchSubscription();
      setNotice('Demo subscription activated for 30 days.');
    }catch(err){setSubscriptionError(err.message);}finally{setSubscriptionBusy(false);}
  }

  async function mutate(url, method, body, after, successText, errorSetter) {
    setProcessing(url); setNotice(""); errorSetter("");
    try {
      const response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || "Unable to complete the action.");
      after(); setNotice(successText);
    } catch (error) { errorSetter(error.message); }
    finally { setProcessing(""); }
  }

  function publication(product) {
    const isPublished = product.isPublished === false;
    if (!window.confirm(isPublished ? "Publish this product?" : "Unpublish this product? Existing orders remain available.")) return;
    mutate(`/api/product-listings/${getId(product)}/publication`, "PATCH", { isPublished }, () => setProducts(list => list.map(x => getId(x) === getId(product) ? { ...x, isPublished } : x)), `Product ${isPublished ? "published" : "unpublished"}.`, setProductError);
  }

  function removeProduct(product) {
    if (!window.confirm("Delete this product? Products with existing enquiries or orders cannot be deleted.")) return;
    mutate(`/api/product-listings/${getId(product)}`, "DELETE", null, () => setProducts(list => list.filter(x => getId(x) !== getId(product))), "Product deleted.", setProductError);
  }

  function removeEquipment(item) {
    if (!window.confirm("Delete this equipment listing? Existing rental orders may prevent deletion.")) return;
    mutate(`/api/rental-equipment/${getId(item)}`, "DELETE", null, () => setEquipment(list => list.filter(x => getId(x) !== getId(item))), "Equipment deleted.", setEquipmentError);
  }

  function enableLocation() {
    if (!navigator.geolocation) return alert("Geolocation is unavailable.");
    navigator.geolocation.getCurrentPosition(position => {
      localStorage.setItem("agriverseCustomerLocation", JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, updatedAt: new Date().toISOString() }));
      setLocationEnabled(true);
    }, () => alert("Location permission was not granted."));
  }

  async function removeMarketplaceLand(item) {
    if (!window.confirm("Delete this marketplace land listing?")) return;
    await mutate(`/api/marketplace-lands/${getId(item)}`, "DELETE", null,
      () => setMarketLands(list => list.filter(land => getId(land) !== getId(item))),
      "Land listing deleted.", setLandError);
  }

  useEffect(() => {
    if (!locationEnabled) return;
    let stored;
    try { stored = JSON.parse(localStorage.getItem("agriverseCustomerLocation") || "null"); } catch { return; }
    const latitude = Number(stored?.latitude);
    const longitude = Number(stored?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    const controller = new AbortController();
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Weather unavailable"); return response.json(); })
      .then(data => setWeather(data.current || null))
      .catch(error => { if (error.name !== "AbortError") setWeatherError("Current weather unavailable"); });
    return () => controller.abort();
  }, [locationEnabled]);


  const currentUser = user;

  return (
    <div className="min-h-screen bg-green-50 p-8">

      <div className="max-w-7xl mx-auto">
<div className="flex items-start justify-between">
    <div>
      <h1 className="text-5xl font-extrabold text-green-700">
        Agri Marketplace
      </h1>
    </div>

    <div className="flex items-center gap-5">
      <Link
        to="/help-support"
        className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-4 rounded-2xl font-bold hover:bg-green-800 transition"
      >
        Help & Support
      </Link>

      <button
        onClick={() => {
          sessionStorage.removeItem("agriverseToken");
          localStorage.removeItem("agriverseCurrentUser");
          navigate("/auth", { replace: true });
        }}
        className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3"
      >
        <LogOut size={22} />
        Logout
      </button>
    </div>
  </div>
        

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-15">
          <div className="bg-white border border-red-200 rounded-3xl p-6">
            <MapPin size={30} className="text-green-700" />
            <h2 className="text-xl font-bold mt-4">My Location</h2>
            <p className="text-gray-600 mt-2">{locationEnabled ? "GPS location enabled" : "Location not enabled"}</p>
            {!locationEnabled && <button onClick={enableLocation} className="mt-4 bg-green-700 text-white px-4 py-2 rounded-xl font-bold">Enable GPS</button>}
          </div>
          <div className="bg-white border border-red-200 rounded-3xl p-6">
            <Thermometer size={30} className="text-green-700" />
            <h2 className="text-xl font-bold mt-4">Temperature</h2>
            <p className="text-3xl gray-600 mt-3">{weather?.temperature_2m == null ? "Unavailable" : `${weather.temperature_2m} °C`}</p>
          </div>
          <div className="bg-white border border-red-200 rounded-3xl p-6">
            <Droplets size={30} className="text-green-700" />
            <h2 className="text-xl font-bold mt-4">Humidity</h2>
            <p className="text-3xl gray-600 mt-3">{weather?.relative_humidity_2m == null ? "Unavailable" : `${weather.relative_humidity_2m}%`}</p>
            {weatherError && <p className="text-xs text-gray-500 mt-2">{weatherError}</p>}
          </div>
          <Link to="/market-price" className="bg-white border border-red-200 rounded-3xl p-6 hover:shadow-md">
            <TrendingUp size={30} className="text-green-700" />
            <h2 className="text-xl font-bold mt-4">Market Prices</h2>
            
          </Link>
          <Link to="/my-requests" className="bg-white border border-red-200 rounded-3xl p-6 hover:shadow-md min-h-[178px]">
            <Bell size={30} className="text-green-700" />
            <h2 className="text-xl font-bold mt-4">My Sent Requests</h2>
            
          </Link>
        </div>

        {notice && <p role="status" className="bg-green-100 text-green-800 rounded-xl p-4 mt-6">{notice}</p>}
        <section className="bg-white border border-green-500 rounded-3xl p-5 md:p-8 mt-10">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div><h2 className="text-2xl md:text-3xl font-extrabold text-green-800">Buy / Sell Products</h2></div>
            <Link to="/sell-products" className="bg-green-700 text-white rounded-xl px-6 py-3 font-bold">Open</Link>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/add-product" className="bg-green-100 text-green-800 rounded-xl px-5 py-3 font-bold flex items-center gap-2"><Plus size={18} /> Add Product</Link>
            <Link
  to="/my-product-orders"
  className="bg-orange-100 text-orange-800 rounded-xl px-5 py-3 font-bold"
>
  My Orders
</Link>
          </div>
          {productError && <p role="alert" className="mt-5 p-4 rounded-xl bg-red-50 text-red-700">{productError}</p>}
          {productLoading ? <p className="mt-7">Loading your products...</p> : products.length ? <div className="flex gap-5 overflow-x-auto pb-5 mt-7 snap-x snap-mandatory">{products.map(item => <OwnerCard key={getId(item)} item={item} type="product" onPublication={publication} onDelete={removeProduct} processing={processing} />)}</div> : <p className="mt-6 bg-green-50 rounded-2xl p-6 text-gray-600">You have not added any products yet.</p>}
        </section>

        <section className="bg-white border border-green-500 rounded-3xl p-5 md:p-8 mt-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div><h2 className="text-2xl md:text-3xl font-extrabold text-green-800">Equipment Rental</h2></div>
            <Link to="/equipment-rental" className="bg-green-700 text-white rounded-xl px-6 py-3 font-bold">Open</Link>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/add-rental-equipment" className="bg-green-100 text-green-800 rounded-xl px-5 py-3 font-bold flex items-center gap-2"><Plus size={18} /> Add Equipment</Link>
            <Link to="/rental-orders" className="bg-orange-100 text-orange-800 rounded-xl px-5 py-3 font-bold">Rental Orders</Link>
          </div>
          {equipmentError && <p role="alert" className="mt-5 p-4 rounded-xl bg-red-50 text-red-700">{equipmentError}</p>}
          {equipmentLoading ? <p className="mt-7">Loading your equipment...</p> : equipment.length ? <div className="flex gap-5 overflow-x-auto pb-5 mt-7 snap-x snap-mandatory">{equipment.map(item => <OwnerCard key={getId(item)} item={item} type="equipment" onDelete={removeEquipment} processing={processing} />)}</div> : <p className="mt-6 bg-green-50 rounded-2xl p-6 text-gray-600">You have not added any equipment yet.</p>}
        </section>

        <section className="bg-white border border-green-500 rounded-3xl p-5 md:p-8 mt-8">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div><h2 className="text-2xl md:text-3xl font-extrabold text-green-800">Land Marketplace</h2></div>
            <Link to="/land-marketplace" className="bg-green-700 text-white rounded-xl px-6 py-3 font-bold">Open</Link>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link to="/sell-land" className="bg-green-100 text-green-800 rounded-xl px-5 py-3 font-bold flex items-center gap-2"><Plus size={18} /> Add Land</Link>
            <Link to="/land-requests" className="bg-orange-100 text-orange-800 rounded-xl px-5 py-3 font-bold">Received Land Requests</Link>
          </div>
          {landError && <p role="alert" className="mt-5 p-4 rounded-xl bg-amber-50 text-amber-800">Land listings could not be retrieved: {landError} <button type="button" onClick={() => window.location.reload()} className="ml-2 underline font-bold">Retry</button></p>}
          {landLoading ? <p className="mt-7">Loading your lands...</p> : marketLands.length ? <div className="flex gap-5 overflow-x-auto pb-5 mt-7 snap-x snap-mandatory">{marketLands.map(item => <LandOwnerCard key={getId(item)} item={item} onDelete={removeMarketplaceLand} processing={processing} />)}</div> : <p className="mt-6 bg-green-50 rounded-2xl p-6 text-gray-600">You have not added any land listings yet.</p>}
          <div className="mt-15 rounded-2xl border border-red-300 bg-amber-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crown className="text-amber-600" size={30}/>
                <div><h3 className="text-3xl font-extrabold text-amber-900">Land Contact Subscription</h3>
                  
                  {subscription?.subscriptionActive && <p className="mt-4 font-bold text-green-800">Active until {new Date(subscription.expiresAt).toLocaleString('en-IN')}</p>}
                </div>
              </div>
              <button type="button" onClick={demoSubscribe} disabled={subscriptionBusy || subscription?.subscriptionActive}
                className={`rounded-xl px-6 py-3 font-bold flex items-center gap-2 ${subscription?.subscriptionActive ? 'bg-green-700 text-white cursor-default' : 'bg-amber-600 text-white hover:bg-amber-700'} disabled:opacity-80`}>
                <Crown size={19}/>{subscription?.subscriptionActive ? 'Subscription Active' : subscriptionBusy ? 'Activating...' : 'Activate ₹500 Demo Subscription'}
              </button>
            </div>
            {subscriptionError && <p role="alert" className="text-red-700 mt-3">{subscriptionError}</p>}
            <p className="mt-6 text-l text-amber-800">₹500 demo subscription unlocks seller contacts for all available lands for 30 days.</p>
            <p className="mt-1 text-l text-amber-800">Demo only: no money is charged.</p>
            
          </div>
        </section>

      </div>

    </div>
  )
}

export default CustomerDashboard
