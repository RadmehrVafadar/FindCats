import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

type Playback = { src: string; volume: number; loop: boolean }
type AudioLog = { plays: Playback[]; pauses: string[] }

async function recordAudio(page: Page, reject = false) {
  await page.addInitScript(reject => {
    const log: AudioLog = { plays: [], pauses: [] }
    Object.assign(window, { audioLog: log })
    HTMLMediaElement.prototype.play = function () {
      log.plays.push({ src: this.src, volume: this.volume, loop: this.loop })
      return reject ? Promise.reject(new Error('Playback unavailable')) : Promise.resolve()
    }
    HTMLMediaElement.prototype.pause = function () { log.pauses.push(this.src) }
  }, reject)
}

async function plays(page: Page) {
  return page.evaluate(() => (window as unknown as { audioLog: AudioLog }).audioLog.plays)
}

async function open(page: Page) {
  await page.goto('/')
  await expect(page.getByText('Opening your sketchbook…')).toBeHidden()
}

test('new cats cycle through three meows; repeated taps, misses, and muting stay quiet', async ({ page }) => {
  await recordAudio(page)
  await open(page)
  await expect(page.getByRole('button', { name: 'Cat sounds', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Relaxing music' })).toHaveAttribute('aria-pressed', 'false')
  expect(await plays(page)).toEqual([])

  const art = page.locator('.picture')
  const box = (await art.boundingBox())!
  await art.click({ position: { x: 500 / 1024 * box.width, y: 500 / 1536 * box.height } })
  expect(await plays(page)).toEqual([])
  await art.click({ position: { x: 205 / 1024 * box.width, y: 1165 / 1536 * box.height } })
  await page.getByRole('button', { name: 'Cat 1', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Cat 2', exact: true }).press('Space')
  await page.getByRole('button', { name: 'Cat 3', exact: true }).press('Enter')
  const meows = await plays(page)
  expect(meows).toHaveLength(3)
  expect(new Set(meows.map(meow => new URL(meow.src).pathname))).toEqual(new Set([1, 2, 3].map(i => `/assets/audio/meow-${i}.wav`)))
  expect(meows.every(meow => meow.volume === 0.65 && !meow.loop)).toBe(true)

  await page.getByRole('button', { name: 'Cat sounds', exact: true }).click()
  await page.getByRole('button', { name: 'Cat 4', exact: true }).press('Enter')
  expect(await plays(page)).toHaveLength(3)
  await expect(page.getByLabel('4 of 6 cats found')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Cat sounds', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Cat 1', exact: true }).press('Enter')
  expect(await plays(page)).toEqual([])
  await page.getByRole('button', { name: 'Cat sounds', exact: true }).press('Space')
  await page.getByRole('button', { name: 'Cat 2', exact: true }).press('Enter')
  expect(await plays(page)).toHaveLength(1)
})

test('music is opt-in, survives scene changes, pauses in the background, and can be stopped independently', async ({ page }) => {
  await recordAudio(page)
  await open(page)
  const music = page.getByRole('button', { name: 'Relaxing music' })
  await music.click()
  await expect(music).toHaveAttribute('aria-pressed', 'true')
  expect(await plays(page)).toEqual([{ src: 'http://127.0.0.1:5173/assets/audio/cat-caffe.mp3', volume: 0.2, loop: true }])
  await page.getByRole('button', { name: 'Cat sounds', exact: true }).click()
  for (let i = 1; i <= 6; i++) await page.getByRole('button', { name: `Cat ${i}`, exact: true }).press('Enter')
  await expect(page.getByRole('group', { name: 'Paris hidden cat illustration' })).toHaveCount(0)
  expect(await plays(page)).toHaveLength(1)
  await expect(music).toHaveAttribute('aria-pressed', 'true')

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(await page.evaluate(() => (window as unknown as { audioLog: AudioLog }).audioLog.pauses)).toContain('http://127.0.0.1:5173/assets/audio/cat-caffe.mp3')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(await plays(page)).toHaveLength(2)
  await music.press('Space')
  await expect(music).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(music).toHaveAttribute('aria-pressed', 'false')
  expect(await plays(page)).toEqual([])
})

test('blocked audio and unavailable storage do not interrupt gameplay or controls', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await recordAudio(page, true)
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage disabled') }
    Storage.prototype.setItem = () => { throw new Error('Storage disabled') }
  })
  await open(page)
  await page.getByRole('button', { name: 'Cat 1', exact: true }).press('Enter')
  await expect(page.getByLabel('1 of 6 cats found')).toBeVisible()
  const music = page.getByRole('button', { name: 'Relaxing music' })
  await music.click()
  await expect(music).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Cat sounds', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cat sounds', exact: true })).toHaveAttribute('aria-pressed', 'false')
  expect(errors).toEqual([])
})

test('all bundled recordings decode in the browser', async ({ page }) => {
  await open(page)
  const durations = await page.evaluate(async () => {
    return Promise.all(['cat-caffe.mp3', 'meow-1.wav', 'meow-2.wav', 'meow-3.wav'].map(file => new Promise<number>((resolve, reject) => {
      const audio = new Audio(`./assets/audio/${file}`)
      audio.addEventListener('loadeddata', () => resolve(audio.duration), { once: true })
      audio.addEventListener('error', () => reject(new Error(`Cannot decode ${file}`)), { once: true })
      audio.load()
    })))
  })
  expect(durations).toHaveLength(4)
  expect(durations.every(duration => Number.isFinite(duration) && duration > 0)).toBe(true)
})
