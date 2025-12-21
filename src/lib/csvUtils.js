// Utility to export CSV with UTF-8 BOM and proper escaping
// headers: string[] already localized
// rows: any[][]
// filename: string without extension
export function exportToCsv(headers, rows, filename) {
    const escapeCell = (value) => {
      const val = String(value ?? '');
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
        return '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    };
  
    const csvRows = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(','))
      .join('\r\n');
  
    const blob = new Blob(['\ufeff' + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  