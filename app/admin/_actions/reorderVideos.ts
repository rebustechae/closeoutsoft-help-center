'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function reorderVideos(videoIds: string[]) {
  const supabase = await createServerSupabaseClient()

  // Update each video with its new position
  const updates = videoIds.map((id, index) => ({
    id,
    position: index,
  }))

  for (const update of updates) {
    await supabase
      .from('help_videos')
      .update({ position: update.position })
      .eq('id', update.id)
  }

  // Revalidate the admin page and home page
  revalidatePath('/admin')
  revalidatePath('/')
}
