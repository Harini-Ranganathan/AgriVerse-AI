import { useState } from "react"
import { Link } from "react-router-dom"
import { Bot, Send, Mic } from "lucide-react"

function FarmAIAssistantPage() {
  const currentUser =
    JSON.parse(localStorage.getItem("agriverseCurrentUser")) || {}

  const dashboardPath =
    currentUser.role === "buyer"
      ? "/customer-dashboard"
      : "/farmer-dashboard"

  const [question, setQuestion] = useState("")
  const [crop, setCrop] = useState("")
  const [location, setLocation] = useState("")
  const [soilType, setSoilType] = useState("")
  const [cropStage, setCropStage] = useState("")
  const [language, setLanguage] = useState("English")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  async function askAI() {
    if (!question.trim()) {
      alert("Please enter a farming question.")
      return
    }

    try {
      setLoading(true)
      setResponse("")

      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          crop,
          location,
          soilType,
          cropStage,
          language,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setResponse(data.response)
      } else {
        setResponse(data.response || "Failed to fetch response from AgriVerse AI.")
      }
    } catch (error) {
      console.error("Farm AI error:", error)
      setResponse("Connection error. Ensure backend server is running.")
    } finally {
      setLoading(false)
    }
  }

  function startVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang =
      language === "Tamil"
        ? "ta-IN"
        : language === "Hindi"
        ? "hi-IN"
        : "en-IN"

    recognition.continuous = false
    recognition.interimResults = false
    recognition.start()

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setQuestion(transcript)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-8">
      <div className="max-w-5xl mx-auto">
        <Link to={dashboardPath} className="text-green-700 font-semibold">
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-[3rem] p-10 mt-6 border border-green-100 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center">
              <Bot className="text-green-700" size={42} />
            </div>

            <div>
              <h1 className="text-5xl font-extrabold text-green-700">
                AgriVerse AI
              </h1>
              
            </div>
          </div>

          <div className="mt-8">
            <label className="font-bold text-2xl text-black">
              Ask Farming Question
            </label>

            <div className="flex gap-4 mt-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Describe your issue (e.g., My paddy leaves are turning yellow. What should I do?)"
                className="w-full border-2 border-green-900 rounded-[2rem] p-6 outline-none h-[160px] resize-none text-lg text-black"
              />

              <button
                onClick={startVoiceInput}
                type="button"
                className="w-20 h-20 rounded-3xl bg-green-700 text-white flex items-center justify-center hover:bg-green-800 transition"
                title="Voice Input"
              >
                <Mic size={30} />
              </button>
            </div>

            <button
              onClick={askAI}
              disabled={loading}
              className="bg-green-700 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 mt-6 hover:bg-green-800 transition disabled:opacity-60"
            >
              <Send size={20} />
              {loading ? "Analyzing Context..." : "Ask AI"}
            </button>
          </div>

          {response && (
            <div className="bg-green-50 rounded-[2rem] p-8 mt-12 border border-green-100">
              <p className="text-lg text-black leading-8 whitespace-pre-line font-medium">
                {response}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FarmAIAssistantPage