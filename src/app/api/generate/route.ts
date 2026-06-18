import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const GOAL_KEYWORDS: Record<string, string[]> = {
  'Calm / Stress / Anxiety': ['calm', 'nervine', 'adaptogen', 'stress', 'relax', 'anxiolytic'],
  'Sleep': ['sleep', 'sedative', 'calming', 'rest'],
  'Digestion': ['digestive', 'carminative', 'gut', 'nausea', 'bloating'],
  'Energy / Focus': ['energizing', 'stimulant', 'focus', 'cognitive', 'adaptogen'],
  'Immunity': ['immune', 'antiviral', 'anti-inflammatory', 'antioxidant'],
  'General Wellness': ['antioxidant', 'tonic', 'adaptogen', 'nourishing'],
}

async function callClaude(inventoryText: string, goal: string, taste: string, retry = false) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const retryNote = retry
    ? '\n\nIMPORTANT: Your previous response included an ingredient not on the list. Use ONLY the ingredients provided. This is a hard requirement.'
    : ''

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: 'You are an expert herbalist and tea blender with deep knowledge of therapeutic herbs, flavor balance, and traditional wellness practices. You create practical, effective tea blends.',
    messages: [
      {
        role: 'user',
        content: `Create a tea blend using ONLY the ingredients listed below.

Do not use any ingredient not on this list. No exceptions.

AVAILABLE INGREDIENTS:
${inventoryText}

USER GOAL: ${goal}
TASTE PREFERENCE: ${taste}

CONSTRAINTS:
- Use ONLY ingredients from the list above
- Choose between 3 and 5 ingredients
- Balance flavor profile with therapeutic benefit
- Measurements are for a single 8oz serving

RESPOND IN THIS EXACT JSON FORMAT — no other text:
{
  "blend_name": "string",
  "ingredients": [
    { "name": "string", "amount": "string", "unit": "tsp" }
  ],
  "water_temp": "string",
  "steep_time": "string",
  "benefits_summary": "string (2–3 sentences)"
}${retryNote}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in response')
  return JSON.parse(jsonMatch[0])
}

export async function POST(request: Request) {
  try {
    const { goal, taste } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch user inventory joined with ingredients_master
    const { data: inventory } = await supabase
      .from('user_inventory')
      .select('quantity, unit, ingredients_master(id, name, flavor_profile, benefits, water_temp, steep_time)')
      .eq('user_id', user.id)

    if (!inventory || inventory.length === 0) {
      return Response.json({ error: 'Your inventory is empty. Add some ingredients first.' }, { status: 400 })
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

    const rows = inventory as InventoryRow[]

    // Pre-filter by goal keywords
    const keywords = GOAL_KEYWORDS[goal] || []
    let filtered = rows.filter(row =>
      row.ingredients_master.benefits?.some(b =>
        keywords.some(k => b.toLowerCase().includes(k))
      )
    )

    // Fall back to full inventory if fewer than 3 match
    if (filtered.length < 3) filtered = rows

    // Build prompt text
    const inventoryText = filtered
      .map(row => {
        const i = row.ingredients_master
        return `${i.name} | Flavor: [${i.flavor_profile?.join(', ')}] | Benefits: [${i.benefits?.join(', ')}] | In stock: ${row.quantity} ${row.unit}`
      })
      .join('\n')

    const validNames = filtered.map(r => r.ingredients_master.name.toLowerCase())

    // First attempt
    let blend = await callClaude(inventoryText, goal, taste)

    // Validate
    const allValid = blend.ingredients.every((i: { name: string }) =>
      validNames.includes(i.name.toLowerCase())
    )

    // Retry once if invalid
    if (!allValid) {
      blend = await callClaude(inventoryText, goal, taste, true)
    }

    return Response.json({ blend })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to generate blend. Please try again.' }, { status: 500 })
  }
}
