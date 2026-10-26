const SLIDE: KeyframeAnimationOptions = {
  duration: 220,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
}

const running = new WeakMap<HTMLElement, Animation>()

/** Relative to the list, so scrolling between two measures doesn't read as movement. */
export function measureTops(list: HTMLElement, rows: Map<string, HTMLElement>) {
  const listTop = list.getBoundingClientRect().top
  const tops = new Map<string, number>()
  for (const [id, element] of rows) {
    tops.set(id, element.getBoundingClientRect().top - listTop)
  }
  return tops
}

// How far a running slide draws the row off its layout spot right now.
function shiftOf(element: HTMLElement) {
  const { transform } = getComputedStyle(element)
  if (transform === "none") return 0
  return new DOMMatrixReadOnly(transform).m42
}

/**
 * Slides rows that moved since `from` to their spot now, starting from where
 * they're drawn, so a slide interrupted mid-way doesn't snap. Returns the spots.
 */
export function slide(
  list: HTMLElement,
  rows: Map<string, HTMLElement>,
  from: Map<string, number> | null
) {
  const listTop = list.getBoundingClientRect().top
  const to = new Map<string, number>()
  for (const [id, element] of rows) {
    const shift = shiftOf(element)
    const after = element.getBoundingClientRect().top - listTop - shift
    to.set(id, after)

    const before = from?.get(id)
    if (before === undefined) continue
    if (Math.abs(before - after) < 1) continue
    const offset = before + shift - after
    running.get(element)?.cancel()
    running.set(
      element,
      element.animate(
        [{ transform: `translateY(${offset}px)` }, { transform: "none" }],
        SLIDE
      )
    )
  }
  return to
}
