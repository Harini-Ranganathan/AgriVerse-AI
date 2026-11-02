
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Tractor,
  MapPin,
  CalendarDays,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  IndianRupee,
  Pencil,
} from "lucide-react";

const EQUIPMENT_API = "/api/rental-equipment";
const CART_API = "/api/rental-cart";
const ORDERS_API = "/api/rental-orders";

function currentUser() {
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
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
}

function getName(item) {
  return item.name || item.equipmentName || item.title || "Rental Equipment";
}

function getImage(item) {
  const image = item.image || item.imageUrl || item.images?.[0];
  return typeof image === "string" ? image : image?.url || "";
}

function getPrice(item) {
  return item.rentAmount ??
    item.pricePerDay ??
    item.rentPerDay ??
    item.rentalPrice ??
    item.price;
}

function getRentType(item) {
  return item.rentType || "Per Day";
}

function formatMoney(value) {
  if (value === undefined || value === null || value === "") {
    return "Price unavailable";
  }
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `₹${amount.toLocaleString("en-IN")}`
    : "Price unavailable";
}

function localDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateDays(start, end) {
  if (!start || !end) return 0;
  const first = Date.parse(`${start}T00:00:00Z`);
  const last = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last) || last < first) {
    return 0;
  }
  return Math.round((last - first) / 86400000) + 1;
}

async function readResponse(response) {
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid server response (${response.status}).`);
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed (${response.status}).`
    );
  }
  return data;
}

function findEquipment(data, equipmentId) {
  if (Array.isArray(data)) {
    return data.find((item) => getId(item._id || item.id) === equipmentId);
  }

  for (const key of ["equipment", "equipments", "items", "listings", "data"]) {
    if (Array.isArray(data?.[key])) {
      const found = data[key].find(
        (item) => getId(item._id || item.id) === equipmentId
      );
      if (found) return found;
    }
  }

  for (const candidate of [
    data?.equipment,
    data?.item,
    data?.listing,
    data?.data,
    data,
  ]) {
    if (
      candidate &&
      !Array.isArray(candidate) &&
      getId(candidate._id || candidate.id) === equipmentId
    ) {
      return candidate;
    }
  }
  return null;
}

