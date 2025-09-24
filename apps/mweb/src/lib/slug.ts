export function toSlug(idOrName: string): string {
  return (idOrName||'')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g,'-')
    .replace(/[\u0600-\u06FF]/g,'')
    .replace(/[^a-z0-9-]/g,'')
}

