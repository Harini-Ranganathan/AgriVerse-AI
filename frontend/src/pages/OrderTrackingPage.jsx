
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
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
} from "lucide-react";

const API = "/api/orders";

const ORDER_STAGES = [
  "Order Placed",
  "Confirmed",
  "Shipped",
  "Delivered",
];

function currentUser() {
  try {
    return JSON.parse(
      localStorage.getItem("agriverseCurrentUser") || "{}"
    ) || {};
  } catch {
    return {};
  }
}

function idOf(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function productOf(order) {
  return (
    order.product ||
    order.productListing ||
    order.productId ||
    {}
  );
}

function productIdOf(order) {
  return idOf(productOf(order));
}

function productName(order) {
  const product = productOf(order);

  return (
    product.productName ||
    product.name ||
    order.productName ||
    "Farm Product"
  );
}

function productImage(order) {
  const product = productOf(order);

  const image =
    product.image ||
    product.imageUrl ||
    order.productImage ||
    order.image;

  return typeof image === "string"
    ? image
    : image?.url || "";
}

function money(value) {
  const amount = Number(value);

  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(amount)
  ) {
    return "Not specified";
  }

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function parseResponse(response) {
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid response from the server.");
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

function extractOrders(data) {
  if (Array.isArray(data)) return data;

  for (const key of [
    "orders",
    "myOrders",
    "sales",
    "purchases",
    "data",
  ]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  throw new Error(
    data?.message || "Unexpected orders response."
  );
}

function orderStatus(order) {
  return order.status || "Order Placed";
}

function statusClass(status) {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800";
    case "Shipped":
      return "bg-blue-100 text-blue-800";
    case "Confirmed":
      return "bg-emerald-100 text-emerald-800";
    case "Rejected":
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

function orderAmount(order) {
  return (
    order.totalAmount ??
    order.totalPrice ??
    order.total ??
    order.amount
  );
}

function getNextStatus(status) {
  const index = ORDER_STAGES.indexOf(status);

  if (index < 0 || index >= ORDER_STAGES.length - 1) {
    return null;
  }

  return ORDER_STAGES[index + 1];
}

function ProductPicture({ order }) {
  const image = productImage(order);

  return image ? (
    <img
      src={image}
      alt={productName(order)}
      className="w-full h-44 object-cover"
      loading="lazy"
    />
  ) : (
    <div className="w-full h-44 bg-green-100 flex items-center justify-center">
      <Package
        size={44}
        className="text-green-700"
      />
    </div>
  );
}

export default function OrderTrackingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = currentUser();

  const token = sessionStorage.getItem(
    "agriverseToken"
  );

  const dashboardPath =
    user.role === "farmer"
      ? "/farmer-dashboard"
      : "/customer-dashboard";

  const currentPath =
    location.pathname + location.search;

  const returnTo =
    location.state?.returnTo ||
    location.state?.from;

  const selectedProductId = idOf(
    location.state?.productId
  );

  const [tab, setTab] = useState(
    location.state?.tab === "sales"
      ? "sales"
      : "purchases"
  );

  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [productRequests, setProductRequests] = useState([]);

  const [loadingPurchases, setLoadingPurchases] =
    useState(true);

  const [loadingSales, setLoadingSales] =
    useState(true);

  const [updatingId, setUpdatingId] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showAllProducts, setShowAllProducts] =
    useState(false);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  function goBack() {
    if (
      typeof returnTo === "string" &&
      returnTo.startsWith("/") &&
      !returnTo.startsWith("//") &&
      returnTo !== currentPath
    ) {
      navigate(returnTo);
      return;
    }

    if (location.key !== "default") {
      navigate(-1);
      return;
    }

    navigate(dashboardPath);
  }

  function openProduct(order) {
    const id = productIdOf(order);

    if (!id) return;

    navigate(
      `/product/${encodeURIComponent(id)}`,
      {
        state: {
          from: currentPath,
        },
      }
    );
  }

  const loadOrders = useCallback(
    async (signal) => {
      if (!token) {
        setError("Please log in again.");
        setLoadingPurchases(false);
        setLoadingSales(false);
        return;
      }

      setLoadingPurchases(true);
      setLoadingSales(true);
      setError("");

      const requestList = async (paths) => {
        let lastError;

        for (const path of paths) {
          try {
            const response = await fetch(path, {
              headers,
              signal,
            });

            if (
              response.status === 404 ||
              response.status === 405
            ) {
              continue;
            }

            const data = await parseResponse(response);
            return extractOrders(data);
          } catch (err) {
            if (err.name === "AbortError") {
              throw err;
            }

            lastError = err;

            if (
              !String(err.message).includes("endpoint not found")
            ) {
              break;
            }
          }
        }

        throw (
          lastError ||
          new Error("Orders endpoint not found.")
        );
      };

      const [purchaseResult, salesResult, requestsResult] =
        await Promise.allSettled([
          requestList([
  `${API}/purchases`,
]),
          requestList([
            `${API}/sales`,
            `${API}/seller-orders`,
            `${API}/seller`,
          ]),
          fetch("/api/product-listings/seller/orders", { headers, signal })
            .then(parseResponse),
        ]);

      if (signal?.aborted) return;

      const messages = [];

      if (purchaseResult.status === "fulfilled") {
        setPurchases(purchaseResult.value);
      } else if (
        purchaseResult.reason?.name !== "AbortError"
      ) {
        messages.push(
          `Purchases: ${purchaseResult.reason?.message || "Unable to load."}`
        );
      }

      if (salesResult.status === "fulfilled") {
        setSales(salesResult.value);
      } else if (
        salesResult.reason?.name !== "AbortError"
      ) {
        messages.push(
          `Sales: ${salesResult.reason?.message || "Unable to load."}`
        );
      }

      if (requestsResult.status === "fulfilled") {
        setProductRequests(Array.isArray(requestsResult.value.orders) ? requestsResult.value.orders : []);
      } else if (requestsResult.reason?.name !== "AbortError") {
        messages.push(`Enquiries: ${requestsResult.reason?.message || "Unable to load."}`);
      }

      if (messages.length) {
        setError(messages.join(" "));
      }

      setLoadingPurchases(false);
      setLoadingSales(false);
    },
    [token, headers]
  );

  useEffect(() => {
    const controller = new AbortController();

    loadOrders(controller.signal);

    return () => controller.abort();
  }, [loadOrders]);

  const allSales = useMemo(() => [
    ...productRequests.map((item) => ({ ...item, _source: "enquiry" })),
    ...sales.map((item) => ({ ...item, _source: "checkout" })),
  ], [productRequests, sales]);

  const filteredSales = useMemo(() => {
    if (
      !selectedProductId ||
      showAllProducts
    ) {
      return allSales;
    }

    return allSales.filter(
      (order) =>
        productIdOf(order) === selectedProductId
    );
  }, [
    allSales,
    selectedProductId,
    showAllProducts,
  ]);

  async function updateStatus(order, nextStatus) {
    const id = idOf(order._id || order.id);

    if (!id || updatingId || !nextStatus) {
      return;
    }

    setUpdatingId(id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await parseResponse(response);

      const updated =
        data.order &&
        typeof data.order === "object"
          ? data.order
          : { status: nextStatus };

      setSales((previous) =>
        previous.map((item) =>
          idOf(item._id || item.id) === id
            ? { ...item, ...updated }
            : item
        )
      );

      setNotice(
        `Order updated to ${nextStatus}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId("");
    }
  }

  async function manageEnquiry(item, action) {
    const productId = idOf(item.productId);
    const request = item.request || item.order || {};
    const requestId = request.id;
    if (!productId || requestId == null || updatingId) return;
    const key = `${productId}-${requestId}`;
    if (!window.confirm(action === "confirm" ? "Accept this buyer request?" : "Reject this buyer request?")) return;
    setUpdatingId(key);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/product-listings/${encodeURIComponent(productId)}/requests/${encodeURIComponent(requestId)}/${action}`,
        { method: "POST", headers }
      );
      const data = await parseResponse(response);
      setProductRequests((prev) => prev.map((entry) =>
        idOf(entry.productId) === productId && String((entry.request || entry.order)?.id) === String(requestId)
          ? { ...entry, status: action === "confirm" ? "Confirmed" : "Rejected", request: data.order || data.request || request }
          : entry
      ));
      setNotice(data.message || "Request updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update request.");
    } finally {
      setUpdatingId("");
    }
  }

  async function shipEnquiry(item) {
    const productId = idOf(item.productId);
    const requestId = (item.order || item.request || {}).id;
    if (!productId || requestId == null || updatingId) return;
    const key = `${productId}-${requestId}`;
    setUpdatingId(key);
    setError("");
    try {
      const response = await fetch(
        `/api/product-listings/${encodeURIComponent(productId)}/orders/${encodeURIComponent(requestId)}/ship`,
        { method: "POST", headers }
      );
      const data = await parseResponse(response);
      setProductRequests((prev) => prev.map((entry) =>
        idOf(entry.productId) === productId && String((entry.request || entry.order)?.id) === String(requestId)
          ? { ...entry, status: "Shipped", order: data.order || entry.order, request: data.order || entry.request }
          : entry
      ));
      setNotice("Order marked as shipped.");
    } catch (err) {
      setError(err.message || "Unable to ship order.");
    } finally {
      setUpdatingId("");
    }
  }

  function renderEnquiry(item) {
    const request = item.order || item.request || {};
    const key = `${idOf(item.productId)}-${request.id}`;
    const status = item.status || "Pending";
    return (
      <article key={`enquiry-${key}`} className="bg-white border border-green-200 rounded-2xl overflow-hidden shadow-sm">
        <ProductPicture order={item} />
        <div className="p-5">
          <h3 className="text-xl font-bold text-green-800">{item.productName || "Farm Product"}</h3>
          <span className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-bold ${statusClass(status)}`}>{status}</span>
          <div className="mt-4 space-y-2 text-gray-700">
            <p><b>Buyer:</b> {request.buyerName || "Not specified"}</p>
            <p><b>Phone:</b> {request.buyerPhone || "Not specified"}</p>
            <p><b>Quantity requested:</b> {request.buyerQuantity || "Not specified"} {item.unit || ""}</p>
            {request.buyerMessage && <p className="whitespace-pre-wrap"><b>Message:</b> {request.buyerMessage}</p>}
            <p><b>Requested:</b> {formatDate(request.createdAt)}</p>
          </div>
          {status === "Pending" && (
            <div className="flex gap-3 flex-wrap mt-5">
              <button disabled={Boolean(updatingId)} onClick={() => manageEnquiry(item, "confirm")}
                className="bg-green-700 text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">Accept Request</button>
              <button disabled={Boolean(updatingId)} onClick={() => manageEnquiry(item, "reject")}
                className="bg-red-600 text-white font-bold px-5 py-3 rounded-xl disabled:opacity-50">Reject Request</button>
            </div>
          )}
          {status === "Confirmed" && (
            <button disabled={Boolean(updatingId)} onClick={() => shipEnquiry(item)}
              className="bg-green-700 text-white font-bold px-5 py-3 rounded-xl mt-5 disabled:opacity-50">Mark Shipped</button>
          )}
        </div>
      </article>
    );
  }

  function renderOrder(order, isSale) {
    const id = idOf(order._id || order.id);
    const status = orderStatus(order);
    const nextStatus = getNextStatus(status);

    const quantity =
      order.quantity ??
      order.orderQuantity ??
      "Not specified";

    return (
      <article
        key={id}
        className="bg-white border border-green-200 rounded-2xl overflow-hidden shadow-sm"
      >
        {productIdOf(order) ? (
          <button
            type="button"
            onClick={() => openProduct(order)}
            className="block w-full text-left cursor-pointer"
          >
            <ProductPicture order={order} />

            <div className="px-5 pt-5">
              <h3 className="text-xl font-bold text-green-800">
                {productName(order)}
              </h3>
            </div>
          </button>
        ) : (
          <>
            <ProductPicture order={order} />

            <h3 className="px-5 pt-5 text-xl font-bold text-green-800">
              {productName(order)}
            </h3>
          </>
        )}

        <div className="p-5">
          <span
            className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${statusClass(status)}`}
          >
            {status}
          </span>

          <div className="mt-5 space-y-3 text-gray-700">
            <p>
              <b>Order ID:</b> {id}
            </p>

            <p>
              <b>Order Date:</b>{" "}
              {formatDate(order.createdAt)}
            </p>

            <p>
              <b>Quantity:</b> {quantity}
            </p>

            <p>
              <b>Total:</b>{" "}
              {money(orderAmount(order))}
            </p>

            {isSale ? (
              <>
                <p>
                  <b>Buyer:</b>{" "}
                  {order.buyerName ||
                    order.buyer?.username ||
                    "Not specified"}
                </p>

                {(order.phone ||
                  order.contactNumber) && (
                  <p>
                    <b>Contact:</b>{" "}
                    {order.phone ||
                      order.contactNumber}
                  </p>
                )}

                {order.deliveryAddress && (
                  <p className="flex gap-2">
                    <MapPin
                      size={18}
                      className="text-green-700 shrink-0"
                    />

                    <span>
                      <b>Delivery Address:</b>{" "}
                      {order.deliveryAddress}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p>
                <b>Seller:</b>{" "}
                {order.sellerName ||
                  order.farmer?.username ||
                  order.seller?.username ||
                  "Not specified"}
              </p>
            )}
          </div>

          <div className="mt-6">
            <h4 className="font-bold text-green-800 mb-4">
              Order Progress
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {ORDER_STAGES.map((stage, index) => {
                const currentIndex =
                  ORDER_STAGES.indexOf(status);

                const done =
                  currentIndex >= index;

                return (
                  <div
                    key={stage}
                    className={
                      done
                        ? "bg-green-100 text-green-800 rounded-xl p-3 flex items-center gap-2 text-sm font-semibold"
                        : "bg-gray-100 text-gray-500 rounded-xl p-3 flex items-center gap-2 text-sm font-semibold"
                    }
                  >
                    {done ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <Clock size={17} />
                    )}

                    {stage}
                  </div>
                );
              })}
            </div>
          </div>

          {isSale &&
            nextStatus &&
            status !== "Cancelled" && (
              <button
                type="button"
                disabled={Boolean(updatingId)}
                onClick={() =>
                  updateStatus(order, nextStatus)
                }
                className="w-full mt-6 bg-green-700 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {nextStatus === "Shipped" ? (
                  <Truck size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}

                {updatingId === id
                  ? "Updating..."
                  : `Mark ${nextStatus}`}
              </button>
            )}
        </div>
      </article>
    );
  }

  const isSalesTab = tab === "sales";

  const displayedOrders =
    isSalesTab ? filteredSales : purchases;

  const loading =
    isSalesTab
      ? loadingSales
      : loadingPurchases;

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

        <section className="bg-white rounded-3xl border border-green-200 shadow-sm p-6 md:p-9 mt-6">
          <div className="flex gap-4 items-center">
            <div className="bg-green-100 rounded-2xl p-4">
              <Package
                size={32}
                className="text-green-700"
              />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-green-800">
                My Orders
              </h1>

              <p className="text-gray-600 mt-2">
                Track your purchases and manage
                orders received for your products.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <button
              type="button"
              onClick={() => setTab("purchases")}
              className={
                !isSalesTab
                  ? "bg-green-700 text-white rounded-xl px-5 py-3 font-bold flex gap-2 items-center"
                  : "bg-green-100 text-green-800 rounded-xl px-5 py-3 font-bold flex gap-2 items-center"
              }
            >
              <ShoppingBag size={18} />
              My Purchases ({purchases.length})
            </button>

            <button
              type="button"
              onClick={() => setTab("sales")}
              className={
                isSalesTab
                  ? "bg-green-700 text-white rounded-xl px-5 py-3 font-bold flex gap-2 items-center"
                  : "bg-green-100 text-green-800 rounded-xl px-5 py-3 font-bold flex gap-2 items-center"
              }
            >
              <Package size={18} />
              My Sales ({allSales.length})
            </button>
          </div>

          {selectedProductId && isSalesTab && (
            <div className="mt-5 bg-green-50 rounded-xl border border-green-200 p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-green-800">
                {showAllProducts
                  ? "Showing orders for all your products."
                  : "Showing orders for the selected product."}
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowAllProducts(
                    (previous) => !previous
                  )
                }
                className="text-green-700 font-bold"
              >
                {showAllProducts
                  ? "Selected Product Only"
                  : "Show All Products"}
              </button>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mt-6 flex gap-2"
            >
              <AlertCircle size={19} />
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="bg-green-100 text-green-800 rounded-xl p-4 mt-6"
            >
              {notice}
            </div>
          )}

          {loading ? (
            <p className="text-green-700 font-semibold mt-8">
              Loading orders...
            </p>
          ) : displayedOrders.length === 0 ? (
            <div className="bg-green-50 p-9 text-center rounded-2xl mt-8">
              <Package
                size={38}
                className="mx-auto text-green-700"
              />

              <h2 className="text-xl font-bold text-green-800 mt-4">
                {isSalesTab
                  ? "No sales orders yet"
                  : "No purchases yet"}
              </h2>

              <p className="text-gray-600 mt-2">
                {isSalesTab
                  ? "Orders received for your published products will appear here."
                  : "Products you purchase will appear here."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
              {displayedOrders.map((order) =>
                order._source === "enquiry" ? renderEnquiry(order) : renderOrder(order, isSalesTab)
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
