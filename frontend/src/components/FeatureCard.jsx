function FeatureCard({ title, description, icon: Icon }) {
  return (
    <div className="relative bg-white rounded-[3rem] p-7 overflow-hidden shadow-sm border border-green-100">
      
      <div className="absolute inset-0 rounded-[3rem] border-[1.5px] border-lime-200 pointer-events-none"></div>

      <div className="absolute inset-2 rounded-[2.5rem] border border-green-100 pointer-events-none"></div>

      <div className="absolute top-0 left-10 w-20 border-t-2 border-green-300"></div>
      <div className="absolute bottom-0 right-10 w-20 border-b-2 border-lime-300"></div>

      <div className="relative z-10 flex flex-col items-center text-center">
        
        <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-5">
          <Icon className="text-green-700" size={30} />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {title}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
          {description}
        </p>
      </div>
    </div>
  )
}

export default FeatureCard