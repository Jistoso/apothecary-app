'use client'

import { useState } from 'react'

const GOALS = [
  'Calm / Stress / Anxiety',
  'Sleep',
  'Digestion',
  'Energy / Focus',
  'Immunity',
  'General Wellness',
]

type Ingredient = { name: string; amount: string; unit: string }

type Blend = {
  blend_name: string
  ingredients: Ingredient[]
  water_temp: string
  steep_time: string
  benefits_summary: string
}

export default function GeneratePage() {
  const [goal, setGoal] = useState(GOALS[0])
  const [taste, setTaste] = useState('')
  const [loading, setLoading] = useState(false)
  const [blend, setBlend] = useState<Blend | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setBlend(null)
    setError('')
    setSaved(false)

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, taste }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.error) {
      setError(data.error)
    } else {
      setBlend(data.blend)
    }
  }

  async function handleSave() {
    if (!blend) return
    setSaving(true)
    const res = await fetch('/api/blends/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blend }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) setSaved(true)
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Blend Generator</h1>
          <p className="text-stone-500 text-sm mt-1">Tell us your goal and we'll craft a blend from your inventory</p>
        </div>

        <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Goal</label>
            <select
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {GOALS.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Taste preference <span className="text-stone-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={taste}
              onChange={e => setTaste(e.target.value)}
              placeholder="e.g. earthy and warm, light and floral..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {loading ? 'Crafting your blend...' : 'Generate blend'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {blend && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
            <h2 className="text-xl font-semibold text-stone-800">{blend.blend_name}</h2>

            <div>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Ingredients</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-stone-400 border-b border-stone-100">
                    <th className="pb-2 font-medium">Ingredient</th>
                    <th className="pb-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {blend.ingredients.map((ing, i) => (
                    <tr key={i}>
                      <td className="py-2 text-stone-700">{ing.name}</td>
                      <td className="py-2 text-stone-500">{ing.amount} {ing.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Water Temp</p>
                <p className="text-sm text-stone-700">{blend.water_temp}</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Steep Time</p>
                <p className="text-sm text-stone-700">{blend.steep_time}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Benefits</h3>
              <p className="text-sm text-stone-600 leading-relaxed">{blend.benefits_summary}</p>
            </div>

            {saved ? (
              <p className="text-sm text-green-600 font-medium">Blend saved to your collection.</p>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2 border border-stone-300 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Save this blend'}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
