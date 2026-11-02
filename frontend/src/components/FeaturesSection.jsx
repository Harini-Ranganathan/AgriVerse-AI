import FeatureCard from "./FeatureCard"
import { platformFeatures } from "../data/features"

function FeaturesSection() {
  return (
    <section className="px-8 pb-16 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900">
          Complete Agriculture Ecosystem
        </h2>
        <p className="text-gray-900 text-lg mt-3">
          Everything a farmer needs — from soil to market.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {platformFeatures.map((feature) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
          />
        ))}
      </div>
    </section>
  )
}

export default FeaturesSection