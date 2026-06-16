/**
 * app/page.tsx
 *
 * Help Center homepage — Server Component.
 *
 * Fetches all published videos on the server, then passes them down to the
 * <VideoGrid> Client Component which handles search + category filtering
 * entirely in the browser (no extra round-trips on every keystroke).
 */

import type { Metadata } from 'next';
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VideoGrid } from "@/app/_components/VideoGrid";
import type { HelpVideo } from "@/lib/supabase/database.types";
import Link from 'next/link';
import Image from "next/image";
import { Header } from "./_components/Header";

export const metadata: Metadata = {
  title: "CloseoutSoft Help Center",
  description: "Video tutorials and guides for CloseoutSoft",
};

export default async function HelpCenterHomePage() {
  const supabase = await createServerSupabaseClient();

  const { data: videos } = await supabase
    .from("help_videos")
    .select("*")
    .eq("is_published", true)
    .order('position', { ascending: true })
    .order("created_at", { ascending: false });

  const allVideos = (videos as HelpVideo[] | null) ?? [];

  // Derive the unique category list (preserving insertion order)
  const categories = [...new Set(allVideos.map((v) => v.category))];

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <Header />

      {/* ── Main content ── */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        {allVideos.length === 0 ? (
          <p className="text-center text-gray-500 py-24">
            No videos published yet.
          </p>
        ) : (
          <VideoGrid videos={allVideos} categories={categories} />
        )}
      </main>
    </div>
  );
}
