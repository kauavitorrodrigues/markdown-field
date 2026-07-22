import { EditorContent } from "@tiptap/react"
import { cn } from "@/lib/utils"
import { useEditorContext } from "./Context"

type ContentProps = {
    className?: string
}

const VIEWER_CONTENT_CLASS = cn(
    "typeset typeset-article cursor-default",
    "[&_.ProseMirror]:outline-none",
    "[&_.ProseMirror_img]:block [&_.ProseMirror_img]:mx-auto",
    "[&_.ProseMirror_img[data-align='left']]:mx-0 [&_.ProseMirror_img[data-align='left']]:mr-auto",
    "[&_.ProseMirror_img[data-align='right']]:mx-0 [&_.ProseMirror_img[data-align='right']]:ml-auto"
)

export function Content({ className }: ContentProps) {
    const { editor } = useEditorContext()

    return (
        <div className={className}>
            <EditorContent editor={editor} className={VIEWER_CONTENT_CLASS} />
        </div>
    )
}
