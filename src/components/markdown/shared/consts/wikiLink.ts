import { Mark, mergeAttributes } from "@tiptap/core"
import { slugify } from "./slug"

// Obsidian-style internal anchors: `[[#Heading|Display text]]` (the `|Display
// text` part is optional, falling back to the heading text itself). markdown-it
// has no notion of this syntax, so `setup()` below hooks an inline rule that
// recognizes `[[#...]]` and emits the `<a>` straight away — same output shape
// `renderHTML` below produces, so the DOM parse phase picks it up unchanged via
// `parseHTML`.
const WIKILINK = /^\[\[#([^\]|]+)(?:\|([^\]]+))?\]\]/

type MarkdownItLike = {
    inline: {
        ruler: {
            before: (
                beforeName: string,
                ruleName: string,
                fn: (state: InlineState, silent: boolean) => boolean
            ) => void
        }
    }
    __wikiLinkRuleAdded?: boolean
}

type InlineState = {
    src: string
    pos: number
    push: (type: string, tag: string, nesting: number) => { content: string }
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function renderWikiLink(target: string, label: string): string {
    const slug = slugify(target)
    return `<a class="mf-wikilink" data-wikilink-target="${escapeHtml(target)}" href="#${escapeHtml(slug)}">${escapeHtml(label)}</a>`
}

function wikiLinkInlineRule(state: InlineState, silent: boolean): boolean {
    if (state.src.slice(state.pos, state.pos + 2) !== "[[") return false

    const match = WIKILINK.exec(state.src.slice(state.pos))
    if (!match) return false

    if (!silent) {
        const target = match[1].trim()
        const label = (match[2] ?? match[1]).trim()
        const token = state.push("html_inline", "", 0)
        token.content = renderWikiLink(target, label)
    }

    state.pos += match[0].length
    return true
}

// Shared by the editor's and viewer's click handlers: resolves a wikilink's
// `target` to the heading id `HeadingAnchors` decorated it with (see
// headingAnchors.ts) and scrolls it into view. Returns whether a match was found.
export function scrollToWikiLinkTarget(view: { dom: HTMLElement }, target: string): boolean {
    const slug = slugify(target)
    if (!slug) return false
    const element = view.dom.querySelector(`#${CSS.escape(slug)}`)
    if (!element) return false
    element.scrollIntoView({ behavior: "smooth", block: "start" })
    return true
}

export const WikiLink = Mark.create({
    name: "wikiLink",
    inclusive: false,

    addAttributes() {
        return {
            target: {
                default: null,
                parseHTML: (element) => element.getAttribute("data-wikilink-target"),
                renderHTML: (attributes) => ({ "data-wikilink-target": attributes.target }),
            },
        }
    },

    parseHTML() {
        return [{ tag: "a[data-wikilink-target]" }]
    },

    renderHTML({ HTMLAttributes, mark }) {
        const slug = slugify((mark.attrs.target as string | null) ?? "")
        return ["a", mergeAttributes(HTMLAttributes, { class: "mf-wikilink", href: `#${slug}` }), 0]
    },

    addStorage() {
        return {
            markdown: {
                // Mirrors how `defaultMarkdownSerializer.marks.link` works: `open`/`close`
                // just bracket the mark, the wrapped text itself is written by the
                // normal text-serialization step in between - so the display text
                // (which may differ from the heading target, e.g. shortened link text)
                // always round-trips correctly.
                serialize: {
                    open(_state: unknown, mark: { attrs: { target: string } }) {
                        return `[[#${mark.attrs.target}|`
                    },
                    close() {
                        return `]]`
                    },
                },
                parse: {
                    setup(md: MarkdownItLike) {
                        if (md.__wikiLinkRuleAdded) return
                        md.__wikiLinkRuleAdded = true
                        md.inline.ruler.before("link", "wikiLink", wikiLinkInlineRule)
                    },
                },
            },
        }
    },
})
