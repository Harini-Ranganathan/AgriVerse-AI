import { useState } from "react"
import { Link } from "react-router-dom"
import { UploadCloud, Leaf, ShieldAlert } from "lucide-react"

function CropDoctorPage() {
  const currentUser =
    JSON.parse(localStorage.getItem("agriverseCurrentUser")) || {}

  const dashboardPath =
    currentUser.role === "buyer"
      ? "/customer-dashboard"
      : "/farmer-dashboard"

  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [crop, setCrop] = useState("")
  const [userQuestion, setUserQuestion] = useState("")
  const [resultText, setResultText] = useState("")
  const [loading, setLoading] = useState(false)

  function handleImageUpload(event) {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  async function analyzeCrop() {
    if (!selectedFile && !crop && !userQuestion) {
      alert("Please upload a crop image or provide details/questions.")
      return
    }

    try {
      setLoading(true)
      setResultText("")

      const formData = new FormData()
      if (selectedFile) formData.append("image", selectedFile)
      formData.append("crop", crop)
      formData.append("question", userQuestion)

      const response = await fetch("http://localhost:5000/api/disease/analyze-disease", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server returned HTTP code ${response.status}`)
      }

      const data = await response.json()

      const output =
        data.analysis ||
        data.result ||
        data.response ||
        (data.data && (data.data.analysis || data.data.result))

      if (output) {
        setResultText(output)
      } else {
        setResultText("Analysis processed, but no diagnostic output was generated.")
      }
    } catch (error) {
      console.error("Crop Doctor UI Error:", error)
      setResultText(`Crop Doctor AI analysis failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link to={dashboardPath} className="text-green-700 font-bold hover:underline">
          ← Back to Dashboard
        </Link>

        <div className="bg-white rounded-[3rem] p-10 border border-green-100 shadow-xl mt-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center">
              <Leaf className="text-green-700" size={42} />
            </div>

            <div>
              <h1 className="text-5xl font-extrabold text-green-700">
                AI Crop Doctor
              </h1>
              <p className="text-gray-600 mt-3 text-lg">
                Upload a leaf photo, enter your crop name, and ask questions to get real-time API diagnostic analysis.
              </p>
            </div>
          </div>

          {/* Inputs Section */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Crop Name</label>
              <input
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                placeholder="e.g. Paddy, Rice, Tomato, Wheat"
                className="w-full border border-green-200 rounded-2xl px-5 py-4 outline-none text-lg text-black bg-white focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Ask About This Crop</label>
              <input
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                placeholder="e.g. Why are the leaf tips turning yellow?"
                className="w-full border border-green-200 rounded-2xl px-5 py-4 outline-none text-lg text-black bg-white focus:border-green-500"
              />
            </div>
          </div>

          {/* Image Upload Area */}
          <label className="mt-8 h-80 border-2 border-dashed border-green-200 rounded-[3rem] bg-green-50 flex items-center justify-center cursor-pointer overflow-hidden relative transition hover:border-green-400">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Crop preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6">
                <UploadCloud
                  className="text-green-700 mx-auto mb-4"
                  size={50}
                />
                <p className="font-bold text-gray-800 text-lg">
                  Click to upload crop image
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports JPG, PNG, WEBP
                </p>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={analyzeCrop}
            disabled={loading}
            className="mt-8 w-full bg-green-700 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-green-800 transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Analyzing Live Crop Health..." : "Analyze Crop Health"}
          </button>

          {/* Result Output */}
          {resultText && (
            <div className="mt-10 bg-green-50 rounded-[3rem] p-8 border border-green-100 shadow-inner">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-green-700" size={30} />
                <h2 className="text-3xl font-extrabold text-black">
                  AI Diagnostic Result
                </h2>
              </div>

              <div className="mt-6 bg-white rounded-3xl p-6 border border-green-100 shadow-sm">
                <pre className="whitespace-pre-wrap text-gray-800 leading-8 text-lg font-sans">
                  {resultText}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CropDoctorPage