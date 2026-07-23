import { Extension } from "@tiptap/core"
import { Suggestion } from "@tiptap/suggestion"
import { autoUpdate, computePosition, flip, offset, shift, size } from "@floating-ui/dom"
import type { VirtualElement } from "@floating-ui/dom"
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
    // Container to mount the suggestion list into; defaults to `document.body`.
    getContainer?: () => HTMLElement | null
}

export const SlashCommandExtension = Extension.create<SlashOptions, SlashStorage>({
    name: "slashCommand",

    addOptions(): SlashOptions {
        return { items: SLASH_COMMANDS, getContainer: () => null }
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
        const editorDom = this.editor.view.dom

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
                    let stopAutoUpdate: (() => void) | null = null

                    // Virtual reference tracking the `/` caret; contextElement
                    // lets floating-ui find the right scroll/resize ancestors.
                    const virtualReference: VirtualElement = {
                        getBoundingClientRect: () => latestProps?.clientRect?.() ?? new DOMRect(),
                        contextElement: editorDom,
                    }

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

                    // floating-ui keeps this anchored correctly even when a
                    // transformed ancestor (e.g. a Radix Dialog centered via
                    // translate) creates a new containing block for fixed elements.
                    async function updatePosition() {
                        if (!storage.container) return
                        const { x, y } = await computePosition(virtualReference, storage.container, {
                            strategy: "fixed",
                            placement: "bottom-start",
                            middleware: [
                                offset(6),
                                flip({ fallbackPlacements: ["top-start"] }),
                                shift({ padding: 8 }),
                                size({
                                    padding: 8,
                                    apply({ availableHeight }) {
                                        storage.container?.style.setProperty(
                                            "--mf-slash-max-h",
                                            `${Math.max(160, Math.floor(availableHeight))}px`
                                        )
                                    },
                                }),
                            ],
                        })
                        Object.assign(storage.container.style, {
                            top: `${y}px`,
                            left: `${x}px`,
                            visibility: "visible",
                        })
                    }

                    function teardown() {
                        stopAutoUpdate?.()
                        stopAutoUpdate = null
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
                                storage.container.style.zIndex = "2147483647"
                            }
                            // Hidden until the first computePosition() resolves, so it
                            // never flashes at its unpositioned (0,0) default for a frame.
                            storage.container.style.visibility = "hidden"
                            // Always remount so the component is fresh and the enter animation fires
                            storage.root?.unmount()
                            storage.root = ReactDOM.createRoot(storage.container)
                            ;(options.getContainer?.() ?? document.body).appendChild(storage.container)

                            renderList(props)
                            stopAutoUpdate = autoUpdate(virtualReference, storage.container, updatePosition)
                        },

                        onUpdate(props: SuggestionProps<SlashCommandItem>) {
                            latestProps = props
                            renderList(props)
                            void updatePosition()
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
