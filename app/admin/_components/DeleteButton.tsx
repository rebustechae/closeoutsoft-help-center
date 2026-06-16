// app/admin/_components/DeleteButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function DeleteButton({ id }: { id: string }) {
    const router = useRouter()
    const supabase = createClient()

    async function handleDelete(){
        if (!confirm('Delete this video permanently? This cannot be undone.')) return

        const { error } = await supabase
            .from('help_videos')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Failed to delete: ' + error.message)
        } else {
            router.refresh()
        }
    }

    return (
        <button
            onClick={handleDelete}
            className='rounded-md bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors'
        >
            Delete
        </button>
    )
}