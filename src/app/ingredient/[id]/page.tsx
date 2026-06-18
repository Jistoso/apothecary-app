import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function IngredientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ingredient } = await supabase
    .from('ingredients_master')
    .select('*')
    .eq('id', id)
    .single()

  if (!ingredient) notFound()

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        <Link href="/inventory" className="text-sm text-stone-400 hover:text-stone-600">
          ← Back to inventory
        </Link>

        <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-6">

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-800">{ingredient.name}</h1>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-stone-100 text-stone-600 text-xs rounded-full capitalize">
                {ingredient.type}
              </span>
            </div>
          </div>

          {ingredient.description && (
            <p className="text-stone-600 text-sm leading-relaxed">{ingredient.description}</p>
          )}

          {ingredient.benefits?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Benefits</h2>
              <div className="flex flex-wrap gap-2">
                {ingredient.benefits.map((b: string) => (
                  <span key={b} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full capitalize">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ingredient.flavor_profile?.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Flavor Profile</h2>
              <div className="flex flex-wrap gap-2">
                {ingredient.flavor_profile.map((f: string) => (
                  <span key={f} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full capitalize">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            {ingredient.water_temp && (
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Water Temp</p>
                <p className="text-sm text-stone-700">{ingredient.water_temp}</p>
              </div>
            )}
            {ingredient.steep_time && (
              <div className="bg-stone-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Steep Time</p>
                <p className="text-sm text-stone-700">{ingredient.steep_time}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
