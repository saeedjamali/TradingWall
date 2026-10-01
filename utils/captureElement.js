const SMALL_IMAGE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const shiftCache = new Map()

function fontParts(font) {
  const match = /([\d.]+)px\s*(.*)$/.exec(font || '')
  if (!match) return { fontSize: 16, family: 'sans-serif' }
  return { fontSize: Number(match[1]), family: match[2] || 'sans-serif' }
}

// html2canvas measures the alphabetic baseline with a 1px image and then adds 2px.
// With this font that image lands on the bottom of the line, so every glyph is
// painted too low. Shift it back up to the font's real ascent.
function textShift(font) {
  if (shiftCache.has(font)) return shiftCache.get(font)
  const { fontSize, family } = fontParts(font)
  const container = document.createElement('div')
  const img = document.createElement('img')
  const span = document.createElement('span')
  container.style.cssText =
    'position:absolute;visibility:hidden;margin:0;padding:0;white-space:nowrap;top:0;left:0'
  container.style.fontFamily = family
  container.style.fontSize = `${fontSize}px`
  img.src = SMALL_IMAGE
  img.width = 1
  img.height = 1
  img.style.cssText = 'margin:0;padding:0;vertical-align:baseline'
  span.style.cssText = 'margin:0;padding:0'
  span.style.fontFamily = family
  span.style.fontSize = `${fontSize}px`
  span.textContent = 'Hidden Text'
  container.appendChild(span)
  container.appendChild(img)
  document.body.appendChild(container)
  const measured = img.offsetTop - span.offsetTop + 2
  document.body.removeChild(container)

  const ctx = document.createElement('canvas').getContext('2d')
  ctx.font = font
  const ascent = ctx.measureText('Hg').fontBoundingBoxAscent || fontSize * 0.8
  const shift = Math.max(0, measured - ascent)
  shiftCache.set(font, shift)
  return shift
}

function withBaselineFix(run) {
  const proto = CanvasRenderingContext2D.prototype
  const original = proto.fillText
  proto.fillText = function fillText(text, x, y, maxWidth) {
    const shift = textShift(this.font)
    return maxWidth == null
      ? original.call(this, text, x, y - shift)
      : original.call(this, text, x, y - shift, maxWidth)
  }
  return Promise.resolve()
    .then(run)
    .finally(() => {
      proto.fillText = original
    })
}

// The cloned document keeps Tailwind utilities but drops the base margin reset,
// so headings and paragraphs get the browser's default top/bottom margin.
function syncVerticalMargins(liveRoot, cloneRoot) {
  const liveNodes = [liveRoot, ...liveRoot.querySelectorAll('*')]
  const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll('*')].filter(
    (node) => node.tagName !== 'HTML2CANVASPSEUDOELEMENT',
  )
  const count = Math.min(liveNodes.length, cloneNodes.length)
  for (let index = 0; index < count; index += 1) {
    const liveStyle = getComputedStyle(liveNodes[index])
    const cloneStyle = cloneNodes[index].ownerDocument.defaultView.getComputedStyle(cloneNodes[index])
    if (liveStyle.marginTop !== cloneStyle.marginTop) {
      cloneNodes[index].style.marginTop = liveStyle.marginTop
    }
    if (liveStyle.marginBottom !== cloneStyle.marginBottom) {
      cloneNodes[index].style.marginBottom = liveStyle.marginBottom
    }
  }
}

export async function captureElement(node, options = {}) {
  const html2canvas = (await import('html2canvas')).default
  const { onclone, ...rest } = options
  return withBaselineFix(() =>
    html2canvas(node, {
      ...rest,
      onclone: (doc, el) => {
        syncVerticalMargins(node, el)
        if (typeof onclone === 'function') onclone(doc, el)
      },
    }),
  )
}
