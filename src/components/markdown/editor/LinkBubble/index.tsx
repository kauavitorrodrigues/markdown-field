import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import type { KeyboardEvent } from "react"
import { getMarkRange } from "@tiptap/core"
import { computePosition, flip, offset, shift } from "@floating-ui/dom"
import { animate } from "motion"
import { ExternalLink, Trash2 } from "lucide-react"
import { useEditorContext, usePortalContainer } from "../Context"
import { MARK } from "../../shared/consts/marks"
import { BubbleIconButton } from "../BubbleIconButton"

export function LinkBubble() {
    const { editor } = useEditorContext()
    const portalContainer = usePortalContainer()
    const bubbleRef = useRef<HTMLDivElement>(null)
    const anchorElRef = useRef<HTMLAnchorElement | null>(null)
    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const visibleRef = useRef(false)
    const [visible, setVisible] = useState(false)
    const [pos, setPos] = useState({ top: -9999, left: -9999 })
    const [url, setUrl] = useState("")

    function showBubble() {
        // Only reset/re-animate opacity on the hidden -> visible transition.
        // Hovering straight from one anchor to another (bubble already
        // visible) must just reposition it - forcing opacity back to 0 here
        // left it stuck invisible, because the entrance animation below only
        // re-runs when `visible` itself flips (it was already `true`).
        if (visibleRef.current) return
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
            // This bubble edits `MARK.LINK` specifically (free-form URL, open,
            // remove) - none of that applies to wikilink anchors, so skip them.
            if (!anchor || anchor.hasAttribute("data-wikilink-target")) return

            cancelHide()

            if (anchor === anchorElRef.current) return

            anchorElRef.current = anchor
            setUrl(anchor.getAttribute("href") ?? "")
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

    // Positioned via floating-ui (not a plain viewport-relative rect) so this
    // stays correctly anchored even inside a transformed ancestor (e.g. a
    // centered Radix Dialog), which breaks naive `position: fixed` math.
    useLayoutEffect(() => {
        if (!visible || !anchorElRef.current || !bubbleRef.current) return
        let cancelled = false
        computePosition(anchorElRef.current, bubbleRef.current, {
            strategy: "fixed",
            placement: "bottom-start",
            middleware: [offset(6), flip(), shift({ padding: 8 })],
        }).then(({ x, y }) => {
            if (!cancelled) setPos({ top: y, left: x })
        })
        return () => {
            cancelled = true
        }
    }, [visible, url])

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
        e.preventDefault()
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

    if (!visible || !portalContainer) return null

    return createPortal(
        <div
            ref={bubbleRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 2147483647 }}
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
            <BubbleIconButton onClick={openLink} label="Abrir link">
                <ExternalLink className="size-3.5" />
            </BubbleIconButton>
            <BubbleIconButton onClick={removeLink} label="Remover link" danger>
                <Trash2 className="size-3.5" />
            </BubbleIconButton>
        </div>,
        portalContainer
    )
}
