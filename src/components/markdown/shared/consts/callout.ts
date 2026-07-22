import { Node, mergeAttributes } from "@tiptap/core"
import type { Editor } from "@tiptap/core"
import type { Node as ProseMirrorNode } from "@tiptap/pm/model"

// GitHub/Obsidian-style callouts: `> [!warning] Optional title` followed by
// blockquote lines. markdown-it has no notion of this, so `setup()` below
// hooks a core rule that runs right after block parsing (tokens still have
// raw `.content` strings, not yet split into inline children) and strips the
// `[!type] title` marker out of the blockquote's first paragraph, moving it
// onto the blockquote_open token as `data-callout-type`/`data-callout-title`
// attributes instead. `parseHTML` below then reads those attributes back.
const MARKER = /^\[!(\w+)\]([^\n]*)\n?([\s\S]*)$/

type MarkdownItLike = {
    core: {
        ruler: {
            after: (afterName: string, ruleName: string, fn: (state: { tokens: MdToken[] }) => void) => void
        }
    }
    __calloutRuleAdded?: boolean
}

type MdToken = {
    type: string
    tag?: string
    content: string
    attrSet: (name: string, value: string) => void
}

function calloutCoreRule(state: { tokens: MdToken[] }) {
    const tokens = state.tokens
    for (let i = 0; i < tokens.length; i++) {
        const open = tokens[i]
        if (open.type !== "blockquote_open") continue
        const paragraphOpen = tokens[i + 1]
        const inline = tokens[i + 2]
        if (!paragraphOpen || paragraphOpen.type !== "paragraph_open") continue
        if (!inline || inline.type !== "inline") continue

        const match = MARKER.exec(inline.content)
        if (!match) continue

        const [, type, rawTitle, remainder] = match
        open.attrSet("data-callout-type", type.toLowerCase())
        const title = rawTitle.trim()
        if (title) open.attrSet("data-callout-title", title)

        if (remainder.trim()) {
            inline.content = remainder
        } else {
            // The marker was the whole first paragraph: drop it (paragraph_open,
            // inline, paragraph_close) so the callout body starts clean.
            tokens.splice(i + 1, 3)
        }
    }
}

const DEFAULT_LABELS: Record<string, string> = {
    note: "Note",
    tip: "Tip",
    important: "Important",
    warning: "Warning",
    caution: "Caution",
    danger: "Danger",
    success: "Success",
    question: "Question",
    example: "Example",
    abstract: "Abstract",
    quote: "Quote",
    info: "Info",
}

function calloutLabel(type: string): string {
    return DEFAULT_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1)
}

export const Callout = Node.create({
    name: "callout",
    group: "block",
    content: "block+",
    defining: true,

    addAttributes() {
        return {
            type: {
                default: "note",
                parseHTML: (element) => (element.getAttribute("data-callout-type") || "note").toLowerCase(),
                renderHTML: (attributes) => ({ "data-callout-type": attributes.type }),
            },
            title: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-callout-title"),
                renderHTML: (attributes) =>
                    attributes.title ? { "data-callout-title": attributes.title } : {},
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: "blockquote[data-callout-type]",
                priority: 60,
                // Our own renderHTML wraps content in `.mf-callout-body`; markdown-it's
                // output (parsed from `> [!type] title`) is a flat blockquote with no
                // such wrapper. Handle both shapes.
                contentElement: (dom) =>
                    (dom as HTMLElement).querySelector(":scope > .mf-callout-body") || (dom as HTMLElement),
            },
        ]
    },

    renderHTML({ node, HTMLAttributes }) {
        const label = node.attrs.title || calloutLabel(node.attrs.type)
        return [
            "blockquote",
            mergeAttributes(HTMLAttributes, { class: `mf-callout mf-callout-${node.attrs.type}` }),
            ["div", { class: "mf-callout-title", contenteditable: "false" }, label],
            ["div", { class: "mf-callout-body" }, 0],
        ]
    },

    addStorage() {
        return {
            markdown: {
                serialize(
                    this: { editor: Editor },
                    state: {
                        write: (text: string) => void
                        ensureNewLine: () => void
                        closeBlock: (node: ProseMirrorNode) => void
                        renderContent: (node: ProseMirrorNode) => void
                        wrapBlock: (
                            delim: string,
                            firstDelim: string | null,
                            node: ProseMirrorNode,
                            fn: () => void
                        ) => void
                    },
                    node: ProseMirrorNode
                ) {
                    state.wrapBlock("> ", null, node, () => {
                        const marker = `[!${node.attrs.type}]${node.attrs.title ? ` ${node.attrs.title}` : ""}`
                        state.write(marker)
                        state.ensureNewLine()
                        state.renderContent(node)
                    })
                    state.closeBlock(node)
                },
                parse: {
                    setup(md: MarkdownItLike) {
                        if (md.__calloutRuleAdded) return
                        md.__calloutRuleAdded = true
                        md.core.ruler.after("block", "callout", calloutCoreRule)
                    },
                },
            },
        }
    },
})
