import { useContext } from "react"
import { ListOrdered as ListOrderedIcon } from "lucide-react"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { CommandButton } from "../CommandButton"

export function OrderedList() {
    const { editor } = useEditorContext()
    const { orderedList } = useContext(ActiveFlagsContext)
    return (
        <CommandButton
            aria-label="Lista numerada"
            aria-pressed={orderedList}
            data-active={orderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
            <ListOrderedIcon className="size-4" />
        </CommandButton>
    )
}
