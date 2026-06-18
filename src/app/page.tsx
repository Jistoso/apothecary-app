import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import Anthropic from '@anthropic-ai/sdk'

const GOALS = [
  'Calm / Stress / Anxiety',
  'Sleep',
  'Digestion',
  'Energy / Focus',
  'Immunity',
  'General Wellness',
]

const GOAL_KEYWORDS: Record<string, string[]> = {
  'Calm / Stress / Anxiety': ['calm', 'nervine', 'adaptogen', 'stress', 'relax', 'anxiolytic'],
  'Sleep': ['sleep', 'sedative', 'calming', 'rest'],
  'Digestion': ['digestive', 'carminative', 'gut', 'nausea', 'bloating'],
  'Energy / Focus': ['energizing', 'stimulant', 'focus', 'cognitive', 'adaptogen'],
  'Immunity': ['immune', 'antiviral', 'anti-inflammatory', 'antioxidant'],
  'General Wellness': ['antioxidant', 'tonic', 'adaptogen', 'nourishing'],
}

type BlendIngredient = { name: string; amount: string; unit: string }
type WeeklyBlend = {
  blend_name: string
  ingredients: BlendIngredient[]
  water_temp: string
  steep_time: string
  benefits_summary: string
}
type InventoryRow = {
  quantity: number
  unit: string
  ingredients_master: {
    id: string
    name: string
    flavor_profile: string[]
    benefits: string[]
    water_temp: string
    steep_time: string
  }
}

async function generateBlend(inventory: InventoryRow[], goal: string): Promise<WeeklyBlend | null> {
  try {
    const keywords = GOAL_KEYWORDS[goal] || []
    let filtered = inventory.filter(row =>
      row.ingredients_master.benefits?.some(b =>
        keywords.some(k => b.toLowerCase().includes(k))
      )
    )
    if (filtered.length < 3) filtered = inventory

    const inventoryText = filtered
      .map(row => {
        const i = row.ingredients_master
        return `${i.name} | Flavor: [${i.flavor_profile?.join(', ')}] | Benefits: [${i.benefits?.join(', ')}] | In stock: ${row.quantity} ${row.unit}`
      })
      .join('\n')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'You are an expert herbalist and tea blender with deep knowledge of therapeutic herbs, flavor balance, and traditional wellness practices. You create practical, effective tea blends.',
      messages: [{
        role: 'user',
        content: `Create a tea blend using ONLY the ingredients listed below. Do not use any ingredient not on this list. No exceptions.

AVAILABLE INGREDIENTS:
${inventoryText}

USER GOAL: ${goal}
TASTE PREFERENCE: balanced

CONSTRAINTS:
- Use ONLY ingredients from the list above
- Choose between 3 and 5 ingredients
- Balance flavor profile with therapeutic benefit
- Measurements are for a single 8oz serving

RESPOND IN THIS EXACT JSON FORMAT — no other text:
{
  "blend_name": "string",
  "ingredients": [{ "name": "string", "amount": "string", "unit": "tsp" }],
  "water_temp": "string",
  "steep_time": "string",
  "benefits_summary": "string (2–3 sentences)"
}`,
      }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    return JSON.parse(jsonMatch[0])
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch inventory
  const { data: inventory } = await supabase
    .from('user_inventory')
    .select('quantity, unit, ingredients_master(id, name, flavor_profile, benefits, water_temp, steep_time)')
    .eq('user_id', user.id)

  const rows = (inventory || []) as InventoryRow[]

  // Weekly recommendation
  let weeklyBlend: WeeklyBlend | null = null
  const { data: rec } = await supabase
    .from('weekly_recommendation')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const isStale = !rec || new Date(rec.generated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  if (isStale && rows.length >= 3) {
    const goal = GOALS[Math.floor(Math.random() * GOALS.length)]
    weeklyBlend = await generateBlend(rows, goal)
    if (weeklyBlend) {
      await supabase.from('weekly_recommendation').upsert(
        { user_id: user.id, blend: weeklyBlend, generated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }
  } else if (rec) {
    weeklyBlend = rec.blend as WeeklyBlend
  }

  // Discover — ingredients not in inventory
  const ownedIds = rows.map(r => r.ingredients_master.id)
  const discoverQuery = supabase
    .from('ingredients_master')
    .select('id, name, type, benefits')
    .limit(8)

  if (ownedIds.length > 0) {
    discoverQuery.not('id', 'in', `(${ownedIds.join(',')})`)
  }

  const { data: discover } = await discoverQuery

  return (
    <div className="min-h-screen bg-stone-50">

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

        {/* Weekly recommendation */}
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">This Week's Blend</h2>
          {weeklyBlend ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <h3 className="text-xl font-semibold text-stone-800">{weeklyBlend.blend_name}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-stone-400 border-b border-stone-100">
                    <th className="pb-2 font-medium">Ingredient</th>
                    <th className="pb-2 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {weeklyBlend.ingredients.map((ing, i) => (
                    <tr key={i}>
                      <td className="py-2 text-stone-700">{ing.name}</td>
                      <td className="py-2 text-stone-500">{ing.amount} {ing.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Water Temp</p>
                  <p className="text-sm text-stone-700">{weeklyBlend.water_temp}</p>
                </div>
                <div className="bg-stone-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Steep Time</p>
                  <p className="text-sm text-stone-700">{weeklyBlend.steep_time}</p>
                </div>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{weeklyBlend.benefits_summary}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center">
              <p className="text-stone-400 text-sm">Add at least 3 ingredients to your inventory to get a weekly recommendation.</p>
              <Link href="/inventory" className="inline-block mt-2 text-sm font-medium text-stone-700 hover:underline">Go to inventory →</Link>
            </div>
          )}
        </section>

        {/* Discover */}
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Discover</h2>
          <p className="text-stone-500 text-sm mb-4">Ingredients not yet in your collection</p>
          {!discover || discover.length === 0 ? (
            <p className="text-stone-400 text-sm">You have every ingredient in the master list.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {discover.map(ing => (
                <li key={ing.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-stone-800">{ing.name}</span>
                    <span className="text-xs text-stone-400 capitalize">{ing.type}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(ing.benefits as string[])?.slice(0, 2).map((b: string) => (
                      <span key={b} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full capitalize">{b}</span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}
