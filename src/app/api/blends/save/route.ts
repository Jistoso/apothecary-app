import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { blend } = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase.from('saved_blends').insert({
      user_id: user.id,
      name: blend.blend_name,
      ingredients: blend.ingredients,
      water_temp: blend.water_temp,
      steep_time: blend.steep_time,
      benefits_summary: blend.benefits_summary,
    })

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed to save blend.' }, { status: 500 })
  }
}
