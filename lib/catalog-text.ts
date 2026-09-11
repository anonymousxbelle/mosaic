export function hasSynopsis(value:string):boolean {
  return !!value.trim() && !/^(?:no (?:synopsis|description)(?: supplied| available)?|(?:synopsis|description) (?:unavailable|not available|not yet loaded))/i.test(value.trim());
}
export function bookSynopsis(raw: string): string {
  if(!hasSynopsis(raw))return '';
  const paragraphs = raw
    .replace(/<br\s*\/?\s*>|<\/p>|<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const kept = paragraphs.filter(
    (p) =>
      !/^([“"‘]|named one of|winner of|coming soon|now a major|praise for|about the author|also (by|available)|more (books|titles)|readers (love|say)|\*?\s*#?\d*\s*(new york times|sunday times|usa today)|an? instant .*bestseller)/i.test(
        p,
      ),
  );
  return (kept.length ? kept : paragraphs).join(' ').slice(0, 1800);
}
const comparable = (s: string) =>
  s
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
export function rankSearch<
  T extends { title: string; creator: string; ratingCount?: number },
>(items: T[], query: string): T[] {
  const q = comparable(query);
  const words = q.split(' ').filter(Boolean);
  const score = (i: T) => {
    const title = comparable(i.title),
      creator = comparable(i.creator);
    return (
      (title === q
        ? 1000
        : title.startsWith(q)
          ? 600
          : title.includes(q)
            ? 400
            : 0) +
      (creator === q ? 300 : creator.includes(q) ? 150 : 0) +
      words.filter((w) => (title + ' ' + creator).split(' ').includes(w))
        .length *
        20
    );
  };
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        score(b.item) - score(a.item) ||
        (b.item.ratingCount || 0) - (a.item.ratingCount || 0) ||
        a.index - b.index,
    )
    .map((x) => x.item);
}
