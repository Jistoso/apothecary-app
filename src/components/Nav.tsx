import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function Nav() {
  const headersList = await headers()
  const pathname = headersList.get('x-invoke-path') || ''

  const isAuthPage = pathname === '/login' || pathname === '/signup'
  if (isAuthPage) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  async function handleLogout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <nav className="bg-white border-b border-stone-200 px-4 py-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-stone-800 hover:text-stone-600">Apothecary</Link>
        <div className="flex items-center gap-3 sm:gap-5 text-sm">
          <Link href="/inventory" className="text-stone-600 hover:text-stone-800">Inventory</Link>
          <Link href="/generate" className="text-stone-600 hover:text-stone-800">Generate</Link>
          <Link href="/blends" className="text-stone-600 hover:text-stone-800">Blends</Link>
          <form action={handleLogout}>
            <button type="submit" className="text-stone-400 hover:text-stone-600">Sign out</button>
          </form>
        </div>
      </div>
    </nav>
  )
}
