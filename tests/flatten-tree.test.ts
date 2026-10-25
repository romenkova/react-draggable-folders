import { describe, expect, it } from "vitest"
import { flattenTree } from "../src/tree/flatten-tree"
import type { TreeFolder, TreeNode } from "../src/types"

type Node = TreeNode<null, null>
type Folder = TreeFolder<null, null>

const item = (id: string) => ({ type: "item" as const, id, data: null })
const folder = (
  id: string,
  items: string[],
  folders: Folder[] = []
): Folder => ({
  type: "folder",
  id,
  data: null,
  folders,
  items: items.map(item),
})

const tree: Node[] = [
  folder("F", ["f1"], [folder("S", ["s1"])]),
  folder("G", []),
  item("a"),
]

// "id@depth", with empty rows as "F:empty@1" or "F:empty@1 hidden"
const show = (collapsedIds: string[]) =>
  flattenTree(tree, collapsedIds).map((row) => {
    const label = `${row.id}@${row.path.length}`
    return row.type === "empty" && row.hidden ? `${label} hidden` : label
  })

describe("flattenTree", () => {
  it("lists subfolders before items, each folder ending in its empty row", () => {
    expect(show([])).toEqual([
      "F@0",
      "S@1",
      "s1@2",
      "S:empty@2 hidden",
      "f1@1",
      "F:empty@1 hidden",
      "G@0",
      "G:empty@1",
      "a@0",
    ])
  })

  it("leaves out what a collapsed folder holds", () => {
    expect(show(["F"])).toEqual(["F@0", "G@0", "G:empty@1", "a@0"])
  })
})
