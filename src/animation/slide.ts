const SLIDE: KeyframeAnimationOptions = {
  duration: 220,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
}

/** Relative to the list, so scrolling between two measures doesn't read as movement. */
export function measureTops(list: HTMLElement, rows: Map<string, HTMLElement>) {
  const listTop = list.getBoundingClientRect().top
  const tops = new Map<string, number>()
  for (const [id, element] of rows) {
    tops.set(id, element.getBoundingClientRect().top - listTop)
  }
  return tops
}

export function slide(
  rows: Map<string, HTMLElement>,
  from: Map<string, number>,
  to: Map<string, number>
) {
  for (const [id, element] of rows) {
    const before = from.get(id)
    const after = to.get(id)
    if (before === undefined || after === undefined) continue
    const offset = before - after
    if (Math.abs(offset) < 1) continue
    element.animate(
      [{ transform: `translateY(${offset}px)` }, { transform: "none" }],
      SLIDE
    )
  }
}
