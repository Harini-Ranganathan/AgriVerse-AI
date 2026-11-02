
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Search,
  Phone,
  CalendarDays,
  MapPin,
  Inbox,
  Trash2,
  Check,
  ExternalLink,
  Leaf,
  RefreshCw,
} from "lucide-react";

const API = "/api/marketplace-lands";

function getId(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
}

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

function getLands(data) {
  if (Array.isArray(data)) return data;

  for (const key of ["lands", "listings", "items", "data"]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  throw new Error("Invalid land response.");
}

function getImage(land) {
  const image = land.images?.[0] || land.image;

  return typeof image === "string"
    ? image
    : image?.url || image?.secure_url || "";
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatPrice(value) {
  if (value === undefined || value === null || value === "") {
    return "Price on request";
  }

  const price = String(value).trim();
  const number = Number(price.replace(/,/g, ""));

  if (Number.isFinite(number)) {
    return `₹${number.toLocaleString("en-IN")}`;
  }

  return price.startsWith("₹") ? price : `₹${price}`;
}

async function readJSON(response) {
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

export default function LandRequestsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [params, setParams] = useSearchParams();

  const user = getUser();
  const token = sessionStorage.getItem("agriverseToken");

  const selectedId = params.get("landId") || "";
  const singleLand = Boolean(selectedId);

  const currentPath = location.pathname + location.search;

  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [reload, setReload] = useState(0);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        if (!token) {
          throw new Error("Please log in again.");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const response = await fetch(`${API}/mine`, {
          headers,
          signal,
        });

        const data = await readJSON(response);

        const records = getLands(data);

        // Opening this page automatically marks received
        // requests as read for the authenticated landowner.
        const results = await Promise.allSettled(
          records.map(async (land) => {
            const requests = Array.isArray(land.buyerRequests)
              ? land.buyerRequests
              : [];

            const hasUnread = requests.some(
              (request) => request.read === false
            );

            if (!hasUnread) {
              return land;
            }

            const landId = getId(land._id || land.id);

            const markResponse = await fetch(
              `${API}/${encodeURIComponent(
                landId
              )}/mark-requests-read`,
              {
                method: "PATCH",
                headers,
                signal,
              }
            );

            await readJSON(markResponse);

            return {
              ...land,
              unreadBuyerCount: 0,
              buyerRequests: requests.map((request) => ({
                ...request,
                read: true,
              })),
            };
          })
        );

        if (signal.aborted) return;

        const updatedLands = results.map((result, index) =>
          result.status === "fulfilled"
            ? result.value
            : records[index]
        );

        setLands(updatedLands);

        if (results.some((result) => result.status === "rejected")) {
          setError(
            "Some requests could not be marked as read. Try refreshing."
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
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();

    load(controller.signal);

    return () => controller.abort();
  }, [load, reload]);

  const visibleLands = useMemo(() => {
    const query = search.trim().toLowerCase();

    return lands.filter((land) => {
      if (
        selectedId &&
        getId(land._id || land.id) !== selectedId
      ) {
        return false;
      }

      const requests = Array.isArray(land.buyerRequests)
        ? land.buyerRequests
        : [];

      if (!query) return true;

      return [
        land.title,
        land.location,
        land.city,
        ...requests.flatMap((request) => [
          request.buyerName,
          request.buyerUsername,
          request.buyerPhone,
          request.buyerMessage,
        ]),
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [lands, selectedId, search]);

  const displayed = useMemo(
    () =>
      visibleLands.map((land) => ({
        land,
        requests: (
          Array.isArray(land.buyerRequests)
            ? land.buyerRequests
            : []
        )
          .filter((request) => {
            const query = search.trim().toLowerCase();

            if (!query) return true;

            return [
              land.title,
              land.location,
              land.city,
              request.buyerName,
              request.buyerUsername,
              request.buyerPhone,
              request.buyerMessage,
            ].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(query)
            );
          })
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0) -
              new Date(a.createdAt || 0)
          ),
      })),
    [visibleLands, search]
  );

  const totalRequests = lands.reduce(
    (sum, land) =>
      sum + (land.buyerRequests?.length || 0),
    0
  );

  const selectedLand = singleLand
    ? lands.find(
        (land) => getId(land._id || land.id) === selectedId
      )
    : null;

  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(
        user.role === "farmer"
          ? "/farmer-dashboard"
          : "/customer-dashboard",
        { replace: true }
      );
    }
  }

  function selectLand(id) {
    setParams(id ? { landId: id } : {});
    setSearch("");
  }

  function openLand(land) {
    navigate(
      `/marketplace-land/${encodeURIComponent(
        getId(land._id || land.id)
      )}`,
      {
        state: { from: currentPath },
      }
    );
  }

  function keepRequest() {
    // The request is already stored in MongoDB.
    // Keeping it requires no backend modification.
    setNotice("Request kept in your received requests.");
    setError("");
  }

  async function deleteRequest(land, request) {
    const landId = getId(land._id || land.id);
    const requestId = getId(request._id || request.id);

    if (!requestId) {
      setError("This request is missing its ID.");
      return;
    }

    if (
      !window.confirm(
        "Delete this buyer request permanently?"
      )
    ) {
      return;
    }

    setBusy(`delete-${landId}-${requestId}`);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `${API}/${encodeURIComponent(
          landId
        )}/requests/${encodeURIComponent(requestId)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await readJSON(response);

      setLands((previous) =>
        previous.map((item) => {
          if (getId(item._id || item.id) !== landId) {
            return item;
          }

          const remaining = (
            item.buyerRequests || []
          ).filter(
            (entry) =>
              getId(entry._id || entry.id) !== requestId
          );

          return {
            ...item,
            buyerRequests: remaining,
            unreadBuyerCount: remaining.filter(
              (entry) => entry.read === false
            ).length,
          };
        })
      );

      setNotice("Request deleted successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

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

        <section className="mt-6 bg-white rounded-3xl border border-green-200 p-6 md:p-9 shadow-sm">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-green-800">
                {singleLand
                  ? "Land Buyer Requests"
                  : "All Land Requests"}
              </h1>

              <p className="text-gray-600 mt-2">
                {singleLand
                  ? "Requests received for this particular land."
                  : "Buyer requests arranged under each land listing."}
              </p>
            </div>

            {singleLand ? (
              <button
                type="button"
                onClick={() => selectLand("")}
                className="bg-orange-100 text-orange-900 px-5 py-3 rounded-xl font-bold"
              >
                All Land Requests
              </button>
            ) : (
              <Link
                to="/land-marketplace"
                className="bg-green-700 text-white px-5 py-3 rounded-xl font-bold"
              >
                Open Marketplace
              </Link>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 text-red-700 p-4"
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="mt-5 rounded-xl bg-green-100 text-green-800 p-4"
            >
              {notice}
            </p>
          )}

          {!singleLand && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
              <div className="bg-green-50 rounded-2xl p-5">
                <p className="text-gray-600">
                  My Land Listings
                </p>

                <p className="text-3xl font-bold text-green-800 mt-2">
                  {lands.length}
                </p>
              </div>

              <div className="bg-green-50 rounded-2xl p-5">
                <p className="text-gray-600">
                  Total Requests
                </p>

                <p className="text-3xl font-bold text-green-800 mt-2">
                  {totalRequests}
                </p>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <label className="flex flex-1 min-w-48 items-center gap-2 border border-green-200 rounded-xl px-4">
              <Search
                size={18}
                className="text-green-700"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search land, buyer or message"
                className="w-full py-3 outline-none"
              />
            </label>

            {!singleLand && (
              <select
                value=""
                onChange={(event) =>
                  selectLand(event.target.value)
                }
                aria-label="Choose specific land"
                className="border border-green-200 rounded-xl px-4 py-3"
              >
                <option value="">All Lands</option>

                {lands.map((land) => (
                  <option
                    key={getId(land._id || land.id)}
                    value={getId(land._id || land.id)}
                  >
                    {land.title || "Farm Land"}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() =>
                setReload((value) => value + 1)
              }
              className="bg-green-100 text-green-800 rounded-xl px-5 py-3 font-bold flex items-center gap-2"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-10 text-green-700 font-bold">
              Loading buyer requests...
            </p>
          ) : singleLand && !selectedLand ? (
            <div className="mt-8 bg-green-50 p-8 rounded-2xl">
              <p className="font-bold text-gray-700">
                This land wasn't found in your listings.
              </p>

              <button
                type="button"
                onClick={() => selectLand("")}
                className="text-green-700 font-bold mt-3"
              >
                View all lands
              </button>
            </div>
          ) : displayed.length === 0 ? (
            <div className="mt-8 text-center bg-green-50 rounded-2xl p-10">
              <Inbox
                size={40}
                className="mx-auto text-green-700"
              />

              <p className="mt-4 text-gray-600">
                No matching lands or requests found.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {displayed.map(({ land, requests }) => {
                const landId = getId(land._id || land.id);
                const photo = getImage(land);

                return (
                  <section
                    key={landId}
                    className="border border-green-200 rounded-2xl overflow-hidden bg-white"
                  >
                    <div className="bg-green-50 p-5 md:p-6 flex flex-col md:flex-row gap-5">
                      <button
                        type="button"
                        onClick={() => openLand(land)}
                        className="shrink-0 text-left"
                      >
                        {photo ? (
                          <img
                            src={photo}
                            alt={land.title || "Farm Land"}
                            className="w-full md:w-48 h-36 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-full md:w-48 h-36 bg-green-100 rounded-xl flex items-center justify-center">
                            <Leaf
                              size={38}
                              className="text-green-700"
                            />
                          </div>
                        )}
                      </button>

                      <div className="flex-1">
                        <h2 className="text-2xl font-extrabold text-green-800">
                          {land.title || "Farm Land"}
                        </h2>

                        <p className="mt-2 flex items-start gap-2 text-gray-600">
                          <MapPin
                            size={18}
                            className="shrink-0"
                          />

                          {land.location ||
                            land.city ||
                            "Location not specified"}
                        </p>

                        <p className="mt-2 font-bold text-green-700">
                          {formatPrice(land.price)}
                        </p>

                        <p className="mt-2 text-gray-700 font-semibold">
                          {land.buyerRequests?.length || 0} requests
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => openLand(land)}
                        className="self-start bg-green-700 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2"
                      >
                        <ExternalLink size={17} />
                        Open Land
                      </button>
                    </div>

                    <div className="p-5 md:p-6">
                      {requests.length === 0 ? (
                        <p className="text-gray-600 bg-green-50 rounded-xl p-5">
                          No buyer requests for this land
                          {search
                            ? " match your search."
                            : " yet."}
                        </p>
                      ) : (
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                          {requests.map((request, index) => {
                            const requestId = getId(
                              request._id || request.id
                            );

                            return (
                              <article
                                key={`${landId}-${requestId || index}`}
                                className="border border-green-200 rounded-xl p-5 bg-white shadow-sm"
                              >
                                <h3 className="font-bold text-green-800 text-lg">
                                  {request.buyerName ||
                                    request.buyerUsername ||
                                    "Interested Buyer"}
                                </h3>

                                <p className="mt-3 flex items-center gap-2 text-gray-700">
                                  <Phone size={17} />

                                  {request.buyerPhone ||
                                    "Phone not provided"}
                                </p>

                                <p className="mt-2 flex items-center gap-2 text-gray-600 text-sm">
                                  <CalendarDays size={16} />

                                  {formatDate(
                                    request.createdAt
                                  )}
                                </p>

                                <div className="mt-4 rounded-xl bg-green-50 p-4">
                                  <p className="font-bold text-green-800">
                                    Buyer Message
                                  </p>

                                  <p className="mt-2 text-gray-700 break-words whitespace-pre-wrap">
                                    {request.buyerMessage ||
                                      "No message provided."}
                                  </p>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={keepRequest}
                                    disabled={Boolean(busy)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-700 text-white font-bold rounded-xl disabled:opacity-50"
                                  >
                                    <Check size={17} />
                                    Keep
                                  </button>

                                  <button
                                    type="button"
                                    disabled={Boolean(busy)}
                                    onClick={() =>
                                      deleteRequest(
                                        land,
                                        request
                                      )
                                    }
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 font-bold rounded-xl disabled:opacity-50"
                                  >
                                    <Trash2 size={17} />
                                    Delete
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
