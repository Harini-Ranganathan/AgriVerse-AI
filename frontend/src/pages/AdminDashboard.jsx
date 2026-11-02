
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Users,
  Sprout,
  ShoppingBag,
  Map,
  Crown,
  Lock,
  LogOut,
  Search,
  RefreshCw,
  LayoutDashboard,
  UserRoundCog,
  Package,
  MessageSquare,
  AlertCircle,
  Tractor,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Archive,
} from "lucide-react";

const API = "/api/admin";

const MENU = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "User Management", icon: UserRoundCog },
  { id: "listings", label: "Marketplace Listings", icon: Package },
  { id: "subscriptions", label: "Subscriptions", icon: Crown },
  { id: "support", label: "Help Requests", icon: MessageSquare },
];

const LISTING_TABS = [
  { id: "products", label: "Products", icon: ShoppingBag },
  { id: "equipment", label: "Rental Equipment", icon: Tractor },
  { id: "lands", label: "Lands", icon: Map },
  { id: "unpublished", label: "Unpublished", icon: Archive },
];

const LISTING_TYPES = [
  { id: "products", label: "Products" },
  { id: "equipment", label: "Rental Equipment" },
  { id: "lands", label: "Lands" },
];

const SUPPORT_FILTERS = [
  ["all", "All Requests"],
  ["Open", "Open"],
  ["In Progress", "In Progress"],
  ["Resolved", "Resolved"],
];

function getUser() {
  try {
    return JSON.parse(
      localStorage.getItem("agriverseCurrentUser") || "{}"
    ) || {};
  } catch {
    return {};
  }
}

async function readJSON(response) {
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid response from backend.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message || `Request failed (${response.status}).`
    );
  }

  return data;
}

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString("en-IN");
}

