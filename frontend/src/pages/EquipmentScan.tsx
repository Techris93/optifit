import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, CheckCircle, Dumbbell, Image as ImageIcon, RefreshCw, Upload, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import ExerciseAnimationWorkoutGrid from '../components/animation/ExerciseAnimationWorkoutGrid'
import VisionStatusBadge from '../components/VisionStatusBadge'
import { enableAnalyze } from '../config'
import { getExerciseAnimationProfilesForEquipment } from '../data/exerciseAnimations'
import { detectEquipment, getHealthStatus } from '../utils/api'
import type { DetectionResult, HealthStatus } from '../types'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const apiBaseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl
const maxUploadSizeBytes = 8 * 1024 * 1024
const scanTips = [
  'Take one wide shot of the full room.',
  'Add one or two close-ups for smaller equipment.',
  'Keep the space well lit and clutter low.',
  'A short panning video works well for home gyms.',
]

export default function EquipmentScan() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [confirmedEquipment, setConfirmedEquipment] = useState<string[]>([])

  useEffect(() => {
    getHealthStatus().then(setHealth).catch(() => undefined)
  }, [])

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  )

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [previews])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles)
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov', '.webm']
    },
    maxFiles: 5,
    maxSize: maxUploadSizeBytes
  })

  const workoutSearch = useMemo(() => {
    const params = new URLSearchParams()
    if (confirmedEquipment.length > 0) {
      params.set('equipment', confirmedEquipment.join(','))
    }
    params.set('source', 'scan')
    params.set('detection_mode', result?.detection_mode || health?.detection_mode || 'local')
    return params.toString()
  }, [confirmedEquipment, health?.detection_mode, result?.detection_mode])

  const matchedAnimationProfiles = useMemo(
    () => getExerciseAnimationProfilesForEquipment(confirmedEquipment, 8),
    [confirmedEquipment]
  )

  const handleScan = async () => {
    if (files.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const data = await detectEquipment(files)
      setResult(data)
      setConfirmedEquipment(data.equipment_found)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFiles([])
    setResult(null)
    setConfirmedEquipment([])
    setError(null)
  }

  const toggleConfirmedEquipment = (item: string) => {
    setConfirmedEquipment((current) => (
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]
    ))
  }

  if (!enableAnalyze) {
    return (
        <div className="card">
          <div className="card-title">Upload Analysis Unavailable</div>
          <p>
            This deployment is running in hosted web mode, so local-only upload analysis is disabled by default.
          </p>
          <Link to="/workouts" className="btn btn-primary btn-large" style={{ marginTop: 16 }}>
            Continue With Manual Equipment Picker
          </Link>
        </div>
      )
  }

  return (
    <div className="feature-page">
      <div className="card page-hero-card feature-intro-card">
        <div className="feature-intro-header">
          <div className="page-status-row">
            <VisionStatusBadge mode={result?.detection_mode ?? health?.detection_mode ?? 'manual'} />
          </div>
          <div className="hero-kicker">Capture and confirm</div>
          <h1>Scan what is available, build a plan, and keep the work measurable.</h1>
          <p className="hero-copy">
            Upload a few clear photos or a short video of the equipment around you. Review the detected list,
            trim anything incorrect, and send a clean setup straight into workout generation.
          </p>
        </div>
        <div className="feature-stat-strip">
          <div className="feature-stat-chip">
            <strong>{result?.files_processed ?? files.length}</strong>
            <span>Files ready</span>
          </div>
          <div className="feature-stat-chip">
            <strong>{confirmedEquipment.length}</strong>
            <span>Equipment found</span>
          </div>
          <div className="feature-stat-chip">
            <strong>{maxUploadSizeBytes / (1024 * 1024)} MB</strong>
            <span>Per file</span>
          </div>
        </div>
      </div>

      {!result ? (
        <>
          <div className="card">
            <div className="section-heading-row">
              <div>
                <div className="card-title zero-margin">Start AI Scan</div>
                <p className="card-subtitle">
                  Add up to 5 photos or short videos, then review the detected equipment before building the session.
                </p>
              </div>
            </div>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
              <input {...getInputProps()} />
              <div className="dropzone-icon">
                {isDragActive ? <CheckCircle size={48} /> : <Camera size={48} />}
              </div>
              <p className="dropzone-text">
                {isDragActive ? 'Drop files here' : 'Drag and drop, click to select, or take a photo/video'}
              </p>
              <p className="dropzone-meta">
                Supports JPG, PNG, WEBP, MP4, MOV, and WEBM. Up to 5 files, 8 MB each.
              </p>
            </div>

            {files.length > 0 && (
              <div className="scan-preview-section">
                <div className="scan-preview-header">
                  <p>Selected files</p>
                  <span>{files.length} item(s)</span>
                </div>
                <div className="scan-preview-grid">
                  {previews.map(({ file, url }) => (
                    <div key={`${file.name}-${file.lastModified}`} className="scan-preview-card">
                      <div className="scan-preview-media">
                        {file.type.startsWith('image/') ? (
                          <img src={url} alt={file.name} className="scan-preview-image" />
                        ) : (
                          <video className="scan-preview-video-player" src={url} controls muted preload="metadata" />
                        )}
                      </div>
                      <div className="scan-preview-copy">
                        <div className="scan-preview-name">{file.name}</div>
                        <div className="scan-preview-meta">
                          {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <Video size={14} />}
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="card error-card scan-error-card">
                {error}
              </div>
            )}

            <div className="delivery-box scan-guidance-box">
              <div><strong>What happens next</strong></div>
              <div className="status-list">
                <div>We analyze the uploaded files and return the equipment that is most likely visible.</div>
                <div>Cloud analysis can take a few seconds, especially when you upload more than one file.</div>
                <div>You will get a confirmation step before workout generation, so you can remove anything that looks wrong.</div>
              </div>
            </div>

            <div className="scan-upload-actions">
              <button
                className="btn btn-primary btn-large full-width"
                onClick={handleScan}
                disabled={files.length === 0 || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spinning" />
                    Analyzing Equipment...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Scan Equipment
                  </>
                )}
              </button>

              <Link to="/workouts" className="btn btn-secondary btn-large full-width">
                Skip Upload and Pick Equipment Manually
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="section-heading-row">
              <div>
                <div className="card-title zero-margin">Tips for best results</div>
                <p className="card-subtitle">A little capture discipline gives the detector a much cleaner equipment list.</p>
              </div>
            </div>
            <div className="scan-tips-grid">
              {scanTips.map((tip) => (
                <div key={tip} className="scan-tip-card">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="scan-result-header">
            <div className="scan-result-icon">
              <CheckCircle size={32} color="var(--secondary)" />
            </div>
            <h2>Equipment Detected</h2>
            <p className="muted-paragraph">
              Found {result.total_items} item(s)
              {result.files_processed && result.files_processed > 1 ? ` across ${result.files_processed} files` : ''}.
              Review the list below and keep only the equipment that is actually available to you.
            </p>
          </div>

          {result.annotated_image && (
            <div className="scan-annotated-image-wrap">
              <img
                src={`${apiBaseUrl}${result.annotated_image}`}
                alt="Detected equipment"
                className="scan-annotated-image"
              />
            </div>
          )}

          <div className="equipment-tags">
            {result.equipment_found.map((item) => (
              <span key={item} className="equipment-tag detected">
                <Dumbbell size={14} />
                {item.replace(/_/g, ' ')}
              </span>
            ))}
          </div>

          <div className="delivery-box">
            <div><strong>Confirm what is actually available</strong></div>
            <div className="muted-paragraph">Tap any item to remove it before generating your workout. Leave only the equipment you can use right now.</div>
            <div className="equipment-tags compact">
              {result.equipment_found.map((item) => {
                const selected = confirmedEquipment.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    className={`equipment-tag equipment-button ${selected ? 'selected' : ''}`}
                    onClick={() => toggleConfirmedEquipment(item)}
                  >
                    {item.replace(/_/g, ' ')}
                  </button>
                )
              })}
            </div>
          </div>

          {matchedAnimationProfiles.length > 0 && (
            <div className="anatomical-preview-block">
              <div className="card-title">Matched Anatomical Workout Preview</div>
              <p className="muted-paragraph">
                These anatomy-first motion packs are matched from your confirmed equipment. Workout generation and saved sessions will reuse the same anatomical visual language per exercise.
              </p>
              <div className="top-gap-16">
                <ExerciseAnimationWorkoutGrid profiles={matchedAnimationProfiles} />
              </div>
            </div>
          )}

          <div className="scan-result-actions">
            <Link
              to={`/workouts?${workoutSearch}`}
              className="btn btn-primary scan-generate-button"
              aria-disabled={confirmedEquipment.length === 0}
              onClick={(event) => {
                if (confirmedEquipment.length === 0) {
                  event.preventDefault()
                  setError('Keep at least one confirmed equipment item before generating a workout.')
                }
              }}
            >
              Generate Workout
            </Link>
            <button className="btn btn-secondary" onClick={handleReset}>
              Scan Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
