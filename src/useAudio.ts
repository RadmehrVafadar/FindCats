import { useEffect, useRef, useState } from 'react'

const EFFECTS_KEY = 'find-the-cats:meows'
const meowFiles = ['meow-1.wav', 'meow-2.wav', 'meow-3.wav']

export default function useAudio() {
  const [effects, setEffects] = useState(() => {
    try { return localStorage.getItem(EFFECTS_KEY) !== 'off' } catch { return true }
  })
  const [music, setMusic] = useState(false)
  const track = useRef<HTMLAudioElement | null>(null)
  const meows = useRef<HTMLAudioElement[]>([])
  const nextMeow = useRef(0)

  useEffect(() => {
    function visibility() {
      if (document.hidden) {
        track.current?.pause()
        meows.current.forEach(meow => meow.pause())
      } else if (music) {
        void track.current?.play().catch(() => setMusic(false))
      }
    }
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [music])

  useEffect(() => () => {
    track.current?.pause()
    meows.current.forEach(meow => meow.pause())
  }, [])

  function playMeow() {
    if (!effects || document.hidden) return
    if (!meows.current.length) {
      nextMeow.current = Math.floor(Math.random() * meowFiles.length)
      meows.current = meowFiles.map(file => {
        const audio = new Audio(`./assets/audio/${file}`)
        audio.volume = 0.65
        return audio
      })
    }
    meows.current.forEach(meow => meow.pause())
    const meow = meows.current[nextMeow.current]
    nextMeow.current = (nextMeow.current + 1) % meowFiles.length
    meow.currentTime = 0
    void meow.play().catch(() => { /* Audio failure must not interrupt finding cats. */ })
  }

  function toggleEffects() {
    const enabled = !effects
    setEffects(enabled)
    if (!enabled) meows.current.forEach(meow => meow.pause())
    try { localStorage.setItem(EFFECTS_KEY, enabled ? 'on' : 'off') } catch { /* Muting still works without storage. */ }
  }

  function toggleMusic() {
    if (!track.current) {
      track.current = new Audio('./assets/audio/cat-caffe.mp3')
      track.current.loop = true
      track.current.volume = 0.2
    }
    if (music) track.current.pause()
    else void track.current.play().catch(() => setMusic(false))
    setMusic(!music)
  }

  return { effects, music, playMeow, toggleEffects, toggleMusic }
}
