import { describe, expect, it } from 'bun:test'
import { JSDOM } from 'jsdom'
import { renderMarkdown } from '../src/services/markdown'

function createWindow(): Window {
  return new JSDOM('', { url: 'https://conduit.example/' })
    .window as unknown as Window
}

describe('safe Markdown rendering', () => {
  it('renders basic Markdown', () => {
    const html = renderMarkdown(
      '# Safe title\n\nThis is **important**.',
      createWindow(),
    )

    expect(html).toContain('<h1>Safe title</h1>')
    expect(html).toContain('<strong>important</strong>')
  })

  it('removes scripts, event handlers, and dangerous URLs', () => {
    const html = renderMarkdown(
      [
        '<script>globalThis.compromised = true</script>',
        '<img src="x" onerror="globalThis.compromised = true">',
        '[danger](javascript:alert(1))',
      ].join('\n\n'),
      createWindow(),
    )

    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('javascript:')
  })

  it('opens only external links safely in a new tab', () => {
    const html = renderMarkdown(
      '[external](https://example.com/guide) [internal](/article/local)',
      createWindow(),
    )
    const document = new JSDOM(html).window.document
    const links = document.querySelectorAll('a')

    expect(links[0]?.getAttribute('target')).toBe('_blank')
    expect(links[0]?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(links[1]?.hasAttribute('target')).toBe(false)
    expect(links[1]?.hasAttribute('rel')).toBe(false)
  })

  it('treats missing content as empty instead of executable HTML', () => {
    expect(renderMarkdown(null, createWindow())).toBe('')
    expect(renderMarkdown('', createWindow())).toBe('')
  })

  it('drops malformed link destinations without breaking the article', () => {
    const html = renderMarkdown(
      '<a href="http://[">broken but harmless</a>',
      createWindow(),
    )

    expect(html).toContain('broken but harmless')
    expect(html).not.toContain('href=')
  })
})
