# markdown-field

A markdown editor and read-only viewer field for React, built on [Tiptap](https://tiptap.dev). Values in, values out are plain markdown strings — no JSON document shape to store or migrate.

- **Editor**: rich-text editing UI (bubble menu, slash commands, image paste/upload) that emits markdown on every change.
- **Viewer**: read-only rendering of a markdown string, same typography.
- **Markdown surface**: headings, bold/italic/strike, inline code, links, ordered/bullet lists, blockquotes, GitHub/Obsidian-style callouts (`> [!warning] title`), GFM tables (with column alignment and resizable columns in the editor), and images.

## Install

```bash
npm install @kauavitorrodrigues/markdown-field
```

Peer dependencies: `react`, `react-dom` (^19), and `tailwindcss` (^4).

## Usage

```tsx
import { useState } from "react"
import { MarkdownEditor, getNotePayload } from "@kauavitorrodrigues/markdown-field"
import "@kauavitorrodrigues/markdown-field/typeset.css"

function Example() {
    const [value, setValue] = useState("## Hello\n\nStart typing…")

    return (
        <MarkdownEditor.Root value={value} onChange={setValue} placeholder="Write something…">
            <MarkdownEditor.Content />
            <MarkdownEditor.LinkBubble />
            <MarkdownEditor.Bubble>
                <MarkdownEditor.Bold />
                <MarkdownEditor.Italic />
                <MarkdownEditor.Strike />
                <MarkdownEditor.Link />
            </MarkdownEditor.Bubble>
        </MarkdownEditor.Root>
    )
}
```

Read-only rendering:

```tsx
import { MarkdownViewer } from "@kauavitorrodrigues/markdown-field"

function Example({ value }: { value: string }) {
    return (
        <MarkdownViewer.Root value={value}>
            <MarkdownViewer.Content />
        </MarkdownViewer.Root>
    )
}
```

Submitting with pending image uploads (pasted/dropped images are held as blob URLs until you submit):

```tsx
const formData = getNotePayload(editor) // FormData: "content" (markdown) + "files" (File[])
```

## `MarkdownEditor.Root` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Markdown content. |
| `onChange` | `(value: string) => void` | — | Called with the new markdown on every edit. |
| `placeholder` | `string` | — | Empty-state placeholder text. |
| `images` | `boolean` | `true` | Enables clipboard image paste and the "Imagem" slash command. |
| `ref` | `Ref<Editor \| null>` | — | Exposes the underlying Tiptap `Editor` instance. |

## `MarkdownViewer.Root` props

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` | Markdown content to render, read-only. |

## License

[MIT](./LICENSE)
