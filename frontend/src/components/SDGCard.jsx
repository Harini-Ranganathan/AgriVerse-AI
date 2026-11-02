function SDGCard({ goal, title, impact }) {
  return (
    <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm">
      <p className="text-sm font-bold text-green-700 mb-1">{goal}</p>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{impact}</p>
    </div>
  )
}

export default SDGCard