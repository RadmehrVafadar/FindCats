import { test, expect } from '@playwright/test'
import { puzzles } from '../src/puzzles'

test('production music and meows play from the mounted asset paths', async ({ page, baseURL }) => {
  await page.addInitScript(() => {
    const media: HTMLMediaElement[] = []
    Object.assign(window, { playedMedia: media })
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      media.push(this)
      return play.call(this)
    }
  })
  await page.goto(baseURL!)
  await expect(page.getByText('Opening your sketchbook…')).toBeHidden()
  const music = page.getByRole('button', { name: 'Relaxing music' })
  await music.click()
  await expect(music).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => page.evaluate(() => {
    const track = (window as unknown as { playedMedia: HTMLMediaElement[] }).playedMedia[0]
    return track && !track.paused && track.currentTime > 0
  })).toBe(true)
  await page.getByRole('button', { name: 'Cat 1', exact: true }).press('Enter')
  await expect.poll(() => page.evaluate(() => {
    const meow = (window as unknown as { playedMedia: HTMLMediaElement[] }).playedMedia[1]
    return meow && meow.currentTime > 0
  })).toBe(true)
  const paths = await page.evaluate(() => (window as unknown as { playedMedia: HTMLMediaElement[] }).playedMedia.map(audio => new URL(audio.src).pathname))
  const mount = `${new URL(baseURL!).pathname.replace(/\/$/, '')}/`
  expect(paths).toHaveLength(2)
  expect(paths.every(path => path.startsWith(`${mount}assets/audio/`))).toBe(true)
  await music.click()
  expect(await page.evaluate(() => (window as unknown as { playedMedia: HTMLMediaElement[] }).playedMedia[0].paused)).toBe(true)
})

test('production assets and gameplay work at the root and behind a prefix-stripping proxy', async ({ page, request, baseURL }, info) => {
  const mount = new URL(baseURL!)
  const mountPath = `${mount.pathname.replace(/\/$/, '')}/`
  const assets: { path: string, type: string, status: number }[] = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('requestfailed', request => errors.push(request.url()))
  page.on('response', response => {
    const type = response.request().resourceType()
    if (['script', 'stylesheet', 'font', 'image'].includes(type)) {
      assets.push({ path: new URL(response.url()).pathname, type, status: response.status() })
    }
  })
  await page.goto(mount.href)
  await expect(page).toHaveURL(mount.href)
  await expect(page.getByRole('group', { name: 'Paris hidden cat illustration' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cat 1', exact: true })).toHaveAttribute('tabindex', '0')
  await page.evaluate(async () => {
    await Promise.all(['400 16px "DM Sans"', '500 16px "DM Sans"', '400 16px "Lora"', 'italic 400 16px "Lora"'].map(font => document.fonts.load(font)))
    await document.fonts.ready
  })
  await page.waitForLoadState('networkidle')
  expect(assets.map(asset => asset.type)).toEqual(expect.arrayContaining(['script', 'stylesheet', 'font', 'image']))
  expect(new Set(assets.filter(asset => asset.type === 'font').map(asset => asset.path)).size).toBe(4)
  for (const asset of assets) {
    expect(asset.path.startsWith(`${mountPath}assets/`), asset.path).toBe(true)
    expect(asset.status, asset.path).toBe(200)
  }
  for (const puzzle of puzzles) {
    expect(puzzle.image).toMatch(/^\.\/assets\//)
    const response = await request.get(new URL(puzzle.image, new URL(mountPath, mount)).href)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  }
  for (const file of ['cat-caffe.mp3', 'meow-1.wav', 'meow-2.wav', 'meow-3.wav']) {
    const response = await request.get(new URL(`./assets/audio/${file}`, new URL(mountPath, mount)).href)
    expect(response.status(), file).toBe(200)
    expect(response.headers()['content-type'], file).toMatch(/^audio\//)
    expect((await response.body()).length, file).toBeGreaterThan(90000)
  }
  await page.screenshot({ path: `.impeccable/review/${info.project.name}-production.png` })
  const art = page.getByRole('group', { name: 'Paris hidden cat illustration' })
  await page.getByRole('button', { name: 'Cat 1', exact: true }).press('Enter')
  await page.screenshot({ path: `.impeccable/review/${info.project.name}-production-found.png`, animations: 'disabled' })
  await art.press('+')
  await expect(art).toHaveAttribute('viewBox', /682\.666/)
  for (let i = 1; i <= 6; i++) await page.getByRole('button', { name: `Cat ${i}`, exact: true }).press('Enter')
  await expect(page.getByLabel('6 of 6 cats found')).toBeVisible()
  await expect(page.locator('.cat-reveal')).toHaveCount(6)
  await expect(art).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Cat 1', exact: true })).toHaveAttribute('tabindex', '0')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Cat 1', exact: true })).toHaveAttribute('tabindex', '0')
  expect(errors).toEqual([])
})

test('the proxy rewrites the slashless mount without a redirect and rejects portfolio-root assets', async ({ request }, info) => {
  test.skip(info.project.name !== 'proxy')
  const response = await request.get('http://127.0.0.1:5175/find-cats', { maxRedirects: 0 })
  expect(response.status()).toBe(200)
  expect(response.headers().location).toBeUndefined()
  expect((await request.get('http://127.0.0.1:5175/assets/missing.js')).status()).toBe(404)
})
