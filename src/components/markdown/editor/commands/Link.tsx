import { useContext } from "react"
import { Link as LinkIcon } from "lucide-react"
import { ActiveFlagsContext } from "../Context"
import { LinkPopover } from "../LinkPopover"
import { CommandButton } from "../CommandButton"

export function Link() {
    const { link } = useContext(ActiveFlagsContext)
    return (
        <LinkPopover>
            <CommandButton
                aria-label="Link"
                aria-pressed={link}
                data-active={link}
            >
                <LinkIcon className="size-4" />
            </CommandButton>
        </LinkPopover>
    )
}