import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clampCamera, findCat, HOME, nextScene, pointInPolygon, readSession, shuffle, zoomCamera } from '../src/game.ts'
import { puzzles } from '../src/puzzles.ts'

const ids = puzzles.map(p => p.id)

test('a shuffled collection exhausts before repeating and avoids the last scene at a cycle boundary', () => {
  let session = nextScene(null, ids, () => 0.5)
  const seen = [session.current]
  for (let i = 1; i < ids.length; i++) { session = nextScene(session, ids, () => 0.5); seen.push(session.current) }
  assert.equal(new Set(seen).size, 3)
  assert.equal(session.remaining.length, 0)
  assert.notEqual(nextScene(session, ids, () => 0.5).current, session.current)
  assert.deepEqual(ids, ['paris', 'venice', 'kyoto'])
  assert.deepEqual([...shuffle(ids, () => 0.5)].sort(), [...ids].sort())
})

test('repeated taps and unknown targets cannot inflate progress', () => {
  const puzzle = puzzles[0]
  let session = { current: puzzle.id, remaining: ids.slice(1), found: { [puzzle.id]: [] as string[] } }
  for (const cat of puzzle.cats) {
    session = findCat(session, puzzle, cat.id)
    const once = session
    session = findCat(session, puzzle, cat.id)
    assert.equal(session, once)
  }
  assert.equal(session.found[puzzle.id].length, 6)
  assert.equal(findCat(session, puzzle, 'not-a-cat'), session)
  assert.equal(findCat(session, puzzles[1], puzzles[1].cats[0].id), session)
  assert.deepEqual(nextScene(session, ids).found.venice, [])
})

test('saved state is validated, deduplicated, and safe against malformed storage', () => {
  for (const value of [null, 'no json', '{}', '[]', '"bad"', '{"current":"missing","remaining":[],"found":{}}']) assert.equal(readSession(value, puzzles), null)
  const saved = readSession(JSON.stringify({ current: 'paris', remaining: ['venice', 'venice', 12, 'removed', 'paris'], found: { paris: ['wall', 'wall', 'unknown', 10], venice: 'bad' } }), puzzles)!
  assert.deepEqual(saved.remaining, ['venice'])
  assert.deepEqual(saved.found.paris, ['wall'])
  assert.deepEqual(saved.found.venice, [])
  assert.equal(nextScene(saved, ids).current, 'venice')
})

test('zoom stays within the artwork and preserves the requested focal point', () => {
  const zoomed = zoomCamera(HOME, 2, 1024, 1536, [0.25, 0.75])
  assert.deepEqual(zoomed, { zoom: 2, x: 128, y: 576 })
  assert.deepEqual(zoomCamera(zoomed, 1, 1024, 1536), HOME)
  assert.deepEqual(clampCamera({ x: -500, y: 99999, zoom: 99 }, 1024, 1536), { x: 0, y: 1152, zoom: 4 })
})

test('each scene has six distinct cats with valid, separate polygons', () => {
  for (const puzzle of puzzles) {
    assert.equal(puzzle.cats.length, 6)
    assert.equal(new Set(puzzle.cats.map(c => c.id)).size, 6)
    for (const cat of puzzle.cats) {
      for (const polygon of [cat.tap, cat.reveal]) {
        assert.ok(polygon.length >= 3)
        for (const [x, y] of polygon) assert.ok(x >= 0 && x <= puzzle.width && y >= 0 && y <= puzzle.height)
      }
      const center: [number, number] = [cat.reveal.reduce((sum, p) => sum + p[0], 0) / cat.reveal.length, cat.reveal.reduce((sum, p) => sum + p[1], 0) / cat.reveal.length]
      assert.ok(pointInPolygon(center, cat.tap), `${puzzle.id}/${cat.id} has a usable central tap`)
      assert.equal(puzzle.cats.filter(other => pointInPolygon(center, other.tap)).length, 1)
    }
  }
  assert.equal(pointInPolygon([500, 500], puzzles[0].cats[0].tap), false)
})
