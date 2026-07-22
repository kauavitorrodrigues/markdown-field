import { cn } from "@/lib/utils"
import { useEditorContext } from "./Context"
import { useCharacterCount } from "../shared/useCharacterCount"

type CharacterCountProps = {
    className?: string
}

export function CharacterCount({ className }: CharacterCountProps) {
    const { editor } = useEditorContext()
    const count = useCharacterCount(editor)

    return (
        <p className={cn("text-xs text-muted-foreground", className)}>
            {count.toLocaleString()} caracteres
        </p>
    )
}
