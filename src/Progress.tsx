import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

type Props = { image: string; picture: RefObject<SVGSVGElement | null>; found: number; total: number }
const catPath = 'M4.5 11 4 3l6 4a10 10 0 0 1 4 0l6-4-.5 8c1 1.3 1.5 2.5 1.5 4 0 4-4 6-9 6s-9-2-9-6c0-1.5.5-2.7 1.5-4Z M8 13h.01M16 13h.01M11 16h2l-1 1-1-1ZM2 14l4 1M2 18l4-1M22 14l-4 1M22 18l-4-1'

export default function Progress({ image, picture, found, total }: Props) {
  const counter = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = counter.current, art = picture.current
    if (!element || !art) return
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 8
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return
    const source = new Image()
    let frame: number | null = null

    const sample = () => {
      frame = null
      if (!source.complete || !source.naturalWidth) return
      const bounds = art.getBoundingClientRect(), label = element.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const view = art.viewBox.baseVal
      context.clearRect(0, 0, 16, 8)
      context.drawImage(source, view.x + (label.x - bounds.x) / bounds.width * view.width, view.y + (label.y - bounds.y) / bounds.height * view.height,
        label.width / bounds.width * view.width, label.height / bounds.height * view.height, 0, 0, 16, 8)
      const { data } = context.getImageData(0, 0, 16, 8)
      const linear = (value: number) => {
        const channel = value / 255
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
      }
      let luminance = 0
      for (let i = 0; i < data.length; i += 4) luminance += 0.2126 * linear(data[i]) + 0.7152 * linear(data[i + 1]) + 0.0722 * linear(data[i + 2])
      // Black and white have equal WCAG contrast at this relative luminance.
      element.dataset.tone = luminance / (data.length / 4) < Math.sqrt(1.05 * 0.05) - 0.05 ? 'light' : 'dark'
    }

    function schedule() {
      if (frame === null) frame = requestAnimationFrame(sample)
    }

    source.onload = schedule
    source.src = image
    const resize = new ResizeObserver(schedule)
    resize.observe(art)
    resize.observe(element)
    const camera = new MutationObserver(schedule)
    camera.observe(art, { attributes: true, attributeFilter: ['viewBox'] })
    return () => {
      source.onload = null
      resize.disconnect()
      camera.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [image, picture])

  return <div ref={counter} className={`progress ${found === total ? 'complete' : ''}`} role="status" aria-live="polite" aria-label={`${found} of ${total} cats found`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={catPath} stroke="var(--counter-edge)" strokeWidth="3.35" />
      <path d={catPath} />
    </svg>
    <span>{found}<span className="count-divider"> / </span>{total}</span>
  </div>
}
