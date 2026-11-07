import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { puzzles } from '../src/puzzles'

const parisSpots = [[205, 1165], [914, 980], [235, 605], [807, 728], [240, 289], [942, 216]]
// Read from the finished artwork, independently of the target polygons.
const sceneSpots: Record<string, number[][]> = {
  paris: parisSpots,
  venice: [[145, 1260], [900, 1325], [164, 463], [500, 750], [868, 360], [220, 100]],
  kyoto: [[190, 1390], [850, 1325], [204, 807], [850, 690], [130, 305], [924, 320]],
  lisbon: [[200, 1170], [901, 1349], [171, 727], [860, 615], [222, 199], [870, 267]],
  istanbul: [[193, 1390], [906, 1237], [146, 616], [835, 890], [204, 178], [899, 239]],
  amsterdam: [[154, 1300], [890, 1268], [291, 615], [801, 773], [255, 247], [912, 155]],
  prague: [[835, 1345], [127, 1220], [950, 785], [300, 655], [187, 202], [912, 236]],
  chefchaouen: [[207, 1365], [755, 1220], [232, 847], [808, 496], [245, 207], [909, 230]],
  havana: [[901, 1305], [157, 1470], [900, 517], [270, 478], [145, 113], [925, 138]],
  seoul: [[182, 1340], [864, 1077], [255, 974], [773, 940], [198, 321], [884, 351]],
}

async function open(page: Page) {
  await page.goto('/')
  await expect(page.getByText('Opening your sketchbook…')).toBeHidden()
  await expect(page.getByRole('group', { name: 'Paris hidden cat illustration' })).toBeVisible()
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
  await expect(page.locator('.progress')).toHaveClass('progress complete')
  await expect(page.getByRole('group', { name: 'Paris hidden cat illustration' })).toHaveCount(0, { timeout: 5000 })
  await expect(page.getByLabel('0 of 6 cats found')).toBeVisible()
  expect(errors).toEqual([])
})

test('zoom and drag leave targets aligned and do not select a cat while panning', async ({ page }) => {
  await open(page)
  const art = page.getByRole('group', { name: /hidden cat illustration/ })
  await art.press('+')
  await expect(art).toHaveAttribute('viewBox', /682\.666/)
  const box = (await page.getByRole('group', { name: /hidden cat illustration/ }).boundingBox())!
  // Drag over the foreground cat, then release away from the initial press.
  const startX = box.x + (205 - 1024 / 6) / (1024 / 1.5) * box.width
  const startY = box.y + (1165 - 1536 / 6) / (1536 / 1.5) * box.height
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(startX + 60, startY - 90, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByLabel('0 of 6 cats found')).toBeVisible()
  await art.press('0')
  await expect(art).toHaveAttribute('viewBox', '0 0 1024 1536')
  await art.press('+')
  await clickArtwork(page, 807, 728)
  await expect(page.getByLabel('1 of 6 cats found')).toBeVisible()
})

test('refresh advances without repeating before the full collection is exhausted', async ({ page }) => {
  await open(page)
  await clickArtwork(page, 205, 1165)
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('find-the-cats:v1')!))
  expect(stored.found.paris).toEqual(['wall'])
  expect(new Set([stored.current, ...stored.remaining])).toEqual(new Set(puzzles.map(puzzle => puzzle.id)))
  const scenes = ['Paris hidden cat illustration']
  for (let i = 1; i < puzzles.length; i++) {
    await page.reload()
    await expect(page.getByText('Opening your sketchbook…')).toBeHidden()
    scenes.push((await page.getByRole('group', { name: /hidden cat illustration/ }).getAttribute('aria-label'))!)
  }
  expect(new Set(scenes).size).toBe(puzzles.length)
  await page.reload()
  await expect(page.getByRole('group', { name: scenes.at(-1), exact: true })).toHaveCount(0)
})

for (const puzzle of puzzles) {
  test(`${puzzle.location} accepts all six real cat coordinates`, async ({ page }, info) => {
    await page.addInitScript(id => localStorage.setItem('find-the-cats:v1', JSON.stringify({ current: id === 'paris' ? 'venice' : 'paris', remaining: [id], found: {} })), puzzle.id)
    await page.goto('/')
    await expect(page.getByText('Opening your sketchbook…')).toBeHidden()
    await expect(page.getByRole('group', { name: `${puzzle.location} hidden cat illustration` })).toBeVisible()
    if (puzzle.id === 'seoul') await expect(page.getByLabel('0 of 6 cats found')).toHaveCSS('color', 'rgb(255, 255, 255)')
    expect(sceneSpots[puzzle.id]).toHaveLength(6)
    for (const [index, [x, y]] of sceneSpots[puzzle.id].entries()) {
      await clickArtwork(page, x, y)
      await expect(page.getByRole('button', { name: `Cat ${index + 1}`, exact: true }), `${puzzle.location} cat ${index + 1}`).toHaveAttribute('aria-pressed', 'true')
    }
    await expect(page.getByLabel('6 of 6 cats found')).toBeVisible()
    await page.locator('.cat-reveal').evaluateAll(elements => Promise.all(elements.flatMap(element => element.getAnimations().map(animation => animation.finished))))
    await page.screenshot({ path: `.impeccable/review/${info.project.name}-${puzzle.id}-complete.png`, fullPage: true })
  })
}

