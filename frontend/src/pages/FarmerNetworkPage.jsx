
import { useEffect, useMemo, useRef, useState } from "react";

import { Link } from "react-router-dom";

import {
  Users,
  ImagePlus,
  Send,
  MessageCircle,
  Sprout,
  Trash2,
  Search,
  X,
} from "lucide-react";

const STORAGE_KEY = "agriverseNetworkPosts";

const cropTags = [
  "Paddy",
  "Wheat",
  "Maize",
  "Sugarcane",
  "Cotton",
  "Coconut",
  "Banana",
  "Mango",
  "Groundnut",
  "Tomato",
  "Potato",
  "Onion",
  "Chilli",
  "Brinjal",
  "Okra",
  "Turmeric",
  "Millets",
  "Pulses",
  "Weather",
  "Market",
  "Disease",
  "Fertilizer",
  "Irrigation",
];

function readUser() {
  try {
    return JSON.parse(
      localStorage.getItem("agriverseCurrentUser") || "{}"
    ) || {};
  } catch {
    return {};
  }
}

function readPosts() {
  try {
    const value = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readProfileValue(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function postTime(post) {
  const value = post.createdAt;

  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

function replyCount(post) {
  return Array.isArray(post.replies)
    ? post.replies.length
    : 0;
}

function PostCard({
  post,
  currentUser,
  onDeletePost,
  onQuickReply,
  onRequireProfile,
}) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);

  const replies = Array.isArray(post.replies)
    ? post.replies
    : [];

  function handleReply(event) {
    event.preventDefault();

    if (!replyText.trim()) return;

    const success = onQuickReply(
      post.id,
      replyText.trim()
    );

    if (success) {
      setReplyText("");
      setShowReply(false);
    } else {
      onRequireProfile();
    }
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-7 border border-green-100 shadow-sm">
      <div className="flex items-start gap-4">
        {post.authorImage ? (
          <img
            src={post.authorImage}
            alt="Farmer profile"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Users
              className="text-green-700"
              size={24}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-green-700">
                {post.author || "Farmer"}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {post.createdAt || "Recently"}
              </p>
            </div>

            {post.cropTag && (
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-2xl font-semibold text-sm">
                {post.cropTag}
              </span>
            )}
          </div>

          <Link to={`/farmer-network/${post.id}`}>
            <p className="text-lg md:text-xl text-black leading-8 mt-5 hover:text-green-700 whitespace-pre-wrap break-words">
              {post.question}
            </p>
          </Link>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to={`/farmer-network/${post.id}`}
              className="bg-green-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2"
            >
              <MessageCircle size={18} />

              Open Discussion ({replies.length})
            </Link>

            <button
              type="button"
              onClick={() => setShowReply((value) => !value)}
              className="bg-green-50 text-green-700 px-5 py-3 rounded-2xl font-bold border border-green-100"
            >
              Quick Reply
            </button>

            {post.userId === currentUser.username && (
              <button
                type="button"
                onClick={() => onDeletePost(post.id)}
                className="bg-red-50 text-red-600 px-5 py-3 rounded-2xl font-bold border border-red-100 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete
              </button>
            )}
          </div>

          {showReply && (
            <form
              onSubmit={handleReply}
              className="mt-5 flex flex-col sm:flex-row gap-3"
            >
              <input
                value={replyText}
                onChange={(event) =>
                  setReplyText(event.target.value)
                }
                placeholder="Reply to this question..."
                required
                className="flex-1 min-w-0 border border-green-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                type="submit"
                disabled={!replyText.trim()}
                className="bg-green-700 text-white px-6 py-4 rounded-2xl font-bold disabled:opacity-50"
              >
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FarmerNetworkPage() {
  const fileInputRef = useRef(null);
  const composerRef = useRef(null);

  const currentUser = useMemo(
    () => readUser(),
    []
  );

  const username = currentUser.username || "";

  const dashboardPath =
    currentUser.role === "buyer"
      ? "/customer-dashboard"
      : "/farmer-dashboard";

  const profileNameKey =
    `agriverseNetworkName_${username}`;

  const profileImageKey =
    `agriverseNetworkImage_${username}`;

  const [profileName, setProfileName] = useState(
    () => readProfileValue(profileNameKey)
  );

  const [profileImage, setProfileImage] = useState(
    () => readProfileValue(profileImageKey)
  );

  const [draftName, setDraftName] = useState(
    () => readProfileValue(profileNameKey)
  );

  const [draftImage, setDraftImage] = useState(
    () => readProfileValue(profileImageKey)
  );

  const [editingProfile, setEditingProfile] = useState(false);

  const [posts, setPosts] = useState(readPosts);

  const [question, setQuestion] = useState("");
  const [cropTag, setCropTag] = useState("");

  const [feedTab, setFeedTab] = useState("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const hasProfile = Boolean(profileName.trim());

  useEffect(() => {
    function syncPosts(event) {
      if (event.key === STORAGE_KEY) {
        setPosts(readPosts());
      }
    }

    window.addEventListener("storage", syncPosts);

    return () => {
      window.removeEventListener("storage", syncPosts);
    };
  }, []);

  const myPostCount = useMemo(
    () =>
      posts.filter(
        (post) => post.userId === username
      ).length,
    [posts, username]
  );

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const matches = posts.filter((post) => {
      const matchesTab =
        feedTab === "all" ||
        post.userId === username;

      const matchesCategory =
        categoryFilter === "All" ||
        post.cropTag === categoryFilter;

      const matchesSearch =
        !term ||
        [
          post.question,
          post.author,
          post.cropTag,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(term)
        );

      return (
        matchesTab &&
        matchesCategory &&
        matchesSearch
      );
    });

    return [...matches].sort((a, b) => {
      if (sortBy === "most-replied") {
        const difference =
          replyCount(b) - replyCount(a);

        if (difference !== 0) {
          return difference;
        }
      }

      return postTime(b) - postTime(a);
    });
  }, [
    posts,
    feedTab,
    username,
    categoryFilter,
    search,
    sortBy,
  ]);

  function openProfileEditor() {
    setDraftName(profileName);
    setDraftImage(profileImage);
    setEditingProfile(true);
    setError("");
  }

  function closeProfileEditor() {
    setDraftName(profileName);
    setDraftImage(profileImage);
    setEditingProfile(false);
  }

  function saveProfile() {
    const name = draftName.trim();

    if (!name) {
      setError("Please enter your nickname.");
      return;
    }

    try {
      localStorage.setItem(profileNameKey, name);
      localStorage.setItem(profileImageKey, draftImage);

      setProfileName(name);
      setProfileImage(draftImage);
      setEditingProfile(false);

      setError("");
      setNotice("Farmer profile saved successfully.");
    } catch {
      setError(
        "Unable to save profile. Please use a smaller image."
      );
    }
  }

  function handleProfileImage(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError(
        "Please select a profile image smaller than 2 MB."
      );
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setDraftImage(reader.result);
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function saveUpdatedPosts(updatedPosts) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedPosts)
      );

      setPosts(updatedPosts);
      return true;
    } catch {
      setError(
        "Unable to save the discussion. Browser storage may be full."
      );
      return false;
    }
  }

  function createPost() {
    setError("");
    setNotice("");

    if (!hasProfile) {
      setError(
        "Please create your farmer profile before posting."
      );
      openProfileEditor();
      return;
    }

    if (!question.trim()) {
      setError("Please enter your question.");
      return;
    }

    const newPost = {
      id: makeId(),
      userId: username,
      author: profileName,
      authorImage: profileImage,
      cropTag,
      question: question.trim(),
      replies: [],
      createdAt: new Date().toLocaleString("en-IN"),
    };

    const updatedPosts = [
      newPost,
      ...posts,
    ];

    if (!saveUpdatedPosts(updatedPosts)) {
      return;
    }

    setQuestion("");
    setCropTag("");

    setFeedTab("all");
    setSearch("");
    setCategoryFilter("All");
    setSortBy("newest");

    setNotice("Your question has been posted.");
  }

  function deletePost(postId) {
    const post = posts.find(
      (item) => item.id === postId
    );

    if (!post || post.userId !== username) {
      setError("You can only delete your own posts.");
      return;
    }

    if (!window.confirm("Delete this discussion?")) {
      return;
    }

    const updatedPosts = posts.filter(
      (item) => item.id !== postId
    );

    if (saveUpdatedPosts(updatedPosts)) {
      setError("");
      setNotice("Discussion deleted.");
    }
  }

  function addQuickReply(postId, replyText) {
    setError("");
    setNotice("");

    if (!hasProfile) {
      setError(
        "Please create your farmer profile before replying."
      );
      openProfileEditor();
      return false;
    }

    if (!replyText.trim()) return false;

    const updatedPosts = posts.map((post) => {
      if (post.id !== postId) return post;

      return {
        ...post,
        replies: [
          ...(Array.isArray(post.replies)
            ? post.replies
            : []),
          {
            id: makeId(),
            userId: username,
            author: profileName,
            authorImage: profileImage,
            text: replyText.trim(),
            replyTo: null,
            createdAt: new Date().toLocaleString("en-IN"),
          },
        ],
      };
    });

    if (!saveUpdatedPosts(updatedPosts)) {
      return false;
    }

    setNotice("Reply posted successfully.");
    return true;
  }

  function resetFilters() {
    setFeedTab("all");
    setSearch("");
    setCategoryFilter("All");
    setSortBy("newest");
  }

  function focusComposer() {
    if (!hasProfile) {
      openProfileEditor();
      return;
    }

    composerRef.current?.focus();
  }

  return (
    <div className="min-h-screen bg-green-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to={dashboardPath}
            className="text-green-700 font-bold"
          >
            ← Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={openProfileEditor}
            className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-green-100 shadow-sm"
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Farmer profile"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Users
                  className="text-green-700"
                  size={24}
                />
              </div>
            )}

            <div className="text-left">
              <p className="font-bold text-black">
                {profileName || "Create Profile"}
              </p>

              <p className="text-xs text-gray-500">
                Edit nickname/photo
              </p>
            </div>
          </button>
        </div>

        {editingProfile && (
          <div className="bg-white rounded-[3rem] p-6 md:p-8 border border-green-100 shadow-xl mt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-extrabold text-green-700">
                Farmer Profile
              </h2>

              <button
                type="button"
                onClick={closeProfileEditor}
                aria-label="Close profile editor"
                className="bg-gray-100 rounded-full p-2"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mt-3">
              Create your profile before joining discussions.
            </p>

            <div className="flex flex-col md:flex-row gap-6 mt-7 items-center">
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="w-32 h-32 rounded-full bg-green-50 border-2 border-dashed border-green-200 flex items-center justify-center overflow-hidden shrink-0"
              >
                {draftImage ? (
                  <img
                    src={draftImage}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImagePlus
                    className="text-green-700"
                    size={36}
                  />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImage}
                className="hidden"
              />

              <input
                value={draftName}
                onChange={(event) =>
                  setDraftName(event.target.value)
                }
                placeholder="Enter nickname"
                className="w-full flex-1 border border-green-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500"
              />

              <button
                type="button"
                onClick={saveProfile}
                className="bg-green-700 text-white px-8 py-4 rounded-2xl font-bold whitespace-nowrap"
              >
                Save Profile
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[3rem] p-5 md:p-10 border border-green-100 shadow-xl mt-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-green-100 flex items-center justify-center shrink-0">
              <Users
                className="text-green-700"
                size={34}
              />
            </div>

            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-green-700">
                Farmer Network
              </h1>

              <p className="text-gray-600 mt-2 text-base md:text-lg">
                Ask farming questions, share experience,
                and reply to other farmers.
              </p>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-6 bg-red-50 text-red-700 rounded-xl p-4 border border-red-200"
            >
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

          <div className="bg-green-50 rounded-3xl p-5 md:p-6 mt-10 border border-green-700">
            <h2 className="text-2xl font-bold text-black">
              Start a Discussion
            </h2>

            {!hasProfile && (
              <div className="mt-5 bg-white border border-green-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-gray-700">
                  Create your farmer profile before posting.
                </p>

                <button
                  type="button"
                  onClick={openProfileEditor}
                  className="bg-green-700 text-white rounded-xl px-5 py-3 font-bold"
                >
                  Create Profile
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-4 mt-5">
              <select
                value={cropTag}
                onChange={(event) =>
                  setCropTag(event.target.value)
                }
                className="border border-green-200 rounded-2xl px-5 py-4 outline-none bg-white"
              >
                <option value="">
                  Select Crop Tag (Optional)
                </option>

                {cropTags.map((tag) => (
                  <option
                    key={tag}
                    value={tag}
                  >
                    {tag}
                  </option>
                ))}
              </select>

              <textarea
                ref={composerRef}
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                onFocus={() => {
                  if (!hasProfile) {
                    focusComposer();
                  }
                }}
                placeholder="Ask your question to other farmers..."
                rows={4}
                className="md:col-span-2 text-lg border border-green-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500 resize-y"
              />
            </div>

            <button
              type="button"
              onClick={createPost}
              className="mt-5 bg-green-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3"
            >
              <Send size={20} />
              Post Question
            </button>
          </div>

          <section className="mt-25">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-black-700">
                  Community Feed
                </h2>

              </div>

              <span className="bg-green-100 text-green-800 rounded-xl px-4 py-2 font-bold text-sm">
                {filteredPosts.length} Discussions
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mt-10">
              <button
                type="button"
                onClick={() => setFeedTab("all")}
                className={`px-5 py-3 rounded-2xl font-bold ${
                  feedTab === "all"
                    ? "bg-green-700 text-white"
                    : "bg-green-50 text-green-700 border border-green-100"
                }`}
              >
                All Discussions
              </button>

              <button
                type="button"
                onClick={() => setFeedTab("mine")}
                className={`px-5 py-3 rounded-2xl font-bold ${
                  feedTab === "mine"
                    ? "bg-green-700 text-white"
                    : "bg-green-50 text-green-700 border border-green-100"
                }`}
              >
                My Discussions ({myPostCount})
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mt-5">
              <label className="flex items-center gap-3 border border-green-200 rounded-2xl px-4">
                <Search
                  size={20}
                  className="text-green-700"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search discussions..."
                  className="w-full py-4 outline-none"
                />
              </label>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                aria-label="Filter discussions by category"
                className="border border-green-200 rounded-2xl px-4 py-4 bg-white outline-none"
              >
                <option value="All">
                  All Categories
                </option>

                {cropTags.map((tag) => (
                  <option
                    key={tag}
                    value={tag}
                  >
                    {tag}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value)
                }
                aria-label="Sort discussions"
                className="border border-green-200 rounded-2xl px-4 py-4 bg-white outline-none"
              >
                <option value="newest">
                  Newest
                </option>

                <option value="most-replied">
                  Most Replied
                </option>
              </select>
            </div>

            {(search ||
              categoryFilter !== "All" ||
              sortBy !== "newest" ||
              feedTab !== "all") && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 text-green-700 font-bold flex items-center gap-2"
              >
                <X size={17} />
                Clear Filters
              </button>
            )}
          </section>

<div className="bg-green-50 rounded-3xl p-5 md:p-6 mt-6 border border-green-700">
          <div className="mt- space-y-6 ">
            {filteredPosts.length === 0 ? (
              <div className="bg-green-50 rounded-3xl p-8 md:p-10 text-center border border-green-100">
                <Sprout
                  className="mx-auto text-green-700"
                  size={42}
                />

                <p className="text-gray-700 text-lg mt-5">
                  {posts.length === 0
                    ? "No farmer discussions yet."
                    : feedTab === "mine" &&
                        myPostCount === 0
                      ? "You haven't posted any discussions yet."
                      : "No matching discussions found."}
                </p>

                {posts.length > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-5 bg-green-700 text-white px-5 py-3 rounded-xl font-bold"
                  >
                    Show All Discussions
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onDeletePost={deletePost}
                  onQuickReply={addQuickReply}
                  onRequireProfile={openProfileEditor}
                />
              ))
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
