
import { Link } from "react-router-dom";
import {
  Sprout,
  ShoppingBasket,
  BrainCircuit,
  Stethoscope,
  CloudSun,
  TrendingUp,
  Store,
  Tractor,
  LandPlot,
  Truck,
  Package,
  ClipboardList,
  Users,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const farmerFeatures = [
  {
    title: "AI Farming Assistant",
    icon: BrainCircuit,
  },
  {
    title: "Crop Disease Detection",
    icon: Stethoscope,
  },
  {
    title: "Farm Land Management",
    icon: LandPlot,
  },
  {
    title: "Weather & Market Prices",
    icon: CloudSun,
  },
  {
    title: "Sell Agricultural Products",
    icon: Store,
  },
  {
    title: "Equipment Rentals",
    icon: Tractor,
  },
  {
    title: "Farmer Network",
    icon: Users,
  },
  {
    title: "Farmland Marketplace",
    icon: Leaf,
  },
];

const buyerFeatures = [
  {
    title: "Buy Agricultural Products",
    icon: ShoppingBasket,
  },
  {
    title: "Product Order Tracking",
    icon: Truck,
  },
  {
    title: "Equipment Rentals",
    icon: Tractor,
  },
  {
    title: "Explore Farmland",
    icon: LandPlot,
  },
  {
    title: "Sell Products & Farmland",
    icon: Store,
  },
  {
    title: "Manage Orders & Requests",
    icon: ClipboardList,
  },
  {
    title: "Market Prices",
    icon: TrendingUp,
  },
  {
    title: "Farmer Network",
    icon: Users,
  },
];

function FeatureCard({ title, icon: Icon }) {
  return (
    <div className="group flex items-center gap-3 bg-white/90 border border-green-200 rounded-2xl px-4 py-4 hover:border-green-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <div className="w-11 h-11 shrink-0 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
        <Icon size={22} className="text-green-700" />
      </div>

      <span className="text-sm md:text-base font-semibold text-gray-800 leading-snug">
        {title}
      </span>
    </div>
  );
}

function PlatformCard({
  title,
  subtitle,
  icon: Icon,
  features,
  label,
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-green-600 shadow-lg shadow-green-950/5">
      <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-green-100/60 blur-3xl pointer-events-none" />

      <div className="relative p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="w-15 h-15 shrink-0 rounded-2xl bg-green-700 text-white p-4 flex items-center justify-center shadow-lg shadow-green-700/20">
            <Icon size={30} />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">
              {label}
            </span>

            <h3 className="text-2xl md:text-3xl font-extrabold text-green-950 mt-1">
              {title}
            </h3>

            <p className="text-gray-500 mt-2 text-sm md:text-base leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-8">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              icon={feature.icon}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5FAF5] text-gray-900 overflow-x-hidden">
      {/* NAVBAR */}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-green-100">
        <nav className="max-w-7xl mx-auto px-5 md:px-8 h-20 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 min-w-0"
          >
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-green-700 text-white flex items-center justify-center shadow-md shadow-green-700/20">
              <Sprout size={27} />
            </div>

            <div>
              <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-green-800">
                AgriVerse AI
              </h1>

              <p className="hidden sm:block text-xs text-gray-500 font-medium tracking-wide">
                Smart Agriculture Ecosystem
              </p>
            </div>
          </Link>

          <Link
            to="/auth"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-green-700 hover:bg-green-800 text-white px-4 md:px-6 py-3 rounded-xl font-bold text-sm md:text-base transition-all shadow-sm"
          >
            Login / Signup
            <ArrowRight size={17} className="hidden sm:block" />
          </Link>
        </nav>
      </header>

      {/* HERO SECTION */}

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-[#F5FAF5] to-emerald-50" />

        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-green-200/50 blur-3xl pointer-events-none" />

        <div className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-emerald-200/50 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-green-200 text-green-800 text-sm font-bold shadow-sm">
            <Leaf size={17} />
            Agriculture Meets Innovation
          </div>

          <h2 className="max-w-5xl mx-auto text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mt-7">
            Growing a Smarter
            <span className="block text-green-700">
              Agricultural Future
            </span>
          </h2>

          <p className="max-w-3xl mx-auto text-gray-600 text-lg md:text-xl leading-relaxed mt-6">
            One platform connecting farmers and buyers through smart farming solutions, agricultural
            marketplaces, and seamless order management.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-9">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-3 bg-green-700 hover:bg-green-800 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-700/20 transition-all"
            >
              Explore AgriVerse AI
              <ArrowRight
                size={21}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>

            <a
              href="#platforms"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white border border-green-200 text-green-800 font-bold text-lg hover:bg-green-50 transition-all shadow-sm"
            >
              View Features
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm md:text-base font-semibold text-green-900">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={19} className="text-green-600" />
              Smart Farming
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 size={19} className="text-green-600" />
              Direct Marketplace
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2 size={19} className="text-green-600" />
              Farmer & Buyer Access
            </span>
          </div>
        </div>
      </section>

      {/* TWO MAIN PLATFORMS */}

      <section
        id="platforms"
        className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-20"
      >
        <div className="text-center mb-11">
          <div className="inline-flex items-center gap-2 text-green-700 font-bold text-sm uppercase tracking-widest">
            <Sparkles size={18} />
            Our Platforms
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-green-950 mt-3">
            Everything You Need, In One Place
          </h2>

        </div>

        <div className="grid lg:grid-cols-2 gap-7 items-stretch ">
          <PlatformCard
            title="Farmer Platform"
            label="For Farmers"
            icon={Sprout}
            features={farmerFeatures}
          />

          <PlatformCard
            title="Buyer Platform"
            label="For Non-Farmers"
            icon={ShoppingBasket}
            
            features={buyerFeatures}
          />
        </div>
      </section>

      {/* MARKETPLACE STRIP */}

      <section className="max-w-7xl mx-auto px-5 md:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-800 to-emerald-700 p-8 md:p-12 text-white">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border-[35px] border-white/5 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-7">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-green-100 font-semibold text-sm uppercase tracking-widest">
                <ShieldCheck size={18} />
                AgriVerse Marketplace
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold mt-3">
                One Marketplace. More Opportunities.
              </h2>

              <p className="text-green-50 leading-relaxed mt-4">
                Explore agricultural products, rental
                equipment and farmland listings
                through a single platform.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="bg-white border-t border-green-100">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-7 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sprout size={24} className="text-green-700" />

            <span className="text-xl font-extrabold text-green-800">
              AgriVerse AI
            </span>
          </div>

          <p className="text-gray-500 text-sm text-center">
            Smart Agriculture Ecosystem for Farmers and Buyers
          </p>
        </div>
      </footer>
    </div>
  );
}
