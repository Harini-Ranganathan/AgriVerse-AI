import { Link } from "react-router-dom"
function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 bg-white/80 shadow-sm sticky top-0 backdrop-blur-md z-50">
      <h1 className="text-2xl font-bold text-green-700">
        AgriVerse AI
      </h1>

      <div className="hidden md:flex gap-6 text-gray-700 font-medium">
        <span className="cursor-pointer hover:text-green-700 transition">
          Farmers
        </span>

        <span className="cursor-pointer hover:text-green-700 transition">
          Marketplace
        </span>

        <span className="cursor-pointer hover:text-green-700 transition">
          AI Tools
        </span>

        <span className="cursor-pointer hover:text-green-700 transition">
          Community
        </span>
      </div>

      <Link
        to="/choose-role"
        className="bg-green-700 text-white px-5 py-2 rounded-full font-semibold hover:bg-green-800 transition"
      >
        Get Started
      </Link>
    </nav>
  )
}

export default Navbar