import { useEditor } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Link } from "@tiptap/extension-link"
import { TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import { Markdown } from "tiptap-markdown"
import { useMemo, useEffect, useRef, useCallback } from "react"
import type { ReactNode } from "react"
import type { EditorView } from "@tiptap/pm/view"
import { EditorContext } from "./Context"
import { MARK, LINK_PROTOCOLS } from "../shared/consts/marks"
import { MarkdownImage } from "../shared/consts/image"
import { Table } from "../shared/consts/table"
import { Callout } from "../shared/consts/callout"
import { HeadingAnchors } from "../shared/consts/headingAnchors"
import { WikiLink, scrollToWikiLinkTarget } from "../shared/consts/wikiLink"

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
            Table.configure({ resizable: false, renderWrapper: true }),
            TableRow,
            TableHeader,
            TableCell,
            Callout,
            HeadingAnchors,
            WikiLink,
            Markdown,
        ],
        []
    )

    const handleClick = useCallback((view: EditorView, pos: number) => {
        const wikiLinkMark = view.state.doc
            .resolve(pos)
            .marks()
            .find((m) => m.type.name === MARK.WIKI_LINK)
        if (wikiLinkMark?.attrs.target) {
            return scrollToWikiLinkTarget(view, wikiLinkMark.attrs.target as string)
        }
        return false
    }, [])

    const editor = useEditor({
        extensions,
        editable: false,
        immediatelyRender: false,
        content: value,
        editorProps: {
            handleClick,
        },
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