function money(value) {
  if (value === undefined || value === null || value === "") {
    return "Not specified";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? `₹${number.toLocaleString("en-IN")}`
    : String(value);
}

function itemName(item) {
  return item.productName || item.name || item.title || "Untitled Listing";
}

function itemImage(item) {
  const value = item.image || item.images?.[0];

  return typeof value === "string"
    ? value
    : value?.url || "";
}

function itemPrice(item, type) {
  if (type === "equipment") {
    return `${money(item.rentAmount)} / ${item.rentType || "Per Day"}`;
  }

  return money(item.price);
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white border-2 border-green-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-gray-600 font-semibold">{title}</p>
          <h3 className="mt-3 text-3xl font-extrabold text-green-800">
            {value ?? "—"}
          </h3>
        </div>

        <div className="bg-green-100 text-green-700 p-4 rounded-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const token = sessionStorage.getItem("agriverseToken");

  const [page, setPage] = useState("overview");

  const [tab, setTab] = useState("products");
  const [unpublishedTab, setUnpublishedTab] = useState("products");
  const [listingSearch, setListingSearch] = useState("");

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [lands, setLands] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [supportTickets, setSupportTickets] = useState([]);
  const [supportReply, setSupportReply] = useState({});
  const [supportStatus, setSupportStatus] = useState("all");
  const [expandedTicketId, setExpandedTicketId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [supportBusy, setSupportBusy] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [reload, setReload] = useState(0);
  const [supportReload, setSupportReload] = useState(0);

  const request = useCallback(
    async (path, options = {}) => {
      if (!token) {
        throw new Error("Please log in as an administrator.");
      }

      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.body
            ? { "Content-Type": "application/json" }
            : {}),
          ...(options.headers || {}),
        },
      });

      return readJSON(response);
    },
    [token]
  );

  // LOAD OVERVIEW, USERS, LISTINGS, SUBSCRIPTIONS

  useEffect(() => {
    if (page === "support") return;

    const controller = new AbortController();

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        if (page === "overview") {
          const data = await request("/stats", {
            signal: controller.signal,
          });

          if (!controller.signal.aborted) {
            setStats(data.stats || null);
          }
        }

        if (page === "users") {
          const query = new URLSearchParams({
            role: roleFilter,
            search,
          });

          const data = await request(
            `/users?${query.toString()}`,
            { signal: controller.signal }
          );

          if (!controller.signal.aborted) {
            setUsers(data.users || []);
          }
        }

        if (page === "listings") {
          if (tab === "unpublished") {
            const [p, e, l] = await Promise.all([
              request("/products", { signal: controller.signal }),
              request("/equipment", { signal: controller.signal }),
              request("/lands", { signal: controller.signal }),
            ]);

            if (!controller.signal.aborted) {
              setProducts(p.products || []);
              setEquipment(e.equipment || []);
              setLands(l.lands || []);
            }
          } else {
            const data = await request(`/${tab}`, {
              signal: controller.signal,
            });

            if (!controller.signal.aborted) {
              if (tab === "products") {
                setProducts(data.products || []);
              } else if (tab === "equipment") {
                setEquipment(data.equipment || []);
              } else if (tab === "lands") {
                setLands(data.lands || []);
              }
            }
          }
        }

        if (page === "subscriptions") {
          const data = await request("/subscriptions", {
            signal: controller.signal,
          });

          if (!controller.signal.aborted) {
            setSubscriptions(data.subscriptions || []);
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

    loadData();

    return () => controller.abort();
  }, [page, tab, roleFilter, search, reload, request]);

  // LOAD HELP REQUESTS

  useEffect(() => {
    if (page !== "support") return;

    const controller = new AbortController();

    async function loadSupport() {
      setSupportLoading(true);
      setError("");

      try {
        if (!token) {
          throw new Error("Please log in again.");
        }

        const response = await fetch(
          "/api/support/admin/tickets",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await readJSON(response);

        if (!controller.signal.aborted) {
          setSupportTickets(data.tickets || []);
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
          setSupportLoading(false);
        }
      }
    }

    loadSupport();

    return () => controller.abort();
  }, [page, token, supportReload]);

  // USER MANAGEMENT

  async function changeUserStatus(user) {
    if (busy) return;

    const status =
      user.status === "suspended" ? "active" : "suspended";

    if (
      !window.confirm(
        `${status === "suspended" ? "Suspend" : "Reactivate"} ${user.username}?`
      )
    ) {
      return;
    }

    setBusy(String(user._id));
    setError("");
    setNotice("");

    try {
      const data = await request(
        `/users/${encodeURIComponent(user._id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setUsers((previous) =>
        previous.map((item) =>
          item._id === user._id
            ? { ...item, status }
            : item
        )
      );

      setNotice(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  // PUBLISH OR UNPUBLISH LISTINGS

  async function changePublication(item, listingType) {
    if (busy) return;

    const id = String(item._id || "");
    if (!id) return;

    const isPublished = item.isPublished === false;

    if (
      !window.confirm(
        `${isPublished ? "Publish" : "Unpublish"} ${itemName(item)}?`
      )
    ) {
      return;
    }

    setBusy(id);
    setError("");
    setNotice("");

    try {
      const data = await request(
        `/${listingType}/${encodeURIComponent(id)}/publication`,
        {
          method: "PATCH",
          body: JSON.stringify({ isPublished }),
        }
      );

      const update = (previous) =>
        previous.map((entry) =>
          String(entry._id) === id
            ? { ...entry, isPublished }
            : entry
        );

      if (listingType === "products") {
        setProducts(update);
      } else if (listingType === "equipment") {
        setEquipment(update);
      } else if (listingType === "lands") {
        setLands(update);
      }

      setNotice(data.message || "Listing updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  // ADMIN REPLIES

  async function sendSupportReply(ticketId) {
    const message = supportReply[ticketId]?.trim();

    if (!message || supportBusy) return;

    setSupportBusy(ticketId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/support/admin/tickets/${encodeURIComponent(ticketId)}/reply`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        }
      );

      const data = await readJSON(response);

      setSupportReply((previous) => ({
        ...previous,
        [ticketId]: "",
      }));

      setNotice(data.message);
      setSupportReload((value) => value + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSupportBusy("");
    }
  }

  async function changeSupportStatus(ticketId, status) {
    if (supportBusy) return;

    setSupportBusy(ticketId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/support/admin/tickets/${encodeURIComponent(ticketId)}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await readJSON(response);

      setNotice(data.message);
      setSupportReload((value) => value + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSupportBusy("");
    }
  }

  function logout() {
    sessionStorage.removeItem("agriverseToken");
    localStorage.removeItem("agriverseCurrentUser");
    localStorage.removeItem("agriverseUser");
    localStorage.removeItem("agriverseLoggedIn");

    navigate("/auth", { replace: true });
  }

  // MARKETPLACE FILTERS

  const activeListingType =
    tab === "unpublished" ? unpublishedTab : tab;

  const allListings =
    activeListingType === "products"
      ? products
      : activeListingType === "equipment"
        ? equipment
        : lands;

  const normalizedSearch = listingSearch.trim().toLowerCase();

  const listingItems = allListings.filter((item) => {
    const published = item.isPublished !== false;

    if (tab === "unpublished" && published) return false;
    if (tab !== "unpublished" && !published) return false;

    if (!normalizedSearch) return true;

    const text = [
      itemName(item),
      item.sellerName,
      item.sellerUsername,
      item.location,
      item.district,
      item.city,
      item.state,
      item.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(normalizedSearch);
  });

  const unpublishedCounts = {
    products: products.filter(
      (item) => item.isPublished === false
    ).length,
    equipment: equipment.filter(
      (item) => item.isPublished === false
    ).length,
    lands: lands.filter(
      (item) => item.isPublished === false
    ).length,
  };

  const visibleSupportTickets =
    supportStatus === "all"
      ? supportTickets
      : supportTickets.filter(
          (ticket) => ticket.status === supportStatus
        );

  return (
    <div className="min-h-screen bg-green-50">
      {/* HEADER */}

      <header className="bg-white border-b border-green-200 px-5 md:px-10 py-5">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-700 text-white p-3 rounded-2xl">
              <ShieldCheck size={26} />
            </div>

            <div>
              <h1 className="text-4xl font-extrabold text-green-800 mt-5">
                AgriVerse AI
              </h1>
              <p className="text-lg text-gray-500 mt-2">
                Administration Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <p className="font-semibold text-xl text-gray-700">
              {currentUser.username || "Administrator"}
            </p>

            <button
              type="button"
              onClick={logout}
              className="bg-red-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-600"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MANAGEMENT AND CONTENT */}

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid lg:grid-cols-[300px_minmax(0,1fr)] gap-8 lg:gap-16">
        {/* MANAGEMENT SIDEBAR */}

        <aside className="bg-white border-2 border-green-200 rounded-3xl p-5 md:p-6 h-fit shadow-md lg:mt-16">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="bg-green-100 rounded-xl p-3">
              <ShieldCheck
                size={27}
                className="text-green-700"
              />
            </div>

            <h2 className="text-2xl font-extrabold text-green-800">
              Management
            </h2>
          </div>

          <div className="space-y-4 mt-12">
            {MENU.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setPage(id);
                  setError("");
                  setNotice("");
                }}
                className={`w-full flex items-center gap-4 rounded-2xl px-5 py-5 text-left text-base font-bold border-2 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  page === id
                    ? "bg-green-700 text-white border-green-700 shadow-md"
                    : "bg-green-50 text-green-800 border-green-200 hover:bg-green-100 hover:border-green-500"
                }`}
              >
                <Icon size={24} className="shrink-0" />
                <span className="flex-1">{label}</span>
                <ChevronRight size={20} className="shrink-0" />
              </button>
            ))}
          </div>
        </aside>

        {/* MAIN CONTENT */}

        <main className="min-w-0">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-3xl font-extrabold text-green-800">
              {MENU.find((item) => item.id === page)?.label}
            </h2>

            {page !== "support" && (
              <button
                type="button"
                onClick={() => setReload((value) => value + 1)}
                className="bg-green-100 text-green-800 px-5 py-3 rounded-xl font-bold flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 flex items-center gap-2"
            >
              <AlertCircle size={20} />
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="mt-6 bg-green-100 text-green-800 rounded-xl p-4"
            >
              {notice}
            </p>
          )}

          {/* OVERVIEW */}

          {page === "overview" && (
            <>
              {loading ? (
                <p className="mt-8">Loading statistics...</p>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-5 mt-7">
                  <StatCard
                    title="Total Farmers"
                    value={stats?.farmers}
                    icon={<Sprout size={30} />}
                  />
                  <StatCard
                    title="Total Buyers"
                    value={stats?.buyers}
                    icon={<Users size={30} />}
                  />
                  <StatCard
                    title="Products"
                    value={stats?.products}
                    icon={<ShoppingBag size={30} />}
                  />
                  <StatCard
                    title="Rental Equipment"
                    value={stats?.equipment}
                    icon={<Tractor size={30} />}
                  />
                  <StatCard
                    title="Land Listings"
                    value={stats?.lands}
                    icon={<Map size={30} />}
                  />
                  <StatCard
                    title="Active Subscriptions"
                    value={stats?.activeSubscriptions}
                    icon={<Crown size={30} />}
                  />
                  <StatCard
                    title="Suspended Users"
                    value={stats?.suspendedUsers}
                    icon={<Lock size={30} />}
                  />
                  <StatCard
                    title="Individual Land Unlocks"
                    value={stats?.landUnlocks}
                    icon={<Eye size={30} />}
                  />
                </div>
              )}
            </>
          )}

          {/* USER MANAGEMENT */}

          {page === "users" && (
            <section className="bg-white border-2 border-green-200 rounded-3xl p-5 md:p-7 mt-7">
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 border border-green-200 rounded-xl px-4 flex-1 min-w-48">
                  <Search size={18} />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search username"
                    className="w-full py-3 outline-none"
                  />
                </label>

                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value)
                  }
                  className="border border-green-200 rounded-xl p-3"
                >
                  <option value="all">All Users</option>
                  <option value="farmer">Farmers</option>
                  <option value="buyer">Buyers</option>
                </select>
              </div>

              {loading ? (
                <p className="mt-6">Loading users...</p>
              ) : users.length === 0 ? (
                <p className="mt-6 text-gray-600">No users found.</p>
              ) : (
                <div className="space-y-4 mt-6">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="border border-green-200 rounded-2xl p-5 flex flex-wrap justify-between items-center gap-4"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-green-800">
                          {user.username}
                        </h3>
                        <p className="mt-1 capitalize text-gray-600">
                          {user.role}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Joined: {formatDate(user.createdAt)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Last login: {formatDate(user.lastLogin)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`px-3 py-2 rounded-xl font-bold ${
                            user.status === "suspended"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.status || "active"}
                        </span>

                        <button
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => changeUserStatus(user)}
                          className={`px-5 py-3 rounded-xl font-bold disabled:opacity-50 ${
                            user.status === "suspended"
                              ? "bg-green-700 text-white"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status === "suspended"
                            ? "Reactivate"
                            : "Suspend"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* MARKETPLACE LISTINGS */}

          {page === "listings" && (
            <section className="mt-7">
              {/* FOUR MAIN TABS */}

              <div className="flex flex-wrap gap-3">
                {LISTING_TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTab(id);
                      setListingSearch("");
                      setError("");
                      setNotice("");
                    }}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold border-2 transition ${
                      tab === id
                        ? "bg-green-700 text-white border-green-700"
                        : "bg-white text-green-800 border-green-200 hover:bg-green-100"
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>

              {/* UNPUBLISHED SUBCATEGORIES */}

              {tab === "unpublished" && (
                <div className="bg-white border-2 border-orange-200 rounded-2xl p-5 mt-6">
                  <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
                    <Archive size={22} />
                    Unpublished Listings
                  </h3>

                  <p className="text-sm text-gray-600 mt-2">
                    Find unpublished listings and publish them again.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-5">
                    {LISTING_TYPES.map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setUnpublishedTab(id);
                          setListingSearch("");
                        }}
                        className={`px-4 py-3 rounded-xl font-bold border-2 ${
                          unpublishedTab === id
                            ? "bg-green-700 text-white border-green-700"
                            : "bg-green-50 text-green-800 border-green-200"
                        }`}
                      >
                        {label}
                        <span className="ml-2">
                          ({unpublishedCounts[id]})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LISTING SEARCH BAR */}

              <div className="mt-6 bg-white border-2 border-green-200 rounded-2xl p-4">
                <label className="flex items-center gap-3">
                  <Search
                    size={22}
                    className="text-green-700 shrink-0"
                  />

                  <input
                    type="search"
                    value={listingSearch}
                    onChange={(event) =>
                      setListingSearch(event.target.value)
                    }
                    placeholder="Search by listing name, seller, category or location..."
                    className="w-full outline-none text-gray-700 py-2 bg-transparent"
                  />
                </label>
              </div>

              {!loading && !error && (
                <p className="mt-5 text-gray-600 font-semibold">
                  {listingItems.length}{" "}
                  {tab === "unpublished"
                    ? "unpublished"
                    : "published"}{" "}
                  listings found
                </p>
              )}

              {loading ? (
                <p className="mt-8">Loading listings...</p>
              ) : error ? null : listingItems.length === 0 ? (
                <div className="bg-white border border-green-200 rounded-2xl p-8 mt-6">
                  {listingSearch.trim()
                    ? "No listings match your search."
                    : tab === "unpublished"
                      ? "No unpublished listings in this category."
                      : "No published listings in this category."}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-5 mt-6">
                  {listingItems.map((item) => {
                    const published = item.isPublished !== false;

                    return (
                      <article
                        key={item._id}
                        className="bg-white border-2 border-green-200 rounded-2xl overflow-hidden shadow-sm"
                      >
                        {itemImage(item) ? (
                          <img
                            src={itemImage(item)}
                            alt={itemName(item)}
                            className="w-full h-44 object-cover"
                          />
                        ) : (
                          <div className="h-44 bg-green-100 flex items-center justify-center">
                            <Package
                              size={42}
                              className="text-green-700"
                            />
                          </div>
                        )}

                        <div className="p-5">
                          <div className="flex justify-between gap-3">
                            <h3 className="text-xl font-bold text-green-800">
                              {itemName(item)}
                            </h3>

                            <span
                              className={`text-xs font-bold px-3 py-2 rounded-xl h-fit ${
                                published
                                  ? "bg-green-100 text-green-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {published
                                ? "Published"
                                : "Unpublished"}
                            </span>
                          </div>

                          <p className="mt-3 text-green-700 font-bold">
                            {itemPrice(item, activeListingType)}
                          </p>

                          <p className="mt-2 text-gray-600">
                            Seller:{" "}
                            {item.sellerName ||
                              item.sellerUsername ||
                              "Not specified"}
                          </p>

                          <p className="mt-2 text-gray-600">
                            Location:{" "}
                            {item.location ||
                              item.district ||
                              "Not specified"}
                          </p>

                          {activeListingType === "equipment" && (
                            <p className="mt-2 text-gray-600">
                              Availability:{" "}
                              {item.availabilityStatus}
                            </p>
                          )}

                          <p className="mt-2 text-sm text-gray-500">
                            Added: {formatDate(item.createdAt)}
                          </p>

                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            onClick={() =>
                              changePublication(
                                item,
                                activeListingType
                              )
                            }
                            className={`mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold disabled:opacity-50 ${
                              published
                                ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                                : "bg-green-700 text-white hover:bg-green-800"
                            }`}
                          >
                            {published ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}

                            {published
                              ? "Unpublish Listing"
                              : "Publish Listing"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* SUBSCRIPTIONS */}

          {page === "subscriptions" && (
            <div className="mt-7">
              {loading ? (
                <p>Loading subscriptions...</p>
              ) : subscriptions.length === 0 ? (
                <div className="bg-white border border-green-200 rounded-2xl p-8">
                  No subscription records found.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  {subscriptions.map((record) => (
                    <article
                      key={record._id}
                      className="bg-white border border-green-200 rounded-2xl p-6"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-green-800">
                            {record.buyer?.username ||
                              "Buyer account unavailable"}
                          </h3>

                          <p className="mt-2 text-gray-600">
                            ₹500 Demo Subscription
                          </p>
                        </div>

                        <span
                          className={`px-3 py-2 rounded-xl font-bold text-sm ${
                            record.subscriptionActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {record.subscriptionActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-5 text-gray-700">
                        Expiry:{" "}
                        <strong>
                          {formatDate(
                            record.subscriptionExpiresAt
                          )}
                        </strong>
                      </p>

                      <p className="mt-3 text-gray-700">
                        ₹50 Individual Land Unlocks:{" "}
                        <strong>
                          {record.unlockedLandCount}
                        </strong>
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HELP REQUESTS */}

          {page === "support" && (
            <section className="mt-7">
              <div className="bg-white border-2 border-green-200 rounded-3xl p-6 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-green-800">
                      Inbox
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSupportReload((value) => value + 1)
                    }
                    className="bg-green-100 text-green-800 rounded-xl px-5 py-3 font-bold flex items-center gap-2"
                  >
                    <RefreshCw size={18} />
                    Refresh
                  </button>
                </div>

                {/* SUPPORT STATUS FILTERS */}

                <div className="flex flex-wrap gap-3 mt-6">
                  {SUPPORT_FILTERS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSupportStatus(value);
                        setExpandedTicketId(null);
                      }}
                      className={`rounded-xl px-5 py-3 font-bold border-2 ${
                        supportStatus === value
                          ? "bg-green-700 text-white border-green-700"
                          : "bg-green-50 text-green-800 border-green-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* COMPACT REQUESTS */}

                {supportLoading ? (
                  <p className="mt-7 text-gray-600">
                    Loading help requests...
                  </p>
                ) : error ? null : visibleSupportTickets.length === 0 ? (
                  <p className="mt-7 text-gray-600">
                    No help requests found.
                  </p>
                ) : (
                  <div className="space-y-4 mt-7">
                    {visibleSupportTickets.map((ticket) => {
                      const expanded =
                        expandedTicketId === ticket._id;

                      return (
                        <article
                          key={ticket._id}
                          className={`border-2 rounded-2xl overflow-hidden transition ${
                            expanded
                              ? "border-green-500 bg-white shadow-md"
                              : "border-green-200 bg-green-50"
                          }`}
                        >
                          {/* COLLAPSED SUMMARY */}

                          <div className="p-5">
                            <div className="flex flex-wrap justify-between items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-extrabold text-green-800 break-words">
                                  {ticket.subject}
                                </h4>

                                <p className="text-gray-700 mt-2">
                                  <strong>
                                    {ticket.user?.username ||
                                      "Account unavailable"}
                                  </strong>
                                </p>

                                <p className="text-sm text-gray-600 mt-1">
                                  Category: {ticket.category}
                                </p>
                              </div>

                              <div className="flex flex-col items-start sm:items-end gap-3">
                                <span
                                  className={`px-3 py-2 rounded-xl text-sm font-bold ${
                                    ticket.status === "Resolved"
                                      ? "bg-green-200 text-green-800"
                                      : ticket.status === "In Progress"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {ticket.status}
                                </span>

                                <button
                                  type="button"
                                  aria-expanded={expanded}
                                  onClick={() =>
                                    setExpandedTicketId(
                                      expanded ? null : ticket._id
                                    )
                                  }
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${
                                    expanded
                                      ? "bg-gray-100 text-gray-700"
                                      : "bg-green-700 text-white hover:bg-green-800"
                                  }`}
                                >
                                  {expanded ? (
                                    <>
                                      <ChevronUp size={18} />
                                      Close Details
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown size={18} />
                                      View Details
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* EXPANDED DETAILS */}

                          {expanded && (
                            <div className="bg-white border-t-2 border-green-200 p-5">
                              <div className="flex flex-wrap justify-between gap-4">
                                <div>
                                  <p className="text-gray-600 capitalize">
                                    Role:{" "}
                                    {ticket.user?.role || "Unknown"}
                                  </p>

                                  <p className="text-sm text-gray-500 mt-2">
                                    Submitted:{" "}
                                    {formatDate(ticket.createdAt)}
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-sm font-bold text-gray-600 mb-2">
                                    Ticket Status
                                  </label>

                                  <select
                                    value={ticket.status}
                                    disabled={Boolean(supportBusy)}
                                    onChange={(event) =>
                                      changeSupportStatus(
                                        ticket._id,
                                        event.target.value
                                      )
                                    }
                                    className="border-2 border-green-200 rounded-xl p-3 font-bold text-green-800"
                                  >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">
                                      In Progress
                                    </option>
                                    <option value="Resolved">
                                      Resolved
                                    </option>
                                  </select>
                                </div>
                              </div>

                              {/* USER MESSAGE */}

                              <div className="bg-green-50 border border-green-100 rounded-xl p-5 mt-5">
                                <p className="font-bold text-green-800">
                                  User's Message
                                </p>

                                <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                                  {ticket.message}
                                </p>
                              </div>

                              {/* PREVIOUS REPLIES */}

                              {ticket.replies?.length > 0 && (
                                <div className="mt-5">
                                  <h5 className="font-bold text-green-800">
                                    Previous Replies
                                  </h5>

                                  <div className="space-y-3 mt-3">
                                    {ticket.replies.map((reply) => (
                                      <div
                                        key={reply._id}
                                        className="bg-gray-50 border border-gray-200 rounded-xl p-4"
                                      >
                                        <p className="font-bold text-gray-700">
                                          Admin Reply
                                        </p>

                                        <p className="mt-2 whitespace-pre-wrap">
                                          {reply.message}
                                        </p>

                                        <p className="text-xs text-gray-500 mt-2">
                                          {formatDate(reply.createdAt)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* SEND REPLY */}

                              <div className="mt-6">
                                <label className="block font-bold text-green-800 mb-3">
                                  Reply to User
                                </label>

                                <textarea
                                  value={
                                    supportReply[ticket._id] || ""
                                  }
                                  onChange={(event) =>
                                    setSupportReply((previous) => ({
                                      ...previous,
                                      [ticket._id]:
                                        event.target.value,
                                    }))
                                  }
                                  maxLength={3000}
                                  rows={4}
                                  placeholder="Enter your response..."
                                  className="w-full border-2 border-green-200 rounded-xl p-4 outline-none focus:border-green-600"
                                />

                                <button
                                  type="button"
                                  disabled={
                                    Boolean(supportBusy) ||
                                    !supportReply[ticket._id]?.trim()
                                  }
                                  onClick={() =>
                                    sendSupportReply(ticket._id)
                                  }
                                  className="mt-4 bg-green-700 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-green-800"
                                >
                                  {supportBusy === ticket._id
                                    ? "Sending..."
                                    : "Send Reply"}
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