function getOrders(data) {
  if (Array.isArray(data)) return data;
  for (const key of ["orders", "rentalOrders", "requests", "rentals", "data"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

export default function RentalEquipmentDetailsPage() {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const user = currentUser();
  const userId = getId(user._id || user.id);
  const token = sessionStorage.getItem("agriverseToken");

  const dashboard =
    user.role === "farmer" ? "/farmer-dashboard" : "/customer-dashboard";
  const currentPath = location.pathname + location.search;

  const [equipment, setEquipment] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const [cartIds, setCartIds] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const [receivedOrders, setReceivedOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [renterName, setRenterName] = useState(
    user.fullName || user.name || user.username || ""
  );
  const [phone, setPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [message, setMessage] = useState("");

  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(isOwner ? dashboard : "/equipment-rental", {
        replace: true,
      });
    }
  }

  function openEdit() {
    navigate(`/edit-rental-equipment/${encodeURIComponent(equipmentId)}`, {
      state: { from: currentPath },
    });
  }

  function openRentalOrders() {
    navigate("/rental-orders", {
      state: {
        from: currentPath,
        returnTo: currentPath,
        equipmentId,
      },
    });
  }

  const loadEquipment = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        let owned = null;

        if (token) {
          try {
            const response = await fetch(`${EQUIPMENT_API}/mine`, {
              headers: { Authorization: `Bearer ${token}` },
              signal,
            });

            if (response.ok) {
              owned = findEquipment(
                await readResponse(response),
                String(equipmentId)
              );
            }
          } catch (err) {
            if (err.name === "AbortError") throw err;
          }
        }

        if (signal.aborted) return;

        if (owned) {
          setEquipment(owned);
          setIsOwner(true);
          return;
        }

        const response = await fetch(EQUIPMENT_API, { signal });
        const data = await readResponse(response);
        const found = findEquipment(data, String(equipmentId));

        if (!found) {
          throw new Error("Equipment is unavailable or has been removed.");
        }

        if (!signal.aborted) {
          setEquipment(found);
          setIsOwner(
            Boolean(
              userId &&
              getId(found.owner || found.seller || found.createdBy) === userId
            )
          );
        }
      } catch (err) {
        if (err.name !== "AbortError" && !signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [equipmentId, token, userId]
  );

  const loadCart = useCallback(
    async (signal) => {
      setCartLoading(true);

      if (!token) {
        setCartLoading(false);
        return;
      }

      try {
        const response = await fetch(CART_API, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });

        const data = await readResponse(response);

        if (!Array.isArray(data.cart?.items)) {
          throw new Error("Invalid rental cart response.");
        }

        if (!signal.aborted) {
          setCartIds(
            data.cart.items.map((entry) =>
              getId(entry.equipmentId || entry.equipment?._id)
            )
          );
        }
      } catch (err) {
        if (err.name !== "AbortError" && !signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!signal.aborted) setCartLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();

    setEquipment(null);
    setIsOwner(false);
    setReceivedOrders([]);

    loadEquipment(controller.signal);
    loadCart(controller.signal);

    return () => controller.abort();
  }, [loadEquipment, loadCart]);

  const loadReceivedOrders = useCallback(
    async (signal) => {
      if (!isOwner || !token) return;

      setOrdersLoading(true);

      try {
        const response = await fetch(`${ORDERS_API}/received`, {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });

        const data = await readResponse(response);

        if (!signal.aborted) {
          setReceivedOrders(
            getOrders(data).filter(
              (order) =>
                getId(order.equipment || order.equipmentId) ===
                String(equipmentId)
            )
          );
        }
      } catch (err) {
        if (err.name !== "AbortError" && !signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!signal.aborted) setOrdersLoading(false);
      }
    },
    [isOwner, token, equipmentId]
  );

  useEffect(() => {
    if (!isOwner) return;

    const controller = new AbortController();
    loadReceivedOrders(controller.signal);

    return () => controller.abort();
  }, [isOwner, loadReceivedOrders]);

  const days = calculateDays(startDate, endDate);

  const estimatedTotal = useMemo(() => {
    if (!equipment || !days) return 0;

    const price = Number(getPrice(equipment));
    if (!Number.isFinite(price) || price < 0) return 0;

    const type = getRentType(equipment).toLowerCase();
    if (type.includes("hour")) return null;
    if (type.includes("week")) return Math.ceil(days / 7) * price;
    if (type.includes("month")) return Math.ceil(days / 30) * price;
    return days * price;
  }, [equipment, days]);

  const inCart = cartIds.includes(String(equipmentId));

  async function addToCart() {
    if (
      !equipment ||
      isOwner ||
      cartLoading ||
      addingToCart ||
      inCart
    ) {
      return;
    }

    if (!token) {
      setError("Please log in again.");
      return;
    }

    setAddingToCart(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(CART_API, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ equipmentId }),
      });

      const data = await readResponse(response);

      if (!Array.isArray(data.cart?.items)) {
        throw new Error("Invalid rental cart response.");
      }

      setCartIds(
        data.cart.items.map((entry) =>
          getId(entry.equipmentId || entry.equipment?._id)
        )
      );

      setNotice("Equipment added to cart.");
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingToCart(false);
    }
  }

  async function submitBooking(event) {
    event.preventDefault();

    if (booking || isOwner || !equipment) return;

    setError("");
    setNotice("");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    if (!days || startDate < localDateString()) {
      setError("Choose a valid rental date range.");
      return;
    }

    if (renterName.trim().length < 2) {
      setError("Enter a valid renter name.");
      return;
    }

    if (!/^[+0-9()\s-]{7,30}$/.test(phone.trim())) {
      setError("Enter a valid contact number.");
      return;
    }

    const address = deliveryAddress.trim();

    if (address.length < 5 || address.length > 1000) {
      setError("Enter a valid delivery address.");
      return;
    }

    setBooking(true);

    try {
      const response = await fetch(ORDERS_API, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipmentId,
          startDate,
          endDate,
          renterName: renterName.trim(),
          phone: phone.trim(),
          deliveryAddress: address,
          renterMessage: message.trim(),
        }),
      });

      await readResponse(response);

      setNotice("Rental request submitted successfully.");
      setStartDate("");
      setEndDate("");
      setPhone("");
      setDeliveryAddress("");
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  }

  const field =
    "w-full border border-green-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500";

  if (loading && !equipment) {
    return (
      <main className="min-h-screen bg-green-50 flex justify-center items-center p-6">
        <p className="text-green-700 font-bold">
          Loading equipment details...
        </p>
      </main>
    );
  }

  if (!equipment) {
    return (
      <main className="min-h-screen bg-green-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-bold text-green-800">
            Equipment Unavailable
          </h1>
          <p className="text-red-700 mt-4">
            {error || "Equipment not found."}
          </p>
          <button
            type="button"
            onClick={goBack}
            className="mt-6 bg-green-700 text-white px-6 py-3 rounded-xl"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  const image = getImage(equipment);

  const locationText = [
    equipment.address || equipment.location,
    equipment.district,
    equipment.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-green-700 font-bold"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {error && (
          <p
            role="alert"
            className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2"
          >
            <AlertCircle size={19} />
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mt-6 bg-green-100 rounded-xl p-4 text-green-800 flex items-center gap-2"
          >
            <CheckCircle2 size={19} />
            {notice}
          </p>
        )}

        <section className="bg-white rounded-3xl border border-green-200 shadow-sm mt-6 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={getName(equipment)}
              className="w-full h-64 md:h-96 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-green-100 flex items-center justify-center">
              <Tractor size={65} className="text-green-700" />
            </div>
          )}

          <div className="p-6 md:p-10">
            <div className="flex flex-wrap justify-between gap-5">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-green-800">
                  {getName(equipment)}
                </h1>
                <p className="text-gray-600 mt-3">
                  {equipment.category || "Agricultural Equipment"}
                </p>
                {isOwner && (
                  <span className="inline-block mt-4 bg-green-100 text-green-800 rounded-xl px-4 py-2 font-bold">
                    Your Equipment
                  </span>
                )}
              </div>

              <div className="bg-green-700 text-white rounded-2xl px-6 py-4">
                <p className="text-2xl font-bold">
                  {formatMoney(getPrice(equipment))}
                </p>
                <p className="mt-1">{getRentType(equipment)}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mt-8 text-gray-700">
              <p className="flex items-center gap-2">
                <MapPin size={19} className="text-green-700" />
                <span>
                  <b>Location:</b>{" "}
                  {locationText || "Not specified"}
                </span>
              </p>

              <p className="flex items-center gap-2">
                <User size={19} className="text-green-700" />
                <span>
                  <b>Owner:</b>{" "}
                  {equipment.ownerName ||
                    equipment.sellerName ||
                    "Not specified"}
                </span>
              </p>

              {equipment.phone && (
                <p className="flex items-center gap-2">
                  <Phone size={19} className="text-green-700" />
                  <span>
                    <b>Contact:</b> {equipment.phone}
                  </span>
                </p>
              )}

              <p className="flex items-center gap-2">
                <IndianRupee size={19} className="text-green-700" />
                <span>
                  <b>Rental Rate:</b>{" "}
                  {formatMoney(getPrice(equipment))}{" "}
                  {getRentType(equipment)}
                </span>
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-green-800">
                Description
              </h2>
              <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                {equipment.description ||
                  "No additional description provided."}
              </p>
            </div>

            {isOwner ? (
              <div className="flex flex-wrap gap-3 mt-8">
                <button
                  type="button"
                  onClick={openEdit}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold"
                >
                  <Pencil size={18} />
                  Edit Equipment
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                disabled={cartLoading || addingToCart || inCart}
                className="mt-8 bg-green-700 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart size={19} />
                {addingToCart
                  ? "Adding..."
                  : inCart
                    ? "Already in Cart"
                    : "Add to Cart"}
              </button>
            )}
          </div>
        </section>

        {isOwner ? (
          <section className="bg-white border border-green-200 rounded-3xl p-6 md:p-9 mt-8">
            <div className="flex flex-wrap justify-between gap-4 items-center">
              <div>
                <h2 className="text-2xl font-bold text-green-800">
                  Rental Requests Received
                </h2>
                <p className="mt-2 text-gray-600">
                  Requests for this equipment.
                </p>
              </div>

              <button
                type="button"
                onClick={openRentalOrders}
                className="bg-green-700 text-white px-5 py-3 rounded-xl font-bold"
              >
                Manage Rental Orders
              </button>
            </div>

            {ordersLoading ? (
              <p className="mt-6 text-green-700">
                Loading requests...
              </p>
            ) : receivedOrders.length === 0 ? (
              <p className="mt-6 bg-green-50 rounded-xl p-6 text-gray-600">
                No rental requests received for this equipment.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {receivedOrders.map((order, index) => (
                  <article
                    key={getId(order._id || order.id) || index}
                    className="bg-green-50 border border-green-200 rounded-2xl p-5"
                  >
                    <h3 className="font-bold text-green-800">
                      {order.renterName ||
                        order.customerName ||
                        order.buyerName ||
                        "Renter"}
                    </h3>
                    <p className="mt-2">
                      <b>Status:</b> {order.status || "Requested"}
                    </p>
                    <p className="mt-2">
                      <b>Dates:</b>{" "}
                      {String(order.startDate || "").slice(0, 10)}
                      {" — "}
                      {String(order.endDate || "").slice(0, 10)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="bg-white border border-green-200 rounded-3xl p-6 md:p-9 mt-8">
            <h2 className="text-2xl font-bold text-green-800">
              Request Equipment Rental
            </h2>
            <p className="mt-2 text-gray-600">
              Select your dates and send a rental request.
            </p>

            <form
              onSubmit={submitBooking}
              className="grid md:grid-cols-2 gap-5 mt-7"
            >
              <label>
                <span className="block font-semibold mb-2">
                  Start Date
                </span>
                <input
                  type="date"
                  min={localDateString()}
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                  className={field}
                />
              </label>

              <label>
                <span className="block font-semibold mb-2">
                  End Date
                </span>
                <input
                  type="date"
                  min={startDate || localDateString()}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                  className={field}
                />
              </label>

              <label>
                <span className="block font-semibold mb-2">
                  Your Name
                </span>
                <input
                  value={renterName}
                  onChange={(event) => setRenterName(event.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  className={field}
                />
              </label>

              <label>
                <span className="block font-semibold mb-2">
                  Phone Number
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  maxLength={30}
                  className={field}
                />
              </label>

              <label className="md:col-span-2">
                <span className="block font-semibold mb-2">
                  Delivery Address
                </span>
                <textarea
                  value={deliveryAddress}
                  onChange={(event) =>
                    setDeliveryAddress(event.target.value)
                  }
                  rows={3}
                  required
                  minLength={5}
                  maxLength={1000}
                  placeholder="Enter the full address where the equipment should be delivered"
                  className={field}
                />
              </label>

              <label className="md:col-span-2">
                <span className="block font-semibold mb-2">
                  Message (Optional)
                </span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  maxLength={2000}
                  className={field}
                />
              </label>

              <div className="md:col-span-2 bg-green-50 rounded-xl border border-green-200 p-5">
                <p className="font-bold text-green-800 flex gap-2 items-center">
                  <CalendarDays size={19} />
                  Rental Summary
                </p>
                <p className="mt-3">
                  <b>Duration:</b> {days}{" "}
                  {days === 1 ? "day" : "days"}
                </p>
                <p className="mt-2">
                  <b>Estimated Rent:</b>{" "}
                  {estimatedTotal === null
                    ? "Calculated by rental provider"
                    : formatMoney(estimatedTotal)}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  The server determines final availability and rent.
                  No payment is collected here.
                </p>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={booking || !days}
                  className="bg-green-700 text-white px-7 py-4 rounded-xl font-bold disabled:opacity-50"
                >
                  {booking
                    ? "Submitting..."
                    : "Send Rental Request"}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
