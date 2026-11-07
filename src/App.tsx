import { useCallback, useEffect, useState } from 'react'
import Picture from './Picture'
import { findCat, nextScene, readSession, STORAGE_KEY, shuffle } from './game'
import type { Session } from './game'
import { puzzles } from './puzzles'
import AudioControls from './AudioControls'
import useAudio from './useAudio'

function start(): Session {
  let previous: Session | null = null
  try { previous = readSession(localStorage.getItem(STORAGE_KEY), puzzles) } catch { /* Private browsing can disable storage. */ }
  return previous ? nextScene(previous, puzzles.map(p => p.id)) : {
    current: 'paris', remaining: shuffle(puzzles.filter(p => p.id !== 'paris').map(p => p.id)), found: { paris: [] },
  }
}

export default function App() {
  const [session, setSession] = useState(start)
  const audio = useAudio()
  const puzzle = puzzles.find(p => p.id === session.current)!
  const found = session.found[puzzle.id] ?? []
  const complete = found.length === puzzle.cats.length
  const advance = useCallback(() => setSession(previous => nextScene(previous, puzzles.map(p => p.id))), [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)) } catch { /* The game also works in memory. */ }
    const next = puzzles.find(p => p.id === session.remaining[0])
    if (next) { const image = new Image(); image.src = next.image }
  }, [session])

  useEffect(() => {
    if (!complete) return
    const timer = window.setTimeout(advance, 2200)
    return () => window.clearTimeout(timer)
  }, [complete, advance])

  return <main className="game" aria-label={`Find the cats in ${puzzle.location}`}>
    <Picture key={puzzle.id} puzzle={puzzle} found={found} onFind={id => {
      const next = findCat(session, puzzle, id)
      if (next === session) return
      setSession(next)
      audio.playMeow()
    }} />
    <AudioControls {...audio} />
  </main>
}
