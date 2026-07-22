import { Image as BaseImage } from "@tiptap/extension-image"
import type { ImageOptions } from "@tiptap/extension-image"
import type { Editor } from "@tiptap/core"
import { createImageNodeView } from "./ImageNodeView"

export type ImageAlign = "left" | "center" | "right"

type ImageAttrs = {
    src: string
    alt: string | null
    title: string | null
    width: number | string | null
    height: number | string | null
    align: ImageAlign
    localFilename: string | null
}

function escapeAttr(value: string): string {
    return value.replace(/"/g, "&quot;")
}

function serializeImage(
    state: { write: (text: string) => void; closeBlock: (node: unknown) => void; esc: (text: string) => string },
    node: { attrs: ImageAttrs; isBlock: boolean }
) {
    const { src, alt, title, width, height, align, localFilename } = node.attrs
    // A pasted image not uploaded yet is referenced by its local filename
    // instead of its (session-only) blob URL, matching the note API's
    // convention for local image references.
    const reference = localFilename ?? src
    const hasCustomLayout = Boolean(width || height || (align && align !== "center"))

    if (hasCustomLayout) {
        const attrs = [
            `src="${escapeAttr(reference)}"`,
            alt ? `alt="${escapeAttr(alt)}"` : null,
            title ? `title="${escapeAttr(title)}"` : null,
            width ? `width="${width}"` : null,
            height ? `height="${height}"` : null,
            align && align !== "center" ? `data-align="${align}"` : null,
        ]
            .filter(Boolean)
            .join(" ")
        state.write(`<img ${attrs} />`)
    } else {
        const titlePart = title ? ` "${title.replace(/"/g, '\\"')}"` : ""
        state.write(`![${state.esc(alt ?? "")}](${reference.replace(/[()]/g, "\\$&")}${titlePart})`)
    }

    if (node.isBlock) state.closeBlock(node)
}

export type PendingNoteFile = {
    filename: string
    file: File
}

function localImageFilename(file: File): string {
    const extensionFromName = file.name.includes(".") ? file.name.split(".").pop() : null
    const extension = extensionFromName || file.type.split("/").pop() || "png"
    return `pasted-${crypto.randomUUID()}.${extension}`
}

// Shared by paste and the "Imagem" slash command: renders the file from a
// local blob URL and tags it with a local filename instead of uploading
// right away, matching `getPendingImageFiles`/`resolveUploadedImage` above.
export function insertImageFile(editor: Editor, file: File) {
    const localFilename = localImageFilename(file)
    const objectUrl = URL.createObjectURL(file)
    const { view } = editor
    const node = view.state.schema.nodes.image.create({ src: objectUrl, localFilename })
    view.dispatch(view.state.tr.replaceSelectionWith(node))
    editor.storage.image.pendingFiles.set(localFilename, file)
}

// Opens a native file picker restricted to images and invokes `onFile` with
// the chosen file. Must be called synchronously from a user gesture (click
// or keydown handler) for browsers to allow the dialog to open.
export function openImageFilePicker(onFile: (file: File) => void) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.style.display = "none"
    input.addEventListener("change", () => {
        const file = input.files?.[0]
        if (file) onFile(file)
        input.remove()
    })
    document.body.appendChild(input)
    input.click()
}

type MarkdownImageStorage = {
    pendingFiles: Map<string, File>
}

// @tiptap/extension-image ships no `Storage` augmentation of its own, so
// `editor.storage.image` is untyped unless we declare it ourselves here.
declare module "@tiptap/core" {
    interface Storage {
        image: MarkdownImageStorage
    }
}

// Collects every pasted image still waiting to be uploaded, keyed by the
// local filename written into the markdown. The consuming app reads this at
// submit time to build the `files` side of the note payload.
export function getPendingImageFiles(editor: Editor): PendingNoteFile[] {
    const storage = editor.storage.image
    if (!storage) return []
    return [...storage.pendingFiles].map(([filename, file]) => ({ filename, file }))
}

// Swaps a local reference for its real, uploaded URL across the whole doc
// (there's normally just one match) and forgets the pending file. Called
// once the note has actually been saved and the backend returns the final
// URL for that filename.
export function resolveUploadedImage(editor: Editor, filename: string, url: string) {
    const storage = editor.storage.image
    const { view } = editor
    let tr = view.state.tr

    view.state.doc.descendants((node, pos) => {
        if (node.type.name !== "image") return
        if ((node.attrs as ImageAttrs).localFilename !== filename) return
        tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: url, localFilename: null })
    })

    if (tr.docChanged) view.dispatch(tr)
    storage?.pendingFiles.delete(filename)
}

type MarkdownImageOptions = ImageOptions & {
    // Only the editor field needs hover/drag controls. The read-only viewer
    // renders a plain `<img>` and lets CSS handle sizing/alignment.
    interactive: boolean
    minWidth: number
}

export const MarkdownImage = BaseImage.extend<MarkdownImageOptions>({
    addOptions() {
        // `this.parent?.()` always resolves at runtime (BaseImage always
        // defines addOptions), but the optional call makes TS infer the
        // spread ImageOptions fields as optional, assert the real shape.
        return {
            ...this.parent?.(),
            interactive: false,
            minWidth: 80,
        } as MarkdownImageOptions
    },
    addAttributes() {
        return {
            ...this.parent?.(),
            align: {
                default: "center",
                parseHTML: (element) => (element.getAttribute("data-align") as ImageAlign | null) ?? "center",
                renderHTML: (attributes) => {
                    const align = attributes.align as ImageAlign
                    return align && align !== "center" ? { "data-align": align } : {}
                },
            },
            // Transient, never rendered to HTML: only `serializeImage` reads
            // it, to write the local reference instead of the blob URL.
            localFilename: { default: null, rendered: false },
        }
    },
    addNodeView() {
        if (!this.options.interactive) return null
        return createImageNodeView(this.options.minWidth)
    },
    addStorage() {
        return {
            pendingFiles: new Map<string, File>(),
            markdown: {
                serialize: serializeImage,
                parse: {
                    // handled by markdown-it (both `![alt](src)` and raw `<img>` tags)
                },
            },
        }
    },
})
