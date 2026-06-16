// app/admin/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DeleteButton } from './_components/DeleteButton'
import { CategoryManager } from './_components/CategoryManager'

type VideoRow = {
  id: string
  title: string
  category: string
  is_published: boolean
  created_at: string
  slug: string
}

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: videos } = await supabase
    .from('help_videos')
    .select('id, title, category, is_published, created_at, slug')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  const allVideos = (videos as VideoRow[] | null) ?? []
  const published = allVideos.filter((v) => v.is_published)
  const drafts = allVideos.filter((v) => !v.is_published)

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Video Dashboard</h1>
            <p className="mt-1 text-sm text-gray-400">
              {published.length} published · {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/admin/new"
            className="rounded-lg bg-[#6c4193] px-4 py-2 text-sm font-semibold
                       text-white hover:bg-[#6c4193]/90 transition-colors"
          >
            + Upload video
          </Link>
        </div>

        {/* Drafts section — shown first so they're easy to find */}
        {drafts.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-yellow-500">
              Drafts
            </h2>
            <VideoTable videos={drafts} />
          </section>
        )}

        {/* Published section */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-green-500">
            Published
          </h2>
          {published.length === 0 ? (
            <p className="text-sm text-gray-500">No published videos yet.</p>
          ) : (
            <VideoTable videos={published} />
          )}
        </section>
        
        <section className='mt-10'>
          <CategoryManager categories={categories ?? []} />
        </section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: table of videos (Server Component, no interactivity needed)
// ---------------------------------------------------------------------------

function VideoTable({ videos }: { videos: VideoRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#425b7d]/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#425b7d]/10 bg-white/5 text-left text-xs
                         uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3 hidden sm:table-cell">Category</th>
            <th className="px-4 py-3 hidden md:table-cell">Added</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#425b7d]/10">
          {videos.map((video) => (
            <tr key={video.id} className="hover:bg-[#425b7d]/10 transition-colors">
              <td className="px-4 py-3">
                <span className="font-medium text-gray-900 line-clamp-1">{video.title}</span>
                <span className="mt-0.5 block font-mono text-xs text-gray-600">
                  {video.slug}
                </span>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell text-gray-400">
                {video.category}
              </td>
              <td className="px-4 py-3 hidden md:table-cell text-gray-400">
                {new Date(video.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  {video.is_published && (
                    <Link
                      href={`/${encodeURIComponent(video.category)}/${video.slug}`}
                      target="_blank"
                      className="text-xs text-gray-500 hover:text-[#425b7d] transition-colors"
                    >
                      View ↗
                    </Link>
                  )}
                  <Link
                    href={`/admin/edit/${video.id}`}
                    className="rounded-md bg-[#425b7d]/10 px-3 py-1 text-xs font-medium
                               text-gray-900 hover:bg-[#425b7d]/20 transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteButton id={video.id}/>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}