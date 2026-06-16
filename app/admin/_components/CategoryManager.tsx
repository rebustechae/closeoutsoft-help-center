// app/admin/_components/CategoryManager.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function CategoryManager({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!newCategory.trim()) return
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('categories')
      .insert({ name: newCategory.trim() })

    if (error) {
      setError(error.message)
    } else {
      setNewCategory('')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"? Videos in this category won't be affected.`)) return

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="rounded-xl border border-[#425b7d]/10 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-900">Manage Categories</h2>

      {/* Add new */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="New category name…"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm
                     focus:border-[#425b7d] focus:outline-none focus:ring-1 focus:ring-[#425b7d]"
        />
        <button
          onClick={handleAdd}
          disabled={loading || !newCategory.trim()}
          className="rounded-lg bg-[#425b7d] px-4 py-1.5 text-sm font-medium text-white
                     hover:bg-[#425b7d]/90 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>

      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      {/* Existing categories */}
      <div className="space-y-1">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-lg
                                       px-3 py-2 hover:bg-slate-50">
            <span className="text-sm text-gray-700">{cat.name}</span>
            <button
              onClick={() => handleDelete(cat.id, cat.name)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}