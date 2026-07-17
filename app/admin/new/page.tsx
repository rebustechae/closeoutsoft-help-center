/**
 * app/admin/new/page.tsx
 *
 * Admin: Create New Help Video
 *
 * A Client Component form that:
 *  1. Collects title, category, description, and a video link.
 *  2. Auto-generates a slug from the title.
 *  3. Inserts a new row into help_videos with all metadata.
 *
 * Add basic route protection in middleware.ts or a layout.tsx to ensure
 * only authenticated team members can reach /admin/* routes.
 */

"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from '@/lib/hooks/useCategories';
import { slugify, type VideoCategory } from "@/lib/utils";
import Link from "next/link";
import type { Database } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreateStatus =
  | { stage: "idle" }
  | { stage: "saving" }
  | { stage: "success"; slug: string; category: string }
  | { stage: "error"; message: string };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewVideoPage() {
  const router = useRouter();
  const supabase = createClient();

  // ── Form field state ────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const categories = useCategories()
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [videoLink, setVideoLink] = useState("");

  // ── Status state ────────────────────────────────────────────────────────
  const [status, setStatus] = useState<CreateStatus>({ stage: "idle" });

  // ── Set default category when categories load ────────────────────────────
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0])
    }
  }, [categories])

  // ── Main submit handler ──────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Basic validation
    if (!videoLink.trim()) {
      setStatus({
        stage: "error",
        message: "Please enter a video link/URL.",
      });
      return;
    }
    if (!title.trim()) {
      setStatus({ stage: "error", message: "A title is required." });
      return;
    }

    try {
      setStatus({ stage: "saving" });

      const slug = slugify(title);

      const { error: dbError } = await (supabase as any)
        .from("help_videos")
        .insert({
          title: title.trim(),
          slug,
          description: description.trim() || null,
          category,
          video_url: videoLink.trim(),
          is_published: isPublished,
        });

      if (dbError) {
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      setStatus({ stage: "success", slug, category });

      // Optionally navigate straight to the published video page:
      // router.push(`/${encodeURIComponent(category)}/${slug}`)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setStatus({ stage: "error", message });
    }
  }

  // ── Derived UI state ─────────────────────────────────────────────────────

  const isSubmitting = status.stage === "saving";

  const submitLabel = status.stage === "saving" ? "Saving…" : "Add Video";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* ── Back link ── */}
        <div className="border-t border-white/10 pb-8">
          <Link
            href="/admin"
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
            Back to Dashboard
          </Link>
        </div>

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Add Help Video
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new help video by providing a title, category, description, and video link.
          </p>
        </div>

        {/* ── Success banner ── */}
        {status.stage === "success" && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              ✓ Video created successfully!
            </p>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/${encodeURIComponent(status.category)}/${status.slug}`,
                  )
                }
                className="text-sm text-green-700 underline hover:text-green-900"
              >
                View video page →
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setVideoLink("");
                  setIsPublished(false);
                  setStatus({ stage: "idle" });
                }}
                className="text-sm text-green-700 underline hover:text-green-900"
              >
                Add another
              </button>
            </div>
          </div>
        )}

        {/* ── Error banner ── */}
        {status.stage === "error" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Upload failed</p>
            <p className="mt-1 text-sm text-red-700">{status.message}</p>
          </div>
        )}

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How to reset your password"
              disabled={isSubmitting}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                         shadow-sm placeholder:text-gray-400 
                         focus:border-[#425b7d] focus:outline-none focus:ring-1 focus:ring-[#425b7d]
                         disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            {/* Live slug preview */}
            {title && (
              <p className="mt-1.5 text-xs text-gray-400">
                Slug: <span className="font-mono">{slugify(title)}</span>
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                         shadow-sm focus:border-[#425b7d] focus:outline-none focus:ring-1
                         focus:ring-[#425b7d] disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief summary of what this video covers…"
              disabled={isSubmitting}
              className="mt-1.5 block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-gray-900
                         text-sm shadow-sm placeholder:text-gray-400
                         focus:border-[#425b7d] focus:outline-none focus:ring-1 focus:ring-[#425b7d]
                         disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          {/* Video link input */}
          <div>
            <label
              htmlFor="videoLink"
              className="block text-sm font-medium text-gray-700"
            >
              Video Link <span className="text-red-500">*</span>
            </label>
            <input
              id="videoLink"
              type="url"
              required
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              placeholder="https://example.com/video.mp4 or https://youtube.com/watch?v=..."
              disabled={isSubmitting}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900
                         shadow-sm placeholder:text-gray-400 
                         focus:border-[#425b7d] focus:outline-none focus:ring-1 focus:ring-[#425b7d]
                         disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Enter the URL of your video. Supports direct video links (MP4, WebM, etc.) or embedded video URLs (YouTube, Vimeo, etc.)
            </p>
          </div>

          {/* Publish toggle */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Publish immediately
              </p>
              <p className="text-xs text-gray-400">
                If off, the video is saved as a draft and hidden from public
                view.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              onClick={() => setIsPublished((v) => !v)}
              disabled={isSubmitting}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
                          border-2 border-transparent transition-colors duration-200 ease-in-out
                          focus:outline-none focus:ring-2 focus:ring-[#425b7d] focus:ring-offset-2
                          disabled:cursor-not-allowed
                          ${isPublished ? "bg-[#425b7d]" : "bg-gray-200"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full
                            bg-white shadow ring-0 transition duration-200 ease-in-out
                            ${isPublished ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !videoLink.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#425b7d] px-4 py-2.5
                       text-sm font-semibold text-white shadow-sm transition-colors
                       hover:bg-[#425b7d]/90 focus:outline-none focus:ring-2 focus:ring-[#425b7d]
                       focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#425b7d]/30"
          >
            {isSubmitting && (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
