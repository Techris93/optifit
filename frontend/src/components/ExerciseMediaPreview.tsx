import { ExternalLink, ImageIcon, PlayCircle } from 'lucide-react'
import type { Exercise } from '../types'

export default function ExerciseMediaPreview({ exercise, title }: { exercise?: Exercise | null; title: string }) {
  const mediaUrl = exercise?.gif_url || exercise?.image_url
  const videoUrl = exercise?.video_url
  const youtubeEmbedUrl = toYouTubeEmbedUrl(videoUrl)

  if (youtubeEmbedUrl) {
    return (
      <div className="exercise-media">
        <iframe
          className="exercise-media-frame"
          src={youtubeEmbedUrl}
          title={`${title} demo`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (videoUrl) {
    return (
      <div className="exercise-media">
        <video className="exercise-media-frame" controls preload="metadata">
          <source src={videoUrl} />
        </video>
      </div>
    )
  }

  if (mediaUrl) {
    return (
      <div className="exercise-media">
        <img className="exercise-media-frame" src={mediaUrl} alt={`${title} demo`} />
      </div>
    )
  }

  return (
    <div className="exercise-media exercise-media-fallback">
      <div className="exercise-media-empty">
        <div className="exercise-media-icons">
          <PlayCircle size={18} />
          <ImageIcon size={18} />
        </div>
        <div className="exercise-media-copy">
          <strong>Demo media not in library yet</strong>
          <span>Attach clips or images to this exercise to complete the deliver step.</span>
        </div>
        {exercise?.demo_search_url && (
          <a href={exercise.demo_search_url} target="_blank" rel="noreferrer" className="exercise-demo-link">
            Find demo
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  )
}

function toYouTubeEmbedUrl(videoUrl?: string | null) {
  if (!videoUrl) {
    return null
  }

  const watchMatch = videoUrl.match(/[?&]v=([^&]+)/)
  if (watchMatch?.[1]) {
    return `https://www.youtube-nocookie.com/embed/${watchMatch[1]}?rel=0`
  }

  const shortMatch = videoUrl.match(/youtu\.be\/([^?]+)/)
  if (shortMatch?.[1]) {
    return `https://www.youtube-nocookie.com/embed/${shortMatch[1]}?rel=0`
  }

  return null
}
