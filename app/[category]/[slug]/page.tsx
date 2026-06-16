/**
 * app/[category]/[slug]/page.tsx
 *
 * Public Theater View — Server Component
 *
 * Fetches a single published help video by its slug, then renders:
 *  • A crisp 16:9 HTML5 <video> player
 *  • The video title and description beneath it
 *  • Breadcrumb navigation back to the category listing
 *
 * URL pattern: /<category>/<slug>
 * Example:     /getting-started/how-to-reset-your-password
 *
 * The page is statically generated at build time (or revalidated on demand)
 * via Next.js App Router's default Server Component behaviour.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { HelpVideo } from '@/lib/supabase/database.types'
import { Header } from '@/app/_components/Header'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{
    category: string
    slug: string
  }>
}

// ---------------------------------------------------------------------------
// Metadata generation (SEO)
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: video } = await supabase
    .from('help_videos')
    .select('title, description')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!video) return { title: 'Video Not Found' }

  return {
    title: `${(video as Pick<HelpVideo, 'title' | 'description'>).title} — Help Center`,
    description: (video as Pick<HelpVideo, 'title' | 'description'>).description ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function VideoTheaterPage({ params }: PageProps) {
  const { category, slug } = await params

  // ── Data fetching ────────────────────────────────────────────────────────
  // The server client forwards the user's cookie so RLS runs correctly.
  // The `is_published = true` filter is belt-and-suspenders on top of RLS.

  const supabase = await createServerSupabaseClient()

  const { data: video, error } = await supabase
    .from('help_videos')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  // Supabase returns an error when no row is found — treat both cases as 404.
  if (error || !video) {
    notFound()
  }

  const typedVideo = video as HelpVideo

  // Decode category for display (the URL uses URL-encoded strings)
  const categoryLabel = decodeURIComponent(category)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">

      {/* ── Top navigation bar ── */}
      <Header/>

      {/* ── Main content ── */}
      <main className="mx-auto max-w-5xl px-4 py-10">

        {/* ── Back link ── */}
        <div className="border-t border-white/10 pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[#425b7d]
                       hover:text-[#2A354B] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Category badge */}
        <div className="mb-4">
          <span className="inline-block rounded-full bg-[#425b7d]/20 px-3 py-1 text-xs
                           font-semibold uppercase tracking-wider text-[#425b7d] ring-1
                           ring-[#425b7d]/30">
            {categoryLabel}
          </span>
        </div>

        {/* Video title */}
        <h1 className="mb-6 text-2xl font-semibold text-[#2A354B] sm:text-3xl leading-snug">
          {typedVideo.title}
        </h1>

        {/* ── Video player ──────────────────────────────────────────────────
            aspect-video = 16:9 (Tailwind utility)
            w-full       = fills the container width
            The outer div provides the coloured border/glow treatment.
        ─────────────────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-lg ring-1 ring-white/10 shadow-2xl
                        shadow-black/60">
          <video
            src={typedVideo.video_url}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black"
            aria-label={`Video: ${typedVideo.title}`}
          >
            {/* Graceful fallback for browsers that can't play the video tag */}
            Your browser does not support the HTML5 video player.{' '}
            <a href={typedVideo.video_url} className="underline">
              Download the video
            </a>{' '}
            instead.
          </video>
        </div>

        {/* ── Metadata strip ── */}
        <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
          <time dateTime={typedVideo.created_at}>
            Published{' '}
            {new Date(typedVideo.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>

        {/* ── Description ── */}
        {typedVideo.description && (
          <div className="mt-6 border-t border-white/10 pt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#425b7d]">
              About this video
            </h2>
            {/* prose class from @tailwindcss/typography for well-formatted text */}
            <p className="prose prose-invert prose-sm max-w-none text-[#2A354B] leading-relaxed">
              {typedVideo.description}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Static params generation (optional but recommended for performance)
//
// Uncomment and adapt if you want Next.js to pre-render all published videos
// at build time. Falls back to on-demand rendering for new videos added
// after deployment.
// ---------------------------------------------------------------------------

// export async function generateStaticParams() {
//   const supabase = await createServerSupabaseClient()
//
//   const { data: videos } = await supabase
//     .from('help_videos')
//     .select('slug, category')
//     .eq('is_published', true)
//
//   return (videos ?? []).map((v) => ({
//     category: encodeURIComponent(v.category),
//     slug: v.slug,
//   }))
// }