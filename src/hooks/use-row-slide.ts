import { useLayoutEffect, useRef, type RefObject } from "react"
import { measureTops, slide } from "../animation/slide"

// After every render, slides rows from where they were on the last one.
// Paused while dragging: the drag library moves rows then.
export function useRowSlide(
  list: RefObject<HTMLElement | null>,
  rows: RefObject<Map<string, HTMLElement>>,
  paused: boolean
) {
  const tops = useRef<Map<string, number> | null>(null)

  useLayoutEffect(() => {
    if (paused || !list.current) return
    tops.current = slide(list.current, rows.current, tops.current)
  })

  // Call right before a change to slide from where rows are on screen now.
  return () => {
    if (list.current) tops.current = measureTops(list.current, rows.current)
  }
}
