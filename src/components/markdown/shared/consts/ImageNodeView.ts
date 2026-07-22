import type { Editor } from "@tiptap/core"
import type { Node as PMNode } from "@tiptap/pm/model"
import type { NodeView } from "@tiptap/pm/view"
import type { ImageAlign } from "./image"

type ImageNodeAttrs = {
    src: string
    alt: string | null
    title: string | null
    width: number | null
    height: number | null
    align: ImageAlign
    localFilename: string | null
}

const ALIGNS: ImageAlign[] = ["left", "center", "right"]

function createAlignIcon(align: ImageAlign): HTMLElement {
    const icon = document.createElement("div")
    icon.className = "mf-image-align-icon"
    icon.dataset.align = align
    ;["100%", "65%", "80%"].forEach((width) => {
        const bar = document.createElement("div")
        bar.className = "mf-image-align-bar"
        bar.style.width = width
        icon.appendChild(bar)
    })
    return icon
}

class ImageNodeView implements NodeView {
    dom: HTMLElement
    private frame: HTMLElement
    private img: HTMLImageElement
    private toolbar: HTMLElement
    private pendingBadge: HTMLElement
    private node: PMNode
    private editor: Editor
    private getPos: () => number | undefined
    private minWidth: number

    constructor(node: PMNode, editor: Editor, getPos: () => number | undefined, minWidth: number) {
        this.node = node
        this.editor = editor
        this.getPos = getPos
        this.minWidth = minWidth

        this.dom = document.createElement("div")
        this.dom.className = "mf-image"

        this.frame = document.createElement("div")
        this.frame.className = "mf-image-frame"
        this.dom.appendChild(this.frame)

        this.img = document.createElement("img")
        this.img.draggable = false
        this.frame.appendChild(this.img)

        this.toolbar = document.createElement("div")
        this.toolbar.className = "mf-image-toolbar"
        ALIGNS.forEach((align) => {
            const btn = document.createElement("button")
            btn.type = "button"
            btn.className = "mf-image-align-btn"
            btn.setAttribute("aria-label", `Alinhar à ${align === "left" ? "esquerda" : align === "right" ? "direita" : "centro"}`)
            btn.appendChild(createAlignIcon(align))
            btn.addEventListener("mousedown", (event) => event.preventDefault())
            btn.addEventListener("click", () => this.setAlign(align))
            this.toolbar.appendChild(btn)
        })
        this.frame.appendChild(this.toolbar)

        const leftHandle = this.createHandle("left")
        const rightHandle = this.createHandle("right")
        this.frame.appendChild(leftHandle)
        this.frame.appendChild(rightHandle)

        this.pendingBadge = document.createElement("div")
        this.pendingBadge.className = "mf-image-pending-badge"
        this.pendingBadge.title = "Imagem será enviada ao salvar"
        this.frame.appendChild(this.pendingBadge)

        this.render()
    }

    private createHandle(side: "left" | "right"): HTMLElement {
        const handle = document.createElement("div")
        handle.className = `mf-image-handle mf-image-handle-${side}`
        handle.addEventListener("mousedown", (event) => this.startResize(event, side))
        return handle
    }

    private render() {
        const { src, alt, title, width, height, align, localFilename } = this.node.attrs as ImageNodeAttrs
        this.img.src = src
        if (alt) this.img.alt = alt
        else this.img.removeAttribute("alt")
        if (title) this.img.title = title
        else this.img.removeAttribute("title")
        this.frame.style.width = width ? `${width}px` : ""
        this.img.style.height = height ? `${height}px` : ""
        this.dom.dataset.align = align ?? "center"
        this.frame.dataset.pending = localFilename ? "true" : "false"
        this.toolbar.querySelectorAll<HTMLButtonElement>(".mf-image-align-btn").forEach((btn) => {
            const icon = btn.firstElementChild as HTMLElement | null
            btn.classList.toggle("is-active", icon?.dataset.align === (align ?? "center"))
        })
    }

    private setAlign(align: ImageAlign) {
        const pos = this.getPos()
        if (pos === undefined) return
        const { view } = this.editor
        view.dispatch(view.state.tr.setNodeMarkup(pos, undefined, { ...this.node.attrs, align }))
    }

    private startResize(event: MouseEvent, side: "left" | "right") {
        event.preventDefault()
        event.stopPropagation()

        const startX = event.clientX
        const startRect = this.frame.getBoundingClientRect()
        const startWidth = startRect.width
        const aspectRatio =
            this.img.naturalWidth && this.img.naturalHeight
                ? this.img.naturalWidth / this.img.naturalHeight
                : startWidth / (startRect.height || startWidth)
        const maxWidth = this.editor.view.dom.getBoundingClientRect().width

        const onMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startX
            const rawWidth = side === "right" ? startWidth + delta : startWidth - delta
            const width = Math.min(maxWidth, Math.max(this.minWidth, rawWidth))
            this.frame.style.width = `${width}px`
            this.img.style.height = `${Math.round(width / aspectRatio)}px`
        }

        const onUp = () => {
            document.removeEventListener("mousemove", onMove)
            document.removeEventListener("mouseup", onUp)
            const finalWidth = Math.round(this.frame.getBoundingClientRect().width)
            const finalHeight = Math.round(finalWidth / aspectRatio)
            const pos = this.getPos()
            if (pos === undefined) return
            const { view } = this.editor
            view.dispatch(
                view.state.tr.setNodeMarkup(pos, undefined, {
                    ...this.node.attrs,
                    width: finalWidth,
                    height: finalHeight,
                })
            )
        }

        document.addEventListener("mousemove", onMove)
        document.addEventListener("mouseup", onUp)
    }

    update(node: PMNode): boolean {
        if (node.type !== this.node.type) return false
        this.node = node
        this.render()
        return true
    }

    // Our own controls (handles, align buttons) manage their own DOM state,
    // so keep ProseMirror from reinterpreting mousedown/click on them as
    // document mutations or selection changes.
    stopEvent(event: Event): boolean {
        return event.target !== this.img
    }

    ignoreMutation(): boolean {
        return true
    }

    destroy() {
        const { src, localFilename } = this.node.attrs as ImageNodeAttrs
        if (localFilename && src.startsWith("blob:")) URL.revokeObjectURL(src)
    }
}

export function createImageNodeView(minWidth: number) {
    return (props: { node: PMNode; editor: Editor; getPos: () => number | undefined }): NodeView =>
        new ImageNodeView(props.node, props.editor, props.getPos, minWidth)
}
