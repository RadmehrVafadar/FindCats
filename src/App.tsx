import { useCallback, useEffect, useState } from 'react'
import Picture from './Picture'
import { findCat, nextScene, readSession, STORAGE_KEY, shuffle } from './game'
import type { Session } from './game'
import { puzzles } from './puzzles'

function start(): Session {
  let previous: Session | null = null
  try { previous = readSession(localStorage.getItem(STORAGE_KEY), puzzles) } catch { /* Private browsing can disable storage. */ }
  return previous ? nextScene(previous, puzzles.map(p => p.id)) : {
    current: 'paris', remaining: shuffle(['venice', 'kyoto']), found: { paris: [] },
  }
}

function CatIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 11 4 3l6 4a10 10 0 0 1 4 0l6-4-.5 8c1 1.3 1.5 2.5 1.5 4 0 4-4 6-9 6s-9-2-9-6c0-1.5.5-2.7 1.5-4Z" />
    <path d="M8 13h.01M16 13h.01M11 16h2l-1 1-1-1ZM2 14l4 1M2 18l4-1M22 14l-4 1M22 18l-4-1" />
  </svg>
}

export default function App() {
  const [session, setSession] = useState(start)
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

  return <main className="game">
    <header className="game-header">
      <h1>{puzzle.location}<span className="location-divider" aria-hidden="true"> / </span><span className="game-name">find the cats</span></h1>
      <div className={`progress ${complete ? 'complete' : ''}`} role="status" aria-live="polite" aria-label={`${found.length} of ${puzzle.cats.length} cats found`}>
        <CatIcon /><span>{found.length}<span className="count-divider"> / </span>{puzzle.cats.length}</span>
      </div>
    </header>
    <Picture key={puzzle.id} puzzle={puzzle} found={found} onFind={id => setSession(previous => findCat(previous, puzzle, id))} />
    <footer className="game-footer">
      {complete ? <div className="completion" role="status"><span>All six found. Bon voyage!</span><button onClick={advance}>Next picture <span aria-hidden="true">↗</span></button></div>
        : <p id="picture-help">Find six little locals.<span> Tap a cat. Pinch to look closer.</span></p>}
    </footer>
  </main>
}
