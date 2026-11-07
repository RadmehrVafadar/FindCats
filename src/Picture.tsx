import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { clampCamera, HOME, pointInPolygon, zoomCamera } from './game'
import type { Camera } from './game'
import type { Point, Puzzle } from './puzzles'

type Props = { puzzle: Puzzle; found: string[]; onFind: (id: string) => void }
type Touch = { x: number; y: number }
const points = (polygon: Point[]) => polygon.map(p => p.join(',')).join(' ')

export default function Picture({ puzzle, found, onFind }: Props) {
  const [camera, setCamera] = useState<Camera>(HOME)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const touches = useRef(new Map<number, Touch>())
  const gesture = useRef({ x: 0, y: 0, moved: false, multi: false })
  const { width, height } = puzzle

  function zoom(factor: number) {
    setCamera(c => zoomCamera(c, c.zoom * factor, width, height))
  }

  function down(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (touches.current.size === 1) gesture.current = { x: event.clientX, y: event.clientY, moved: false, multi: false }
    else gesture.current.multi = true
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    const old = touches.current.get(event.pointerId)
    if (!old) return
    const before = [...touches.current.values()]
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 7) gesture.current.moved = true
    const rect = event.currentTarget.getBoundingClientRect()
    if (touches.current.size >= 2) {
      const after = [...touches.current.values()]
      const distance = (a: Touch, b: Touch) => Math.hypot(a.x - b.x, a.y - b.y)
      const oldDistance = distance(before[0], before[1])
      if (!oldDistance) return
      const anchor: Point = [((before[0].x + before[1].x) / 2 - rect.left) / rect.width, ((before[0].y + before[1].y) / 2 - rect.top) / rect.height]
      const dx = (after[0].x + after[1].x - before[0].x - before[1].x) / 2
      const dy = (after[0].y + after[1].y - before[0].y - before[1].y) / 2
      setCamera(c => {
        const next = zoomCamera(c, c.zoom * distance(after[0], after[1]) / oldDistance, width, height, anchor)
        return clampCamera({ ...next, x: next.x - dx * width / rect.width / next.zoom, y: next.y - dy * height / rect.height / next.zoom }, width, height)
      })
    } else if (gesture.current.moved) {
      setCamera(c => clampCamera({ ...c, x: c.x - (event.clientX - old.x) * width / rect.width / c.zoom, y: c.y - (event.clientY - old.y) * height / rect.height / c.zoom }, width, height))
    }
  }

  function up(event: PointerEvent<SVGSVGElement>) {
    if (!touches.current.has(event.pointerId)) return
    touches.current.delete(event.pointerId)
    if (event.type === 'pointercancel' || gesture.current.moved || gesture.current.multi || !loaded) return
    const rect = event.currentTarget.getBoundingClientRect()
    const point: Point = [camera.x + (event.clientX - rect.left) / rect.width * width / camera.zoom, camera.y + (event.clientY - rect.top) / rect.height * height / camera.zoom]
    const match = puzzle.cats.find(cat => pointInPolygon(point, cat.tap))
    if (match) onFind(match.id)
  }

  function key(event: KeyboardEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) return
    const directions: Record<string, Point> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    if (directions[event.key]) {
      event.preventDefault()
      const [x, y] = directions[event.key]
      setCamera(c => clampCamera({ ...c, x: c.x + x * width / c.zoom * 0.12, y: c.y + y * height / c.zoom * 0.12 }, width, height))
    } else if (['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault()
      if (event.key === '0') setCamera(HOME)
      else zoom(event.key === '-' ? 1 / 1.5 : 1.5)
    }
  }

  return <div className="picture-wrap">
    <svg className={`picture ${camera.zoom > 1 ? 'is-zoomed' : ''}`} viewBox={`${camera.x} ${camera.y} ${width / camera.zoom} ${height / camera.zoom}`} width={width} height={height}
      role="group" aria-label={`${puzzle.location} hidden cat illustration`} aria-describedby="picture-help" tabIndex={0}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
      onLostPointerCapture={event => touches.current.delete(event.pointerId)}>
      <desc id="picture-help">Find six cats. Pinch to zoom, then drag to explore. With the picture focused, use plus or minus to zoom, arrow keys to pan, and zero to reset.</desc>
      <defs>
        <filter id="found-tint" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.52" intercept="0.48" />
            <feFuncG type="linear" slope="0.52" intercept="0.48" />
            <feFuncB type="linear" slope="0.52" intercept="0.46" />
          </feComponentTransfer>
        </filter>
        {puzzle.cats.map(cat => <clipPath id={`reveal-${cat.id}`} key={cat.id}><polygon points={points(cat.reveal)} /></clipPath>)}
      </defs>
      <image href={puzzle.image} width={width} height={height} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      {puzzle.cats.map((cat, index) => <g key={cat.id}>
        {found.includes(cat.id) && <g className="cat-reveal" pointerEvents="none" clipPath={`url(#reveal-${cat.id})`}>
          <image href={puzzle.image} width={width} height={height} filter="url(#found-tint)" />
        </g>}
        <polygon className="cat-target" points={points(cat.tap)} fill="transparent"
          role="button" tabIndex={loaded ? 0 : -1} aria-label={`Cat ${index + 1}`} aria-pressed={found.includes(cat.id)}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onFind(cat.id) }
          }} />
      </g>)}
    </svg>
    {!loaded && <div className="picture-message" role="status">{failed ? <><span>The picture couldn’t load.</span><button onClick={() => window.location.reload()}>Try again</button></> : 'Opening your sketchbook…'}</div>}
  </div>
}
