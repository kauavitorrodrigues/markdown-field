import { Extension } from "@tiptap/core"
import { Suggestion } from "@tiptap/suggestion"
import ReactDOM from "react-dom/client"
import { createElement, createRef } from "react"
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion"
import { filterCommands, SLASH_COMMANDS, type SlashCommandItem } from "./commands"
import { SlashCommandList, type SlashCommandListHandle } from "./List"

type SlashStorage = {
    root: ReactDOM.Root | null
    container: HTMLDivElement | null
}

type SlashOptions = {
    items: SlashCommandItem[]
}

export const SlashCommandExtension = Extension.create<SlashOptions, SlashStorage>({
    name: "slashCommand",

    addOptions(): SlashOptions {
        return { items: SLASH_COMMANDS }
    },

    addStorage(): SlashStorage {
        return { root: null, container: null }
    },

    onDestroy() {
        const s = this.storage as SlashStorage
        s.root?.unmount()
        s.container?.remove()
        s.root = null
        s.container = null
    },

    addProseMirrorPlugins() {
        const storage = this.storage as SlashStorage
        const options = this.options as SlashOptions

        return [
            Suggestion<SlashCommandItem>({
                editor: this.editor,
                char: "/",
                allowSpaces: false,
                startOfLine: false,
                allowedPrefixes: [" ", "\n"],
                items({ query }) {
                    return filterCommands(query, options.items)
                },
                render() {
                    const listRef = createRef<SlashCommandListHandle>()
                    let latestProps: SuggestionProps<SlashCommandItem> | null = null

                    function renderList(props: SuggestionProps<SlashCommandItem>) {
                        storage.root?.render(
                            createElement(SlashCommandList, {
                                ref: listRef,
                                items: props.items,
                                editor: props.editor,
                                range: props.range,
                            })
                        )
                    }

                    function updatePosition(props: SuggestionProps<SlashCommandItem>) {
                        const rect = props.clientRect?.()
                        if (rect && storage.container) {
                            storage.container.style.top = `${rect.bottom + 6}px`
                            storage.container.style.left = `${rect.left}px`
                        }
                    }

                    // The menu is positioned in viewport (`fixed`) coordinates
                    // computed from the caret's clientRect, but that rect only
                    // gets recomputed on start/update. Track scrolling on any
                    // ancestor (capture phase) so the menu keeps following the
                    // `/` character instead of staying stuck in place.
                    function onScroll() {
                        if (latestProps) updatePosition(latestProps)
                    }

                    function teardown() {
                        window.removeEventListener("scroll", onScroll, true)
                        storage.root?.unmount()
                        storage.root = null
                        storage.container?.remove()
                    }

                    return {
                        onStart(props: SuggestionProps<SlashCommandItem>) {
                            latestProps = props

                            if (!storage.container) {
                                storage.container = document.createElement("div")
                                storage.container.style.position = "fixed"
                                storage.container.style.zIndex = "9999"
                            }
                            // Always remount so the component is fresh and the enter animation fires
                            storage.root?.unmount()
                            storage.root = ReactDOM.createRoot(storage.container)
                            document.body.appendChild(storage.container)

                            updatePosition(props)
                            renderList(props)

                            window.addEventListener("scroll", onScroll, true)
                        },

                        onUpdate(props: SuggestionProps<SlashCommandItem>) {
                            latestProps = props
                            updatePosition(props)
                            renderList(props)
                        },

                        onKeyDown({ event }: SuggestionKeyDownProps): boolean {
                            if (event.key === "Escape") {
                                teardown()
                                return true
                            }
                            return listRef.current?.onKeyDown(event) ?? false
                        },

                        onExit() {
                            teardown()
                        },
                    }
                },
            }),
        ]
    },
})
