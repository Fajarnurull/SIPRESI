import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  period: string;
  printedBy: string;
  role: string;
  headers: string[];
  data: (string | number)[][];
  summaryText?: string;
}

export function generatePdfReport(options: PdfReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // 1. KOP SURAT RESMI
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('PEMERINTAH KABUPATEN BANJARNEGARA', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA', pageWidth / 2, 19, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(11, 31, 74); // #0B1F4A
  doc.text('SMP NEGERI 2 WANADADI', pageWidth / 2, 26, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Alamat: Jl. Raya Wanadadi - Tapen No. 12, Kec. Wanadadi, Kab. Banjarnegara 53461', pageWidth / 2, 31, { align: 'center' });

  // Garis Pembatas Kop Ganda
  doc.setDrawColor(11, 31, 74);
  doc.setLineWidth(0.8);
  doc.line(14, 34, pageWidth - 14, 34);
  doc.setLineWidth(0.2);
  doc.line(14, 35.2, pageWidth - 14, 35.2);

  // 2. JUDUL LAPORAN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 31, 74);
  doc.text(options.title.toUpperCase(), pageWidth / 2, 43, { align: 'center' });

  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(options.subtitle, pageWidth / 2, 48, { align: 'center' });
  }

  // 3. METADATA LAPORAN
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const metaStartY = options.subtitle ? 54 : 50;
  doc.text(`Periode: ${options.period}`, 14, metaStartY);
  doc.text(`Tanggal Cetak: ${currentDate}`, 14, metaStartY + 4.5);
  doc.text(`Pencetak: ${options.printedBy} (${options.role})`, pageWidth - 14, metaStartY, { align: 'right' });
  doc.text(`Sistem: SIPRESI v1.0 DSS`, pageWidth - 14, metaStartY + 4.5, { align: 'right' });

  let tableStartY = metaStartY + 8;

  // Catatan ringkasan jika ada
  if (options.summaryText) {
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(options.summaryText, 14, tableStartY);
    tableStartY += 5;
  }

  // 4. TABEL DATA
  autoTable(doc, {
    startY: tableStartY,
    head: [options.headers],
    body: options.data,
    margin: { left: 14, right: 14, bottom: 25 },
    theme: 'striped',
    headStyles: {
      fillColor: [11, 31, 74], // #0B1F4A
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 32 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 14 }
    },
    didDrawPage: (data) => {
      // Footer Nomor Halaman
      const pageStr = `Halaman ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(pageStr, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      doc.text('SIPRESI · SMP Negeri 2 Wanadadi · Dokumen Resmi Rahasia', 14, doc.internal.pageSize.getHeight() - 10);
    }
  });

  // 5. TANDA TANGAN DI HALAMAN TERAKHIR
  // @ts-expect-error autoTable adds lastAutoTable to doc
  const finalY = doc.lastAutoTable?.finalY || 160;
  const pageHeight = doc.internal.pageSize.getHeight();

  // Jika sisa halaman tidak cukup untuk tanda tangan (butuh ~45mm), tambahkan halaman baru
  let signY = finalY + 12;
  if (signY + 45 > pageHeight - 15) {
    doc.addPage();
    signY = 25;
  }

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  // Kolom tanda tangan kanan (Kepala Sekolah / Guru BK)
  const signColX = pageWidth - 65;
  doc.text('Wanadadi, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), signColX, signY);
  doc.text('Mengetahui / Penanggung Jawab,', signColX, signY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(options.role.includes('Kepala') ? 'Kepala SMP Negeri 2 Wanadadi' : 'Koordinator BK & DSS', signColX, signY + 9);

  // Ruang tanda tangan
  doc.setFont('helvetica', 'normal');
  doc.text(options.printedBy, signColX, signY + 32);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NIP. ........................................', signColX, signY + 36);

  // Simpan file
  const sanitizedTitle = options.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  doc.save(`${sanitizedTitle}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
