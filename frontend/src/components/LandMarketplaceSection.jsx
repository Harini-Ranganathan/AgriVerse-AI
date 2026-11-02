import { LandPlot } from "lucide-react"
import { Link } from "react-router-dom"

function LandMarketplaceSection() {
  return (
    <Link to="/land-marketplace">
<section className="px-8 pb-20 max-w-6xl mx-auto">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-green-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-green-100 flex items-center justify-center">
            <LandPlot className="text-green-700" size={42} />
          </div>

          <div className="flex-1">
            <h2 className="text-4xl font-bold text-gray-900">
              Farm Land Marketplace
            </h2>

            <p className="text-gray-800 mt-4 text-lg">
              Farmers can list agricultural lands for sale with photos, location,
              soil quality, water access, crop suitability, and price. Buyers can
              explore lands directly without brokers.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-green-100 p-4 rounded-2xl">
                ₹50 owner contact unlock
              </div>
              <div className="bg-green-100 p-4 rounded-2xl">
                ₹500 premium buyer badge
              </div>
              <div className="bg-green-100 p-4 rounded-2xl">
                Optional secure transaction fee
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
</Link>
  )
}

export default LandMarketplaceSection