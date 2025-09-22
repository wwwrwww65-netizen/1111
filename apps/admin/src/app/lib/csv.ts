export function toCsv(rows: (string|number)[][]): string {
  return rows
    .map(r => r
      .map(v => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      })
      .join(',')
    )
    .join('\n');
}

export function downloadCsv(filename: string, rows: (string|number)[][]): void {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 3000);
}

