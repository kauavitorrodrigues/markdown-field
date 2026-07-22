import { useContext } from "react"
import { Quote as QuoteIcon } from "lucide-react"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { CommandButton } from "../CommandButton"

export function Quote() {
    const { editor } = useEditorContext()
    const { blockquote } = useContext(ActiveFlagsContext)
    return (
        <CommandButton
            aria-label="Citação"
            aria-pressed={blockquote}
            data-active={blockquote}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
            <QuoteIcon className="size-4" />
        </CommandButton>
    )
}
