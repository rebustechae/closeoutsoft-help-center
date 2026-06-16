"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { useCategories } from "@/lib/hooks/useCategories";
import type { Database } from "@/lib/supabase/database.types";

type Status =
  | { stage: "idle" }
  | { stage: "loading" }
  | { stage: "saving" }
  | { stage: "success" }
  | { stage: "error"; message: string };

export default function EditVideoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");

  const [status, setStatus] = useState<Status>({ stage: "loading" });
  const categories = useCategories();

  // ── Sync default category once categories load ───────────────────────────
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories]);

  // ── Load existing video data ─────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("help_videos")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setStatus({ stage: "error", message: "Video not found." });
        return;
      }

      const video = data as Database['public']['Tables']['help_videos']['Row'];
      setTitle(video.title);
      setCategory(video.category);
      setDescription(video.description ?? "");
      setIsPublished(video.is_published);
      setVideoUrl(video.video_url);
      setOriginalSlug(video.slug);
      setStatus({ stage: "idle" });
    }

    load();
  }, [id]);

  // ── Save handler ─────────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus({ stage: "saving" });

    const newSlug = title !== originalSlug ? slugify(title) : originalSlug;

    const updateData = {
      title: title.trim(),
      slug: newSlug,
      description: description.trim() || null,
      category,
      is_published: isPublished,
    } satisfies Database['public']['Tables']['help_videos']['Update'];

    const { error } = await (
      supabase as ReturnType<typeof createClient> & { from: any }
    )
      .from("help_videos")
      .update(updateData)
      .eq("id", id);

    if (error) {
      setStatus({ stage: "error", message: error.message });
    } else {
      setStatus({ stage: "success" });
      router.refresh();
    }
  }

  // ── Delete handler ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm("Delete this video permanently? This cannot be undone."))
      return;

    const { error } = await supabase.from("help_videos").delete().eq("id", id);

    if (error) {
      setStatus({ stage: "error", message: error.message });
    } else {
      router.push("/admin");
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (status.stage === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  const isSubmitting = status.stage === "saving";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/admin")}
              className="mb-2 text-sm text-[#425b7d] hover:text-[#2a354b] transition-colors"
            >
              ← Back to dashboard
            </button>
            <h1 className="text-2xl font-bold text-[#2a354b]">Edit Video</h1>
          </div>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5
                       text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        </div>

        {/* Success banner */}
        {status.stage === "success" && (
          <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-sm font-medium text-green-400">Changes saved.</p>
          </div>
        )}

        {/* Error banner */}
        {status.stage === "error" && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{status.message}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-[#425b7d]/10 bg-[#425b7d]/5 p-6"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#2a345b] mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#425b7d]/10 bg-[#425b7d]/5 px-3 py-2
                         text-sm text-[#2a354b] placeholder:text-gray-500
                         focus:border-[#425b7d] focus:outline-none focus:ring-1
                         focus:ring-[#425b7d] disabled:opacity-50"
            />
            {title && (
              <p className="mt-1.5 text-xs text-gray-600">
                Slug: <span className="font-mono">{slugify(title)}</span>
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[#2a354b] mb-1.5">
              Category
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#425b7d]/10 bg-[#425b7d]/5 px-3 py-2
                         text-sm text-[#2a354b] focus:border-[#425b7d] focus:outline-none
                         focus:ring-1 focus:ring-[#425b7d] disabled:opacity-50"
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
            <label className="block text-sm font-medium text-[#2a354b] mb-1.5">
              Description{" "}
              <span className="font-normal text-gray-600">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full resize-none rounded-lg border border-[#425b7d]/10 bg-[#425b7d]/5
                         px-3 py-2 text-sm text-[#2a354b] placeholder:text-gray-500
                         focus:border-[#425b7d] focus:outline-none focus:ring-1
                         focus:ring-[#425b7d] disabled:opacity-50"
            />
          </div>

          {/* Video URL (read-only) */}
          <div>
            <label className="block text-sm font-medium text-[#2a354b] mb-1.5">
              Video file
            </label>
            <p
              className="rounded-lg border border-[#425b7d]/10 bg-[#425b7d]/5 px-3 py-2
                          text-xs text-[#2a354b] font-mono break-all"
            >
              {videoUrl}
            </p>
            <p className="mt-1.5 text-xs text-gray-600">
              To replace the video file, delete this entry and upload a new one.
            </p>
          </div>

          {/* Publish toggle */}
          <div
            className="flex items-center justify-between rounded-lg border
                          border-[#425b7d]/10 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-[#2a354b]">Published</p>
              <p className="text-xs text-gray-600">
                {isPublished ? "Visible to the public" : "Hidden — draft only"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              onClick={() => setIsPublished((v) => !v)}
              disabled={isSubmitting}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full
                          border-2 border-transparent transition-colors duration-200
                          focus:outline-none focus:ring-1 focus:ring-[#425b7d]
                          focus:ring-offset-2 focus:ring-offset-gray-950
                          disabled:opacity-50
                          ${isPublished ? "bg-[#425b7d]" : "bg-[#B0BDCF]"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform
                                rounded-full bg-white shadow transition duration-200
                                ${isPublished ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#6c4193] py-2.5 text-sm font-semibold
                       text-white hover:bg-[#543372] disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
