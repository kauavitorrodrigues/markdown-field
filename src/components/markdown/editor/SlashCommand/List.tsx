import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react"
import { animate } from "motion"
import type { Editor, Range } from "@tiptap/core"
import type { SlashCommandItem } from "./commands"

type SlashCommandListProps = {
    items: SlashCommandItem[]
    editor: Editor
    range: Range
}

export type SlashCommandListHandle = {
    onKeyDown: (event: KeyboardEvent) => boolean
}

export const SlashCommandList = forwardRef<
    SlashCommandListHandle,
    SlashCommandListProps
>(function SlashCommandList({ items, editor, range }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const isKeyboardNavRef = useRef(false)

    useEffect(() => {
        if (!containerRef.current) return
        animate(
            containerRef.current,
            { opacity: [0, 1] },
            { duration: 0.15, ease: [0, 0, 0.2, 1] }
        )
    }, [])

    const itemKey = useMemo(() => items.map((i) => i.title).join(","), [items])
    useEffect(() => {
        setSelectedIndex(0)
    }, [itemKey])

    useEffect(() => {
        if (!isKeyboardNavRef.current || !containerRef.current) return
        ;(containerRef.current.children[selectedIndex] as HTMLElement | undefined)
            ?.scrollIntoView({ block: "nearest" })
    }, [selectedIndex])

    useImperativeHandle(ref, () => ({
        onKeyDown(event: KeyboardEvent): boolean {
            if (event.key === "ArrowUp") {
                isKeyboardNavRef.current = true
                setSelectedIndex(
                    (prev) => (prev - 1 + items.length) % items.length
                )
                return true
            }
            if (event.key === "ArrowDown") {
                isKeyboardNavRef.current = true
                setSelectedIndex((prev) => (prev + 1) % items.length)
                return true
            }
            if (event.key === "Enter") {
                const item = items[selectedIndex]
                if (item) {
                    item.command(editor, range)
                }
                return true
            }
            return false
        },
    }), [items, selectedIndex, editor, range])

    if (items.length === 0) {
        return (
            <div
                ref={containerRef}
                className="w-64 max-h-(--mf-slash-max-h) overflow-y-auto rounded-md border bg-popover p-1 shadow-xs"
            >
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    Nenhum resultado
                </p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="w-64 max-h-(--mf-slash-max-h) overflow-y-auto rounded-md border bg-popover p-1 shadow-xs"
        >
            {items.map((item, index) => {
                const isSelected = index === selectedIndex
                const isGroupStart = index > 0 && item.group !== items[index - 1].group
                const Icon = item.icon
                return (
                    <button
                        key={item.title}
                        type="button"
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${isGroupStart ? "mt-1 border-t border-border pt-2" : ""} ${
                            isSelected
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                        onMouseEnter={() => {
                            isKeyboardNavRef.current = false
                            setSelectedIndex(index)
                        }}
                        onClick={() => item.command(editor, range)}
                    >
                        <Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{item.title}</span>
                    </button>
                )
            })}
        </div>
    )
})
