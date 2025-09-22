export async function exportToXlsx(filename: string, headers: (string)[], rows: (string|number)[][]): Promise<void> {
  const XLSX = await import('xlsx');
  const sheetData: (string|number)[][] = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 3000);
}

export async function exportToPdf(filename: string, headers: string[], rows: (string|number)[][]): Promise<void> {
  const jsPDF = (await import('jspdf')).default;
  const autoTable = (await import('jspdf-autotable')).default as any;
  const doc = new jsPDF('l', 'pt');
  autoTable(doc, { head: [headers], body: rows.map(r => r.map(v => String(v ?? ''))) });
  doc.save(filename);
}

