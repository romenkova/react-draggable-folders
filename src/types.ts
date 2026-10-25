/** The library never reads `data`, it only carries it. */
export type TreeItem<I> = { type: "item"; id: string; data: I }

/** Rendered as `folders` then `items`, each in array order. */
export type TreeFolder<I, F> = {
  type: "folder"
  id: string
  data: F
  folders: TreeFolder<I, F>[]
  items: TreeItem<I>[]
}

/** A root entry. The root mixes folders and items in array order. */
export type TreeNode<I, F> = TreeItem<I> | TreeFolder<I, F>

/** `index` is the insert position in the root array, or in the folder's `folders` or `items`, matching the moved node's type. */
export type DropTarget =
  | { kind: "root"; index: number }
  | { kind: "folder"; folderId: string; index: number }

export interface TreeMove {
  id: string
  target: DropTarget
}

/** How deep items and folders can nest. Depth 0 is the root. */
export interface DepthLimits {
  /** Max item depth. 0 keeps items at the root, 1 allows them in root folders. */
  item: number
  /** Max folder depth, counting its deepest subfolder. 0 keeps folders at the root. */
  folder: number
}

/**
 * `path` holds the folders a row sits in, outermost first, so its length is
 * the row's depth. A folder header is not in its own path.
 */
export type TreeRow<I, F> = { id: string; path: string[] } & (
  | { type: "folder"; folder: TreeFolder<I, F>; collapsed: boolean }
  | { type: "item"; item: TreeItem<I> }
  // Every expanded folder has one, hidden once it holds anything.
  | { type: "empty"; folder: TreeFolder<I, F>; hidden: boolean }
)
