
import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Crown,
  LockKeyhole,
  Droplets,
  Mountain,
  CalendarDays,
  Leaf,
  CheckCircle2,
  AlertCircle,
  X,
  ZoomIn,
  ZoomOut,
  Trash2,
  Pencil,
  MessageSquare,
  ExternalLink,
} from "lucide-react";

const API = "/api/marketplace-lands";

function getUser() {
  try {
    return (
      JSON.parse(
        localStorage.getItem("agriverseCurrentUser") || "{}"
      ) || {}
    );
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

function getImages(land) {
  const values = [
    ...(Array.isArray(land?.images) ? land.images : []),
    ...(land?.image ? [land.image] : []),
  ];

  return values
    .map((image) =>
      typeof image === "string"
        ? image
        : image?.url || image?.secure_url || ""
    )
    .filter(
      (image, index, all) =>
        Boolean(image) && all.indexOf(image) === index
    );
}

async function readJSON(response) {
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      "The server returned an invalid response. Check that the backend is running."
    );
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed (${response.status}).`
    );
  }

  return data;
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not specified"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function displayPrice(value) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return "Price on request";
  }

  const original = String(value).trim();

  const numeric = Number(original.replace(/,/g, ""));

  if (Number.isFinite(numeric)) {
    return `₹${numeric.toLocaleString("en-IN")}`;
  }

  return original.startsWith("₹")
    ? original
    : `₹${original}`;
}

function Info({ label, value, icon }) {
  return (
    <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-green-700">
        {icon}

        <span className="font-semibold">
          {label}
        </span>
      </div>

      <p className="mt-3 font-bold text-gray-800 break-words">
        {value === undefined ||
        value === null ||
        value === ""
          ? "Not specified"
          : value}
      </p>
    </div>
  );
}

export default function MarketplaceLandDetailsPage() {
  const params = useParams();

  const landId = params.landId || params.id;

  const navigate = useNavigate();
  const location = useLocation();

  const user = getUser();

  const username = user.username || "";

  const token = sessionStorage.getItem("agriverseToken");

  const role = String(user.role || "").toLowerCase();

  const dashboard =
    role === "farmer"
      ? "/farmer-dashboard"
      : "/customer-dashboard";

  const currentPath =
    location.pathname + location.search;

  const [land, setLand] = useState(null);

  const [isOwner, setIsOwner] = useState(false);

  const [subscription, setSubscription] = useState(null);

  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState("");

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");

  const [selectedImage, setSelectedImage] = useState("");

  const [zoom, setZoom] = useState(1);

  const [buyerName, setBuyerName] = useState(
    user.fullName ||
    user.name ||
    username
  );

  const [buyerPhone, setBuyerPhone] = useState("");

  const [buyerMessage, setBuyerMessage] = useState("");

  const images = useMemo(
    () => (land ? getImages(land) : []),
    [land]
  );

  const requests = useMemo(() => {
    const entries = Array.isArray(land?.buyerRequests)
      ? land.buyerRequests
      : [];

    return [...entries].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
  }, [land]);

  const requestCount = requests.length;

  const contactUnlocked =
    land?.contactUnlocked === true;

  const hasSellerName =
    typeof land?.sellerName === "string" &&
    land.sellerName.trim().length > 0;

  const hasSellerPhone =
    typeof land?.sellerPhone === "string" &&
    land.sellerPhone.trim().length > 0;

  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate("/land-marketplace", {
        replace: true,
      });
    }
  }

  function openRequests() {
    navigate(
      `/land-requests?landId=${encodeURIComponent(landId)}`,
      {
        state: {
          from: currentPath,
          landId,
        },
      }
    );
  }

  function openEdit() {
    navigate(
      `/sell-land?landId=${encodeURIComponent(landId)}`,
      {
        state: {
          from: currentPath,
        },
      }
    );
  }

  async function refreshLand() {
    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {};

    const response = await fetch(
      `${API}/${encodeURIComponent(landId)}`,
      {
        headers,
      }
    );

    const data = await readJSON(response);

    const found =
      data.land ||
      data.listing ||
      data.data;

    if (!found) {
      throw new Error("Land listing not found.");
    }

    setLand(found);

    setIsOwner(Boolean(found.isOwner));

    return found;
  }

  async function refreshSubscription() {
    if (!token) {
      setSubscription(null);
      return;
    }

    const response = await fetch(
      `${API}/access/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await readJSON(response);

    setSubscription(data);

    return data;
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadLand() {
      setLoading(true);

      setError("");

      setLand(null);

      setIsOwner(false);

      try {
        const headers = token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {};

        const response = await fetch(
          `${API}/${encodeURIComponent(landId)}`,
          {
            headers,
            signal: controller.signal,
          }
        );

        const data = await readJSON(response);

        const found =
          data.land ||
          data.listing ||
          data.data;

        if (!found) {
          throw new Error("Land listing not found.");
        }

        if (controller.signal.aborted) {
          return;
        }

        setLand(found);

        setIsOwner(Boolean(found.isOwner));

        if (token) {
          const accessResponse = await fetch(
            `${API}/access/me`,
            {
              headers,
              signal: controller.signal,
            }
          );

          if (accessResponse.ok) {
            const accessData = await readJSON(
              accessResponse
            );

            if (!controller.signal.aborted) {
              setSubscription(accessData);
            }
          }
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

    loadLand();

    return () => {
      controller.abort();
    };
  }, [landId, token]);

  async function activateDemo() {
    if (busy) return;

    if (!token) {
      setError(
        "Please log in to unlock seller contact details."
      );
      return;
    }

    if (role !== "buyer") {
      setError(
        "Only buyers need to activate demo payments."
      );
      return;
    }

    setBusy("land");

    setError("");

    setNotice("");

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(
          landId
        )}/access/demo-unlock`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await readJSON(response);

      if (data.success !== true) {
        throw new Error(
          data.message || "Demo payment failed."
        );
      }

      const updatedLand = await refreshLand();

      await refreshSubscription();

      if (!updatedLand.contactUnlocked) {
        throw new Error(
          "Demo payment was recorded, but seller contact could not be loaded. Please refresh the page."
        );
      }

      setNotice(
        "₹50 demo payment successful! Seller contact is now unlocked for this land until the listing is deleted."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function activateSubscription() {
    if (busy) return;

    if (!token) {
      setError("Please log in to activate a subscription.");
      return;
    }

    if (role !== "buyer") {
      setError("Only buyers need subscriptions.");
      return;
    }

    setBusy("subscription");

    setError("");

    setNotice("");

    try {
      const response = await fetch(
        `${API}/access/demo-subscribe`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await readJSON(response);

      if (data.success !== true) {
        throw new Error(
          data.message || "Subscription activation failed."
        );
      }

      await refreshSubscription();

      const updatedLand = await refreshLand();

      if (!updatedLand.contactUnlocked) {
        throw new Error(
          "Subscription was activated, but seller contact could not be loaded. Please refresh the page."
        );
      }

      setNotice(
        "₹500 demo subscription activated! Seller contact details are unlocked for all available lands for 30 days."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function sendInterestRequest(event) {
    event.preventDefault();

    if (!land || isOwner || busy) {
      return;
    }

    if (!token) {
      setError("Please log in again.");
      return;
    }

    if (
      buyerName.trim().length < 2 ||
      !/^[+0-9()\s-]{7,30}$/.test(buyerPhone.trim()) ||
      !buyerMessage.trim()
    ) {
      setError(
        "Enter your name, valid phone number and message."
      );
      return;
    }

    setBusy("request");

    setError("");

    setNotice("");

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(
          landId
        )}/requests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            buyerName: buyerName.trim(),
            buyerPhone: buyerPhone.trim(),
            buyerMessage: buyerMessage.trim(),
          }),
        }
      );

      await readJSON(response);

      setBuyerMessage("");

      setNotice(
        "Your interest request was sent successfully."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function deleteLand() {
    if (!isOwner || busy) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this land listing?"
    );

    if (!confirmed) {
      return;
    }

    setBusy("delete");

    setError("");

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(landId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await readJSON(response);

      navigate(dashboard, {
        replace: true,
      });
    } catch (err) {
      setError(err.message);

      setBusy("");
    }
  }

  const field =
    "w-full border border-green-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500";

  if (loading) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center">
        <p className="text-green-700 font-bold">
          Loading land details...
        </p>
      </main>
    );
  }

  if (!land) {
    return (
      <main className="min-h-screen bg-green-50 p-8">
        <button
          type="button"
          onClick={goBack}
          className="text-green-700 font-bold flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <p className="mt-8 text-red-700">
          {error || "Land not found."}
        </p>
      </main>
    );
  }

  const mapAddress =
    land.exactAddress ||
    land.address ||
    land.location ||
    [land.city, land.state]
      .filter(Boolean)
      .join(", ");

  return (
    <main className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 font-bold text-green-700"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {error && (
          <p
            role="alert"
            className="mt-5 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex gap-2"
          >
            <AlertCircle size={18} />
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mt-5 p-4 rounded-xl bg-green-100 text-green-800 flex gap-2"
          >
            <CheckCircle2 size={18} />
            {notice}
          </p>
        )}

        <section className="mt-6 bg-white rounded-3xl border border-green-200 overflow-hidden shadow-sm">
          {images[0] ? (
            <button
              type="button"
              onClick={() => {
                setSelectedImage(images[0]);
                setZoom(1);
              }}
              className="block w-full"
            >
              <img
                src={images[0]}
                alt={land.title || "Farm Land"}
                className="w-full h-64 md:h-96 object-cover"
              />
            </button>
          ) : (
            <div className="h-64 bg-green-100 flex items-center justify-center">
              <Leaf
                size={60}
                className="text-green-700"
              />
            </div>
          )}

          <div className="p-6 md:p-9">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-green-800">
                  {land.title || "Farm Land"}
                </h1>

                <p className="mt-3 text-gray-600 flex items-center gap-2">
                  <MapPin size={19} />

                  {land.location ||
                    land.city ||
                    "Not specified"}
                </p>
              </div>

              <div className="bg-green-700 text-white rounded-2xl px-6 py-4">
                <p className="text-2xl font-bold">
                  {displayPrice(land.price)}
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="px-4 py-3 bg-green-100 text-green-800 rounded-xl font-bold">
                  Your Land
                </span>

                <button
                  type="button"
                  onClick={openRequests}
                  className="bg-orange-100 text-orange-800 px-5 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                  <MessageSquare size={18} />

                  Buyer Requests ({requestCount})

                  <ExternalLink size={16} />
                </button>

                <button
                  type="button"
                  onClick={openEdit}
                  className="bg-green-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                  <Pencil size={18} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={deleteLand}
                  disabled={Boolean(busy)}
                  className="bg-red-50 text-red-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </section>

        {images.length > 1 && (
          <section className="mt-7 bg-white border border-green-200 rounded-3xl p-6">
            <h2 className="text-2xl font-bold text-green-800">
              Land Images
            </h2>

            <div className="flex gap-4 overflow-x-auto mt-5 pb-3">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  onClick={() => {
                    setSelectedImage(image);
                    setZoom(1);
                  }}
                  className="w-56 h-40 shrink-0 overflow-hidden rounded-xl"
                >
                  <img
                    src={image}
                    alt={`Land ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-3 gap-7 mt-7">
          <div className="lg:col-span-2 space-y-7">
            <section className="bg-white rounded-3xl p-6 md:p-8 border border-green-200">
              <h2 className="text-2xl font-bold text-green-800">
                Land Information
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Info
                  label="Area"
                  value={land.area}
                  icon={<Leaf size={18} />}
                />

                <Info
                  label="Soil Type"
                  value={land.soil}
                  icon={<Mountain size={18} />}
                />

                <Info
                  label="Water Availability"
                  value={land.water}
                  icon={<Droplets size={18} />}
                />

                <Info
                  label="Posted"
                  value={formatDate(land.createdAt)}
                  icon={<CalendarDays size={18} />}
                />

                <Info
                  label="Land Type"
                  value={land.landType}
                />

                <Info
                  label="Irrigation"
                  value={land.irrigationType}
                />

                <Info
                  label="Road Access"
                  value={land.roadAccess}
                />

                <Info
                  label="Electricity"
                  value={land.electricity}
                />

                <Info
                  label="Previous Crops"
                  value={land.previousCrops}
                />

                <Info
                  label="City / District"
                  value={land.city}
                />

                <Info
                  label="State"
                  value={land.state}
                />
              </div>

              <h3 className="text-xl font-bold text-green-800 mt-8">
                Land Description
              </h3>

              <p className="text-gray-700 mt-3 whitespace-pre-wrap">
                {land.description ||
                  "No description provided."}
              </p>
            </section>

            {mapAddress && (
              <section className="bg-white border border-green-200 rounded-3xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-green-800">
                  Land Location
                </h2>

                <p className="mt-4 text-gray-600 flex items-center gap-2">
                  <MapPin size={18} />

                  {mapAddress}
                </p>

                <div className="mt-5 overflow-hidden rounded-2xl">
                  <iframe
                    title="Land Location"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      mapAddress
                    )}&z=15&output=embed`}
                    width="100%"
                    height="350"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    mapAddress
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-green-700 font-bold"
                >
                  <ExternalLink size={17} />
                  Open in Google Maps
                </a>
              </section>
            )}
          </div>

          <div className="space-y-7">
            <section className="bg-white border border-green-200 rounded-3xl p-6">
              <h2 className="text-2xl font-bold text-green-800">
                Seller Contact
              </h2>

              {contactUnlocked ? (
                <div className="mt-5 space-y-4">
                  {hasSellerName && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                      <p className="flex items-center gap-2 font-semibold text-green-700">
                        <User size={18} />
                        Seller Name
                      </p>

                      <p className="mt-3 font-bold text-gray-800">
                        {land.sellerName}
                      </p>
                    </div>
                  )}

                  {hasSellerPhone && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                      <p className="flex items-center gap-2 font-semibold text-green-700">
                        <Phone size={18} />
                        Phone Number
                      </p>

                      <p className="mt-3 font-bold text-gray-800">
                        {land.sellerPhone}
                      </p>
                    </div>
                  )}

                  {!hasSellerName && !hasSellerPhone && (
                    <p className="text-amber-700">
                      Contact access is unlocked, but the seller has not provided contact information.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5">
                  {role === "buyer" ? (
                    <button
                      type="button"
                      onClick={activateDemo}
                      disabled={Boolean(busy)}
                      className="w-full bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl px-5 py-4 disabled:opacity-50"
                    >
                      {busy === "land"
                        ? "Processing Demo Payment..."
                        : "Pay ₹50 to View Seller Contact"}
                    </button>
                  ) : (
                    <p className="text-gray-600">
                      <LockKeyhole
                        size={18}
                        className="inline mr-2"
                      />
                      Please log in to view seller contact.
                    </p>
                  )}
                </div>
              )}

              {role === "buyer" &&
                subscription?.subscriptionActive && (
                  <p className="mt-5 flex items-center gap-2 font-bold text-green-800">
                    <Crown
                      size={19}
                      className="text-amber-600"
                    />

                    Subscribed until{" "}
                    {formatDate(subscription.expiresAt)}
                  </p>
                )}
            </section>

            {isOwner ? (
              <section className="bg-white border border-green-200 rounded-3xl p-6">
                <h2 className="text-2xl font-bold text-green-800">
                  Buyer Requests
                </h2>

                <p className="mt-3 text-gray-600">
                  {requestCount === 0
                    ? "No buyer requests received yet."
                    : `${requestCount} buyer request${
                        requestCount === 1 ? "" : "s"
                      } received for this land.`}
                </p>

                <button
                  type="button"
                  onClick={openRequests}
                  className="mt-5 w-full bg-orange-100 text-orange-800 rounded-xl px-5 py-4 font-bold flex items-center justify-center gap-2"
                >
                  <MessageSquare size={18} />

                  View Buyer Requests ({requestCount})

                  <ExternalLink size={16} />
                </button>
              </section>
            ) : (
              <section className="bg-white border border-green-200 rounded-3xl p-6">
                <h2 className="text-2xl font-bold text-green-800">
                  Interested in This Land?
                </h2>

                <p className="text-gray-600 mt-2">
                  Send an interest request to the seller.
                </p>

                <form
                  onSubmit={sendInterestRequest}
                  className="mt-5 space-y-4"
                >
                  <input
                    value={buyerName}
                    onChange={(event) =>
                      setBuyerName(event.target.value)
                    }
                    placeholder="Your Name"
                    aria-label="Your Name"
                    required
                    className={field}
                  />

                  <input
                    type="tel"
                    value={buyerPhone}
                    onChange={(event) =>
                      setBuyerPhone(event.target.value)
                    }
                    placeholder="Phone Number"
                    aria-label="Phone Number"
                    required
                    className={field}
                  />

                  <textarea
                    value={buyerMessage}
                    onChange={(event) =>
                      setBuyerMessage(event.target.value)
                    }
                    placeholder="Message to Seller"
                    aria-label="Message to Seller"
                    rows={5}
                    maxLength={2000}
                    required
                    className={field}
                  />

                  <button
                    type="submit"
                    disabled={Boolean(busy)}
                    className="w-full bg-green-700 text-white rounded-xl px-5 py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />

                    {busy === "request"
                      ? "Sending..."
                      : "Send Interest Request"}
                  </button>
                </form>
              </section>
            )}
          </div>
        </div>

        {selectedImage && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged land image"
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedImage("");
                setZoom(1);
              }}
              aria-label="Close image"
              className="absolute top-5 right-5 bg-white rounded-full p-3 z-10"
            >
              <X size={24} />
            </button>

            <div className="absolute top-5 left-5 flex gap-3 z-10">
              <button
                type="button"
                onClick={() =>
                  setZoom((value) =>
                    Math.min(value + 0.25, 3)
                  )
                }
                className="bg-white rounded-xl p-3"
                aria-label="Zoom in"
              >
                <ZoomIn size={20} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setZoom((value) =>
                    Math.max(value - 0.25, 1)
                  )
                }
                className="bg-white rounded-xl p-3"
                aria-label="Zoom out"
              >
                <ZoomOut size={20} />
              </button>
            </div>

            <div className="w-full h-full overflow-auto flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Enlarged land"
                style={{
                  transform: `scale(${zoom})`,
                }}
                className="max-w-full max-h-[80vh] object-contain transition-transform"
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
