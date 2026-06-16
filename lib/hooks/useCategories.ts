// lib/hooks/useCategories.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useCategories() {
    const [categories, setCategories] = useState<string[]>([])

    useEffect(() => {
        const supabase = createClient()
        supabase
            .from('categories')
            .select('name')
            .order('name')
            .then(({ data }) => setCategories(data?.map((c) => c.name) ?? []))
    }, [])

    return categories
}