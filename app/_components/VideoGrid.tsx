/**
 * app/_components/VideoGrid.tsx
 *
 * Client Component — handles search + category filtering entirely in the
 * browser. All video data is passed in as props from the Server Component
 * parent (app/page.tsx), so there are no extra network requests on filter.
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { HelpVideo } from "@/lib/supabase/database.types";

interface VideoGridProps {
  videos: HelpVideo[];
  categories: string[];
}

export function VideoGrid({ videos, categories }: VideoGridProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // ── Derived filtered list (recomputed only when inputs change) ───────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return videos.filter((v) => {
      const matchesCategory =
        activeCategory === "All" || v.category === activeCategory;

      const matchesSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [videos, search, activeCategory]);

  // ── Group filtered results by category ──────────────────────────────────
  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, HelpVideo[]>>((acc, video) => {
      if (!acc[video.category]) acc[video.category] = [];
      acc[video.category].push(video);
      return acc;
    }, {});
  }, [filtered]);

  const countByCategory = useMemo(() => {
    return videos.reduce<Record<string, number>>((acc, video) => {
      acc[video.category] = (acc[video.category] ?? 0) + 1
      return acc
    }, {})
  }, [videos])

  const hasResults = filtered.length > 0;

  return (
    <div>
      {/* ── Search + filter bar ── */}
      <div className="mb-10 space-y-4">
        {/* Search input */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              className="h-4 w-4 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search videos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-3xl border border-gray-300 bg-gray-100 py-3 pl-11 pr-4
                       text-sm text-gray-900 placeholder:text-gray-500
                       focus:border-[#425b7d] focus:outline-none focus:ring-1
                       focus:ring-[#425b7d] transition-colors"
          />
          {/* Clear button */}
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500
                         hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors
                          focus:outline-none focus:ring-offset-2
                          focus:ring-offset-gray-950
                          ${
                            activeCategory === cat
                              ? "bg-[#425b7d] text-white"
                              : "bg-[#425b7d]/5 text-gray-400 hover:bg-[#425b7d]/95 hover:text-white"
                          }`}
            >
              {cat === 'All'
                ? `All (${videos.length})`
                : `${cat} (${countByCategory[cat] ?? 0})`
              }
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ── */}
      {search || activeCategory !== "All" ? (
        <p className="mb-6 text-sm text-gray-500">
          {hasResults
            ? `${filtered.length} video${filtered.length === 1 ? "" : "s"} found`
            : null}
        </p>
      ) : null}

      {/* ── Empty state ── */}
      {!hasResults && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg
            className="mb-4 h-10 w-10 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <p className="text-base font-medium text-gray-400">
            No videos match your search
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Try a different keyword or{" "}
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
              className="text-[#652f8f] underline hover:text-[#2e1542]"
            >
              clear all filters.
            </button>
          </p>
        </div>
      )}

      {/* ── Video grid, grouped by category ── */}
      <div className="space-y-12">
        {Object.entries(grouped).map(([category, categoryVideos]) => (
          <section key={category}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#425b7d]">
                {category}
              </h2>
              <span className="text-xs text-gray-600">
                {categoryVideos.length} video
                {categoryVideos.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/${encodeURIComponent(video.category)}/${video.slug}`}
                  className="group rounded-xl border border-gray-200 bg-gray-100 p-4
                             hover:border-[#425b7d]/50 hover:bg-[#425b7d]/10 transition-all
                             duration-150"
                >
                  <div className="aspect-video w-full rounded-lg bg-gray-800 mb-3 overflow-hidden">
                    <video
                      src={video.video_url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                      playsInline
                      // Seeks to 1 second to grab a frame as the "thumbnail"
                      onLoadedMetadata={(e) => {
                        (e.target as HTMLVideoElement).currentTime = 1;
                      }}
                    />
                  </div>

                  {/* Highlight matching search text in title */}
                  <h3
                    className="font-medium text-gray-900 group-hover:text-[#425b7d]
                                 transition-colors line-clamp-2 text-sm leading-snug"
                  >
                    <HighlightedText text={video.title} query={search} />
                  </h3>

                  {video.description && (
                    <p className="mt-1.5 text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      <HighlightedText
                        text={video.description}
                        query={search}
                      />
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: highlights the matched query string within a piece of text
// ---------------------------------------------------------------------------

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-[#425b7d]/30 text-[#425b7d] rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
