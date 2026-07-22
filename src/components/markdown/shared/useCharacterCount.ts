import { useEditorState } from "@tiptap/react"
import type { Editor } from "@tiptap/core"

export function useCharacterCount(editor: Editor | null): number {
    return (
        useEditorState({
            editor,
            selector: ({ editor: e }) => e?.state.doc.textContent.length ?? 0,
        }) ?? 0
    )
}
