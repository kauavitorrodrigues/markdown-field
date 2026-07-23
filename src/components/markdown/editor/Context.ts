import { createContext, useContext } from "react"
import { useEditorState } from "@tiptap/react"
import type { Editor } from "@tiptap/core"
import { MARK } from "../shared/consts/marks"

export const EditorContext = createContext<{
    editor: Editor | null
    portalContainer: HTMLElement | null
}>({
    editor: null,
    portalContainer: null,
})

export function useEditorContext(): { editor: Editor } {
    const { editor } = useContext(EditorContext)
    if (!editor) {
        throw new Error(
            "useEditorContext must be used within MarkdownEditor.Root"
        )
    }
    return { editor }
}

// Bubbles/popovers portal here instead of `document.body` so a foreign
// Radix Dialog/Popover the field is nested in doesn't treat them as an
// outside click and dismiss itself.
export function usePortalContainer(): HTMLElement | null {
    return useContext(EditorContext).portalContainer
}

export function useEditorActiveState(
    markName: string,
    attributes?: Record<string, unknown>
): boolean {
    const { editor } = useContext(EditorContext)

    const isActive = useEditorState({
        editor,
        selector: ({ editor: e }) => {
            if (!e) return false
            return e.isActive(markName, attributes)
        },
    })

    return isActive ?? false
}

export type EditorActiveFlags = {
    bold: boolean
    italic: boolean
    strike: boolean
    code: boolean
    blockquote: boolean
    bulletList: boolean
    orderedList: boolean
    link: boolean
    heading: { level: 1 | 2 | 3 } | false
}

const DEFAULT_FLAGS: EditorActiveFlags = {
    bold: false,
    italic: false,
    strike: false,
    code: false,
    blockquote: false,
    bulletList: false,
    orderedList: false,
    link: false,
    heading: false,
}

function headingEqual(
    a: EditorActiveFlags["heading"],
    b: EditorActiveFlags["heading"]
): boolean {
    if (a === false && b === false) return true
    if (a === false || b === false) return false
    return a.level === b.level
}

function flagsEqual(
    a: EditorActiveFlags | null,
    b: EditorActiveFlags | null
): boolean {
    if (a === b) return true
    if (!a || !b) return false
    return (
        a.bold === b.bold &&
        a.italic === b.italic &&
        a.strike === b.strike &&
        a.code === b.code &&
        a.blockquote === b.blockquote &&
        a.bulletList === b.bulletList &&
        a.orderedList === b.orderedList &&
        a.link === b.link &&
        headingEqual(a.heading, b.heading)
    )
}

export function useEditorActiveFlags(enabled = true): EditorActiveFlags {
    const { editor } = useContext(EditorContext)
    return useEditorState({
        editor: enabled ? editor : null,
        selector: ({ editor: e }) => ({
            bold: e?.isActive(MARK.BOLD) ?? false,
            italic: e?.isActive(MARK.ITALIC) ?? false,
            strike: e?.isActive(MARK.STRIKE) ?? false,
            code: e?.isActive(MARK.CODE) ?? false,
            blockquote: e?.isActive(MARK.BLOCKQUOTE) ?? false,
            bulletList: e?.isActive(MARK.BULLET_LIST) ?? false,
            orderedList: e?.isActive(MARK.ORDERED_LIST) ?? false,
            link: e?.isActive(MARK.LINK) ?? false,
            heading: e?.isActive("heading")
                ? ({ level: (e.getAttributes("heading").level ?? 1) as 1 | 2 | 3 } as const)
                : false,
        }),
        equalityFn: flagsEqual,
    }) ?? DEFAULT_FLAGS
}

export const ActiveFlagsContext = createContext<EditorActiveFlags>(DEFAULT_FLAGS)
