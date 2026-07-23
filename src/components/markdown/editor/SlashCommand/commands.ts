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
    TableOfContents,
} from "lucide-react"
import type { Editor, Range } from "@tiptap/core"
import type { LucideIcon } from "lucide-react"
import type { JSONContent } from "@tiptap/core"
import { insertImageFile, openImageFilePicker } from "../../shared/consts/image"
import { getDocumentHeadings } from "../../shared/consts/headingAnchors"

// Walks the current doc for headings and inserts a bullet list of wikilinks
// pointing at each one (`[[#Heading|Heading]]`), i.e. a table of contents
// built from the same anchors `WikiLink`/`HeadingAnchors` already support.
function insertTableOfContents(editor: Editor, range: Range) {
    const headings = getDocumentHeadings(editor)

    const content: JSONContent = headings.length
        ? {
              type: "bulletList",
              content: headings.map((text) => ({
                  type: "listItem",
                  content: [
                      {
                          type: "paragraph",
                          content: [
                              {
                                  type: "text",
                                  text,
                                  marks: [{ type: "wikiLink", attrs: { target: text } }],
                              },
                          ],
                      },
                  ],
              })),
          }
        : {
              type: "paragraph",
              content: [{ type: "text", text: "Nenhum título no documento ainda." }],
          }

    editor.chain().focus().deleteRange(range).insertContent(content).run()
}

export type SlashCommandItem = {
    id: string
    title: string
    description: string
    icon: LucideIcon
    group: string
    keywords: string[]
    command: (editor: Editor, range: Range) => void
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
    {
        id: "heading1",
        title: "Título 1",
        description: "Título grande de seção",
        icon: Heading1,
        group: "Títulos",
        keywords: ["titulo", "h1", "heading", "grande"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
    },
    {
        id: "heading2",
        title: "Título 2",
        description: "Título médio de seção",
        icon: Heading2,
        group: "Títulos",
        keywords: ["titulo", "h2", "heading", "medio", "subtitulo"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    },
    {
        id: "heading3",
        title: "Título 3",
        description: "Título pequeno de seção",
        icon: Heading3,
        group: "Títulos",
        keywords: ["titulo", "h3", "heading", "pequeno"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
    },
    {
        id: "tableOfContents",
        title: "Índice",
        description: "Lista com links para os títulos do documento",
        icon: TableOfContents,
        group: "Títulos",
        keywords: ["indice", "índice", "sumario", "sumário", "toc", "table of contents"],
        command: insertTableOfContents,
    },
    {
        id: "paragraph",
        title: "Texto normal",
        description: "Parágrafo de texto simples",
        icon: Type,
        group: "Texto",
        keywords: ["paragrafo", "texto", "normal", "simples", "p"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
        id: "bulletList",
        title: "Lista com marcadores",
        description: "Lista não ordenada de itens",
        icon: List,
        group: "Listas",
        keywords: ["lista", "marcadores", "bullet", "nao ordenada", "ul"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
        id: "orderedList",
        title: "Lista numerada",
        description: "Lista ordenada numericamente",
        icon: ListOrdered,
        group: "Listas",
        keywords: ["lista", "numerada", "ordenada", "ol", "numero"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
        id: "blockquote",
        title: "Citação",
        description: "Bloco de citação ou destaque",
        icon: Quote,
        group: "Blocos",
        keywords: ["citacao", "quote", "blockquote", "destaque"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
        id: "horizontalRule",
        title: "Divisor",
        description: "Separador visual entre seções",
        icon: Minus,
        group: "Blocos",
        keywords: ["divisor", "separador", "linha", "hr", "horizontal"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
        id: "bold",
        title: "Negrito",
        description: "Deixar o texto em negrito",
        icon: Bold,
        group: "Inline",
        keywords: ["negrito", "bold", "strong", "b"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleBold().run(),
    },
    {
        id: "italic",
        title: "Itálico",
        description: "Deixar o texto em itálico",
        icon: Italic,
        group: "Inline",
        keywords: ["italico", "italic", "em", "enfase", "i"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleItalic().run(),
    },
    {
        id: "strike",
        title: "Tachado",
        description: "Texto com linha no meio",
        icon: Strikethrough,
        group: "Inline",
        keywords: ["tachado", "strike", "strikethrough", "riscado", "s"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleStrike().run(),
    },
    {
        id: "code",
        title: "Código inline",
        description: "Trecho de código dentro do texto",
        icon: Code,
        group: "Inline",
        keywords: ["codigo", "code", "inline", "mono", "snippet"],
        command: (editor, range) =>
            editor.chain().focus().deleteRange(range).toggleCode().run(),
    },
    {
        id: "image",
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

export function filterCommands(query: string, items: SlashCommandItem[] = SLASH_COMMANDS): SlashCommandItem[] {
    if (!query) return items

    const q = query.toLowerCase()
    return items.filter(
        (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.keywords.some((k) => k.includes(q))
    )
}
