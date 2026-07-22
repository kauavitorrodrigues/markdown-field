import { useContext } from "react"
import { Code as CodeIcon } from "lucide-react"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { CommandButton } from "../CommandButton"

export function InlineCode() {
    const { editor } = useEditorContext()
    const { code } = useContext(ActiveFlagsContext)
    return (
        <CommandButton
            aria-label="Código inline"
            aria-pressed={code}
            data-active={code}
            onClick={() => editor.chain().focus().toggleCode().run()}
        >
            <CodeIcon className="size-4" />
        </CommandButton>
    )
}
