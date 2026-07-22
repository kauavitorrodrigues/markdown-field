import { useContext, useState } from "react"
import type { ReactNode, KeyboardEvent } from "react"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Trash2 } from "lucide-react"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { cn } from "@/lib/utils"
import { MARK, LINK_PROTOCOLS } from "../../shared/consts/marks"

type LinkPopoverProps = {
    children: ReactNode
}

export function LinkPopover({ children }: LinkPopoverProps) {
    const { editor } = useEditorContext()
    const isLinkActive = useContext(ActiveFlagsContext).link
    const [url, setUrl] = useState("")
    const [open, setOpen] = useState(false)

    const isValid = url === "" || LINK_PROTOCOLS.some((p) => url.startsWith(`${p}://`))
    const isError = url !== "" && !isValid

    function handleOpenChange(next: boolean) {
        if (next) {
            const href = editor.getAttributes(MARK.LINK).href as string | undefined
            setUrl(href ?? "")
        }
        setOpen(next)
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key !== "Enter") return
        // Always prevent the default here: this input isn't a form submit
        // trigger, it's the confirmation control for the link URL.
        e.preventDefault()
        if (isValid && url !== "") {
            editor.chain().focus().setLink({ href: url }).run()
            setOpen(false)
        }
    }

    function handleRemove() {
        editor.chain().focus().unsetLink().run()
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>{children}</PopoverTrigger>
            <PopoverContent
                className="w-72 p-1"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex items-center gap-1">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Cole o link e pressione Enter…"
                        className={cn(
                            "h-8 min-w-0 flex-1 rounded-md px-3 text-sm outline-none",
                            isError && "text-destructive"
                        )}
                    />
                    {isLinkActive && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            aria-label="Remover link"
                            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                            <Trash2 className="size-3.5" />
                        </button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
