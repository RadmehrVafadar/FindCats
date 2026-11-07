import { test, expect } from '@playwright/test'
import { puzzles } from '../src/puzzles'

test('production requests scripts, styles, fonts, and artwork under /find-cats/assets/', async ({ page, request }) => {
  const assets: { path: string, type: string, status: number }[] = []
  page.on('response', response => {
    const type = response.request().resourceType()
    if (['script', 'stylesheet', 'font', 'image'].includes(type)) {
      assets.push({ path: new URL(response.url()).pathname, type, status: response.status() })
    }
  })
  await page.goto('/find-cats/')
  await expect(page.getByRole('group', { name: 'Paris hidden cat illustration' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cat 1', exact: true })).toHaveAttribute('tabindex', '0')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForLoadState('networkidle')
  expect(assets.map(asset => asset.type)).toEqual(expect.arrayContaining(['script', 'stylesheet', 'font', 'image']))
  for (const asset of assets) {
    expect(asset.path).toMatch(/^\/find-cats\/assets\//)
    expect(asset.status).toBe(200)
  }
  for (const puzzle of puzzles) {
    expect(puzzle.image).toMatch(/^\/find-cats\/assets\//)
    const response = await request.get(puzzle.image)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  }
})
