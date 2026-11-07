type Props = {
  effects: boolean
  music: boolean
  toggleEffects: () => void
  toggleMusic: () => void
}

export default function AudioControls({ effects, music, toggleEffects, toggleMusic }: Props) {
  return <div className="audio-controls" role="group" aria-label="Audio controls">
    <button type="button" aria-label="Cat sounds" aria-pressed={effects} onClick={toggleEffects} title={effects ? 'Mute cat sounds' : 'Enable cat sounds'}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z" />{effects ? <path d="M15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14" /> : <path d="m16 9 6 6m0-6-6 6" />}</svg>
    </button>
    <button type="button" aria-label="Relaxing music" aria-pressed={music} onClick={toggleMusic} title={music ? 'Pause relaxing music' : 'Play relaxing music'}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17V5l11-2v12M9 9l11-2" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="16" rx="3" ry="2" />{!music && <path d="m3 3 18 18" />}</svg>
    </button>
  </div>
}
