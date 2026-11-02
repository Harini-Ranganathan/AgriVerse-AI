
import { useEffect, useState } from "react"

import {
  Link,
  useParams,
} from "react-router-dom"

import {
  Users,
  Send,
  Reply,
  Trash2,
} from "lucide-react"

function FarmerDiscussionPage() {

  const { id } =
    useParams()

  const currentUser =
    JSON.parse(
      localStorage.getItem(
        "agriverseCurrentUser"
      )
    ) || {
      username: "defaultUser",
    }

  const [post, setPost] =
    useState(null)

  const [replyText, setReplyText] =
    useState("")

  const [replyTo, setReplyTo] =
    useState(null)

  // IMPORTANT FIX
  // NO DEFAULT "Farmer"

  const profileName =
    localStorage.getItem(
      `agriverseNetworkName_${currentUser.username}`
    ) || ""

  const profileImage =
    localStorage.getItem(
      `agriverseNetworkImage_${currentUser.username}`
    ) || ""

  useEffect(() => {

    const posts =
      JSON.parse(
        localStorage.getItem(
          "agriverseNetworkPosts"
        )
      ) || []

    const selectedPost =
      posts.find(
        (item) =>
          item.id === id
      )

    setPost(selectedPost)

  }, [id])

  function saveUpdatedPost(updatedPost) {

    const posts =
      JSON.parse(
        localStorage.getItem(
          "agriverseNetworkPosts"
        )
      ) || []

    const updatedPosts =
      posts.map((item) =>

        item.id === updatedPost.id
          ? updatedPost
          : item
      )

    localStorage.setItem(
      "agriverseNetworkPosts",

      JSON.stringify(
        updatedPosts
      )
    )

    setPost(updatedPost)
  }

  function sendReply() {

    // IMPORTANT FIX
    // MUST create profile first

    if (!profileName.trim()) {

      alert(
        "Please create your farmer profile first."
      )

      return
    }

    if (!replyText.trim())
      return

    const newReply = {

      id:
        Date.now().toString(),

      userId:
        currentUser.username,

      author:
        profileName,

      authorImage:
        profileImage,

      text:
        replyText,

      replyTo,

      createdAt:
        new Date().toLocaleString(),
    }

    const updatedPost = {

      ...post,

      replies: [
        ...post.replies,
        newReply,
      ],
    }

    saveUpdatedPost(
      updatedPost
    )

    setReplyText("")

    setReplyTo(null)
  }

  if (!post) {

    return (

      <div className="min-h-screen bg-green-50 flex items-center justify-center">

        <h1 className="text-3xl font-bold text-green-700">

          Discussion not found.

        </h1>

      </div>
    )
  }

  return (

    <div className="min-h-screen bg-green-50 p-8">

      <div className="max-w-5xl mx-auto">

        <Link
          to="/farmer-network"

          className="text-green-700 font-bold"
        >
          ← Back to Farmer Network
        </Link>

        <div className="bg-white rounded-[3rem] p-10 border border-green-100 shadow-xl mt-6">

          <div className="flex items-start gap-4">

            {post.authorImage ? (

              <img
                src={post.authorImage}
                alt="profile"

                className="w-16 h-16 rounded-full object-cover"
              />

            ) : (

              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">

                <Users
                  className="text-green-700"
                  size={28}
                />

              </div>
            )}

            <div>

              <h1 className="text-3xl font-extrabold text-green-700">

                {post.author}

              </h1>

              <p className="text-sm text-gray-500 mt-1">

                {post.createdAt}

              </p>

              {post.cropTag && (

                <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-2xl font-semibold mt-3">

                  {post.cropTag}

                </span>
              )}
            </div>
          </div>

          <p className="text-2xl text-black leading-10 mt-8">

            {post.question}

          </p>

          <div className="mt-10">

            <h2 className="text-3xl font-extrabold text-black">

              Replies

            </h2>

            {post.replies.length === 0 ? (

              <div className="bg-green-50 rounded-3xl p-8 mt-6">

                <p className="text-gray-700 text-lg">

                  No replies yet.

                </p>

              </div>

            ) : (

              <div className="space-y-5 mt-6">

                {post.replies.map((reply) => (

                  <div
                    key={reply.id}

                    className="bg-green-50 rounded-3xl p-6 border border-green-100"
                  >

                    {reply.replyTo && (

                      <div className="bg-white rounded-2xl p-4 border border-green-100 mb-4 text-sm text-gray-600">

                        Replying to:
                        {" "}
                        {reply.replyTo}

                      </div>
                    )}

                    <div className="flex items-start gap-4">

                      {reply.authorImage ? (

                        <img
                          src={reply.authorImage}
                          alt="profile"

                          className="w-12 h-12 rounded-full object-cover"
                        />

                      ) : (

                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">

                          <Users
                            className="text-green-700"
                            size={22}
                          />

                        </div>
                      )}

                      <div className="flex-1">

                        <h3 className="text-lg font-bold text-green-700">

                          {reply.author}

                        </h3>

                        <p className="text-sm text-gray-500">

                          {reply.createdAt}

                        </p>

                        <p className="text-lg text-black leading-8 mt-3">

                          {reply.text}

                        </p>

                        <div className="flex gap-5 mt-4">

                          {reply.userId === currentUser.username && (

                            <button

                              onClick={() => {

                                const confirmDelete =
                                  window.confirm(
                                    "Delete this reply?"
                                  )

                                if (!confirmDelete)
                                  return

                                const updatedPost = {

                                  ...post,

                                  replies:
                                    post.replies.filter(
                                      (item) =>
                                        item.id !== reply.id
                                    ),
                                }

                                saveUpdatedPost(
                                  updatedPost
                                )
                              }}

                              className="text-red-500 font-bold flex items-center gap-2"
                            >

                              <Trash2 size={16} />

                              Delete

                            </button>
                          )}

                          <button
                            onClick={() =>
                              setReplyTo(
                                reply.text
                              )
                            }

                            className="text-green-700 font-bold flex items-center gap-2"
                          >

                            <Reply size={16} />

                            Reply

                          </button>

                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-green-50 rounded-3xl p-6 border border-green-100 mt-10">

            {replyTo && (

              <div className="bg-white rounded-2xl p-4 border border-green-100 mb-4 flex justify-between gap-4">

                <p className="text-sm text-gray-600">

                  Replying to:
                  {" "}
                  {replyTo}

                </p>

                <button
                  onClick={() =>
                    setReplyTo(null)
                  }

                  className="text-red-500 font-bold"
                >
                  Cancel
                </button>

              </div>
            )}

            <div className="flex gap-4">

              <input
                value={replyText}

                onChange={(e) =>
                  setReplyText(
                    e.target.value
                  )
                }

                placeholder="Type your reply..."

                className="flex-1 border border-green-200 rounded-2xl px-5 py-4 outline-none"
              />

              <button
                onClick={sendReply}

                className="bg-green-700 text-white px-7 rounded-2xl font-bold flex items-center gap-2"
              >

                <Send size={18} />

                Send

              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmerDiscussionPage

