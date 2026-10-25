import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react"
import { flushSync } from "react-dom"
import { flattenTree } from "../tree/flatten-tree"
import type { DepthLimits, TreeFolder, TreeItem, TreeRow } from "../types"
import type { FolderTree } from "../hooks/use-folder-tree"
import { useTreeDrag } from "../hooks/use-tree-drag"

export interface RowState {
  dragging: boolean
}

export interface FolderRowState extends RowState {
  collapsed: boolean
  /** True while the dragged row would drop into this folder. */
  isDropTarget: boolean
}

export interface DraggableFoldersProps<I, F> {
  tree: FolderTree<I, F>
  renderItem: (item: TreeItem<I>, state: RowState) => ReactNode
  renderFolder: (folder: TreeFolder<I, F>, state: FolderRowState) => ReactNode
  /** Rendered inside an expanded folder with no folders or items. */
  renderEmpty?: (folder: TreeFolder<I, F>) => ReactNode
  /** Return true to disable dragging a row, for example while renaming it. */
  isDragDisabled?: (id: string) => boolean
  /** Default: no limits. */
  limits?: DepthLimits
  /** Left margin per depth level, and the pointer distance per level while dragging. Default 16. */
  indentPx?: number
  /** Drop animation duration. Default 150. */
  dropAnimationMs?: number
  /** Set a unique id when there is more than one tree on the page. */
  droppableId?: string
  /** Default `ul` and `li`. Custom ones must accept `ref` and spread the props they get. */
  components?: {
    List?: ComponentType<ComponentProps<"ul">>
    Row?: ComponentType<ComponentProps<"li">>
  }
  /** Applied to the list element. */
  className?: string
}

const NO_LIMITS: DepthLimits = { item: Infinity, folder: Infinity }
const TRANSITION_MS = 150

/** A @hello-pangea/dnd list over `tree`. Row content comes from `renderItem` and `renderFolder`; indentation and nesting are handled here. */
export function DraggableFolders<I, F>({
  tree,
  renderItem,
  renderFolder,
  renderEmpty,
  isDragDisabled,
  limits = NO_LIMITS,
  indentPx = 16,
  dropAnimationMs = TRANSITION_MS,
  droppableId = "react-draggable-folders",
  components,
  className,
}: DraggableFoldersProps<I, F>) {
  const List = components?.List ?? "ul"
  const Row = components?.Row ?? "li"
  const rows = flattenTree(tree.nodes, tree.collapsedIds)
  const {
    draggingFolderId,
    landingFolderId,
    landingDepth,
    vanishOnDrop,
    responders,
    onPointerDown,
    setListElement,
    setRowElement,
    setFolderElement,
  } = useTreeDrag(rows, {
    limits,
    indentPx,
    // Synchronous, or dnd paints the old order for a frame
    onMove: (move) => flushSync(() => tree.move(move)),
  })

  // The dragged row follows the depth it would land at.
  const indent = (row: TreeRow<I, F>, isDragging: boolean): CSSProperties => ({
    marginLeft: (isDragging ? landingDepth : row.path.length) * indentPx,
    transition: isDragging ? `margin-left ${TRANSITION_MS}ms` : undefined,
  })

  const content = (row: TreeRow<I, F>, isDragging: boolean) => {
    if (row.type === "empty") {
      return (
        <div
          style={{
            display: "grid",
            gridTemplateRows: row.hidden ? "0fr" : "1fr",
            transition: `grid-template-rows ${TRANSITION_MS}ms`,
            marginLeft: row.path.length * indentPx,
          }}
        >
          <div style={{ overflow: "hidden" }}>{renderEmpty?.(row.folder)}</div>
        </div>
      )
    }
    if (row.type === "item") {
      return (
        <div style={indent(row, isDragging)}>
          {renderItem(row.item, { dragging: isDragging })}
        </div>
      )
    }
    const { id } = row
    return (
      <div
        style={indent(row, isDragging)}
        ref={(element) => setFolderElement(id, element)}
      >
        {renderFolder(row.folder, {
          dragging: isDragging,
          collapsed: row.collapsed,
          isDropTarget: id === landingFolderId,
        })}
      </div>
    )
  }

  return (
    <DragDropContext {...responders}>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <List
            ref={(element) => {
              provided.innerRef(element)
              setListElement(element)
            }}
            {...provided.droppableProps}
            className={className}
            onPointerDown={onPointerDown}
          >
            {rows.map((row, index) => (
              <Draggable
                key={row.id}
                draggableId={row.id}
                index={index}
                disableInteractiveElementBlocking
                isDragDisabled={
                  row.type === "empty" || (isDragDisabled?.(row.id) ?? false)
                }
              >
                {(dragProvided, snapshot) => {
                  const style: CSSProperties = {
                    ...dragProvided.draggableProps.style,
                  }
                  if (snapshot.isDropAnimating) {
                    // Not `0s`: that never fires `transitionend`
                    style.transitionDuration = `${vanishOnDrop ? 1 : dropAnimationMs}ms`
                    if (vanishOnDrop) style.opacity = 0
                  }
                  if (
                    draggingFolderId !== null &&
                    row.path.includes(draggingFolderId)
                  ) {
                    style.height = 0
                    style.overflow = "hidden"
                  }
                  return (
                    <Row
                      ref={(element) => {
                        dragProvided.innerRef(element)
                        setRowElement(row.id, element)
                      }}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      // The drag handle props set role="button"
                      role="listitem"
                      style={style}
                    >
                      {content(row, snapshot.isDragging)}
                    </Row>
                  )
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  )
}
