// GitHub-style slug: lowercase, strip anything that isn't a letter/number/space/hyphen
// (accents included, so "Não começar" survives as "não-começar"), then collapse
// whitespace into hyphens. Shared by heading anchors and wikilink targets so both
// sides of `[[#Heading|Text]]` land on the same id.
export function slugify(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-")
}
