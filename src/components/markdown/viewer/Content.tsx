import { EditorContent } from "@tiptap/react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useEditorContext } from "./Context"

type ContentProps = {
    className?: string
    // Applied to the rendered area itself (`.ProseMirror`), not the wrapper.
    contentClassName?: string
}

const VIEWER_CONTENT_CLASS = cn(
    "typeset typeset-article cursor-default",
    "[&_.ProseMirror]:outline-none",
    "[&_.ProseMirror_img]:block [&_.ProseMirror_img]:mx-auto",
    "[&_.ProseMirror_img[data-align='left']]:mx-0 [&_.ProseMirror_img[data-align='left']]:mr-auto",
    "[&_.ProseMirror_img[data-align='right']]:mx-0 [&_.ProseMirror_img[data-align='right']]:ml-auto"
)

export function Content({ className, contentClassName }: ContentProps) {
    const { editor } = useEditorContext()
    const appliedClassesRef = useRef<string[]>([])

    // `.ProseMirror` is a child tiptap mounts inside EditorContent's own div,
    // so contentClassName can't reach it via props; apply it directly instead.
    useEffect(() => {
        if (!editor) return
        const dom = editor.view.dom
        if (appliedClassesRef.current.length) dom.classList.remove(...appliedClassesRef.current)
        const next = contentClassName?.split(/\s+/).filter(Boolean) ?? []
        if (next.length) dom.classList.add(...next)
        appliedClassesRef.current = next
    }, [editor, contentClassName])

    return (
        <div className={className}>
            <EditorContent editor={editor} className={VIEWER_CONTENT_CLASS} />
        </div>
    )
}
