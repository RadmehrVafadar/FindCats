import { test, expect } from '@playwright/test'
import { puzzles } from '../src/puzzles'

test('production assets and gameplay work at the root and behind a prefix-stripping proxy', async ({ page, request, baseURL }, info) => {
  const mount = new URL(baseURL!)
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
  await page.goto('./')
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
    expect(asset.path.startsWith(`${mount.pathname}assets/`), asset.path).toBe(true)
    expect(asset.status, asset.path).toBe(200)
  }
  for (const puzzle of puzzles) {
    expect(puzzle.image).toMatch(/^\.\/assets\//)
    const response = await request.get(new URL(puzzle.image, mount).href)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  }
  await page.screenshot({ path: `.impeccable/review/${info.project.name}-production.png` })
  const art = page.getByRole('group', { name: 'Paris hidden cat illustration' })
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

test('the proxy canonicalizes the mount and rejects portfolio-root assets', async ({ request }, info) => {
  test.skip(info.project.name !== 'proxy')
  const redirect = await request.get('http://127.0.0.1:5175/find-cats', { maxRedirects: 0 })
  expect(redirect.status()).toBe(308)
  expect(redirect.headers().location).toBe('/find-cats/')
  expect((await request.get('http://127.0.0.1:5175/assets/missing.js')).status()).toBe(404)
})
