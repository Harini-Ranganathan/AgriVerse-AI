import { Link } from "react-router-dom"
function HeroSection() {
  return (
    <section className="px-8 py-20 text-center">
      <p className="text-green-700 font-semibold text-2xl mb-4">
        AI Agriculture Ecosystem for Indian Farmers
      </p>

      <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 max-w-5xl mx-auto leading-tight">
        AI-Powered Regenerative Agriculture Intelligence Ecosystem for India
      </h2>

      <p className="text-xl text-gray-900 max-w-3xl mx-auto mt-6">
        A real-world platform helping farmers improve crop decisions, soil
        health, climate resilience, market access, income, and long-term
        sustainability.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        
        <Link
          to="/choose-role"
          className="bg-green-700 text-white px-7 py-3 rounded-full font-semibold shadow-md hover:bg-green-800 transition"
        >
          Start as Farmer
        </Link>

        <button className="bg-white text-green-700 px-7 py-3 rounded-full font-semibold shadow-md border border-green-200 hover:bg-green-50 transition">
          Explore Platform
        </button>
      </div>
    </section>
  )
}

export default HeroSection