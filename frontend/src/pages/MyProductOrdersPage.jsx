
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBag,
  PackageCheck,
  Truck,
  Clock,
  AlertCircle,
  RefreshCw,
  Store,
} from "lucide-react";

const API = "/api/product-listings";

function getUser() {
  try {
    return JSON.parse(
      localStorage.getItem("agriverseCurrentUser") || "{}"
    ) || {};
  } catch {
    return {};
  }
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusIcon(status) {
  switch (status) {
    case "Shipped":
      return <Truck size={20} />;

    case "Confirmed":
      return <PackageCheck size={20} />;

    default:
      return <Clock size={20} />;
  }
}

function StatusBadge({ status }) {
  const classes = {
    Pending: "bg-yellow-100 text-yellow-800",
    Confirmed: "bg-blue-100 text-blue-800",
    Shipped: "bg-green-100 text-green-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${
        classes[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {getStatusIcon(status)}
      {status || "Pending"}
    </span>
  );
}

function OrderCard({ item, type }) {
  const order = item.request || item.order || {};

  const productId = String(item.productId || "");

  const productName =
    item.productName || "Agricultural Product";

  const status = item.status || "Pending";

  const date =
    order.shippedAt ||
    order.confirmedAt ||
    order.createdAt;

  const quantity =
    order.buyerQuantity ||
    order.quantity ||
    "";

  const buyerName = order.buyerName || "";

  return (
    <article className="bg-white border border-green-200 rounded-3xl p-5 md:p-6 shadow-sm">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex items-start gap-4">
          {item.image ? (
            <img
              src={item.image}
              alt={productName}
              className="w-20 h-20 rounded-xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-green-100 text-green-700 rounded-xl flex items-center justify-center">
              <ShoppingBag size={32} />
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-green-800">
              {productName}
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              {formatDate(date)}
            </p>

            {quantity !== "" && (
              <p className="mt-2 text-gray-700">
                Quantity:{" "}
                <span className="font-bold">
                  {quantity}
                </span>
              </p>
            )}

            {type === "sales" && buyerName && (
              <p className="mt-2 text-gray-700">
                Buyer:{" "}
                <span className="font-bold">
                  {buyerName}
                </span>
              </p>
            )}
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      {order.buyerMessage && (
        <div className="mt-5 bg-green-50 p-4 rounded-xl">
          <p className="text-sm font-bold text-green-800">
            Buyer Message
          </p>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">
            {order.buyerMessage}
          </p>
        </div>
      )}

      {order.trackingNumber && (
        <div className="mt-4 bg-blue-50 p-4 rounded-xl">
          <p className="font-bold text-blue-800">
            Tracking Number
          </p>
          <p className="mt-1 text-gray-700">
            {order.trackingNumber}
          </p>
        </div>
      )}

      {productId && (
        <Link
          to={`/product/${encodeURIComponent(productId)}`}
          className="inline-flex mt-5 bg-green-700 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-800"
        >
          View Product
        </Link>
      )}
    </article>
  );
}

export default function MyProductOrdersPage() {
  const navigate = useNavigate();

  const user = getUser();

  const token = sessionStorage.getItem("agriverseToken");

  const [tab, setTab] = useState("purchases");

  const [purchases, setPurchases] = useState([]);

  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOrders() {
      setLoading(true);
      setError("");

      if (!token) {
        setError("Please log in to view your orders.");
        setLoading(false);
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [purchaseResponse, salesResponse] =
          await Promise.all([
            fetch(`${API}/buyer/requests`, {
              headers,
              signal: controller.signal,
            }),

            fetch(`${API}/seller/orders`, {
              headers,
              signal: controller.signal,
            }),
          ]);

        const [purchaseData, salesData] =
          await Promise.all([
            purchaseResponse.json(),
            salesResponse.json(),
          ]);

        if (
          !purchaseResponse.ok ||
          purchaseData.success === false
        ) {
          throw new Error(
            purchaseData.message ||
              "Unable to load purchases."
          );
        }

        if (
          !salesResponse.ok ||
          salesData.success === false
        ) {
          throw new Error(
            salesData.message ||
              "Unable to load sales."
          );
        }

        if (!controller.signal.aborted) {
          setPurchases(
            Array.isArray(purchaseData.requests)
              ? purchaseData.requests
              : []
          );

          setSales(
            Array.isArray(salesData.orders)
              ? salesData.orders
              : []
          );
        }
      } catch (err) {
        if (
          err.name !== "AbortError" &&
          !controller.signal.aborted
        ) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => controller.abort();
  }, [token, reload]);

  const currentItems =
    tab === "purchases" ? purchases : sales;

  const dashboard =
    String(user.role).toLowerCase() === "farmer"
      ? "/farmer-dashboard"
      : "/customer-dashboard";

  return (
    <main className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(dashboard)}
          className="flex items-center gap-2 font-bold text-green-700"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="mt-7 bg-white border border-green-200 rounded-3xl p-6 md:p-9">
          <div className="flex flex-wrap justify-between items-center gap-5">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-green-800">
                My Product Orders
              </h1>

              <p className="mt-3 text-gray-600">
                View your product enquiries, confirmed
                orders, and shipped orders.
              </p>
            </div>

            
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <button
              type="button"
              onClick={() => setTab("purchases")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold ${
                tab === "purchases"
                  ? "bg-green-700 text-white"
                  : "bg-green-100 text-green-800"
              }`}
            >
              <ShoppingBag size={18} />
              My Purchase Enquiries ({purchases.length})
            </button>

            <button
              type="button"
              onClick={() => setTab("sales")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold ${
                tab === "sales"
                  ? "bg-green-700 text-white"
                  : "bg-green-100 text-green-800"
              }`}
            >
              <Store size={18} />
              My Sales Orders ({sales.length})
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 flex items-center gap-3"
          >
            <AlertCircle size={21} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-green-200 rounded-3xl p-10 mt-6 text-center">
            <p className="font-semibold text-green-700">
              Loading your orders...
            </p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="bg-white border border-green-200 rounded-3xl p-10 mt-6 text-center">
            <PackageCheck
              size={45}
              className="mx-auto text-green-700"
            />

            <h2 className="text-2xl font-bold text-green-800 mt-5">
              {tab === "purchases"
                ? "No purchase enquiries yet"
                : "No sales orders yet"}
            </h2>

            <p className="text-gray-600 mt-3">
              {tab === "purchases"
                ? "Products you enquire about will appear here."
                : "Confirmed orders for products you sell will appear here."}
            </p>

            <Link
              to="/sell-products"
              className="inline-block mt-6 bg-green-700 text-white rounded-xl px-6 py-3 font-bold"
            >
              Open Product Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5 mt-6">
            {currentItems.map((item, index) => (
              <OrderCard
                key={`${item.productId}-${item.request?.id || item.order?.id || index}`}
                item={item}
                type={tab}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
