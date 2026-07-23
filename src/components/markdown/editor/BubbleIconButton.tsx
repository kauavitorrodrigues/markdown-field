import { memo } from "react"
import { cn } from "@/lib/utils"

// Small icon-only action button shared by the hover bubbles (LinkBubble,
// WikiLinkBubble): open/jump, remove, etc.
export const BubbleIconButton = memo(function BubbleIconButton({
    onClick,
    label,
    danger,
    children,
}: {
    onClick: () => void
    label: string
    danger?: boolean
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded transition-colors",
                danger
                    ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
        >
            {children}
        </button>
    )
})
