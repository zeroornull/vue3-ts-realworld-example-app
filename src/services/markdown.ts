import createDOMPurify, { type WindowLike } from 'dompurify'
import { marked } from 'marked'

function protectExternalLinks(element: Element, baseUrl: URL): void {
  if (element.tagName !== 'A') {
    return
  }

  const href = element.getAttribute('href')

  if (!href) {
    element.removeAttribute('target')
    element.removeAttribute('rel')
    return
  }

  let url: URL

  try {
    url = new URL(href, baseUrl)
  } catch {
    element.removeAttribute('href')
    element.removeAttribute('target')
    element.removeAttribute('rel')
    return
  }
  const isExternalHttpLink =
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    url.origin !== baseUrl.origin

  if (isExternalHttpLink) {
    element.setAttribute('target', '_blank')
    element.setAttribute('rel', 'noopener noreferrer')
    return
  }

  element.removeAttribute('target')
  element.removeAttribute('rel')
}

export function renderMarkdown(
  content: unknown,
  windowObject: WindowLike = window,
): string {
  if (typeof content !== 'string' || content.length === 0) {
    return ''
  }

  const baseUrl = new URL(windowObject.document?.baseURI ?? 'http://localhost/')
  const purifier = createDOMPurify(windowObject)

  purifier.addHook('afterSanitizeAttributes', (element) => {
    protectExternalLinks(element, baseUrl)
  })

  return purifier.sanitize(marked.parse(content, { async: false }))
}
