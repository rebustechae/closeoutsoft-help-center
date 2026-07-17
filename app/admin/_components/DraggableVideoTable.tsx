'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DeleteButton } from './DeleteButton'
import { reorderVideos } from '../_actions/reorderVideos'

type VideoRow = {
  id: string
  title: string
  category: string
  is_published: boolean
  created_at: string
  slug: string
}

interface DraggableVideoTableProps {
  videos: VideoRow[]
}

export function DraggableVideoTable({ videos: initialVideos }: DraggableVideoTableProps) {
  const [videos, setVideos] = useState(initialVideos)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Update videos when the filtered prop changes
  useEffect(() => {
    setVideos(initialVideos)
  }, [initialVideos])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return

    const draggedIndex = videos.findIndex((v) => v.id === draggedId)
    const targetIndex = videos.findIndex((v) => v.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reorder videos
    const newVideos = [...videos]
    const [draggedVideo] = newVideos.splice(draggedIndex, 1)
    newVideos.splice(targetIndex, 0, draggedVideo)

    setVideos(newVideos)
    setDraggedId(null)

    // Save to database
    saveOrder(newVideos)
  }

  const saveOrder = async (orderedVideos: VideoRow[]) => {
    setIsSaving(true)
    try {
      await reorderVideos(orderedVideos.map((v) => v.id))
    } catch (error) {
      console.error('Failed to save order:', error)
      // Revert on error
      setVideos(initialVideos)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#425b7d]/10">
      {isSaving && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <p className="text-sm text-gray-600">Saving order...</p>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#425b7d]/10 bg-white/5 text-left text-xs
                         uppercase tracking-wider text-gray-500">
            <th className="px-4 py-3 w-8"></th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3 hidden sm:table-cell">Category</th>
            <th className="px-4 py-3 hidden md:table-cell">Added</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#425b7d]/10">
          {videos.map((video) => (
            <tr
              key={video.id}
              draggable
              onDragStart={(e) => handleDragStart(e, video.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, video.id)}
              className={`hover:bg-[#425b7d]/10 transition-colors cursor-move ${
                draggedId === video.id ? 'opacity-50 bg-[#425b7d]/20' : ''
              }`}
            >
              <td className="px-4 py-3 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="9" cy="5" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="9" cy="19" r="1.5" />
                  <circle cx="15" cy="5" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="15" cy="19" r="1.5" />
                </svg>
              </td>
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
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-3">
                  {video.is_published && (
                    <Link
                      href={`/${encodeURIComponent(video.category)}/${video.slug}`}
                      className="text-xs text-[#425b7d] hover:text-[#2A354B] transition-colors"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    href={`/admin/edit/${video.id}`}
                    className="text-xs text-[#425b7d] hover:text-[#2A354B] transition-colors"
                  >
                    Edit
                  </Link>
                  <DeleteButton id={video.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
