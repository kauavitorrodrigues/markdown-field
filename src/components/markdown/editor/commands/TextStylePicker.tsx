import { useContext, useState } from "react"
import { ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEditorContext, ActiveFlagsContext } from "../Context"
import { cn } from "@/lib/utils"

const STYLES = [
    {
        id: "paragraph",
        label: "Texto normal",
        previewClass: "text-sm font-normal leading-snug",
        command: (editor: ReturnType<typeof useEditorContext>["editor"]) =>
            editor.chain().focus().setParagraph().run(),
    },
    {
        id: "h1",
        label: "Título 1",
        previewClass: "text-2xl font-bold leading-tight",
        command: (editor: ReturnType<typeof useEditorContext>["editor"]) =>
            editor.chain().focus().setHeading({ level: 1 }).run(),
    },
    {
        id: "h2",
        label: "Título 2",
        previewClass: "text-xl font-semibold leading-tight",
        command: (editor: ReturnType<typeof useEditorContext>["editor"]) =>
            editor.chain().focus().setHeading({ level: 2 }).run(),
    },
    {
        id: "h3",
        label: "Título 3",
        previewClass: "text-base font-semibold leading-snug",
        command: (editor: ReturnType<typeof useEditorContext>["editor"]) =>
            editor.chain().focus().setHeading({ level: 3 }).run(),
    },
] as const

export function TextStylePicker() {
    const { editor } = useEditorContext()
    const [open, setOpen] = useState(false)
    const { heading } = useContext(ActiveFlagsContext)
    const activeStyleId = !heading
        ? "paragraph"
        : heading.level === 1
          ? "h1"
          : heading.level === 2
            ? "h2"
            : "h3"

    function handleSelect(style: (typeof STYLES)[number]) {
        style.command(editor)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    aria-label="Estilo de texto"
                    className={cn(
                        "flex h-7 items-center gap-0.5 rounded-md px-1.5 text-sm font-medium transition-colors hover:bg-accent",
                        open && "bg-accent"
                    )}
                >
                    <span className="min-w-[1.75rem] text-center">
                        {activeStyleId === "paragraph"
                            ? "P"
                            : activeStyleId === "h1"
                              ? "H1"
                              : activeStyleId === "h2"
                                ? "H2"
                                : "H3"}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-52 gap-0 p-1 shadow-sm"
                align="start"
                side="bottom"
                onOpenAutoFocus={(e) => {
                    e.preventDefault()
                    const active = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(
                        "[data-active='true']"
                    )
                    ;(active ?? (e.currentTarget as HTMLElement).querySelector("button"))?.focus()
                }}
            >
                {STYLES.map((style, index) => {
                    const isActive = style.id === activeStyleId
                    const prevStyle = index > 0 ? STYLES[index - 1] : null
                    const isGroupStart = index > 0 && prevStyle?.id === "paragraph"
                    return (
                        <button
                            key={style.id}
                            data-active={isActive}
                            onClick={() => handleSelect(style)}
                            className={cn(
                                "flex w-full items-center rounded px-2 py-1.5 text-left transition-colors",
                                isGroupStart && "mt-1 border-t border-border pt-2",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <span className={style.previewClass}>{style.label}</span>
                        </button>
                    )
                })}
            </PopoverContent>
        </Popover>
    )
}
