import type { Editor } from "@tiptap/core"
import { getPendingImageFiles } from "../../shared/consts/image"

type MarkdownStorage = {
    getMarkdown: () => string
}

export function getMarkdown(editor: Editor): string {
    return (editor.storage as unknown as { markdown: MarkdownStorage }).markdown.getMarkdown()
}

// Builds the exact shape the note API expects: a multipart/form-data body
// with the markdown content as text and every pasted image still waiting to
// be uploaded appended as its raw file bytes (no base64 involved).
export function getNotePayload(editor: Editor): FormData {
    const formData = new FormData()
    formData.append("content", getMarkdown(editor))

    for (const { filename, file } of getPendingImageFiles(editor)) {
        formData.append("files", file, filename)
    }

    return formData
}
