import { useContext } from "react"
import { Italic as ItalicIcon } from "lucide-react"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { CommandButton } from "../CommandButton"

export function Italic() {
    const { editor } = useEditorContext()
    const { italic } = useContext(ActiveFlagsContext)
    return (
        <CommandButton
            aria-label="Itálico"
            aria-pressed={italic}
            data-active={italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
        >
            <ItalicIcon className="size-4" />
        </CommandButton>
    )
}
