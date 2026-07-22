import { useEffect, useRef, useState, useCallback, memo } from "react"
import { createPortal } from "react-dom"
import type { KeyboardEvent } from "react"
import { getMarkRange } from "@tiptap/core"
import { animate } from "motion"
import { ExternalLink, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditorContext } from "../Context"
import { MARK } from "../../shared/consts/marks"

export function LinkBubble() {
    const { editor } = useEditorContext()
    const bubbleRef = useRef<HTMLDivElement>(null)
    const anchorElRef = useRef<HTMLAnchorElement | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const visibleRef = useRef(false)
    const [visible, setVisible] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const [url, setUrl] = useState("")

    function showBubble() {
        if (bubbleRef.current) bubbleRef.current.style.opacity = "0"
        visibleRef.current = true
        setVisible(true)
    }

    function hideBubble() {
        visibleRef.current = false
        setVisible(false)
    }

    const getLinkRange = useCallback(() => {
        const anchor = anchorElRef.current
        if (!anchor) return null
        try {
            const child = anchor.firstChild ?? anchor
            const pmPos = editor.view.posAtDOM(child, 0)
            const $pos = editor.state.doc.resolve(pmPos)
            return getMarkRange($pos, editor.schema.marks[MARK.LINK])
        } catch {
            return null
        }
    }, [editor])

    const scheduleHide = useCallback(() => {
        hideTimer.current = setTimeout(() => hideBubble(), 200)
    }, [])

    const cancelHide = useCallback(() => {
        clearTimeout(hideTimer.current)
    }, [])

    useEffect(() => {
        const dom = editor.view.dom

        const onMouseOver = (e: MouseEvent) => {
            const t = e.target as Element
            const p = t.parentElement
            const g = p?.parentElement
            const anchor = (
                t.tagName === "A" ? t
                : p?.tagName === "A" ? p
                : g?.tagName === "A" ? g
                : null
            ) as HTMLAnchorElement | null
            if (!anchor) return

            cancelHide()

            if (anchor === anchorElRef.current) return

            anchorElRef.current = anchor
            setUrl(anchor.getAttribute("href") ?? "")
            const rect = anchor.getBoundingClientRect()
            setPos({ top: rect.bottom + 6, left: rect.left })
            showBubble()
        }

        const onMouseLeave = (e: MouseEvent) => {
            if (bubbleRef.current?.contains(e.relatedTarget as Node)) return
            scheduleHide()
        }

        dom.addEventListener("mouseover", onMouseOver)
        dom.addEventListener("mouseleave", onMouseLeave)
        return () => {
            dom.removeEventListener("mouseover", onMouseOver)
            dom.removeEventListener("mouseleave", onMouseLeave)
        }
    }, [editor, cancelHide, scheduleHide])

    // Animate entrance whenever bubble becomes visible
    useEffect(() => {
        if (!visible || !bubbleRef.current) return
        animate(
            bubbleRef.current,
            { opacity: [0, 1], y: [6, 0] },
            { duration: 0.18, ease: [0.16, 1, 0.3, 1] }
        )
    }, [visible])

    useEffect(() => {
        if (!visible) return
        const hide = () => hideBubble()
        window.addEventListener("scroll", hide, { capture: true, passive: true })
        return () => window.removeEventListener("scroll", hide, true)
    }, [visible])

    const applyUrl = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== "Enter") return
        const range = getLinkRange()
        if (!range) return
        const { schema, state } = editor
        editor.view.dispatch(
            state.tr
                .removeMark(range.from, range.to, schema.marks[MARK.LINK])
                .addMark(range.from, range.to, schema.marks[MARK.LINK].create({ href: url }))
        )
    }, [editor, getLinkRange, url])

    const removeLink = useCallback(() => {
        const range = getLinkRange()
        if (!range) return
        const { schema, state } = editor
        editor.view.dispatch(state.tr.removeMark(range.from, range.to, schema.marks[MARK.LINK]))
        hideBubble()
    }, [editor, getLinkRange])

    const openLink = useCallback(() => {
        if (url) window.open(url, "_blank", "noopener,noreferrer")
    }, [url])

    if (!visible) return null

    return createPortal(
        <div
            ref={bubbleRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 50 }}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
            className="flex items-center gap-1 rounded-md border bg-popover p-1.5 shadow-sm"
        >
            <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={applyUrl}
                placeholder="https://"
                className="h-7 w-52 rounded px-2 text-sm outline-none"
            />
            <IconButton onClick={openLink} label="Abrir link">
                <ExternalLink className="size-3.5" />
            </IconButton>
            <IconButton onClick={removeLink} label="Remover link" danger>
                <Trash2 className="size-3.5" />
            </IconButton>
        </div>,
        document.body
    )
}

const IconButton = memo(function IconButton({
    onClick,
    label,
    danger,
    children,
}: {
    onClick: () => void
    label: string
    danger?: boolean
    children: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            aria-label={label}
            className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded transition-colors",
                danger
                    ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
        >
            {children}
        </button>
    )
})
