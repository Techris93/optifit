type VisionStatusBadgeProps = {
  mode?: string | null
}

const labels: Record<string, string> = {
  manual: 'Manual Mode',
  local: 'Local Vision',
  openai: 'OpenAI Vision',
  gemini: 'Gemini Vision'
}

export default function VisionStatusBadge({ mode }: VisionStatusBadgeProps) {
  const normalizedMode = mode ?? 'manual'
  const label = labels[normalizedMode] ?? normalizedMode

  return <span className={`vision-badge vision-${normalizedMode}`}>{label}</span>
}
