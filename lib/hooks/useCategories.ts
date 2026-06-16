// lib/hooks/useCategories.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export function useCategories() {
    const [categories, setCategories] = useState<string[]>([])

    useEffect(() => {
        const supabase = createClient()
        supabase
            .from('categories')
            .select('name')
            .order('name')
            .then(({ data }) => {
                const typedData = data as Pick<Database['public']['Tables']['categories']['Row'], 'name'>[] | null
                setCategories(typedData?.map((c) => c.name) ?? [])
            })
    }, [])

    return categories
}