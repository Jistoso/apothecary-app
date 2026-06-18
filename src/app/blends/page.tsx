import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function BlendsPage() {
  const supabase = await createClient()

  const { data: blends } = await supabase
    .from('saved_blends')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Saved Blends</h1>
          <p className="text-stone-500 text-sm mt-1">Your personal blend collection</p>
        </div>

        {!blends || blends.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
            <p className="text-stone-400 text-sm">No saved blends yet.</p>
            <Link href="/generate" className="inline-block mt-3 text-sm font-medium text-stone-700 hover:underline">
              Generate your first blend →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {blends.map(blend => (
              <li key={blend.id}>
                <Link
                  href={`/blends/${blend.id}`}
                  className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-5 py-4 hover:bg-stone-50 transition-colors"
                >
                  <span className="text-sm font-medium text-stone-800">{blend.name}</span>
                  <span className="text-xs text-stone-400">
                    {new Date(blend.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  )
}
