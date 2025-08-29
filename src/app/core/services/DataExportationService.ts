import { Injectable } from '@angular/core';

import * as jspdf from 'jspdf';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class DataExportationService {
  time: string;



  constructor(
  ) {
    const date = new Date();
    const dateString = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

    this.time = `${dateString} ${timeString}`;


  }

  /**exports grid entries to xlsx */
  exportDataXlsx(exportArray: any, title: string): void {
    console.log(exportArray);

    exportArray = Array.from(new Set(exportArray));
    let doc = exportArray;
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(doc);
    let dataLength = exportArray.length;
    let wscols = [];
    for (let i = 1; i < (dataLength - 1); i++) {
      wscols.push({wch: 30})
    }
    ws['!cols'] = wscols;
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${title}`);
    XLSX.utils.sheet_add_aoa(ws, [
      [`Download Date: ${this.time}`]
    ], {origin: -1});

    XLSX.writeFile(wb, `${title}_${this.time}.xlsx`);
  }

  /**exports entries to pdf */
  exportToPdf(cols: string[], rows: string[][], title: string): void {
    // Defer heavy PDF generation to allow UI to update and avoid immediate freeze
    // Keep signature synchronous for backward compatibility
    const start = performance.now?.() ?? Date.now();

    // Small async yield to let Angular detect changes/UI update before blocking work
    setTimeout(() => {
      try {
        // Use compression to reduce processing/memory footprint where supported
        const doc = new jspdf.jsPDF({ orientation: 'landscape', compress: true as any });
        doc.text(`${title}`, 14, 30);
        autoTable(doc, {
          head: [cols],
          body: rows,
          styles: { fontSize: 4 },
          didDrawPage: (data: any) => {
            doc.setFontSize(5);
            doc.setTextColor(40);
            doc.text(`Date Downloaded: ${this.time}`, data.settings.margin.left, 5);
          }
        });
        doc.save(title);
      } catch (e) {
        console.error('PDF export failed', e);
      } finally {
        const end = performance.now?.() ?? Date.now();
        console.log(`PDF export scheduled duration: ${Math.round((end - start) as number)} ms`);
      }
    }, 0);
  }

  /**exports entries to csv */
  exportToCsv(rows: Record<string, string>[], title: string) {
    const replacer = (key: any, value: null) => value === null ? '' : value; // specify how you want to handle null values here
    const header = Object.keys(rows[0]);
    let csv = rows.map((row: { [x: string]: any; }) => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    let csvArray = csv.join('\r\n');

    const blob = new Blob([csvArray], {type: 'text/csv'});
    saveAs(blob, `${title}.csv`);
  }
}
