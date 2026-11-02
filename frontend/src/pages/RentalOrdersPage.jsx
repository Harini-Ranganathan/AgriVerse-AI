import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, ClipboardList, CheckCircle2, XCircle, Clock, Tractor, AlertCircle, PackageCheck } from "lucide-react";

const API = "/api/rental-orders";
const getUser = () => { try { return JSON.parse(localStorage.getItem("agriverseCurrentUser") || "{}") || {}; } catch { return {}; } };
const idOf = (v) => typeof v === "object" && v !== null ? String(v._id || v.id || "") : String(v || "");
const dateText = (v) => v && !isNaN(new Date(v).getTime()) ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not specified";
const money = (v) => Number.isFinite(Number(v)) && v !== null && v !== "" ? `₹${Number(v).toLocaleString("en-IN")}` : "Not specified";
const colors = (s) => ({ Requested: "bg-yellow-100 text-yellow-800", Confirmed: "bg-green-100 text-green-800", Active: "bg-blue-100 text-blue-800", Completed: "bg-emerald-100 text-emerald-800", Rejected: "bg-red-100 text-red-700", Cancelled: "bg-gray-100 text-gray-700" }[s] || "bg-yellow-100 text-yellow-800");
async function readResponse(response) {
  const body = await response.text();
  let data;
  try { data = body ? JSON.parse(body) : {}; } catch { throw new Error(`Unexpected server response (${response.status}).`); }
  if (!response.ok || data.success === false) throw new Error(data.message || `Request failed (${response.status}).`);
  return data;
}