test('keyboard access finds cats, and storage failure does not prevent play', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage disabled') } })
  await open(page)
  await page.getByRole('button', { name: 'Cat 1', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'Cat 1', exact: true }).press('Space')
  await expect(page.getByLabel('1 of 6 cats found')).toBeVisible()
  await page.getByRole('group', { name: /hidden cat illustration/ }).press('+')
  await expect(page.getByRole('group', { name: /hidden cat illustration/ })).toHaveAttribute('viewBox', /682\.666/)
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
  const art = page.getByRole('group', { name: /hidden cat illustration/ })
  await expect(art).not.toHaveAttribute('viewBox', '0 0 1024 1536')
  await expect(page.getByLabel('0 of 6 cats found')).toBeVisible()
  await art.press('0')
  const catX = box.x + 205 / 1024 * box.width, catY = box.y + 1165 / 1536 * box.height
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: catX, y: catY, id: 0 }] })
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(page.getByLabel('1 of 6 cats found')).toBeVisible()
  await cdp.detach()
})

test('the minimal page fits the viewport and supplies a visual review capture', async ({ page }, info) => {
  await open(page)
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
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

test('only the unboxed cat counter overlays the largest uncropped picture', async ({ page }) => {
  await open(page)
  await expect(page.getByRole('heading')).toHaveCount(0)
  await expect(page.getByText('Find six little locals.', { exact: false })).toBeHidden()
  await expect(page.getByRole('button', { name: /zoom/i })).toHaveCount(0)
  await expect(page.locator('header, footer')).toHaveCount(0)
  const picture = (await page.locator('.picture').boundingBox())!
  const counter = (await page.getByLabel('0 of 6 cats found').boundingBox())!
  const viewport = page.viewportSize()!
  expect(picture.width).toBeCloseTo(Math.min(viewport.width, viewport.height * 2 / 3), 0)
  expect(picture.height / picture.width).toBeCloseTo(1.5)
  expect(counter.x).toBeGreaterThan(picture.x + picture.width / 2)
  expect(counter.x + counter.width).toBeLessThan(picture.x + picture.width)
  expect(counter.y).toBeGreaterThan(picture.y)
  expect(counter.y + counter.height).toBeLessThan(picture.y + picture.height)
  const decoration = await page.locator('.progress').evaluate(element => {
    const style = getComputedStyle(element)
    return { background: style.backgroundColor, shadow: style.boxShadow, pointerEvents: style.pointerEvents }
  })
  expect(decoration).toEqual({ background: 'rgba(0, 0, 0, 0)', shadow: 'none', pointerEvents: 'none' })
})

test('the counter switches ink for dark, light, and midtone artwork', async ({ page }, info) => {
  await page.addInitScript(() => localStorage.clear())
  for (const [background, foreground] of [['#111111', 'rgb(255, 255, 255)'], ['#ffffff', 'rgb(0, 0, 0)'], ['#777777', 'rgb(0, 0, 0)']]) {
    await page.route('**/art/paris.png', route => route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><path fill="${background}" d="M0 0h1024v1536H0z"/></svg>` }))
    await open(page)
    const counter = page.getByLabel('0 of 6 cats found')
    await expect(counter).toHaveCSS('color', foreground)
    await expect(counter.locator('.count-divider')).toHaveCSS('color', foreground)
    await expect(counter.locator('svg')).toHaveCSS('color', foreground)
    await expect(counter).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await page.screenshot({ path: `.impeccable/review/${info.project.name}-counter-${background.slice(1)}.png`, fullPage: true })
    await page.unroute('**/art/paris.png')
  }
})

test('counter contrast follows the artwork during zoom, pan, and resize', async ({ page }) => {
  await page.route('**/art/paris.png', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536"><path fill="white" d="M0 0h1024v1536H0z"/><path fill="#111" d="M0 512h1024v1024H0z"/></svg>' }))
  await open(page)
  const art = page.locator('.picture')
  const counter = page.getByLabel('0 of 6 cats found')
  await expect(counter).toHaveCSS('color', 'rgb(0, 0, 0)')
  for (let i = 0; i < 3; i++) await art.press('+')
  await expect(counter).toHaveCSS('color', 'rgb(255, 255, 255)')
  for (let i = 0; i < 2; i++) await art.press('ArrowUp')
  await expect(counter).toHaveCSS('color', 'rgb(0, 0, 0)')
  await page.setViewportSize({ width: 320, height: 568 })
  await expect(counter).toHaveCSS('color', 'rgb(0, 0, 0)')
  await art.press('0')
  await expect(counter).toHaveCSS('color', 'rgb(0, 0, 0)')
})

test('the full picture stays usable on narrow and short landscape screens', async ({ page }, info) => {
  await open(page)
  for (const size of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size)
    const picture = (await page.locator('.picture').boundingBox())!
    expect(picture.width).toBeCloseTo(Math.min(size.width, size.height * 2 / 3), 0)
    expect(picture.height).toBeLessThanOrEqual(size.height)
    await expect(page.locator('.picture')).toBeInViewport({ ratio: 1 })
    await expect(page.getByLabel('0 of 6 cats found')).toBeInViewport({ ratio: 1 })
    await page.screenshot({ path: `.impeccable/review/${info.project.name}-${size.width}.png`, fullPage: true })
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
  const exported = await download
  expect(exported.suggestedFilename()).toBe('paris.json')
  expect(JSON.parse(await readFile((await exported.path())!, 'utf8')).image).toBe('./assets/art/paris.png')
  await page.getByRole('button', { name: 'Edit outlines' }).click()
  await page.getByRole('button', { name: 'Add cat' }).click()
  await page.getByRole('button', { name: 'Export puzzle JSON' }).click()
  await expect(page.getByRole('alert')).toContainText('save both polygons')
  await page.getByRole('link', { name: 'Back to the game' }).click()
  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await expect(page.getByRole('group', { name: 'Paris hidden cat illustration' })).toBeVisible()
})
