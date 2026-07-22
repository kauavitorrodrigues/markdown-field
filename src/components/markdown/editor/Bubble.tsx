import { BubbleMenu } from "@tiptap/react/menus"
import { useRef, useCallback, useState } from "react"
import type { ReactNode } from "react"
import { animate } from "motion"
import { NodeSelection } from "@tiptap/pm/state"
import type { EditorState } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import { ActiveFlagsContext, useEditorActiveFlags, useEditorContext } from "./Context"

type BubbleProps = {
    children: ReactNode
}

export function Bubble({ children }: BubbleProps) {
    const { editor } = useEditorContext()
    const innerRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const flags = useEditorActiveFlags(isOpen)

    const onShow = useCallback(() => {
        setIsOpen(true)
        if (!innerRef.current) return
        animate(innerRef.current, { opacity: [0, 1], y: [6, 0] }, { duration: 0.12, ease: [0.16, 1, 0.3, 1] })
    }, [])

    const onHide = useCallback(() => {
        setIsOpen(false)
    }, [])

    // Hide for node selections (e.g. a selected image): the text-formatting
    // buttons in this menu don't apply to non-text nodes.
    const shouldShow = useCallback(
        ({ view, state, from, to }: { view: EditorView; state: EditorState; from: number; to: number }) => {
            const { doc, selection } = state
            if (selection instanceof NodeSelection) return false
            if (selection.empty || !doc.textBetween(from, to).length) return false
            return view.hasFocus()
        },
        []
    )

    return (
        <BubbleMenu
            editor={editor}
            updateDelay={50}
            shouldShow={shouldShow}
            options={{ placement: "top", onShow, onHide }}
        >
            <ActiveFlagsContext.Provider value={flags}>
                <div
                    ref={innerRef}
                    className="flex gap-0.5 rounded-md border bg-popover p-1 shadow-xs"
                >
                    {children}
                </div>
            </ActiveFlagsContext.Provider>
        </BubbleMenu>
    )
}
