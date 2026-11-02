
import { useCallback, useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ShoppingBasket,
  MapPin,
  Package,
  Pencil,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  Eye,
  EyeOff,
  Trash2,
  MessageSquare,
  ClipboardList,
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

function idOf(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
}

function productName(product) {
  return product.productName || product.name || "Farm Product";
}

function productImage(product) {
  const image =
    product.image ||
    product.imageUrl ||
    product.images?.[0];

  return typeof image === "string"
    ? image
    : image?.url || "";
}

function money(value) {
  const amount = Number(value);

  if (
    value === undefined ||
    value === null ||
    value === "" ||
    !Number.isFinite(amount)
  ) {
    return "Price unavailable";
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}

async function parseResponse(response) {
  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid server response.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed (${response.status}).`
    );
  }

  return data;
}

function findProduct(data, productId) {
  if (Array.isArray(data)) {
    return data.find(
      (item) => idOf(item._id || item.id) === productId
    );
  }

  for (const key of ["products", "listings", "items", "data"]) {
    if (Array.isArray(data?.[key])) {
      const item = data[key].find(
        (entry) => idOf(entry._id || entry.id) === productId
      );
      if (item) return item;
    }
  }

  for (const candidate of [
    data?.product,
    data?.listing,
    data?.data,
    data,
  ]) {
    if (
      candidate &&
      !Array.isArray(candidate) &&
      idOf(candidate._id || candidate.id) === productId
    ) {
      return candidate;
    }
  }

  return null;
}

function getCart(key) {
  try {
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export default function ProductDetailsPage() {
  const { id, productId: routeProductId } = useParams();
  const productId = id || routeProductId;

  const navigate = useNavigate();
  const location = useLocation();

  const user = getUser();
  const userId = idOf(user._id || user.id);
  const token = sessionStorage.getItem("agriverseToken");

  const dashboard =
    user.role === "farmer"
      ? "/farmer-dashboard"
      : "/customer-dashboard";

  const currentPath = location.pathname + location.search;

  const cartKey = `agriverseCart_${
    userId || user.username || "guest"
  }`;

  const [product, setProduct] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);

  const [buyerName, setBuyerName] = useState(user.name || user.fullName || user.username || "");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerQuantity, setBuyerQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // Move backward in real browser history.
  // Never navigate to state.from using push navigation.
  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(
        isOwner ? dashboard : "/sell-products",
        { replace: true }
      );
    }
  }

  function openEdit() {
    navigate(
      `/edit-product/${encodeURIComponent(productId)}`,
      {
        state: {
          from: currentPath,
        },
      }
    );
  }

  function openOrders() {
    navigate("/order-tracking", {
      state: {
        from: currentPath,
        returnTo: currentPath,
        productId,
        tab: "sales",
      },
    });
  }

  const loadProduct = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        let ownedProduct = null;

        if (token) {
          try {
            const response = await fetch(`${API}/mine`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal,
            });

            if (response.ok) {
              ownedProduct = findProduct(
                await parseResponse(response),
                String(productId)
              );
            }
          } catch (err) {
            if (err.name === "AbortError") throw err;
          }
        }

        if (signal.aborted) return;

        if (ownedProduct) {
          setProduct(ownedProduct);
          setIsOwner(true);
          return;
        }

        const response = await fetch(API, { signal });
        const data = await parseResponse(response);

        const found = findProduct(data, String(productId));

        if (!found) {
          throw new Error("Product not found or unavailable.");
        }

        if (!signal.aborted) {
          setProduct(found);
          setIsOwner(
            Boolean(
              userId &&
              idOf(
                found.seller ||
                found.owner ||
                found.createdBy
              ) === userId
            )
          );
        }
      } catch (err) {
        if (err.name !== "AbortError" && !signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [productId, token, userId]
  );

  useEffect(() => {
    const controller = new AbortController();

    setProduct(null);
    setIsOwner(false);
    setEnquiries([]);

    loadProduct(controller.signal);

    return () => controller.abort();
  }, [loadProduct]);

  useEffect(() => {
    if (!isOwner || !token) return;

    const controller = new AbortController();

    async function loadEnquiries() {
      setEnquiriesLoading(true);

      try {
        const response = await fetch(
          `${API}/seller/requests`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await parseResponse(response);

        const items = Array.isArray(data)
          ? data
          : data.requests || data.enquiries || data.data || [];

        if (!Array.isArray(items)) {
          throw new Error("Invalid enquiries response.");
        }

        if (!controller.signal.aborted) {
          setEnquiries(
            items.filter(
              (item) =>
                idOf(
                  item.product ||
                  item.productId ||
                  item.productListing ||
                  item.listing
                ) === String(productId)
            )
          );
        }
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setEnquiriesLoading(false);
        }
      }
    }

    loadEnquiries();

    return () => controller.abort();
  }, [isOwner, productId, token]);

  async function changePublication() {
    if (!isOwner || !product || busy) return;

    const nextPublished = product.isPublished === false;

    setBusy("publish");
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(productId)}/publication`,
        {
          method: "PATCH",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isPublished: nextPublished,
          }),
        }
      );

      const data = await parseResponse(response);
      const updated = data.product || data.listing || {};

      setProduct((previous) => ({
        ...previous,
        ...updated,
        isPublished: updated.isPublished ?? nextPublished,
      }));

      setNotice(
        nextPublished
          ? "Product published successfully."
          : "Product unpublished successfully."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function deleteProduct() {
    if (!isOwner || busy) return;

    if (!window.confirm("Delete this product permanently?")) {
      return;
    }

    setBusy("delete");
    setError("");

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(productId)}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      await parseResponse(response);

      navigate(dashboard, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  function addToCart() {
    if (!product || isOwner) return;

    if (!token) {
      setError("Please log in again.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const cart = getCart(cartKey);

      if (
        cart.some(
          (item) => idOf(item._id || item.id) === String(productId)
        )
      ) {
        setNotice("This product is already in your cart.");
        return;
      }

      localStorage.setItem(
        cartKey,
        JSON.stringify([...cart, product])
      );

      setNotice(
        "Product added to cart. You can view it in Buy / Sell Farm Products."
      );
    } catch {
      setError("Unable to update cart.");
    }
  }

  async function sendEnquiry(event) {
    event.preventDefault();
    if (isOwner || busy) return;
    if (!token) { setError("Please log in again."); return; }
    const name = buyerName.trim();
    const phone = buyerPhone.trim();
    const quantity = buyerQuantity.trim();
    if (name.length < 2 || name.length > 100) { setError("Enter a valid name."); return; }
    if (!/^[+0-9()\s-]{7,30}$/.test(phone)) { setError("Enter a valid phone number."); return; }
    if (!quantity || quantity.length > 100) { setError("Enter a valid quantity."); return; }
    if (message.length > 2000) { setError("Message is too long."); return; }
    setBusy("enquiry"); setError(""); setNotice("");
    try {
      const response = await fetch(`${API}/${encodeURIComponent(productId)}/requests`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ buyerName: name, buyerPhone: phone, buyerQuantity: quantity, buyerMessage: message.trim() }),
      });
      const data = await parseResponse(response);
      setBuyerQuantity(""); setMessage("");
      setNotice(data.message || "Enquiry sent successfully.");
    } catch (err) { setError(err.message); }
    finally { setBusy(""); }
  }

  async function decideEnquiry(item, decision) {
    const request = item.request || item;
    const requestId = request.id;
    if (requestId == null || busy) return;
    if (!window.confirm(decision === "confirm" ? "Accept this request?" : "Reject this request?")) return;
    setBusy(String(requestId)); setError(""); setNotice("");
    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(productId)}/requests/${encodeURIComponent(requestId)}/${decision}`,
        { method: "POST", headers: authHeaders }
      );
      const data = await parseResponse(response);
      setEnquiries((previous) => previous.filter((entry) => String((entry.request || entry).id) !== String(requestId)));
      setNotice(data.message || "Request updated successfully. View Product Orders for its new status.");
    } catch (err) { setError(err.message); }
    finally { setBusy(""); }
  }

  if (loading && !product) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="font-bold text-green-700">
          Loading product details...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-green-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 text-center">
          <h1 className="text-2xl font-bold text-green-800">
            Product Unavailable
          </h1>

          <p className="mt-4 text-red-700">
            {error || "Product not found."}
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

  const image = productImage(product);

  const locationText = [
    product.location,
    product.district,
    product.state,
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
            className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex gap-2"
          >
            <AlertCircle size={19} />
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mt-6 bg-green-100 text-green-800 rounded-xl p-4 flex gap-2"
          >
            <CheckCircle2 size={19} />
            {notice}
          </p>
        )}

        <section className="mt-6 bg-white rounded-3xl border border-green-200 shadow-sm overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={productName(product)}
              className="w-full h-64 md:h-96 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-green-100 flex items-center justify-center">
              <ShoppingBasket size={70} className="text-green-700" />
            </div>
          )}

          <div className="p-6 md:p-10">
            <div className="flex flex-wrap justify-between gap-5">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-green-800">
                  {productName(product)}
                </h1>

                <p className="mt-3 text-gray-600">
                  {product.category || "Farm Product"}
                </p>

                {isOwner && (
                  <span className="inline-block mt-4 bg-green-100 text-green-800 rounded-xl px-4 py-2 font-bold">
                    Your Product
                  </span>
                )}
              </div>

              <div className="bg-green-700 text-white px-6 py-4 rounded-2xl">
                <p className="text-2xl font-extrabold">
                  {money(product.price)}
                </p>

                <p className="mt-1">
                  Per {product.unit || "unit"}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 mt-8">
              <p className="flex items-center gap-2 text-gray-700">
                <MapPin size={19} className="text-green-700" />
                <span>
                  <b>Location:</b>{" "}
                  {locationText || "Not specified"}
                </span>
              </p>

              <p className="flex items-center gap-2 text-gray-700">
                <Package size={19} className="text-green-700" />
                <span>
                  <b>Quantity:</b>{" "}
                  {product.quantity ?? "Not specified"}{" "}
                  {product.unit || ""}
                </span>
              </p>

              <p className="text-gray-700">
                <b>Seller:</b>{" "}
                {product.sellerName || "Not specified"}
              </p>

              <p className="text-gray-700">
                <b>Availability:</b>{" "}
                {product.isPublished === false
                  ? "Unpublished"
                  : "Published"}
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-green-800">
                Description
              </h2>

              <p className="mt-3 text-gray-700 whitespace-pre-wrap">
                {product.description || "No description provided."}
              </p>
            </div>

            {isOwner ? (
              <div className="flex flex-wrap gap-3 mt-8">
                <button type="button" onClick={openEdit} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold"><Pencil size={18} /> Edit</button>
                <button type="button" disabled={Boolean(busy)} onClick={changePublication} className="flex items-center gap-2 bg-green-700 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50">
                  {product.isPublished === false ? <Eye size={18} /> : <EyeOff size={18} />}
                  {product.isPublished === false ? "Publish" : "Unpublish"}
                </button>
                <button type="button" disabled={Boolean(busy)} onClick={deleteProduct} className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50"><Trash2 size={18} /> Delete</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={addToCart}
                className="mt-8 bg-green-700 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2"
              >
                <ShoppingCart size={19} />
                Add to Cart
              </button>
            )}
          </div>
        </section>

        {isOwner ? (
          <section className="mt-8 bg-white border border-green-200 rounded-3xl p-6 md:p-9">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-green-800">
                  Product Enquiries
                </h2>

                <p className="mt-2 text-gray-600">
                  Enquiries received for this product.
                </p>
              </div>

              <button
                type="button"
                onClick={openOrders}
                className="bg-green-700 text-white px-5 py-3 rounded-xl font-bold"
              >
                View Product Orders
              </button>
            </div>

            {enquiriesLoading ? (
              <p className="mt-6 text-green-700">
                Loading enquiries...
              </p>
            ) : enquiries.length === 0 ? (
              <p className="mt-6 bg-green-50 p-6 rounded-xl text-gray-600">
                No enquiries for this product yet.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {enquiries.map((item, index) => {
                  const enquiry = item.request || item;
                  return (
                    <article key={String(enquiry.id ?? index)} className="bg-green-50 border border-green-200 rounded-xl p-5">
                      <p className="font-bold text-green-800">{enquiry.buyerName || "Interested Buyer"}</p>
                      <p className="mt-3"><b>Phone:</b> {enquiry.buyerPhone || "Not provided"}</p>
                      <p className="mt-2"><b>Quantity:</b> {enquiry.buyerQuantity || "Not specified"} {product.unit || ""}</p>
                      {enquiry.buyerMessage && <p className="mt-3 whitespace-pre-wrap"><b>Message:</b> {enquiry.buyerMessage}</p>}
                      <div className="flex gap-3 flex-wrap mt-4">
                        <button type="button" disabled={Boolean(busy)} onClick={() => decideEnquiry(item, "confirm")}
                          className="bg-green-700 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50">Accept</button>
                        <button type="button" disabled={Boolean(busy)} onClick={() => decideEnquiry(item, "reject")}
                          className="bg-red-600 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50">Reject</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="mt-8 bg-white border border-green-200 rounded-3xl p-6 md:p-9">
            <div className="flex items-center gap-3">
              <MessageSquare size={24} className="text-green-700" />
              <h2 className="text-2xl font-bold text-green-800">
                Enquire About This Product
              </h2>
            </div>

            <form onSubmit={sendEnquiry} className="mt-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="font-semibold text-green-800">Your Name
                  <input value={buyerName} onChange={(event) => setBuyerName(event.target.value)} required minLength={2} maxLength={100}
                    className="mt-2 block w-full rounded-xl border border-green-200 px-4 py-3 font-normal" />
                </label>
                <label className="font-semibold text-green-800">Phone Number
                  <input type="tel" value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} required maxLength={30}
                    className="mt-2 block w-full rounded-xl border border-green-200 px-4 py-3 font-normal" />
                </label>
              </div>
              <label className="block font-semibold text-green-800">Quantity Required ({product.unit || "units"})
                <input value={buyerQuantity} onChange={(event) => setBuyerQuantity(event.target.value)} required maxLength={100}
                  placeholder="Example: 10" className="mt-2 block w-full rounded-xl border border-green-200 px-4 py-3 font-normal" />
              </label>
              <label className="block font-semibold text-green-800">Message (Optional)
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={2000}
                  placeholder="Ask about availability or delivery..." className="mt-2 block w-full border border-green-200 rounded-xl p-4 font-normal" />
              </label>
              <button type="submit" disabled={Boolean(busy)}
                className="mt-4 bg-green-700 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50">
                {busy === "enquiry" ? "Sending..." : "Send Product Request"}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
