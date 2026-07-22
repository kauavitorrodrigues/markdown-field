import { useContext } from "react"
import { Strikethrough as StrikethroughIcon } from "lucide-react"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { CommandButton } from "../CommandButton"

export function Strike() {
    const { editor } = useEditorContext()
    const { strike } = useContext(ActiveFlagsContext)
    return (
        <CommandButton
            aria-label="Tachado"
            aria-pressed={strike}
            data-active={strike}
            onClick={() => editor.chain().focus().toggleStrike().run()}
        >
            <StrikethroughIcon className="size-4" />
        </CommandButton>
    )
}
