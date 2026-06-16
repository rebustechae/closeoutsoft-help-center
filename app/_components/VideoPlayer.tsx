// app/_components/VideoPlayer.tsx
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

export function VideoPlayer({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const hideTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]

  // ── Auto-hide controls ───────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false)
    }, 3000)
  }, [playing])

  useEffect(() => {
    return () => clearTimeout(hideTimer.current)
  }, [])

  // ── Close speed menu when clicking outside ───────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as Element).closest('.speed-menu-container')) {
        setShowSpeedMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Video event handlers ─────────────────────────────────────────────────
  function onTimeUpdate() {
    setCurrentTime(videoRef.current?.currentTime ?? 0)
  }

  function onLoadedMetadata() {
    setDuration(videoRef.current?.duration ?? 0)
  }

  function onEnded() {
    setPlaying(false)
    setShowControls(true)
  }

  // ── Controls ─────────────────────────────────────────────────────────────
  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setPlaying(true) }
    else { v.pause(); setPlaying(false) }
    resetHideTimer()
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Number(e.target.value)
    setCurrentTime(v.currentTime)
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current
    if (!v) return
    const val = Number(e.target.value)
    v.volume = val
    setVolume(val)
    setMuted(val === 0)
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    v.muted = !muted
    setMuted(!muted)
  }

  function changeSpeed(s: number) {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = s
    setSpeed(s)
  }

  function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // ── Time formatter ───────────────────────────────────────────────────────
  function fmt(s: number) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-lg bg-black ring-1 ring-white/10
                 shadow-2xl shadow-black/60"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Video element — no native controls */}
      <video
        ref={videoRef}
        src={src}
        className="aspect-video w-full cursor-pointer"
        aria-label={`Video: ${title}`}
        onClick={togglePlay}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        playsInline
        preload="metadata"
      />

      {/* Big play button overlay when paused */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="rounded-full bg-black/50 p-4 backdrop-blur-sm">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Control bar ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90
                    to-transparent px-4 pb-3 pt-8 transition-opacity duration-300
                    ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={seek}
          className="w-full h-1 mb-3 accent-white cursor-pointer"
        />

        {/* Bottom row */}
        <div className="flex items-center gap-3">

          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors">
            {playing ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Mute */}
          <button onClick={toggleMute} className="text-white hover:text-gray-300 transition-colors">
            {muted || volume === 0 ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l1.98 1.98L21 18.69l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            )}
          </button>

          {/* Volume slider */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={changeVolume}
            className="w-16 h-1 accent-white cursor-pointer"
          />

          {/* Time */}
          <span className="text-xs text-gray-300 tabular-nums">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Playback speed dropdown */}
          <div className="relative speed-menu-container">
            <button
              onClick={() => setShowSpeedMenu((v) => !v)}
              className="text-xs font-medium text-gray-400 hover:text-white transition-colors
                         rounded px-1.5 py-0.5 min-w-[36px] text-center"
            >
              {speed}x
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-8 right-0 bg-black/90 rounded-lg overflow-hidden
                              border border-white/10 py-1 min-w-[80px]">
                {speeds.map((s) => (
                  <button
                    key={s}
                    onClick={() => { changeSpeed(s); setShowSpeedMenu(false) }}
                    className={`w-full px-4 py-1.5 text-xs text-left transition-colors
                                ${speed === s
                                  ? 'bg-white/20 text-white font-medium'
                                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                  >
                    {s === 1 ? 'Normal' : `${s}x`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition-colors">
            {isFullscreen ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            )}
          </button>

        </div>
      </div>
    </div>
  )
}