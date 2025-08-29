import {ChangeDetectionStrategy, Component, inject, Input, OnInit} from '@angular/core';
import {TableModule} from 'primeng/table';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AllCommunityModule, ModuleRegistry} from 'ag-grid-community';
import {AgGridAngular} from 'ag-grid-angular';
import {ButtonIcon} from 'primeng/button';
import {SplitButton} from 'primeng/splitbutton';
import {MenuItem} from 'primeng/api';
import {DataExportationService} from '../../../../../core/services/DataExportationService';

ModuleRegistry.registerModules([AllCommunityModule]);


@Component({
  selector: 'app-pivot-table-component',
  templateUrl: './pivot-table-component.component.html',
  imports: [TableModule, ReactiveFormsModule, FormsModule, AgGridAngular, ButtonIcon, SplitButton,],
  providers: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./pivot-table-component.component.scss']
})
export class PivotTableComponentComponent implements OnInit {

  dataExportationService = inject(DataExportationService)

  pivotItems: MenuItem[] | undefined;
  @Input() pivotRowData!: any[];
  @Input() pivotColumnDefs!: any[];
  domLayout: 'autoHeight' = 'autoHeight';
  defaultColDef = {sortable: true, filter: true, resizable: true};


  constructor() {
    this.pivotItems = [{
      label: 'Export as PDF', command: () => {
        this.exportPivotTable('pdf');
      }
    }, {
      label: 'Export as Excel', command: () => {
        this.exportPivotTable('xlsx');
      }
    }, {
      label: 'Export as CSV', command: () => {
        this.exportPivotTable('csv');
      }
    }]
  }

  ngOnInit(): void {
  }


  exportPivotTable(type: 'pdf' | 'xlsx' | 'csv' = 'pdf') {
    let cols: string[] = this.pivotColumnDefs.map((item: any) => {
      if (item['headerName'] && String(item['headerName']).toLowerCase() !== 'actions') {
        return String(item['field'] ?? '').toUpperCase();
      } else {
        return ''
      }
    });

    cols = cols.filter(item => item !== '' && item !== undefined);

    const view = this.pivotRowData;

    if (!view || view.length === 0) return;

    const rowKeys: string[] = Object.keys(view[0] as any);

    // rows for PDF/Excel (matrix)
    const matrix: (string | number)[][] = [];
    // rows for CSV/XLSX JSON form
    const jsonRows: Record<string, any>[] = [];

    view.forEach((row: any) => {
      const temp: (string | number)[] = [];
      const jsonRow: Record<string, any> = {};
      cols.forEach(colKey => {
        rowKeys.forEach(key => {
          if (colKey === key.toUpperCase()) {
            temp.push(row[key]);
            jsonRow[key] = row[key];
          }
        })
      })
      matrix.push(temp);
      jsonRows.push(jsonRow);
    })

    if (type === 'pdf') {
      this.dataExportationService.exportToPdf(cols, matrix as string[][], 'Pivot_Table_Data.pdf');
    } else if (type === 'xlsx') {
      this.dataExportationService.exportDataXlsx(jsonRows, 'Pivot_Table_Data');
    } else if (type === 'csv') {
      this.dataExportationService.exportToCsv(jsonRows as any, 'Pivot_Table_Data');
    }
  }


}

