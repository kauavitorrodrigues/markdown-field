import { useEditor } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { Link } from "@tiptap/extension-link"
import { Placeholder } from "@tiptap/extension-placeholder"
import { TableRow, TableHeader, TableCell } from "@tiptap/extension-table"
import { Markdown } from "tiptap-markdown"
import { useMemo, useEffect, useCallback, useRef, useImperativeHandle } from "react"
import type { ReactNode, Ref } from "react"
import type { Editor } from "@tiptap/core"
import type { EditorView } from "@tiptap/pm/view"
import { EditorContext } from "./Context"
import { MARK, LINK_PROTOCOLS } from "../shared/consts/marks"
import { MarkdownImage, insertImageFile } from "../shared/consts/image"
import { Table } from "../shared/consts/table"
import { getMarkdown } from "./consts/notePayload"
import { SlashCommandExtension, SLASH_COMMANDS } from "./SlashCommand"

type RootProps = {
    value: string
    onChange: (value: string) => void
    children: ReactNode
    placeholder?: string
    className?: string
    // Enables image support: pasting from the clipboard and the "Imagem"
    // slash command. Off by default keeps text-only flows free of the
    // image node, its toolbar entry, and the upload plumbing entirely.
    images?: boolean
    // Exposes the underlying Tiptap editor, e.g. to build a save payload
    // with `getNotePayload(editorRef.current)` (a FormData) on submit.
    ref?: Ref<Editor | null>
}

export function Root({
    value,
    onChange,
    children,
    placeholder,
    className,
    images = true,
    ref,
}: RootProps) {
    // Tracks the last markdown string emitted by the editor so we can
    // distinguish our own onChange echoes from genuine external value changes.
    const lastInternalValueRef = useRef<string | null>(null)
    const editorRef = useRef<Editor | null>(null)

    const onUpdate = useCallback(
        ({ editor }: { editor: Editor }) => {
            const markdown = getMarkdown(editor)
            if (markdown === lastInternalValueRef.current) return
            lastInternalValueRef.current = markdown
            onChange(markdown)
        },
        [onChange]
    )

    const placeholderRef = useRef(placeholder)
    useEffect(() => {
        placeholderRef.current = placeholder
    })

    const getPlaceholder = useCallback(() => placeholderRef.current ?? "", [])

    const extensions = useMemo(
        () => [
            StarterKit.configure({ heading: { levels: [1, 2, 3] }, codeBlock: false, link: false }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
                protocols: [...LINK_PROTOCOLS],
            }),
            ...(images
                ? [MarkdownImage.configure({ interactive: true, minWidth: 80, allowBase64: true })]
                : []),
            Table.configure({ resizable: true, renderWrapper: true }),
            TableRow,
            TableHeader,
            TableCell,
            Markdown,
            // eslint-disable-next-line react-hooks/refs -- getPlaceholder is called by Tiptap outside of render, not during useMemo execution
            Placeholder.configure({ placeholder: getPlaceholder }),
            SlashCommandExtension.configure({
                items: images ? SLASH_COMMANDS : SLASH_COMMANDS.filter((item) => item.id !== "image"),
            }),
        ],
        [getPlaceholder, images]
    )

    const handleClick = useCallback(
        (view: EditorView, pos: number, event: MouseEvent) => {
            if (event.ctrlKey || event.metaKey) {
                const marks = view.state.doc.resolve(pos).marks()
                const linkMark = marks.find((m) => m.type.name === MARK.LINK)
                if (linkMark?.attrs.href) {
                    window.open(
                        linkMark.attrs.href as string,
                        "_blank",
                        "noopener,noreferrer"
                    )
                    return true
                }
            }
            return false
        },
        []
    )

    // Paste an image straight from the clipboard (e.g. a screenshot): render
    // it from a local blob URL and tag it with a local filename instead of
    // uploading right away. The note only gets uploaded, alongside its
    // content, when the app actually submits it as multipart form data
    // (see `getNotePayload`).
    const handlePaste = useCallback(
        (_view: EditorView, event: ClipboardEvent) => {
            if (!images) return false

            const imageFile = Array.from(event.clipboardData?.files ?? []).find((file) =>
                file.type.startsWith("image/")
            )
            if (!imageFile) return false

            event.preventDefault()

            if (editorRef.current) insertImageFile(editorRef.current, imageFile)

            return true
        },
        [images]
    )

    const editor = useEditor({
        extensions,
        immediatelyRender: false,
        onUpdate,
        editorProps: {
            handleClick,
            handlePaste,
        },
    })

    useEffect(() => {
        editorRef.current = editor
    }, [editor])

    useImperativeHandle<Editor | null, Editor | null>(ref, () => editor, [editor])

    useEffect(() => {
        if (!editor) return
        // First mount: initialize and record the value so future echoes are skipped.
        if (lastInternalValueRef.current === null) {
            lastInternalValueRef.current = value
            editor.commands.setContent(value)
            return
        }
        // External change (e.g. "Load large document"): value differs from what we last emitted.
        if (value !== lastInternalValueRef.current) {
            lastInternalValueRef.current = value
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
