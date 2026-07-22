import { Table as BaseTable } from "@tiptap/extension-table"
import { getHTMLFromFragment } from "@tiptap/core"
import { Fragment } from "@tiptap/pm/model"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"

type MarkdownState = {
    write: (text: string) => void
    ensureNewLine: () => void
    closeBlock: (node: ProseMirrorNode) => void
    renderInline: (node: ProseMirrorNode) => void
}

// tiptap-markdown's bundled default serializer for a "table" node never
// looks at column alignment, so any table with `:---`/`---:`/`:---:`
// column markers silently loses that alignment the moment the editor
// round-trips it back to markdown (e.g. right after the initial
// `setContent`, since that already triggers `onUpdate`). This override
// keeps the same output shape but reads each header cell's `align` attr
// to write the delimiter row correctly.
function alignMarker(align: unknown): string {
    if (align === "center") return ":---:"
    if (align === "right") return "---:"
    if (align === "left") return ":---"
    return "---"
}

// Mirrors tiptap-markdown's own "is this table plain GFM markdown" gate:
// only a table with a single header row (row 0, all `tableHeader`, one
// paragraph per cell, no spans) round-trips cleanly to `| a | b |` syntax.
// Anything fancier (colspan/rowspan/multi-paragraph cells) falls back to
// raw HTML, same as tiptap-markdown does for other unsupported nodes.
function isPlainTable(node: ProseMirrorNode): boolean {
    let plain = true
    node.forEach((row, _offset, rowIndex) => {
        row.forEach((cell) => {
            const isHeaderCell = cell.type.name === "tableHeader"
            const hasSpan = cell.attrs.colspan > 1 || cell.attrs.rowspan > 1
            if (hasSpan || cell.childCount > 1) plain = false
            if (rowIndex === 0 && !isHeaderCell) plain = false
            if (rowIndex > 0 && isHeaderCell) plain = false
        })
    })
    return plain
}

function serializeAsHTML(state: MarkdownState, node: ProseMirrorNode) {
    const html = getHTMLFromFragment(Fragment.from(node), node.type.schema)
    state.write(html)
    state.closeBlock(node)
}

export const Table = BaseTable.extend({
    addStorage() {
        return {
            markdown: {
                serialize(state: MarkdownState, node: ProseMirrorNode) {
                    if (!isPlainTable(node)) {
                        serializeAsHTML(state, node)
                        return
                    }
                    const aligns: string[] = []
                    node.forEach((row, _offset, rowIndex) => {
                        state.write("| ")
                        row.forEach((cell, _cellOffset, cellIndex) => {
                            if (cellIndex) state.write(" | ")
                            const content = cell.firstChild
                            if (content && content.textContent.trim()) state.renderInline(content)
                            if (rowIndex === 0) aligns.push(alignMarker(cell.attrs.align))
                        })
                        state.write(" |")
                        state.ensureNewLine()
                        if (rowIndex === 0) {
                            state.write(`| ${aligns.join(" | ")} |`)
                            state.ensureNewLine()
                        }
                    })
                    state.closeBlock(node)
                },
                parse: {
                    // handled by markdown-it
                },
            },
        }
    },
})
