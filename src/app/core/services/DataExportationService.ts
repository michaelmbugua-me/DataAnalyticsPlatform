import { Injectable } from '@angular/core';

import * as jspdf from 'jspdf';
import * as XLSX from 'xlsx';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class DataExportationService {
  generatedPdfBlob: Blob | undefined;
  public CSV_EXTENSION: any = '.csv';
  public CSV_TYPE: any = 'text/plain;charset=utf-8';
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
    console.log("cols: ", cols);
    console.log("rows: ", rows);

    let doc = new jspdf.jsPDF({ orientation: 'landscape' });
    doc.text(`${title}`, 14, 30);
    autoTable(doc, {head: [cols], body: rows, styles: {fontSize: 4}, didDrawPage: (data: any) => {
        doc.setFontSize(5);
        doc.setTextColor(40);
        doc.text(`Date Downloaded: ${this.time}`, data.settings.margin.left, 5);
      } });
    doc.save(title);
  }


  exportToExcelsend(cols: string[], rows: string[][], title: string): Blob {
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([cols, ...rows]);

    XLSX.utils.book_append_sheet(workbook, worksheet, title);

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    return excelBlob;
  }




  /**exports entries to csv */
  private saveAsFile(buffer: any, fileName: string, fileType: string): void {
    const data: Blob = new Blob([buffer], { type: fileType });
    saveAs(data, fileName);
  }

  exportToCsv(rows: Record<string, string>[], title: string) {
    const replacer = (key: any, value: null) => value === null ? '' : value; // specify how you want to handle null values here
    const header = Object.keys(rows[0]);
    let csv = rows.map((row: { [x: string]: any; }) => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    let csvArray = csv.join('\r\n');

    var blob = new Blob([csvArray], {type: 'text/csv' })
    saveAs(blob, `${title}.csv`);
  }


  exportTwoTablesToPdf(cols1: string[], rows1: string[][], title1: string, cols2: string[], rows2: string[][], title2: string): void {
    const doc = new jspdf.jsPDF();

    // Export Table 1
    doc.text(`${title1}`, 14, 20);
    autoTable(doc, { head: [cols1], body: rows1, startY: 30, styles: { fontSize: 8 } });

    const table1Height = 100; // Adjust this value based on your table's estimated height

    // Check if Table 2 can fit below Table 1 on the same page
    const pageHeight = doc.internal.pageSize.height;
    const requiredHeight = table1Height + 30 + (rows2.length * 10);

    if (requiredHeight > pageHeight) {
      doc.addPage();
      doc.text(`${title2}`, 14, 20); // Start Table 2 on a new page
      autoTable(doc, { head: [cols2], body: rows2, startY: 30, styles: { fontSize: 8 } });
    } else {
      doc.text(`${title2}`, 14, table1Height + 40); // Start Table 2 below Table 1 on the same page
      autoTable(doc, { head: [cols2], body: rows2, startY: table1Height + 50, styles: { fontSize: 8 } });
    }

    doc.save(`${title1}_${title2}.pdf`);
  }



//import * as XLSX from 'xlsx';

  exportTwoTablesToExcel(
    exportArray1: any[], title1: string,
    exportArray2: any[], title2: string
  ): void {
    // Create Workbook and Sheets
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const ws1: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportArray1);
    const ws2: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportArray2);

    // Set column widths for Sheet 1
    const ws1cols = [];
    for (let i = 1; i < exportArray1.length; i++) {
      ws1cols.push({ wch: 30 });
    }
    ws1['!cols'] = ws1cols;

    // Add Sheet 1 to the Workbook
    XLSX.utils.book_append_sheet(wb, ws1, title1);

    // Add a blank row between the two tables
    XLSX.utils.sheet_add_aoa(ws1, [[]], { origin: -1 });

    // Add Sheet 2 to the Workbook
    XLSX.utils.book_append_sheet(wb, ws2, title2);

    // Save the Workbook as an Excel file
    XLSX.writeFile(wb, `${title1}_${title2}_${this.time}.xlsx`);
  }



}
