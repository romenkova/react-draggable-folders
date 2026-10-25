# react-draggable-folders

A drag-and-drop folder tree for React.

React 19 · built on [@hello-pangea/dnd](https://github.com/hello-pangea/dnd)

[Live example](https://romenkova.github.io/react-draggable-folders/) · [npm](https://www.npmjs.com/package/react-draggable-folders)

## Install

```sh
npm i react-draggable-folders
pnpm add react-draggable-folders
yarn add react-draggable-folders
bun add react-draggable-folders
```

## Quick start

`useFolderTree` holds the tree, `DraggableFolders` renders it. You pass a render function for folders and one for items.

```tsx
import { DraggableFolders, useFolderTree } from "react-draggable-folders"

function Sidebar({ nodes, save }) {
  const tree = useFolderTree({ nodes, onChange: save })

  return (
    <DraggableFolders
      tree={tree}
      renderItem={(item, { dragging }) => <div>{item.data.title}</div>}
      renderFolder={(folder, { collapsed, isDropTarget }) => (
        <div onClick={() => tree.toggle(folder.id)}>
          {collapsed ? "▸" : "▾"} {folder.data.title}
        </div>
      )}
    />
  )
}
```

## Data shape

`I` and `F` are your own data for items and folders. Ids have to be unique across the whole tree.

```ts
type TreeItem<I> = { type: "item"; id: string; data: I }

type TreeFolder<I, F> = {
  type: "folder"
  id: string
  data: F
  folders: TreeFolder<I, F>[] // always rendered before items
  items: TreeItem<I>[]
}

// The root holds folders and items in any order.
type TreeNode<I, F> = TreeItem<I> | TreeFolder<I, F>
```

## Dragging

Drag a row up or down to reorder it. While dragging, move the pointer right by one indent to put the row into the folder above, or left to take it out of its folder. The folder it will land in gets `isDropTarget`, so you can highlight it.

A folder moves together with everything inside it.

## useFolderTree(options)

Options:

| Name                | Type                      | Description                                                                                                |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `nodes`             | `TreeNode[]`              | The tree. A new array (after a sync or a refetch) replaces local edits, so keep it stable between renders. |
| `collapsedIds`      | `string[]`                | Folders that start collapsed. Read once, on mount.                                                         |
| `onChange`          | `(nodes) => void`         | Called after every edit. Save the tree here.                                                               |
| `onCollapsedChange` | `(id, collapsed) => void` | Called when a folder opens or closes.                                                                      |

What it returns:

| Name           | Type                          | Description                                                                                         |
| -------------- | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `nodes`        | `TreeNode[]`                  | The tree with local edits.                                                                          |
| `collapsedIds` | `string[]`                    | Folders that are collapsed now.                                                                     |
| `move`         | `(move) => void`              | Applies a TreeMove. DraggableFolders calls it on drop.                                              |
| `addFolder`    | `(folder, parentId?) => void` | Adds a folder at the top of the root, or at the top of parentId's subfolders, and opens the parent. |
| `removeFolder` | `(id) => void`                | Deletes a folder. Its contents move up one level.                                                   |
| `updateItem`   | `(id, data) => void`          | Replaces an item's data.                                                                            |
| `updateFolder` | `(id, data) => void`          | Replaces a folder's data.                                                                           |
| `setCollapsed` | `(id, collapsed) => void`     | Opens or closes a folder.                                                                           |
| `toggle`       | `(id) => void`                | Opens a closed folder, closes an open one.                                                          |

## &lt;DraggableFolders&gt;

| Name              | Type                                                           | Description                                                              |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `tree`            | `FolderTree`                                                   | What useFolderTree returns.                                              |
| `renderItem`      | `(item, { dragging }) => ReactNode`                            | Renders an item row.                                                     |
| `renderFolder`    | `(folder, { dragging, collapsed, isDropTarget }) => ReactNode` | Renders a folder row.                                                    |
| `renderEmpty`     | `(folder) => ReactNode`                                        | Shown inside an open folder with nothing in it.                          |
| `isDragDisabled`  | `(id) => boolean`                                              | Stops a row from dragging, for example while it's being renamed.         |
| `limits`          | `DepthLimits`                                                  | How deep items and folders can go. No limit by default.                  |
| `indentPx`        | `number`                                                       | Indent per level, also how far you move the pointer to nest. Default 16. |
| `dropAnimationMs` | `number`                                                       | How long the drop animation takes. Default 150.                          |
| `droppableId`     | `string`                                                       | Set it if there's more than one tree on the page.                        |
| `components`      | `{ List?, Row? }`                                              | Your own components instead of the default ul and li.                    |
| `className`       | `string`                                                       | Goes on the list.                                                        |

## Depth limits

`{ item, folder }` sets how deep each can go. Depth 0 is the root, depth 1 is inside a root folder. For example, `{ item: 1, folder: 0 }` gives you folders with items and no subfolders.

## Without the hook

If the tree lives somewhere else, like a store or the server, use the plain functions instead: `moveNode`, `addFolder`, `removeFolder`, `updateItem`, `updateFolder`. Each one returns a new tree and leaves the old one as is.

```ts
import { moveNode, addFolder, removeFolder } from "react-draggable-folders"

const next = moveNode(nodes, {
  id: "acme",
  target: { kind: "folder", folderId: "archive", index: 0 },
})
```

## Development

```sh
pnpm dev     # example page with HMR, on localhost:5176
pnpm build   # dist/index.js and type declarations
pnpm test
```
