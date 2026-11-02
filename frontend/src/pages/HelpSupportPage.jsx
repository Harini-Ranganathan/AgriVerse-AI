
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Headphones,
  Send,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Clock,
} from "lucide-react";

const categories = [
  "Account",
  "Products",
  "Rental Equipment",
  "Land Marketplace",
  "Subscriptions",
  "Payments",
  "Other",
];

function date(value) {
  return value
    ? new Date(value).toLocaleString("en-IN")
    : "Not available";
}

export default function HelpSupportPage() {
  const token = sessionStorage.getItem("agriverseToken");

  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("agriverseCurrentUser") || "{}"
      );
    } catch {
      return {};
    }
  })();

  const home =
    user.role === "buyer"
      ? "/customer-dashboard"
      : "/farmer-dashboard";

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Account");
  const [message, setMessage] = useState("");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/support/tickets/mine",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not load help requests."
        );
      }

      setTickets(data.tickets || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function submitTicket(event) {
    event.preventDefault();
    if (sending) return;

    setSending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Could not submit request."
        );
      }

      setSubject("");
      setMessage("");
      setCategory("Account");
      setNotice("Your help request has been sent to the admin.");

      await loadTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-50 p-5 md:p-10">
      <div className="max-w-5xl mx-auto">
        <Link
          to={home}
          className="inline-flex items-center gap-2 text-green-800 font-bold"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4 mt-8">
          <div className="bg-green-700 text-white p-4 rounded-2xl">
            <Headphones size={32} />
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-green-800">
              Help & Support
            </h1>

            <p className="text-gray-600 mt-2">
              Contact the AgriVerse AI administrator.
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mt-6">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="bg-green-100 text-green-800 p-4 rounded-xl mt-6">
            {notice}
          </p>
        )}

        <section className="bg-white border-2 border-green-200 rounded-3xl p-6 md:p-8 mt-8 shadow-sm">
          <h2 className="text-2xl font-extrabold text-green-800">
            Submit a Help Request
          </h2>

          <form onSubmit={submitTicket} className="space-y-5 mt-6">
            <div>
              <label className="font-bold text-gray-700">
                Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                placeholder="What do you need help with?"
                maxLength={150}
                required
                className="mt-2 w-full p-4 border-2 border-green-200 rounded-xl outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700">
                Category
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="mt-2 w-full p-4 border-2 border-green-200 rounded-xl"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-gray-700">
                Describe your issue
              </label>

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Explain your problem clearly..."
                maxLength={3000}
                rows={6}
                required
                className="mt-2 w-full p-4 border-2 border-green-200 rounded-xl outline-none focus:border-green-600 resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 bg-green-700 text-white px-7 py-4 rounded-xl font-bold disabled:opacity-50"
            >
              <Send size={19} />
              {sending ? "Sending..." : "Submit Request"}
            </button>
          </form>
        </section>

        <section className="mt-10">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-2xl font-extrabold text-green-800">
              My Help Requests
            </h2>

            <button
              type="button"
              onClick={loadTickets}
              className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-4 py-3 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="mt-6">Loading requests...</p>
          ) : tickets.length === 0 ? (
            <p className="mt-6 bg-white border border-green-200 rounded-xl p-6 text-gray-600">
              You haven't submitted any help requests yet.
            </p>
          ) : (
            <div className="space-y-5 mt-6">
              {tickets.map((ticket) => (
                <article
                  key={ticket._id}
                  className="bg-white border border-green-200 rounded-2xl p-6"
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-green-800">
                        {ticket.subject}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {ticket.category} · {date(ticket.createdAt)}
                      </p>
                    </div>

                    <span className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-xl h-fit font-bold">
                      {ticket.status === "Resolved" ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Clock size={17} />
                      )}
                      {ticket.status}
                    </span>
                  </div>

                  <p className="mt-5 text-gray-700 whitespace-pre-wrap">
                    {ticket.message}
                  </p>

                  {ticket.replies?.length > 0 && (
                    <div className="mt-6 border-t border-green-100 pt-5">
                      <h4 className="flex items-center gap-2 font-bold text-green-800">
                        <MessageSquare size={18} />
                        Admin Replies
                      </h4>

                      <div className="space-y-3 mt-4">
                        {ticket.replies.map((reply) => (
                          <div
                            key={reply._id}
                            className="bg-green-50 border border-green-200 rounded-xl p-4"
                          >
                            <p className="font-bold text-green-800">
                              Administrator
                            </p>

                            <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                              {reply.message}
                            </p>

                            <p className="text-xs text-gray-500 mt-3">
                              {date(reply.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
