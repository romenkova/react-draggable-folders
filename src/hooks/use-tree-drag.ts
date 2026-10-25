import type {
  BeforeCapture,
  DragStart,
  DragUpdate,
  DropResult,
} from "@hello-pangea/dnd"
import { useEffect, useRef, useState, type PointerEvent } from "react"
import { bounce } from "../animation/bounce"
import { dropTarget } from "../tree/drop-target"
import type { DepthLimits, TreeMove, TreeRow } from "../types"
import { useRowSlide } from "./use-row-slide"

interface Options {
  limits: DepthLimits
  indentPx: number
  onMove: (move: TreeMove) => void
}

export function useTreeDrag<I, F>(rows: TreeRow<I, F>[], options: Options) {
  const { limits, indentPx, onMove } = options
  const listElement = useRef<HTMLElement | null>(null)
  const rowElements = useRef(new Map<string, HTMLElement>())
  // Folder headers, for the bounce
  const folderElements = useRef(new Map<string, HTMLElement>())
  const [drag, setDrag] = useState<DragUpdate | null>(null)
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null)
  const pull = usePull(drag !== null, indentPx)
  const rememberTops = useRowSlide(listElement, rowElements, drag !== null)

  const findRow = (id: string) => rows.find((row) => row.id === id)

  // Where the dragged row would land: the folder it goes in and its depth.
  const findLanding = () => {
    if (!drag) return null
    const dragged = findRow(drag.draggableId)
    if (!dragged) return null
    const move = dropTarget(rows, drag, pull.depth, limits)
    // No move means it lands back where it started.
    if (!move) {
      const folderId = dragged.path.at(-1) ?? null
      return { folderId, depth: dragged.path.length, collapsed: false }
    }
    if (move.target.kind === "root") {
      return { folderId: null, depth: 0, collapsed: false }
    }
    const { folderId } = move.target
    const folder = findRow(folderId)
    return {
      folderId,
      depth: (folder?.path.length ?? 0) + 1,
      collapsed: folder?.type === "folder" && folder.collapsed,
    }
  }
  const landing = findLanding()

  const responders = {
    // Runs before dimensions are captured, so the folder's rows are 0px by then.
    onBeforeCapture: ({ draggableId }: BeforeCapture) => {
      if (findRow(draggableId)?.type === "folder") {
        setDraggingFolderId(draggableId)
      }
    },
    onDragStart: (start: DragStart) => {
      const row = findRow(start.draggableId)
      pull.start(row?.path.length ?? 0)
      setDrag({ ...start, destination: start.source, combine: null })
    },
    onDragUpdate: setDrag,
    onDragEnd: (result: DropResult) => {
      setDrag(null)
      setDraggingFolderId(null)
      const move = dropTarget(rows, result, pull.depth, limits)
      if (!move) return
      const from = findRow(move.id)?.path.at(-1)
      // An item dropped above subfolders goes after them: slide it there.
      rememberTops()
      onMove(move)
      if (move.target.kind === "folder" && move.target.folderId !== from) {
        bounce(folderElements.current.get(move.target.folderId))
      }
    },
  }

  return {
    draggingFolderId,
    landingFolderId: landing?.folderId ?? null,
    landingDepth: landing?.depth ?? 0,
    vanishOnDrop: landing?.collapsed ?? false,
    responders,
    onPointerDown: pull.onPointerDown,
    setListElement: (element: HTMLElement | null) => {
      listElement.current = element
    },
    setRowElement: (id: string, element: HTMLElement | null) =>
      track(rowElements.current, id, element),
    setFolderElement: (id: string, element: HTMLElement | null) =>
      track(folderElements.current, id, element),
  }
}

function track(
  elements: Map<string, HTMLElement>,
  id: string,
  element: HTMLElement | null
) {
  if (element) elements.set(id, element)
  else elements.delete(id)
}

// Each indent the pointer moves right of where the drag started asks for one
// level deeper; left asks for one shallower.
function usePull(active: boolean, indentPx: number) {
  const [depth, setDepth] = useState(0)
  const origin = useRef({ x: 0, indent: 0 })

  useEffect(() => {
    if (!active) return
    const onPointerMove = (event: globalThis.PointerEvent) => {
      const { x, indent } = origin.current
      setDepth(Math.max(0, Math.round((event.clientX - x + indent) / indentPx)))
    }
    window.addEventListener("pointermove", onPointerMove)
    return () => window.removeEventListener("pointermove", onPointerMove)
  }, [active, indentPx])

  return {
    depth,
    onPointerDown: (event: PointerEvent) => {
      origin.current.x = event.clientX
    },
    start: (depth: number) => {
      origin.current.indent = depth * indentPx
      setDepth(depth)
    },
  }
}
