import { useContext } from "react"
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { CommandButton } from "../CommandButton"

function useSetTableCellAlign() {
    const { editor } = useEditorContext()
    return (align: "left" | "center" | "right") =>
        editor.chain().focus().setCellAttribute("align", align).run()
}

export function TableCellAlignLeft() {
    const setAlign = useSetTableCellAlign()
    const { tableAlign } = useContext(ActiveFlagsContext)
    if (tableAlign === null) return null
    return (
        <CommandButton
            aria-label="Alinhar à esquerda"
            aria-pressed={tableAlign === "left"}
            data-active={tableAlign === "left"}
            onClick={() => setAlign("left")}
        >
            <AlignLeft className="size-4" />
        </CommandButton>
    )
}

export function TableCellAlignCenter() {
    const setAlign = useSetTableCellAlign()
    const { tableAlign } = useContext(ActiveFlagsContext)
    if (tableAlign === null) return null
    return (
        <CommandButton
            aria-label="Centralizar"
            aria-pressed={tableAlign === "center"}
            data-active={tableAlign === "center"}
            onClick={() => setAlign("center")}
        >
            <AlignCenter className="size-4" />
        </CommandButton>
    )
}

export function TableCellAlignRight() {
    const setAlign = useSetTableCellAlign()
    const { tableAlign } = useContext(ActiveFlagsContext)
    if (tableAlign === null) return null
    return (
        <CommandButton
            aria-label="Alinhar à direita"
            aria-pressed={tableAlign === "right"}
            data-active={tableAlign === "right"}
            onClick={() => setAlign("right")}
        >
            <AlignRight className="size-4" />
        </CommandButton>
    )
}
