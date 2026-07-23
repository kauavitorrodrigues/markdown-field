import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { getMarkRange } from "@tiptap/core"
import { animate } from "motion"
import { ArrowRight, Trash2 } from "lucide-react"
import { useEditorContext } from "../Context"
import { MARK } from "../../shared/consts/marks"
import { getDocumentHeadings } from "../../shared/consts/headingAnchors"
import { scrollToWikiLinkTarget } from "../../shared/consts/wikiLink"
import { BubbleIconButton } from "../BubbleIconButton"

// Hover bubble for `[[#Heading|Text]]` anchors (mirrors LinkBubble's
// structure/hover mechanics). Retargeting is a dropdown over the document's
// actual headings rather than free text - unlike a URL, a wikilink target
// that doesn't match a real heading is just a dead link, so there's no
// freeform input to type a broken one into.
export function WikiLinkBubble() {
    const { editor } = useEditorContext()
    const bubbleRef = useRef<HTMLDivElement>(null)
    const anchorElRef = useRef<HTMLAnchorElement | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const visibleRef = useRef(false)
    const [visible, setVisible] = useState(false)
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const [target, setTarget] = useState("")

    function showBubble() {
        if (visibleRef.current) return
        if (bubbleRef.current) bubbleRef.current.style.opacity = "0"
        visibleRef.current = true
        setVisible(true)
    }

    function hideBubble() {
        visibleRef.current = false
        setVisible(false)
    }

    const getWikiLinkRange = useCallback(() => {
        const anchor = anchorElRef.current
        if (!anchor) return null
        try {
            const child = anchor.firstChild ?? anchor
            const pmPos = editor.view.posAtDOM(child, 0)
            const $pos = editor.state.doc.resolve(pmPos)
            return getMarkRange($pos, editor.schema.marks[MARK.WIKI_LINK])
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
            if (!anchor || !anchor.hasAttribute("data-wikilink-target")) return

            cancelHide()

            if (anchor === anchorElRef.current) return

            anchorElRef.current = anchor
            setTarget(anchor.getAttribute("data-wikilink-target") ?? "")
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

    const headings = visible ? getDocumentHeadings(editor) : []

    const retarget = useCallback(
        (newTarget: string) => {
            const range = getWikiLinkRange()
            if (!range || !newTarget) return
            const { schema, state } = editor
            editor.view.dispatch(
                state.tr
                    .removeMark(range.from, range.to, schema.marks[MARK.WIKI_LINK])
                    .addMark(range.from, range.to, schema.marks[MARK.WIKI_LINK].create({ target: newTarget }))
            )
            setTarget(newTarget)
        },
        [editor, getWikiLinkRange]
    )

    const removeWikiLink = useCallback(() => {
        const range = getWikiLinkRange()
        if (!range) return
        const { schema, state } = editor
        editor.view.dispatch(state.tr.removeMark(range.from, range.to, schema.marks[MARK.WIKI_LINK]))
        hideBubble()
    }, [editor, getWikiLinkRange])

    const jumpToTarget = useCallback(() => {
        if (target) scrollToWikiLinkTarget(editor.view, target)
    }, [editor, target])

    if (!visible) return null

    const targetIsStale = !headings.includes(target)

    return createPortal(
        <div
            ref={bubbleRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 50 }}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
            className="flex items-center gap-1 rounded-md border bg-popover p-1.5 shadow-sm"
        >
            <select
                value={targetIsStale ? "" : target}
                onChange={(e) => retarget(e.target.value)}
                className="h-7 max-w-52 rounded bg-transparent px-2 text-sm outline-none"
            >
                {targetIsStale && (
                    <option value="" disabled>
                        {target || "(sem título)"} — não encontrado
                    </option>
                )}
                {headings.map((heading) => (
                    <option key={heading} value={heading}>
                        {heading}
                    </option>
                ))}
            </select>
            <BubbleIconButton onClick={jumpToTarget} label="Ir para o título">
                <ArrowRight className="size-3.5" />
            </BubbleIconButton>
            <BubbleIconButton onClick={removeWikiLink} label="Remover link" danger>
                <Trash2 className="size-3.5" />
            </BubbleIconButton>
        </div>,
        document.body
    )
}