export default function RentalOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const token = sessionStorage.getItem("agriverseToken");
  const dashboard = user.role === "farmer" ? "/farmer-dashboard" : "/customer-dashboard";
  const selectedEquipmentId = idOf(location.state?.equipmentId);
  const [tab, setTab] = useState(selectedEquipmentId ? "received" : "mine");
  const [myOrders, setMyOrders] = useState([]);
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showAllEquipment, setShowAllEquipment] = useState(false);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadOrders = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    if (!token) { setError("Please log in again."); setLoading(false); return; }
    try {
      const [mineResponse, receivedResponse] = await Promise.all([
        fetch(`${API}/mine`, { headers, signal }),
        fetch(`${API}/received`, { headers, signal }),
      ]);
      const [mine, received] = await Promise.all([readResponse(mineResponse), readResponse(receivedResponse)]);
      if (!Array.isArray(mine.orders) || !Array.isArray(received.orders)) throw new Error("Invalid rental orders data.");
      if (!signal?.aborted) { setMyOrders(mine.orders); setReceivedOrders(received.orders); }
    } catch (err) {
      if (err.name !== "AbortError" && !signal?.aborted) setError(err.message || "Unable to load rental orders.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [headers, token]);

  useEffect(() => { const controller = new AbortController(); loadOrders(controller.signal); return () => controller.abort(); }, [loadOrders]);

  const filteredReceived = receivedOrders.filter((order) => !selectedEquipmentId || showAllEquipment || idOf(order.equipment) === selectedEquipmentId);
  const displayed = tab === "mine" ? myOrders : filteredReceived;

  async function updateStatus(order, status) {
    const id = idOf(order._id || order.id);
    if (!id || busyId) return;
    if (["Rejected", "Cancelled"].includes(status) && !window.confirm(`Are you sure you want to mark this rental as ${status.toLowerCase()}?`)) return;
    setBusyId(id); setError(""); setNotice("");
    try {
      const response = await fetch(`${API}/${encodeURIComponent(id)}/status`, {
        method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      });
      const data = await readResponse(response);
      const updated = data.order || { status };
      setMyOrders((old) => old.map((item) => idOf(item._id) === id ? { ...item, ...updated } : item));
      setReceivedOrders((old) => old.map((item) => idOf(item._id) === id ? { ...item, ...updated } : item));
      setNotice(data.message || `Rental marked ${status}.`);
    } catch (err) { setError(err.message); }
    finally { setBusyId(""); }
  }

  function goBack() {
    const to = location.state?.returnTo || location.state?.from;
    if (typeof to === "string" && to.startsWith("/") && !to.startsWith("//") && to !== location.pathname + location.search) navigate(to);
    else if (location.key !== "default") navigate(-1);
    else navigate(dashboard);
  }

  return (
    <main className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={goBack} className="flex items-center gap-2 font-bold text-green-700"><ArrowLeft size={18} /> Back</button>
        <section className="bg-white rounded-3xl border border-green-200 shadow-sm p-6 md:p-9 mt-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-100 rounded-2xl"><Tractor size={33} className="text-green-700" /></div>
            <div><h1 className="text-3xl md:text-4xl font-extrabold text-green-800">Rental Orders</h1><p className="text-gray-600 mt-2">Track equipment you rent and manage incoming rental requests.</p></div>
          </div>
          <div className="flex flex-wrap gap-3 mt-8">
            <button onClick={() => setTab("mine")} className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${tab === "mine" ? "bg-green-700 text-white" : "bg-green-100 text-green-800"}`}><ClipboardList size={18} /> My Rentals ({myOrders.length})</button>
            <button onClick={() => setTab("received")} className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 ${tab === "received" ? "bg-green-700 text-white" : "bg-green-100 text-green-800"}`}><PackageCheck size={18} /> Requests Received ({receivedOrders.length})</button>
          </div>
          {selectedEquipmentId && tab === "received" && <div className="mt-5 bg-green-50 border border-green-200 p-4 rounded-xl flex flex-wrap justify-between gap-3"><p className="text-green-800 font-semibold">{showAllEquipment ? "Showing requests for all your equipment." : "Showing requests for the selected equipment."}</p><button onClick={() => setShowAllEquipment(!showAllEquipment)} className="text-green-700 font-bold">{showAllEquipment ? "Selected Equipment Only" : "Show All Equipment"}</button></div>}
          {error && <p role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mt-6 flex gap-2"><AlertCircle size={18} /> {error}</p>}
          {notice && <p role="status" className="bg-green-100 rounded-xl p-4 text-green-800 mt-6">{notice}</p>}
          {loading ? <p className="mt-8 text-green-700 font-semibold">Loading rental orders...</p> : displayed.length === 0 ? (
            <div className="mt-8 bg-green-50 rounded-2xl p-9 text-center"><Clock size={36} className="mx-auto text-green-700" /><h2 className="text-xl font-bold text-green-800 mt-4">{tab === "mine" ? "No rentals requested yet" : "No rental requests received"}</h2><p className="text-gray-600 mt-2">{tab === "mine" ? "Equipment you request will appear here." : "Rental requests for your equipment will appear here."}</p></div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
              {displayed.map((order) => {
                const id = idOf(order._id || order.id);
                const equipmentId = idOf(order.equipment);
                const status = order.status || "Requested";
                const received = tab === "received";
                const action = status === "Confirmed" ? "Active" : status === "Active" ? "Completed" : null;
                return <article key={id} className="bg-white border border-green-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="h-36 bg-green-100 flex items-center justify-center"><Tractor size={48} className="text-green-700" /></div>
                  <div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-xl font-bold text-green-800">{order.equipmentName || "Rental Equipment"}</h3><span className={`px-3 py-1 rounded-full text-sm font-bold ${colors(status)}`}>{status}</span></div>
                    <p className="flex items-center gap-2 text-gray-700 mt-5"><CalendarDays size={18} className="text-green-700" />{dateText(order.startDate)} — {dateText(order.endDate)}</p>
                    <p className="mt-3 text-gray-700"><b>Estimated Rent:</b> {money(order.totalPrice)}</p>
                    <p className="mt-2 text-gray-700"><b>Billing:</b> {order.rentalUnits || "—"} {order.rentType || "units"}</p>
                    {received && <p className="mt-2 text-gray-700"><b>Renter:</b> {order.renterName || "Not specified"}</p>}
                    {order.renterMessage && <p className="mt-3 text-gray-700 whitespace-pre-wrap"><b>Message:</b> {order.renterMessage}</p>}
                    {equipmentId && <Link to={`/rental-equipment/${encodeURIComponent(equipmentId)}`} state={{ from: location.pathname + location.search }} className="inline-block mt-4 text-green-700 font-bold hover:underline">View Equipment</Link>}
                    <div className="flex flex-wrap gap-3 mt-5">
                      {received && status === "Requested" && <><button disabled={!!busyId} onClick={() => updateStatus(order, "Confirmed")} className="inline-flex items-center gap-2 bg-green-700 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50"><CheckCircle2 size={18} /> Confirm</button><button disabled={!!busyId} onClick={() => updateStatus(order, "Rejected")} className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl font-bold disabled:opacity-50"><XCircle size={18} /> Reject</button></>}
                      {received && action && <button disabled={!!busyId} onClick={() => updateStatus(order, action)} className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-3 rounded-xl font-bold disabled:opacity-50"><PackageCheck size={18} /> Mark {action}</button>}
                      {!received && status === "Requested" && <button disabled={!!busyId} onClick={() => updateStatus(order, "Cancelled")} className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl font-bold disabled:opacity-50"><XCircle size={18} /> Cancel Request</button>}
                    </div>
                  </div>
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
