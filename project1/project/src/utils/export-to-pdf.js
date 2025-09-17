import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportToPDF(data, filename = 'report.pdf') {
  const doc = new jsPDF();
  const headers = [Object.keys(data[0])];
  const rows = data.map(row => Object.values(row));
  doc.autoTable({
    head: headers,
    body: rows,
  });
  doc.save(filename);
}
