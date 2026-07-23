import { EditorContent } from "@tiptap/react"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useEditorContext } from "./Context"

type ContentProps = {
    className?: string
    // Applied to the writable area itself (`.ProseMirror`), not the wrapper.
    contentClassName?: string
}

const EDITOR_CONTENT_CLASS = cn(
    "typeset typeset-article cursor-text",
    "[&_.ProseMirror]:outline-none",
    "[&_.ProseMirror_a]:cursor-default",
    "[&_.ProseMirror_.is-editor-empty:first-child]:before:pointer-events-none [&_.ProseMirror_.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_.is-editor-empty:first-child]:before:h-0 [&_.ProseMirror_.is-editor-empty:first-child]:before:text-muted-foreground/60 [&_.ProseMirror_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
    "[&_.mf-image]:my-3"
)

export function Content({ className, contentClassName }: ContentProps) {
    const { editor } = useEditorContext()
    const wrapperRef = useRef<HTMLDivElement>(null)
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

    // Toggle data-ctrl attribute while Ctrl/Meta is held so CSS can add underline + pointer to links
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Control" || e.key === "Meta") {
                if (!wrapperRef.current?.hasAttribute("data-ctrl"))
                    wrapperRef.current?.setAttribute("data-ctrl", "")
            }
        }
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Control" || e.key === "Meta")
                wrapperRef.current?.removeAttribute("data-ctrl")
        }
        const onBlur = () => wrapperRef.current?.removeAttribute("data-ctrl")
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)
        window.addEventListener("blur", onBlur)
        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("keyup", onKeyUp)
            window.removeEventListener("blur", onBlur)
        }
    }, [])

    return (
        <div
            ref={wrapperRef}
            className={cn("[&[data-ctrl]_.ProseMirror_a]:cursor-pointer", className)}
        >
            <EditorContent editor={editor} className={EDITOR_CONTENT_CLASS} />
        </div>
    )
}
