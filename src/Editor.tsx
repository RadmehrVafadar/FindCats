import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import Picture from './Picture'
import { puzzles } from './puzzles'
import type { Cat, Point, Puzzle } from './puzzles'

const polygonPoints = (points: Point[]) => points.map(point => point.join(',')).join(' ')

export default function Editor() {
  const [puzzle, setPuzzle] = useState<Puzzle>(structuredClone(puzzles[0]))
  const [image, setImage] = useState(puzzle.image)
  const [selected, setSelected] = useState(puzzle.cats[0].id)
  const [region, setRegion] = useState<'tap' | 'reveal'>('reveal')
  const [trace, setTrace] = useState<Point[]>([])
  const [preview, setPreview] = useState(false)
  const [found, setFound] = useState<string[]>([])
  const [error, setError] = useState('')
  const uploadSequence = useRef(0)
  const current = puzzle.cats.find(cat => cat.id === selected)

  function load(id: string) {
    uploadSequence.current++
    const next = structuredClone(puzzles.find(p => p.id === id)!)
    setPuzzle(next); setImage(next.image); setSelected(next.cats[0].id); setTrace([]); setFound([]); setError('')
  }

  async function upload(file?: File) {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
      setError('Choose a PNG, JPEG, or WebP smaller than 20 MB.'); return
    }
    const sequence = ++uploadSequence.current
    const reader = new FileReader()
    reader.onerror = () => setError('The image could not be read. Try another file.')
    reader.onload = () => {
      const src = String(reader.result)
      const picture = new Image()
      picture.onerror = () => setError('This file is not a readable image.')
      picture.onload = () => {
        if (sequence !== uploadSequence.current) return
        if (picture.width > 8192 || picture.height > 8192) { setError('Use an image no larger than 8192 pixels on either edge.'); return }
        setPuzzle({ id: 'new-location', version: 1, title: '', location: '', image: `/art/${file.name}`, width: picture.width, height: picture.height, cats: [] })
        setImage(src); setSelected(''); setTrace([]); setFound([]); setError(''); setPreview(false)
      }
      picture.src = src
    }
    reader.readAsDataURL(file)
  }

  function addPoint(event: MouseEvent<SVGSVGElement>) {
    if (!selected) { setError('Add or select a cat before tracing.'); return }
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    setTrace(previous => [...previous, [Math.round(Math.max(0, Math.min(puzzle.width, point.x))), Math.round(Math.max(0, Math.min(puzzle.height, point.y)))]] )
  }

  function save() {
    if (trace.length < 3) return
    setPuzzle(previous => ({ ...previous, cats: previous.cats.map(cat => cat.id === selected ? { ...cat, [region]: trace } : cat) }))
    setTrace([])
  }

  function addCat() {
    let number = puzzle.cats.length + 1
    while (puzzle.cats.some(cat => cat.id === `cat-${number}`)) number++
    const cat: Cat = { id: `cat-${number}`, tap: [], reveal: [] }
    setPuzzle(previous => ({ ...previous, cats: [...previous.cats, cat] })); setSelected(cat.id); setTrace([])
  }

  function exportPuzzle() {
    if (!puzzle.id.trim() || !puzzle.location.trim() || !puzzle.cats.length || puzzle.cats.some(cat => cat.tap.length < 3 || cat.reveal.length < 3)) {
      setError('Enter an ID and location, and save both polygons for every cat before exporting.'); return
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(puzzle, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = `${puzzle.id}.json`; link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); setError('')
  }

  return <main className="editor">
    <h1>Puzzle editor</h1><a href="/">Back to the game</a>
    <div className="editor-layout">
      <div>{preview ? <Picture key={`${puzzle.id}-${image}`} puzzle={{ ...puzzle, image }} found={found} onFind={id => setFound(previous => previous.includes(id) ? previous : [...previous, id])} />
        : <svg className="editor-canvas" viewBox={`0 0 ${puzzle.width} ${puzzle.height}`} onClick={addPoint} aria-label="Click to trace the selected cat">
          <image href={image} width={puzzle.width} height={puzzle.height} />
          {puzzle.cats.map(cat => <polygon key={cat.id} points={polygonPoints(cat[region])} fill={cat.id === selected ? '#63855744' : '#63855711'} stroke={cat.id === selected ? '#3d6531' : '#807f71'} strokeWidth="3" />)}
          <polyline points={polygonPoints(trace)} fill="none" stroke="#a64128" strokeWidth="3" />
          {trace.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="5" fill="#a64128" />)}
        </svg>}</div>
      <aside className="editor-panel">
        <label>Existing illustration<select value={puzzles.some(p => p.id === puzzle.id) ? puzzle.id : ''} onChange={event => load(event.target.value)}><option value="" disabled>New illustration</option>{puzzles.map(p => <option key={p.id} value={p.id}>{p.location}</option>)}</select></label>
        <label>Upload artwork<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event.target.files?.[0])} /></label>
        <label>Puzzle ID<input value={puzzle.id} onChange={event => setPuzzle({ ...puzzle, id: event.target.value })} /></label>
        <label>Location<input value={puzzle.location} onChange={event => setPuzzle({ ...puzzle, location: event.target.value })} /></label>
        <label>Title<input value={puzzle.title} onChange={event => setPuzzle({ ...puzzle, title: event.target.value })} /></label>
        <label>Cat<select value={selected} onChange={event => { setSelected(event.target.value); setTrace([]) }}><option value="" disabled>Select a cat</option>{puzzle.cats.map(cat => <option key={cat.id} value={cat.id}>{cat.id} ({cat.tap.length && cat.reveal.length ? 'ready' : 'needs outlines'})</option>)}</select></label>
        <div className="editor-actions"><button onClick={addCat}>Add cat</button><button disabled={!current} onClick={() => { setPuzzle({ ...puzzle, cats: puzzle.cats.filter(cat => cat.id !== selected) }); setSelected(''); setTrace([]) }}>Remove cat</button></div>
        <label>Outline to trace<select value={region} onChange={event => { setRegion(event.target.value as 'tap' | 'reveal'); setTrace([]) }}><option value="reveal">Precise reveal outline</option><option value="tap">Forgiving tap region</option></select></label>
        <p>Click around the cat, then save the polygon. Trace each region separately. The tap region should include a little space around the cat.</p>
        <div className="editor-actions"><button disabled={trace.length < 3 || preview} onClick={save}>Save outline ({trace.length})</button><button disabled={!trace.length} onClick={() => setTrace(trace.slice(0, -1))}>Undo point</button><button onClick={() => setTrace([])}>Clear trace</button></div>
        <button onClick={() => { setPreview(!preview); setFound([]) }}>{preview ? 'Edit outlines' : 'Preview puzzle'}</button>
        {preview && <p role="status">{found.length} / {puzzle.cats.length} cats found</p>}
        <button onClick={exportPuzzle}>Export puzzle JSON</button>
        {error && <p role="alert">{error}</p>}
        <p>Copy uploaded artwork to <code>public/art/</code> using its original filename, and add the exported record to <code>src/puzzles.ts</code>.</p>
      </aside>
    </div>
  </main>
}
