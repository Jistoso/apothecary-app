export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">
      <div>
        <div className="skeleton h-3 w-32 mb-3" />
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <div className="skeleton h-6 w-48" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="skeleton h-16" />
            <div className="skeleton h-16" />
          </div>
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      </div>

      <div>
        <div className="skeleton h-3 w-24 mb-3" />
        <div className="skeleton h-4 w-56 mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl px-4 py-3 space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
