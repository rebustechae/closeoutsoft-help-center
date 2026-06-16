'use client'

import { useState, useMemo } from 'react'
import { DraggableVideoTable } from './DraggableVideoTable'

type VideoRow = {
  id: string
  title: string
  category: string
  is_published: boolean
  created_at: string
  slug: string
}

interface VideoDashboardFilterProps {
  videos: VideoRow[]
  categories: { id: string; name: string }[]
}

export function VideoDashboardFilter({ videos, categories }: VideoDashboardFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Filter videos based on search and category
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory
      const matchesSearch =
        !searchQuery ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.slug.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [videos, searchQuery, selectedCategory])

  const getCategoryCount = (category: string) => {
    return videos.filter((v) => v.category === category).length
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="rounded-xl border border-[#425b7d]/10 bg-white p-5">
        <div className="space-y-4">
          {/* Search Box */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
              Search Videos
            </label>
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#425b7d]/20 bg-white px-4 py-2.5 text-sm
                         placeholder:text-gray-400 focus:border-[#425b7d] focus:outline-none focus:ring-1 focus:ring-[#425b7d]"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
              Filter by Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#425b7d] text-white'
                    : 'border border-[#425b7d]/20 text-[#425b7d] hover:bg-[#425b7d]/10'
                }`}
              >
                All Videos ({videos.length})
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-[#425b7d] text-white'
                      : 'border border-[#425b7d]/20 text-[#425b7d] hover:bg-[#425b7d]/10'
                  }`}
                >
                  {category.name} ({getCategoryCount(category.name)})
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          {(searchQuery || selectedCategory !== 'all') && (
            <div className="rounded-lg bg-[#425b7d]/5 px-3 py-2">
              <p className="text-xs text-[#425b7d]">
                Showing <span className="font-semibold">{filteredVideos.length}</span> of{' '}
                <span className="font-semibold">{videos.length}</span> video
                {videos.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Filtered Videos Table */}
      {filteredVideos.length === 0 ? (
        <div className="rounded-xl border border-[#425b7d]/10 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            {searchQuery ? 'No videos match your search.' : 'No videos in this category.'}
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-green-500">
              Published Videos (Drag to reorder)
            </h3>
            <span className="text-xs text-gray-500">{filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}</span>
          </div>
          <DraggableVideoTable videos={filteredVideos} />
        </div>
      )}
    </div>
  )
}
