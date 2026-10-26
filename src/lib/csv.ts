/**
 * Utilitas ekspor data ke format CSV sisi klien (Browser Blob)
 * Memenuhi seluruh aturan keamanan dan format:
 * 1. BOM UTF-8 (\uFEFF) untuk kompatibilitas Microsoft Excel
 * 2. Pemisah koma, escape tanda kutip
 * 3. Sanitasi CSV Injection (karakter =, +, -, @ diawali dengan petik tunggal ')
 * 4. Header berbahasa Indonesia
 * 5. Nama file otomatis yang deskriptif
 */

export function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value).trim();

  // Cegah Formula Injection (CSV Injection)
  // Jika nilai diawali dengan karakter berpotensi formula Excel: = + - @ \t \r
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // Escape tanda kutip ganda dengan menggandakannya (" -> "")
  const escaped = str.replace(/"/g, '""');

  // Bungkus dalam tanda kutip
  return `"${escaped}"`;
}

export function generateCsvContent(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(h => sanitizeCsvCell(h)).join(',');
  const rowLines = rows.map(row => row.map(cell => sanitizeCsvCell(cell)).join(','));

  // Tambahkan BOM UTF-8 (\uFEFF) di awal konten
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
