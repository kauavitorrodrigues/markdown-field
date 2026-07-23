import { Extension } from "@tiptap/core"
import type { Editor } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import { slugify } from "./slug"

// The current headings' text, in document order - the valid set of wikilink
// targets. Shared by the "/índice" slash command and `WikiLinkBubble`'s
// retarget dropdown, so both stay in sync with whatever `HeadingAnchors`
// above would assign ids to.
export function getDocumentHeadings(editor: Editor): string[] {
    const headings: string[] = []
    editor.state.doc.descendants((node) => {
        if (node.type.name !== "heading") return
        const text = node.textContent.trim()
        if (text) headings.push(text)
    })
    return headings
}

// Gives every heading a stable `id` so wikilinks (see wikiLink.ts) and the
// `scroll-margin` rule in typeset.css have something to land on. Ids are
// derived from heading text and kept out of the ProseMirror doc/markdown
// entirely — they're pure view decorations, recomputed from scratch on every
// doc change, so duplicate headings (`-1`, `-2`, ...) never drift or get
// persisted as stale attributes.
function headingDecorations(doc: ProseMirrorNode): DecorationSet {
    const seen = new Map<string, number>()
    const decorations: Decoration[] = []

    doc.descendants((node, pos) => {
        if (node.type.name !== "heading") return
        const text = node.textContent.trim()
        if (!text) return

        const base = slugify(text) || "section"
        const occurrence = seen.get(base) ?? 0
        seen.set(base, occurrence + 1)
        const id = occurrence === 0 ? base : `${base}-${occurrence}`

        decorations.push(Decoration.node(pos, pos + node.nodeSize, { id }))
    })

    return DecorationSet.create(doc, decorations)
}

export const HeadingAnchors = Extension.create({
    name: "headingAnchors",

    addProseMirrorPlugins() {
        const key = new PluginKey<DecorationSet>("headingAnchors")
        return [
            new Plugin({
                key,
                state: {
                    init: (_, state) => headingDecorations(state.doc),
                    apply: (tr, decorationSet) => (tr.docChanged ? headingDecorations(tr.doc) : decorationSet),
                },
                props: {
                    decorations(state) {
                        return key.getState(state)
                    },
                },
            }),
        ]
    },
})
