import { useState } from "react"
import { Link } from "react-router-dom"
import { Upload, Leaf, Mic } from "lucide-react"

function DiseaseDetectionPage() {

  const currentUser =
    JSON.parse(
      localStorage.getItem(
        "agriverseCurrentUser"
      )
    ) || {}

  const dashboardPath =
    currentUser.role === "buyer"
      ? "/customer-dashboard"
      : "/farmer-dashboard"
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState("")
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)

  function handleImage(event) {
    const file = event.target.files[0]
    if (!file) return

    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  function startVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert("Voice recognition not supported.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.start()

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript
      setQuestion((oldText) =>
        oldText.trim() ? oldText.trim() + " " + spokenText : spokenText
      )
    }
  }

  async function detectDisease() {

    if (!image) {
      alert("Please upload an image.")
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append("image", image)
      formData.append("question", question)

      const res = await fetch("http://localhost:5000/api/disease/detect", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      setResult(data.response || data.result || "No AI result generated.")
    } catch (error) {
      console.error(error)
      setResult("Crop Doctor AI failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link to={dashboardPath} className="text-green-700 font-semibold">
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-[3rem] p-10 mt-6 border border-green-100 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center">
              <Leaf className="text-green-700" size={42} />
            </div>

            <div>
              <h1 className="text-5xl font-extrabold text-green-700">
                Crop Doctor AI
              </h1>
              
            </div>
          </div>

          <div className="mt-12">
            <label className="font-bold text-2xl text-black">
              Upload Crop Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="border border-green-200 p-4 rounded-2xl w-full mt-5"
            />

            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-[350px] object-cover rounded-3xl mt-8"
              />
            )}
          </div>

          <div className="mt-10">
            <label className="font-bold text-2xl text-black">
              Ask About This Crop
            </label>

            <div className="flex gap-4 mt-5">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: What disease is this? How can I treat these leaves?"
                className="w-full border-2 border-green-200 rounded-[2rem] p-6 outline-none h-[140px] resize-none text-lg text-black"
              />

              <button
                onClick={startVoiceInput}
                className="w-20 h-20 rounded-3xl bg-green-700 text-white flex items-center justify-center hover:bg-green-800 transition"
              >
                <Mic size={30} />
              </button>
            </div>

            <button
              onClick={detectDisease}
              className="mt-8 bg-green-700 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-green-800 transition"
            >
              <Upload size={22} />
              {loading ? "Analyzing..." : "Analyze Crop"}
            </button>
          </div>

          {result && (
            <div className="bg-green-50 rounded-[2rem] p-8 mt-12 border border-green-100">
              <h2 className="text-3xl font-extrabold text-green-700">
                Crop Doctor Result
              </h2>

              <p className="text-lg text-black leading-9 mt-6 whitespace-pre-line">
                {result}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DiseaseDetectionPage