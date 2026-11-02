import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBasket, Tractor, Map, MapPin, Trash2 } from "lucide-react";

const categories = [
  { id: "product", title: "Products", icon: ShoppingBasket },
  { id: "equipment", title: "Rental Equipment", icon: Tractor },
  { id: "land", title: "Lands", icon: Map },
];
const currentUser = () => { try { return JSON.parse(localStorage.getItem("agriverseCurrentUser") || "{}") || {}; } catch { return {}; } };
const dateText = (v) => v && !isNaN(new Date(v).getTime()) ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not available";

export default function MyRequestsPage() {
  const user = currentUser();
  const token = sessionStorage.getItem("agriverseToken");
  const dashboardPath = user.role === "farmer" ? "/farmer-dashboard" : "/customer-dashboard";
  const [activeCategory, setActiveCategory] = useState("product");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRequests = useCallback(async (signal) => {
    setLoading(true); setError("");
    if (!token) { setError("Please log in again."); setLoading(false); return; }
    const list = [], problems = [];
    const headers = { Authorization: `Bearer ${token}` };
    async function get(path, key) {
      const response = await fetch(path, { headers, signal });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Invalid server response (${response.status}).`); }
      if (!response.ok || data.success === false || !Array.isArray(data[key])) throw new Error(data.message || `Request failed (${response.status}).`);
      return data[key];
    }
    try {
      const rows = await get("/api/product-listings/buyer/requests", "requests");
      for (const item of rows) {
        const r = item.request || item;
        const id = item.productId || item.product?._id || item.listingId;
        if (!id || r.id == null) continue;
        list.push({ type: "product", sourceId: String(id), requestId: String(r.id), title: item.productName || item.name || "Product", message: r.buyerMessage || "Product enquiry sent.", quantity: r.buyerQuantity || "", createdAt: r.createdAt || r.requestedAt, status: item.status || "Pending", detailsPath: `/product/${id}?view=marketplace`, image: item.image || "", location: item.district || "", canWithdraw: (item.status || "Pending") === "Pending" && !r.read });
      }
    } catch (e) { if (e.name === "AbortError") return; problems.push(`Products: ${e.message}`); }
    try {
      const rows = await get("/api/marketplace-lands/buyer/requests", "requests");
      for (const item of rows) {
        const r = item.request || item;
        const id = item.landId || item.listingId || item.marketplaceLandId || item.land?._id || item._id;
        if (!id || r.id == null) continue;
        list.push({ type: "land", sourceId: String(id), requestId: String(r.id), title: item.landTitle || item.landName || item.title || "Land Listing", message: r.buyerMessage || "Land enquiry sent.", createdAt: r.createdAt || r.requestedAt, status: item.status || "Pending", detailsPath: `/marketplace-land/${id}`, image: item.image || "", location: item.location || "", canWithdraw: !r.read });
      }
    } catch (e) { if (e.name === "AbortError") return; problems.push(`Lands: ${e.message}`); }
    try {
      const rows = await get("/api/rental-orders/mine", "orders");
      for (const r of rows) {
        const equipmentId = r.equipment?._id || r.equipment;
        if (!equipmentId) continue;
        list.push({ type: "equipment", sourceId: String(equipmentId), requestId: String(r._id), title: r.equipmentName || "Rental Equipment", message: r.renterMessage || "Rental request submitted.", createdAt: r.createdAt, status: r.status || "Requested", detailsPath: `/rental-equipment/${equipmentId}`, image: "", location: "", canWithdraw: r.status === "Requested", startDate: r.startDate, endDate: r.endDate });
      }
    } catch (e) { if (e.name === "AbortError") return; problems.push(`Rental Equipment: ${e.message}`); }
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (!signal?.aborted) { setRequests(list); setError(problems.join(" | ")); setLoading(false); }
  }, [token]);

  useEffect(() => { const controller = new AbortController(); loadRequests(controller.signal); return () => controller.abort(); }, [loadRequests]);
  const counts = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, requests.filter((r) => r.type === c.id).length])), [requests]);
  const visible = requests.filter((r) => r.type === activeCategory);
  const selected = categories.find((c) => c.id === activeCategory);

  async function withdraw(item) {
    if (!item.canWithdraw || busy) return;
    if (!window.confirm(item.type === "equipment" ? "Cancel this rental request?" : "Withdraw this request?")) return;
    const key = `${item.type}-${item.sourceId}-${item.requestId}`;
    setBusy(key); setError(""); setNotice("");
    try {
      let response;
      if (item.type === "equipment") {
        response = await fetch(`/api/rental-orders/${encodeURIComponent(item.requestId)}/status`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ status: "Cancelled" }) });
      } else {
        const base = item.type === "product" ? "/api/product-listings" : "/api/marketplace-lands";
        response = await fetch(`${base}/${encodeURIComponent(item.sourceId)}/requests/${encodeURIComponent(item.requestId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      }
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.message || "Could not update request.");
      await loadRequests();
      setNotice(item.type === "equipment" ? "Rental request cancelled." : "Request withdrawn successfully.");
    } catch (e) { setError(e.message); }
    finally { setBusy(""); }
  }

  return <main className="min-h-screen bg-green-50 p-4 md:p-8"><div className="max-w-6xl mx-auto">
    <Link to={dashboardPath} className="inline-flex items-center gap-2 text-green-700 font-bold"><ArrowLeft size={18} />Back to Dashboard</Link>
    <section className="bg-white rounded-3xl p-6 md:p-10 mt-6 border border-green-100 shadow-xl">
      <h1 className="text-3xl md:text-4xl font-extrabold text-green-800">My Requests</h1><p className="text-gray-600 mt-3">View and manage your submitted requests.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">{categories.map((cat) => { const Icon = cat.icon; return <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center justify-between gap-3 rounded-2xl p-5 border-2 font-bold ${activeCategory === cat.id ? "bg-green-700 text-white border-green-700" : "bg-green-50 text-green-800 border-green-200 hover:border-green-500"}`}><span className="flex items-center gap-3"><Icon size={23}/>{cat.title}</span><span className={`rounded-full px-3 py-1 text-sm ${activeCategory === cat.id ? "bg-white text-green-800" : "bg-green-200 text-green-800"}`}>{counts[cat.id]}</span></button>; })}</div>
      {error && <p role="alert" className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-6 bg-green-100 rounded-xl p-4 text-green-800">{notice}</p>}
      <h2 className="text-2xl font-bold text-green-800 mt-8 mb-5">{selected.title} Requests</h2>
      {loading ? <p className="text-green-700">Loading your requests...</p> : visible.length === 0 ? <div className="bg-green-50 p-10 text-center rounded-2xl text-gray-700">No {selected.title.toLowerCase()} requests found.</div> :
        <div className="space-y-5">{visible.map((item) => { const key = `${item.type}-${item.sourceId}-${item.requestId}`; const Icon = selected.icon; return <article key={key} className="bg-green-50 rounded-2xl border border-green-200 p-5"><div className="flex flex-col sm:flex-row gap-5">
          <div className="w-full sm:w-44 h-40 flex-shrink-0">{item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover rounded-xl"/> : <div className="w-full h-full bg-green-100 rounded-xl flex items-center justify-center"><Icon size={42} className="text-green-700" /></div>}</div>
          <div className="flex-1 min-w-0"><p className="text-sm text-gray-500">{dateText(item.createdAt)}</p><h3 className="text-2xl font-bold text-green-800 mt-3">{item.title}</h3><p className="mt-2 font-semibold text-green-800">Status: {item.status}</p>
            {item.location && <p className="flex items-center gap-2 text-gray-600 mt-2"><MapPin size={17}/>{item.location}</p>}
            {item.quantity && <p className="mt-3 text-gray-700"><b>Quantity:</b> {item.quantity}</p>}
            {item.type === "equipment" && <p className="mt-3 text-gray-700"><b>Rental dates:</b> {dateText(item.startDate)} — {dateText(item.endDate)}</p>}
            <p className="mt-3 text-gray-700 whitespace-pre-wrap">{item.message}</p>
            <div className="flex flex-wrap gap-3 mt-5"><Link to={item.detailsPath} className="bg-green-700 text-white px-5 py-3 rounded-xl font-bold">View Details</Link>{item.canWithdraw && <button disabled={!!busy} onClick={() => withdraw(item)} className="bg-red-50 text-red-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"><Trash2 size={17}/>{busy === key ? "Updating..." : item.type === "equipment" ? "Cancel Request" : "Withdraw Request"}</button>}</div>
          </div></div></article>; })}</div>}
    </section>
  </div></main>;
}
