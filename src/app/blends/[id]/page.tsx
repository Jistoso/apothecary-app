import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BlendDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: blend } = await supabase
    .from('saved_blends')
    .select('*')
    .eq('id', id)
    .single()

  if (!blend) notFound()

  const ingredients = blend.ingredients as { name: string; amount: string; unit: string }[]

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        <Link href="/blends" className="text-sm text-stone-400 hover:text-stone-600">
          ← Back to blends
        </Link>

        <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">

          <div>
            <h1 className="text-2xl font-semibold text-stone-800">{blend.name}</h1>
            <p className="text-xs text-stone-400 mt-1">
              Saved {new Date(blend.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Ingredients</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-400 border-b border-stone-100">
                  <th className="pb-2 font-medium">Ingredient</th>
                  <th className="pb-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {ingredients.map((ing, i) => (
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
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Benefits</h2>
            <p className="text-sm text-stone-600 leading-relaxed">{blend.benefits_summary}</p>
          </div>

        </div>
      </div>
    </div>
  )
}
