import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { puzzles } from '../src/puzzles'

const parisSpots = [[205, 1165], [914, 980], [235, 605], [807, 728], [240, 289], [942, 216]]

async function open(page: Page) {
  await page.goto('/')
  await expect(page.getByText('Opening your sketchbook…')).toBeHidden()
  await expect(page.getByRole('heading')).toContainText('Paris')
}

async function clickArtwork(page: Page, x: number, y: number) {
  const art = page.getByRole('group', { name: /hidden cat illustration/ })
  const box = (await art.boundingBox())!
  const viewBox = (await art.getAttribute('viewBox'))!.split(' ').map(Number)
  await art.click({ position: { x: (x - viewBox[0]) / viewBox[2] * box.width, y: (y - viewBox[1]) / viewBox[3] * box.height } })
}

test('actual artwork taps reveal cats once and automatically open the next scene', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await open(page)
  await clickArtwork(page, 500, 500)
  await expect(page.getByLabel('0 of 6 cats found')).toBeVisible()
  await clickArtwork(page, ...parisSpots[0] as [number, number])
  await clickArtwork(page, ...parisSpots[0] as [number, number])
  await expect(page.getByLabel('1 of 6 cats found')).toBeVisible()
  await expect(page.locator('.cat-reveal')).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Cat 1', exact: true })).toHaveAttribute('aria-pressed', 'true')
  for (const [x, y] of parisSpots.slice(1)) await clickArtwork(page, x, y)
  await expect(page.getByLabel('6 of 6 cats found')).toBeVisible()
  await expect(page.getByText('All six found. Bon voyage!')).toBeVisible()
  await expect(page.getByRole('heading')).not.toContainText('Paris', { timeout: 5000 })
  await expect(page.getByLabel('0 of 6 cats found')).toBeVisible()
  expect(errors).toEqual([])
})

test('zoom and drag leave targets aligned and do not select a cat while panning', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Reset zoom' })).toContainText('150')
  const box = (await page.getByRole('group', { name: /hidden cat illustration/ }).boundingBox())!
  // Drag over the foreground cat, then release away from the initial press.
  const startX = box.x + (205 - 1024 / 6) / (1024 / 1.5) * box.width
  const startY = box.y + (1165 - 1536 / 6) / (1536 / 1.5) * box.height
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 60, startY - 90, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByLabel('0 of 6 cats found')).toBeVisible()
  await page.getByRole('button', { name: 'Reset zoom' }).click()
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
  await clickArtwork(page, 807, 728)
  await expect(page.getByLabel('1 of 6 cats found')).toBeVisible()
})

test('refresh advances without repeating before the full collection is exhausted', async ({ page }) => {
  await open(page)
  await clickArtwork(page, 205, 1165)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('find-the-cats:v1')!))
  expect(stored.found.paris).toEqual(['wall'])
  const scenes = ['Paris']
  for (let i = 0; i < 2; i++) {
    await page.reload()
    await expect(page.getByText('Opening your sketchbook…')).toBeHidden()
    scenes.push((await page.getByRole('heading').innerText()).split('/')[0].trim())
  }
  expect(new Set(scenes).size).toBe(3)
  await page.reload()
  await expect(page.getByRole('heading')).not.toContainText(scenes[2])
})

test('every location accepts all six real cat coordinates', async ({ page }, info) => {
  for (const puzzle of puzzles) {
    await page.addInitScript(id => localStorage.setItem('find-the-cats:v1', JSON.stringify({ current: id === 'paris' ? 'venice' : 'paris', remaining: [id], found: {} })), puzzle.id)
    await page.goto('/')
    await expect(page.getByText('Opening your sketchbook…')).toBeHidden()
    await expect(page.getByRole('heading')).toContainText(puzzle.location)
    for (const cat of puzzle.cats) {
      const x = cat.reveal.reduce((sum, p) => sum + p[0], 0) / cat.reveal.length
      const y = cat.reveal.reduce((sum, p) => sum + p[1], 0) / cat.reveal.length
      await clickArtwork(page, x, y)
    }
    await expect(page.getByLabel('6 of 6 cats found')).toBeVisible()
    await page.locator('.cat-reveal').evaluateAll(elements => Promise.all(elements.flatMap(element => element.getAnimations().map(animation => animation.finished))))
    await page.screenshot({ path: `.impeccable/review/${info.project.name}-${puzzle.id}-complete.png`, fullPage: true })
  }
})

test('keyboard access finds cats, and storage failure does not prevent play', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage disabled') } })
  await open(page)
  await page.getByRole('button', { name: 'Cat 1', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Cat 1', exact: true }).press('Space')
  await expect(page.getByLabel('1 of 6 cats found')).toBeVisible()
  await page.getByRole('group', { name: /hidden cat illustration/ }).press('+')
  await expect(page.getByRole('button', { name: 'Reset zoom' })).toContainText('150')
})

test('two-finger pinch zooms without finding cats, followed by a real touch tap', async ({ page, context }) => {
  await open(page)
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true })
  const box = (await page.getByRole('group', { name: /hidden cat illustration/ }).boundingBox())!
  const x = box.x + box.width / 2, y = box.y + box.height / 2
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 35, y, id: 0 }, { x: x + 35, y, id: 1 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 70, y, id: 0 }, { x: x + 70, y, id: 1 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.getByRole('button', { name: 'Reset zoom' })).not.toContainText('100')
  await expect(page.getByLabel('0 of 6 cats found')).toBeVisible()
  await page.getByRole('button', { name: 'Reset zoom' }).click()
  const catX = box.x + 205 / 1024 * box.width, catY = box.y + 1165 / 1536 * box.height
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: catX, y: catY, id: 0 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.getByLabel('1 of 6 cats found')).toBeVisible()
  await cdp.detach()
})

test('the minimal page fits the viewport and supplies a visual review capture', async ({ page }, info) => {
  await open(page)
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.getByRole('group', { name: /hidden cat illustration/ })).toBeInViewport({ ratio: 1 })
  await page.screenshot({ path: `.impeccable/review/${info.project.name}.png`, fullPage: true })
  await clickArtwork(page, 205, 1165)
  await page.locator('.cat-reveal').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)))
  await page.screenshot({ path: `.impeccable/review/${info.project.name}-found.png`, fullPage: true })
  if (info.project.name === 'desktop') {
    await page.setViewportSize({ width: 406, height: 884 })
    await page.screenshot({ path: '.impeccable/review/user-406.png', fullPage: true })
  }
})

test('the development editor previews and exports separate cat polygons', async ({ page }) => {
  await page.goto('/editor')
  await expect(page.getByRole('heading', { name: 'Puzzle editor' })).toBeVisible()
  await page.getByRole('button', { name: 'Preview puzzle' }).click()
  await expect(page.getByText('Opening your sketchbook…')).toBeHidden()
  await clickArtwork(page, 205, 1165)
  await expect(page.getByText('1 / 6 cats found')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export puzzle JSON' }).click()
  expect((await download).suggestedFilename()).toBe('paris.json')
  await page.getByRole('button', { name: 'Edit outlines' }).click()
  await page.getByRole('button', { name: 'Add cat' }).click()
  await page.getByRole('button', { name: 'Export puzzle JSON' }).click()
  await expect(page.getByRole('alert')).toContainText('save both polygons')
})
