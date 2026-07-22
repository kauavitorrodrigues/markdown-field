import { useContext } from "react"
import { List as ListIcon } from "lucide-react"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { CommandButton } from "../CommandButton"

export function BulletList() {
    const { editor } = useEditorContext()
    const { bulletList } = useContext(ActiveFlagsContext)
    return (
        <CommandButton
            aria-label="Lista com marcadores"
            aria-pressed={bulletList}
            data-active={bulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
            <ListIcon className="size-4" />
        </CommandButton>
    )
}
