import { useMemo, useState } from "react"
import type { Editor } from "@tiptap/core"
import { MarkdownEditor, getNotePayload } from "@/components/markdown/editor"
import { MarkdownViewer } from "@/components/markdown/viewer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const LARGE_DOCUMENT = Array.from(
    { length: 200 },
    (_, i) =>
        `## Section ${i + 1}\n\nThis is **paragraph ${i + 1}** with *italic*, ~~strike~~, and \`inline code\`.\n\nHere is a [link](https://example.com) and some more text to pad the content out to a realistic length.\n\n> Blockquote in section ${i + 1} with important notes.\n\n- Item A\n- Item B\n- Item C\n`
).join("\n")

const INITIAL_VALUE = `# Demonstração do campo

Todos os recursos de markdown suportados pelo editor/viewer, num só documento.

## Índice

- [[#Texto|Texto]]
- [[#Citação|Citação]]
- [[#Tabela|Tabela]]

## Texto

Um parágrafo com **negrito**, *itálico*, ~~riscado~~, \`código inline\` e um [link](https://example.com).

## Listas

### Com marcador

- Primeiro item
- Segundo item
  - Sub-item aninhado
- Terceiro item

### Numerada

1. Levanta o custo de desenvolvimento
2. Empilha as margens obrigatórias
3. Soma os custos fixos

## Citação

> Uma citação simples, sem tipo de callout — vira blockquote comum.

## Callouts

> [!note] Nota
> Callout informativo, com título customizado.

> [!tip]
> Callout de dica, sem título — usa o rótulo padrão do tipo.

> [!warning] Erro mais comum
> Cobrar a hora do projeto inteiro por um preço só.

> [!important] Atenção
> Algo que o leitor não pode deixar passar.

> [!caution] Cuidado
> Uma ação que pode ter consequências.

## Tabela

Com alinhamento por coluna (esquerda, centro, direita):

| Papel | Horas | Custo/hora | Custo |
| --- | :---: | :---: | ---: |
| Front-end | 55 | R$60 | R$3.300 |
| Back-end | 75 | R$50 | R$3.750 |
| **Total** | | | **R$7.050** |

## Imagem

![Diagram de arquitetura](https://images.pexels.com/photos/17345751/pexels-photo-17345751.jpeg)

---

Acima do divisor: tudo que o campo entende nativamente.`

export function App() {
    const [value, setValue] = useState(INITIAL_VALUE)
    const [editor, setEditor] = useState<Editor | null>(null)
    const payloadPreview = useMemo(() => {
        if (!editor) return ""

        const formData = getNotePayload(editor)
        const files = formData
            .getAll("files")
            .filter((entry): entry is File => entry instanceof File)
            .map((file) => `${file.name} (${file.size.toLocaleString()} bytes, ${file.type})`)

        return JSON.stringify(
            {
                content: formData.get("content"),
                files,
            },
            null,
            2
        )
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `value` is a proxy for the editor's content changing, `editor` itself is stable per mount
    }, [value, editor])

    return (
        <div className="min-h-svh bg-background p-8">
            <div className="mx-auto max-w-5xl">
                <Tabs defaultValue="editor">
                    <div className="mb-6 flex items-center justify-between">
                        <TabsList>
                            <TabsTrigger value="editor">Editor</TabsTrigger>
                            <TabsTrigger value="viewer">Viewer</TabsTrigger>
                        </TabsList>
                        <button
                            onClick={() => setValue(LARGE_DOCUMENT)}
                            className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                        >
                            Load ~{Math.round(LARGE_DOCUMENT.length / 1000)}k
                            chars
                        </button>
                    </div>
                    <TabsContent value="editor">
                        <MarkdownEditor.Root
                            ref={setEditor}
                            value={value}
                            onChange={setValue}
                            placeholder="Adicione uma descrição…"
                        >
                            <MarkdownEditor.Content />
                            <MarkdownEditor.LinkBubble />
                            <MarkdownEditor.WikiLinkBubble />
                            <MarkdownEditor.Bubble>
                                <MarkdownEditor.TextStylePicker />
                                <MarkdownEditor.Bold />
                                <MarkdownEditor.Italic />
                                <MarkdownEditor.Strike />
                                <MarkdownEditor.Link />
                                <MarkdownEditor.Quote />
                                <MarkdownEditor.BulletList />
                                <MarkdownEditor.OrderedList />
                                <MarkdownEditor.InlineCode />
                            </MarkdownEditor.Bubble>
                            <MarkdownEditor.CharacterCount className="mt-2" />
                        </MarkdownEditor.Root>
                    </TabsContent>
                    <TabsContent value="viewer">
                        <MarkdownViewer.Root value={value}>
                            <MarkdownViewer.Content />
                        </MarkdownViewer.Root>
                    </TabsContent>
                </Tabs>

                <div className="mt-6">
                    <h2 className="mb-2 text-xs font-medium text-muted-foreground">
                        Payload enviado ao backend
                    </h2>
                    <pre className="max-h-96 overflow-auto rounded-md border bg-muted p-4 text-xs whitespace-pre-wrap">
                        {payloadPreview}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export default App
