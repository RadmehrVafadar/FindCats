import type { Point, Puzzle } from './puzzles.ts'

export type Session = { current: string; remaining: string[]; found: Record<string, string[]> }
export type Camera = { x: number; y: number; zoom: number }
export const STORAGE_KEY = 'find-the-cats:v1'
export const HOME: Camera = { x: 0, y: 0, zoom: 1 }

export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function nextScene(previous: Session | null, ids: string[], random = Math.random): Session {
  if (!ids.length) throw new Error('At least one puzzle is required')
  let queue = previous?.remaining.filter(id => ids.includes(id)) ?? []
  if (!queue.length) {
    queue = shuffle(ids, random)
    if (queue.length > 1 && queue[0] === previous?.current) [queue[0], queue[1]] = [queue[1], queue[0]]
  }
  const [current, ...remaining] = queue
  return { current, remaining, found: { ...previous?.found, [current]: [] } }
}

export function readSession(raw: string | null, puzzles: Puzzle[]): Session | null {
  try {
    const data: unknown = JSON.parse(raw ?? 'null')
    if (!data || typeof data !== 'object') return null
    const { current, remaining, found } = data as Partial<Session>
    if (typeof current !== 'string' || !puzzles.some(p => p.id === current) || !Array.isArray(remaining) || !found || typeof found !== 'object') return null
    const validFound = Object.fromEntries(puzzles.map(p => [p.id,
      Array.isArray(found[p.id]) ? [...new Set(found[p.id].filter(id => typeof id === 'string' && p.cats.some(c => c.id === id)))] : [],
    ]))
    return { current, remaining: [...new Set(remaining.filter(id => typeof id === 'string' && id !== current && puzzles.some(p => p.id === id)))], found: validFound }
  } catch { return null }
}

export function findCat(session: Session, puzzle: Puzzle, id: string): Session {
  const found = session.found[puzzle.id] ?? []
  if (session.current !== puzzle.id || !puzzle.cats.some(c => c.id === id) || found.includes(id)) return session
  return { ...session, found: { ...session.found, [puzzle.id]: [...found, id] } }
}

export function pointInPolygon([x, y]: Point, polygon: Point[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function clampCamera(camera: Camera, width: number, height: number): Camera {
  const zoom = Math.min(4, Math.max(1, camera.zoom))
  return {
    zoom,
    x: Math.min(width - width / zoom, Math.max(0, camera.x)),
    y: Math.min(height - height / zoom, Math.max(0, camera.y)),
  }
}

export function zoomCamera(camera: Camera, zoom: number, width: number, height: number, anchor: Point = [0.5, 0.5]): Camera {
  const z = Math.min(4, Math.max(1, zoom))
  return clampCamera({ zoom: z, x: camera.x + width * anchor[0] * (1 / camera.zoom - 1 / z), y: camera.y + height * anchor[1] * (1 / camera.zoom - 1 / z) }, width, height)
}
