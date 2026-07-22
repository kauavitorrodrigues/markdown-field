import { createContext, useContext } from "react"
import type { Editor } from "@tiptap/core"

export const EditorContext = createContext<{ editor: Editor | null }>({
    editor: null,
})

export function useEditorContext(): { editor: Editor } {
    const { editor } = useContext(EditorContext)
    if (!editor) {
        throw new Error(
            "useEditorContext must be used within MarkdownViewer.Root"
        )
    }
    return { editor }
}
