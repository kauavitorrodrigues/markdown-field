import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

type Props = ComponentProps<typeof Button>

export function CommandButton({ className, type = "button", ...props }: Props) {
    return (
        <Button
            type={type}
            variant="ghost"
            size="icon"
            className={cn(
                "size-7 data-[active=true]:bg-accent transition-colors duration-100 active:scale-[0.82]",
                className
            )}
            {...props}
        />
    )
}
