
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Search,
  TrendingUp,
  MapPin,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API = "/api/market-prices";
const PAGE_SIZE = 20;

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

function showPrice(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "—";
  }

  const numeric = Number(
    String(value).replace(/,/g, "")
  );

  return Number.isFinite(numeric)
    ? `₹${numeric.toLocaleString("en-IN")}`
    : String(value);
}

export default function MarketPricePage() {
  const user = getUser();

  const dashboardPath =
    user.role === "buyer"
      ? "/customer-dashboard"
      : "/farmer-dashboard";

  const [commodity, setCommodity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [market, setMarket] = useState("");

  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(false);
  const [searched, setSearched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [partial, setPartial] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const [showPreviousResults, setShowPreviousResults] =
    useState(false);

  const lastSearch = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function loadPrices(
    filters,
    nextPage
  ) {
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    setMessage("");
    setShowPreviousResults(false);

    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: String(PAGE_SIZE),
    });

    if (filters.commodity) {
      params.set(
        "commodity",
        filters.commodity
      );
    }

    if (filters.district) {
      params.set(
        "district",
        filters.district
      );
    }

    if (filters.state) {
      params.set("state", filters.state);
    }

    if (filters.market) {
      params.set("market", filters.market);
    }

    try {
      const response = await fetch(
        `${API}?${params.toString()}`,
        {
          signal: controller.signal,
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The backend returned an invalid response."
        );
      }

      if (
        !response.ok ||
        data.success === false
      ) {
        throw new Error(
          data.message ||
          "Unable to load government prices."
        );
      }

      if (!Array.isArray(data.records)) {
        throw new Error(
          "Government price records are invalid."
        );
      }

      if (controller.signal.aborted) {
        return;
      }

      setRecords(data.records);
      setHasMore(Boolean(data.hasMore));
      setPage(nextPage);

      setPartial(Boolean(data.partial));
      setMessage(data.message || "");

      setLastUpdated(
        new Date().toLocaleString("en-IN")
      );

      setSearched(true);
      setShowPreviousResults(false);
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      setError(
        err.message ||
        "Unable to connect to the backend."
      );

      setSearched(true);

      // Preserve previously successful results
      // instead of clearing them when a new
      // government API request fails.
      setShowPreviousResults(
        records.length > 0
      );
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }

  function search(event) {
    event.preventDefault();

    const filters = {
      commodity: commodity.trim(),
      district: district.trim(),
      state: state.trim(),
      market: market.trim(),
    };

    if (
      !Object.values(filters).some(Boolean)
    ) {
      setError(
        "Enter at least one search field."
      );

      return;
    }

    lastSearch.current = filters;

    loadPrices(filters, 1);
  }

  function goToPage(nextPage) {
    if (
      !lastSearch.current ||
      loading ||
      nextPage < 1
    ) {
      return;
    }

    loadPrices(
      lastSearch.current,
      nextPage
    );
  }

  function retrySearch() {
    if (!lastSearch.current || loading) {
      return;
    }

    loadPrices(
      lastSearch.current,
      page
    );
  }

  const inputClass =
    "w-full border border-green-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-green-500";

  return (
    <main className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Link
          to={dashboardPath}
          className="text-green-700 font-bold"
        >
          ← Back to Dashboard
        </Link>

        <section className="bg-white rounded-3xl p-5 md:p-10 mt-6 border border-green-100 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-green-100 flex items-center justify-center shrink-0">
              <TrendingUp
                className="text-green-700"
                size={34}
              />
            </div>

            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-green-700">
                Market Prices
              </h1>

              <p className="text-gray-600 mt-2">
                Search agricultural commodity prices
                reported by government mandis.
              </p>
            </div>
          </div>

          <form
            onSubmit={search}
            className="grid md:grid-cols-2 gap-5 mt-9"
          >
            <div>
              <label className="block font-bold text-gray-700 mb-2">
                Crop / Commodity
              </label>

              <div className="flex items-center gap-2 border border-green-200 rounded-2xl px-4">
                <Search
                  size={19}
                  className="text-green-700 shrink-0"
                />

                <input
                  value={commodity}
                  onChange={(event) =>
                    setCommodity(event.target.value)
                  }
                  placeholder="e.g. Potato, Tomato, Paddy"
                  className="w-full py-4 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-2">
                District
              </label>

              <div className="flex items-center gap-2 border border-green-200 rounded-2xl px-4">
                <MapPin
                  size={19}
                  className="text-green-700 shrink-0"
                />

                <input
                  value={district}
                  onChange={(event) =>
                    setDistrict(event.target.value)
                  }
                  placeholder="e.g. Chennai, Coimbatore"
                  className="w-full py-4 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-2">
                State (Optional)
              </label>

              <input
                value={state}
                onChange={(event) =>
                  setState(event.target.value)
                }
                placeholder="e.g. Tamil Nadu"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-2">
                Market / Mandi (Optional)
              </label>

              <input
                value={market}
                onChange={(event) =>
                  setMarket(event.target.value)
                }
                placeholder="Enter mandi name"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 bg-green-700 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Search size={19} />

              {loading
                ? "Searching Government Records..."
                : "Search Market Prices"}
            </button>
          </form>

          {!searched && !error && (
            <div className="bg-green-50 rounded-2xl p-7 mt-8 text-gray-700">
              Enter a crop, district, state or market
              name and click Search Market Prices.
              Results will appear below.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 mt-8"
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={22}
                  className="shrink-0"
                />

                <div className="flex-1">
                  <p className="font-bold">
                    Unable to Complete Search
                  </p>

                  <p className="mt-2">{error}</p>

                  <button
                    type="button"
                    onClick={retrySearch}
                    disabled={loading || !lastSearch.current}
                    className="mt-4 inline-flex items-center gap-2 bg-green-700 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-50"
                  >
                    <RefreshCw size={17} />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading &&
            searched &&
            !error &&
            records.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mt-8">
                <p className="font-bold text-green-800">
                  No Matching Mandi Prices
                </p>

                <p className="text-gray-600 mt-2">
                  {message ||
                    "No matching government mandi records were returned."}
                </p>

                <p className="text-gray-500 mt-3 text-sm">
                  Try searching with a different crop
                  spelling, district or nearby mandi.
                  Some markets do not report prices for
                  every crop.
                </p>
              </div>
            )}

          {!loading && records.length > 0 && (
            <>
              {showPreviousResults && (
                <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 text-orange-800">
                  The latest search failed. The prices
                  below are from your previous successful
                  search, not the new search.
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-green-800">
                    Mandi Price Results
                  </h2>

                  <p className="text-sm text-gray-600 mt-2">
                    Source: Government AGMARKNET data
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    Prices generally in ₹ per quintal.
                    Check each record's reporting date.
                  </p>
                </div>

                {lastUpdated && (
                  <p className="text-sm text-gray-500">
                    Retrieved: {lastUpdated}
                  </p>
                )}
              </div>

              {partial && (
                <p className="mt-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl p-4">
                  This search examined a limited number
                  of government records. More matching
                  records may exist outside the scanned
                  range.
                </p>
              )}

              <div className="overflow-x-auto mt-5 rounded-2xl border border-green-100">
                <table className="w-full min-w-[950px]">
                  <thead className="bg-green-700 text-white">
                    <tr>
                      {[
                        "Commodity",
                        "Market",
                        "District",
                        "State",
                        "Variety",
                        "Min Price",
                        "Max Price",
                        "Modal Price",
                        "Date",
                      ].map((label) => (
                        <th
                          key={label}
                          className="p-4 text-left"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {records.map((item, index) => (
                      <tr
                        key={`${page}-${index}`}
                        className="border-b border-green-100 hover:bg-green-50"
                      >
                        <td className="p-4 font-bold text-green-700">
                          {item.commodity || "—"}
                        </td>

                        <td className="p-4">
                          {item.market || "—"}
                        </td>

                        <td className="p-4">
                          {item.district || "—"}
                        </td>

                        <td className="p-4">
                          {item.state || "—"}
                        </td>

                        <td className="p-4">
                          {item.variety || "—"}
                        </td>

                        <td className="p-4">
                          {showPrice(item.min_price)}
                        </td>

                        <td className="p-4">
                          {showPrice(item.max_price)}
                        </td>

                        <td className="p-4 font-bold">
                          {showPrice(item.modal_price)}
                        </td>

                        <td className="p-4">
                          {item.arrival_date || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center gap-3 mt-6">
                <button
                  type="button"
                  disabled={loading || page === 1}
                  onClick={() =>
                    goToPage(page - 1)
                  }
                  className="flex gap-2 items-center bg-green-100 text-green-800 px-5 py-3 rounded-xl font-bold disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>

                <span className="font-bold text-green-800">
                  Page {page}
                </span>

                <button
                  type="button"
                  disabled={loading || !hasMore}
                  onClick={() =>
                    goToPage(page + 1)
                  }
                  className="flex gap-2 items-center bg-green-700 text-white px-5 py-3 rounded-xl font-bold disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
