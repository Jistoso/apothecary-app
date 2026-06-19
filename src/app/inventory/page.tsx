'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Ingredient = {
  id: string
  name: string
  type: string
}

type InventoryItem = {
  id: string
  ingredient_id: string
  quantity: number
  unit: string
  notes: string | null
  ingredients_master: Ingredient
}

const UNITS = ['g', 'oz', 'tbsp', 'tsp', 'cups']

export default function InventoryPage() {
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Ingredient[]>([])
  const [selected, setSelected] = useState<Ingredient | null>(null)
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('g')
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState('')
  const [editUnit, setEditUnit] = useState('g')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  async function fetchInventory() {
    const { data } = await supabase
      .from('user_inventory')
      .select('*, ingredients_master(id, name, type)')
      .order('created_at', { ascending: false })
    if (data) setInventory(data as unknown as InventoryItem[])
  }

  async function handleSearch(term: string) {
    setSearch(term)
    setSelected(null)
    if (term.length < 2) { setResults([]); return }
    const { data } = await supabase
      .from('ingredients_master')
      .select('id, name, type')
      .ilike('name', `%${term}%`)
      .limit(8)
    if (data) setResults(data)
  }

  async function handleAdd() {
    if (!selected || !quantity) return
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('user_inventory').insert({
      user_id: user!.id,
      ingredient_id: selected.id,
      quantity: parseFloat(quantity),
      unit,
      notes: notes || null,
    })
    setSelected(null)
    setSearch('')
    setResults([])
    setQuantity('')
    setUnit('g')
    setNotes('')
    setAdding(false)
    fetchInventory()
  }

  async function handleUpdate(id: string) {
    await supabase
      .from('user_inventory')
      .update({ quantity: parseFloat(editQuantity), unit: editUnit })
      .eq('id', id)
    setEditingId(null)
    fetchInventory()
  }

  async function handleDelete(id: string) {
    await supabase.from('user_inventory').delete().eq('id', id)
    setConfirmDeleteId(null)
    fetchInventory()
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">

        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Inventory</h1>
          <p className="text-stone-500 text-sm mt-1">Search and add ingredients to your collection</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <input
            type="text"
            placeholder="Search ingredients..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />

          {results.length > 0 && !selected && (
            <ul className="border border-stone-200 rounded-lg divide-y divide-stone-100">
              {results.map(r => (
                <li
                  key={r.id}
                  onClick={() => { setSelected(r); setResults([]) }}
                  className="px-4 py-3 cursor-pointer hover:bg-stone-50 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-stone-800">{r.name}</span>
                  <span className="text-xs text-stone-400 capitalize">{r.type}</span>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-stone-800">{selected.name}</span>
                <button onClick={() => setSelected(null)} className="text-xs text-stone-400 hover:text-stone-600">Clear</button>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-32 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                >
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <input
                type="text"
                placeholder="Notes (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !quantity}
                className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
              >
                {adding ? 'Adding...' : 'Add to inventory'}
              </button>
            </div>
          )}
        </div>

        {/* Inventory list */}
        <div>
          <h2 className="text-lg font-medium text-stone-700 mb-3">Your ingredients ({inventory.length})</h2>
          {inventory.length === 0 ? (
            <p className="text-stone-400 text-sm">No ingredients yet. Search above to add some.</p>
          ) : (
            <ul className="space-y-2">
              {inventory.map(item => (
                <li key={item.id} className="bg-white border border-stone-200 rounded-xl px-5 py-4">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-stone-800 flex-1">{item.ingredients_master.name}</span>
                      <input
                        type="number"
                        value={editQuantity}
                        onChange={e => setEditQuantity(e.target.value)}
                        className="w-24 px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none"
                      />
                      <select
                        value={editUnit}
                        onChange={e => setEditUnit(e.target.value)}
                        className="px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none"
                      >
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                      <button onClick={() => handleUpdate(item.id)} className="text-xs font-medium text-green-600 hover:text-green-700">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-stone-400 hover:text-stone-600">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <Link href={`/ingredient/${item.ingredients_master.id}`} className="text-sm font-medium text-stone-800 hover:underline">
                          {item.ingredients_master.name}
                        </Link>
                        <span className="text-xs text-stone-400 ml-2 capitalize">{item.ingredients_master.type}</span>
                        {item.notes && <p className="text-xs text-stone-400 mt-0.5">{item.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-600">{item.quantity} {item.unit}</span>
                        <button
                          onClick={() => { setEditingId(item.id); setEditQuantity(String(item.quantity)); setEditUnit(item.unit) }}
                          className="text-xs text-stone-400 hover:text-stone-600"
                        >
                          Edit
                        </button>
                        {confirmDeleteId === item.id ? (
                          <span className="flex items-center gap-1 text-xs">
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 font-medium">Confirm</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-stone-400 hover:text-stone-600">Cancel</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(item.id)} className="text-xs text-red-400 hover:text-red-500">Remove</button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
