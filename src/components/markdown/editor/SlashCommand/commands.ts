import {
    Heading1,
    Heading2,
    Heading3,
    Type,
    List,
    ListOrdered,
    Quote,
    Minus,
    Bold,
    Italic,
    Strikethrough,
    Code,
    Image as ImageIcon,
} from "lucide-react"
import type { Editor, Range } from "@tiptap/core"
import type { LucideIcon } from "lucide-react"
import { insertImageFile, openImageFilePicker } from "../../shared/consts/image"

export type SlashCommandItem = {
    title: string
    description: string
    icon: LucideIcon
    group: string
    keywords: string[]
    command: (editor: Editor, range: Range) => void
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
    {
        title: "Título 1",
        description: "Título grande de seção",
        icon: Heading1,
        group: "Títulos",
        keywords: ["titulo", "h1", "heading", "grande"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
    },
    {
        title: "Título 2",
        description: "Título médio de seção",
        icon: Heading2,
        group: "Títulos",
        keywords: ["titulo", "h2", "heading", "medio", "subtitulo"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    },
    {
        title: "Título 3",
        description: "Título pequeno de seção",
        icon: Heading3,
        group: "Títulos",
        keywords: ["titulo", "h3", "heading", "pequeno"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
    },
    {
        title: "Texto normal",
        description: "Parágrafo de texto simples",
        icon: Type,
        group: "Texto",
        keywords: ["paragrafo", "texto", "normal", "simples", "p"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
        title: "Lista com marcadores",
        description: "Lista não ordenada de itens",
        icon: List,
        group: "Listas",
        keywords: ["lista", "marcadores", "bullet", "nao ordenada", "ul"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
        title: "Lista numerada",
        description: "Lista ordenada numericamente",
        icon: ListOrdered,
        group: "Listas",
        keywords: ["lista", "numerada", "ordenada", "ol", "numero"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
        title: "Citação",
        description: "Bloco de citação ou destaque",
        icon: Quote,
        group: "Blocos",
        keywords: ["citacao", "quote", "blockquote", "destaque"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
        title: "Divisor",
        description: "Separador visual entre seções",
        icon: Minus,
        group: "Blocos",
        keywords: ["divisor", "separador", "linha", "hr", "horizontal"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
        title: "Negrito",
        description: "Deixar o texto em negrito",
        icon: Bold,
        group: "Inline",
        keywords: ["negrito", "bold", "strong", "b"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleBold().run(),
    },
    {
        title: "Itálico",
        description: "Deixar o texto em itálico",
        icon: Italic,
        group: "Inline",
        keywords: ["italico", "italic", "em", "enfase", "i"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleItalic().run(),
    },
    {
        title: "Tachado",
        description: "Texto com linha no meio",
        icon: Strikethrough,
        group: "Inline",
        keywords: ["tachado", "strike", "strikethrough", "riscado", "s"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleStrike().run(),
    },
    {
        title: "Código inline",
        description: "Trecho de código dentro do texto",
        icon: Code,
        group: "Inline",
        keywords: ["codigo", "code", "inline", "mono", "snippet"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleCode().run(),
    },
    {
        title: "Imagem",
        description: "Anexar uma imagem do computador",
        icon: ImageIcon,
        group: "Mídia",
        keywords: ["imagem", "foto", "anexar", "upload", "arquivo", "image", "file"],
        command: (editor, range) => {
            editor.chain().focus().deleteRange(range).run()
            openImageFilePicker((file) => insertImageFile(editor, file))
        },
    },
]

export function filterCommands(query: string): SlashCommandItem[] {
    if (!query) return SLASH_COMMANDS

    const q = query.toLowerCase()
    return SLASH_COMMANDS.filter(
        (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.keywords.some((k) => k.includes(q))
    )
}
