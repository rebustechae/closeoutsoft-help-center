/**
 * app/admin/new/page.tsx
 *
 * Admin: Upload New Help Video
 *
 * A Client Component form that:
 *  1. Collects title, category, description, and a video file.
 *  2. Uploads the video file DIRECTLY from the browser to Supabase Storage
 *     (bypasses Vercel's 4.5 MB serverless payload limit entirely).
 *  3. Retrieves the storage public URL.
 *  4. Auto-generates a slug from the title.
 *  5. Inserts a new row into help_videos with all metadata.
 *
 * Add basic route protection in middleware.ts or a layout.tsx to ensure
 * only authenticated team members can reach /admin/* routes.
 */

"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCategories } from '@/lib/hooks/useCategories';
import { slugify, type VideoCategory } from "@/lib/utils";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UploadStatus =
  | { stage: "idle" }
  | { stage: "uploading"; progress: number }
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
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // ── Upload progress state ────────────────────────────────────────────────
  const [status, setStatus] = useState<UploadStatus>({ stage: "idle" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Sanitise the file name for use as a storage path */
  function buildStoragePath(file: File): string {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `${timestamp}-${safeName}`; // flat structure; add subfolders as needed
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setVideoFile(file);
    setStatus({ stage: "idle" });
  }

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0])
    }
  }, [categories])

  // ── Main submit handler ──────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Basic validation
    if (!videoFile) {
      setStatus({
        stage: "error",
        message: "Please select a video file before uploading.",
      });
      return;
    }
    if (!title.trim()) {
      setStatus({ stage: "error", message: "A title is required." });
      return;
    }

    try {
      // ------------------------------------------------------------------
      // PHASE 1: Upload the video file directly to Supabase Storage.
      // This call goes browser → Supabase, completely bypassing Vercel.
      // ------------------------------------------------------------------

      setStatus({ stage: "uploading", progress: 0 });

      const storagePath = buildStoragePath(videoFile);

      const { error: uploadError } = await supabase.storage
        .from("support-videos")
        .upload(storagePath, videoFile, {
          cacheControl: "3600",
          upsert: false,
          // Supabase JS v2 does not expose upload progress natively via XHR;
          // for a real progress bar swap to a fetch+ReadableStream approach.
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // ------------------------------------------------------------------
      // PHASE 2: Retrieve the permanent public URL for the uploaded file.
      // ------------------------------------------------------------------

      const { data: urlData } = supabase.storage
        .from("support-videos")
        .getPublicUrl(storagePath);

      const videoUrl = urlData.publicUrl;

      if (!videoUrl) {
        throw new Error("Could not retrieve the public URL from storage.");
      }

      // ------------------------------------------------------------------
      // PHASE 3: Insert the metadata row into help_videos.
      // ------------------------------------------------------------------

      setStatus({ stage: "saving" });

      const slug = slugify(title);

      const { error: dbError } = await supabase
        .from("help_videos")
        .insert(
          {
            title: title.trim(),
            slug,
            description: description.trim() || null,
            category,
            video_url: videoUrl,
            is_published: isPublished,
          } as any
        );

      if (dbError) {
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      // ------------------------------------------------------------------
      // PHASE 4: Success — redirect or show confirmation.
      // ------------------------------------------------------------------

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

  const isSubmitting =
    status.stage === "uploading" || status.stage === "saving";

  const submitLabel =
    status.stage === "uploading"
      ? "Uploading video file, please wait…"
      : status.stage === "saving"
        ? "Saving metadata…"
        : "Upload Video";

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
            Upload Help Video
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details below. The video uploads directly to cloud
            storage — no file size limits.
          </p>
        </div>

        {/* ── Success banner ── */}
        {status.stage === "success" && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              ✓ Video uploaded successfully!
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
                  setVideoFile(null);
                  setIsPublished(false);
                  setStatus({ stage: "idle" });
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-sm text-green-700 underline hover:text-green-900"
              >
                Upload another
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

          {/* Video file input */}
          <div>
            <label
              htmlFor="video"
              className="block text-sm font-medium text-gray-700"
            >
              Video File <span className="text-red-500">*</span>
            </label>

            {/* Custom styled file drop zone */}
            <label
              htmlFor="video"
              className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-2
                          rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors
                          ${
                            isSubmitting
                              ? "cursor-not-allowed border-gray-200 bg-gray-50"
                              : videoFile
                                ? "border-[#425b7d] bg-[#425b7d]/10"
                                : "border-gray-300 bg-white hover:border-[#425b7d] hover:bg-[#425b7d]/10"
                          }`}
            >
              {videoFile ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-[#425b7d]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.361a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-[#425b7d]">
                    {videoFile.name}
                  </span>
                  <span className="text-xs text-[#425b7d]">
                    {(videoFile.size / 1024 / 1024).toFixed(1)} MB — click to
                    change
                  </span>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">
                    Click to select or drag a video file
                  </span>
                  <span className="text-xs text-gray-400">
                    MP4, MOV, WebM, AVI supported
                  </span>
                </>
              )}
            </label>

            <input
              ref={fileInputRef}
              id="video"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="sr-only"
            />
          </div>

          {/* Upload progress indicator */}
          {status.stage === "uploading" && (
            <div className="rounded-lg bg-[#425b7d]/5 px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Spinner */}
                <svg
                  className="h-5 w-5 animate-spin text-[#425b7d]"
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
                <span className="text-sm font-medium text-[#425b7d]">
                  Uploading video file directly to cloud storage — do not close
                  this tab…
                </span>
              </div>
            </div>
          )}

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
            disabled={isSubmitting || !videoFile}
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
