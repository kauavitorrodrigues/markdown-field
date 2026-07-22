import { useContext } from "react"
import { Bold as BoldIcon } from "lucide-react"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { CommandButton } from "../CommandButton"

export function Bold() {
    const { editor } = useEditorContext()
    const { bold } = useContext(ActiveFlagsContext)
    return (
        <CommandButton
            aria-label="Negrito"
            aria-pressed={bold}
            data-active={bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
        >
            <BoldIcon className="size-4" />
        </CommandButton>
    )
}
