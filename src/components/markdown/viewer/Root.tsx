import { useEditor } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Link } from "@tiptap/extension-link"
import { Markdown } from "tiptap-markdown"
import { useMemo, useEffect, useRef } from "react"
import type { ReactNode } from "react"
import { EditorContext } from "./Context"
import { LINK_PROTOCOLS } from "../shared/consts/marks"
import { MarkdownImage } from "../shared/consts/image"

type RootProps = {
    value: string
    children: ReactNode
    className?: string
}

export function Root({ value, children, className }: RootProps) {
    const lastValueRef = useRef<string | null>(null)

    const extensions = useMemo(
        () => [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                codeBlock: false,
                link: false,
            }),
            Link.configure({
                openOnClick: true,
                autolink: true,
                protocols: [...LINK_PROTOCOLS],
            }),
            MarkdownImage,
            Markdown,
        ],
        []
    )

    const editor = useEditor({
        extensions,
        editable: false,
        immediatelyRender: false,
        content: value,
    })

    useEffect(() => {
        if (!editor) return
        if (lastValueRef.current === null) {
            lastValueRef.current = value
            return
        }
        if (value !== lastValueRef.current) {
            lastValueRef.current = value
            editor.commands.setContent(value)
        }
    }, [editor, value])

    const contextValue = useMemo(() => ({ editor }), [editor])

    return (
        <EditorContext.Provider value={contextValue}>
            <div className={className}>{editor ? children : null}</div>
        </EditorContext.Provider>
    )
}
