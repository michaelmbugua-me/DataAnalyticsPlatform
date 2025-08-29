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
  selector: 'app-grouped-table-component',
  templateUrl: './grouped-table-component.component.html',
  imports: [TableModule, ReactiveFormsModule, FormsModule, AgGridAngular, ButtonIcon, SplitButton,],
  providers: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./grouped-table-component.component.scss']
})
export class GroupedTableComponentComponent implements OnInit {

  dataExportationService = inject(DataExportationService)

  items: MenuItem[] | undefined;


  @Input() groupRowData!: any[];
  @Input() groupColumnDefs!: any[];
  domLayout: 'autoHeight' = 'autoHeight';
  defaultColDef = {sortable: true, filter: true, resizable: true};


  constructor() {
    this.items = [{
      label: 'Export as PDF', command: () => {
        this.exportGroupedTable('pdf');
      }
    }, {
      label: 'Export as Excel', command: () => {
        this.exportGroupedTable('xlsx');
      }
    }, {
      label: 'Export as CSV', command: () => {
        this.exportGroupedTable('csv');
      }
    }]
  }

  ngOnInit(): void {
  }


  exportGroupedTable(type: 'pdf' | 'xlsx' | 'csv' = 'pdf') {
    // Build column headers and row data from current grid data
    let cols: string[] = this.groupColumnDefs.map((item: any) => {
      if (item['headerName'] && String(item['headerName']).toLowerCase() !== 'actions') {
        return String(item['field'] ?? '').toUpperCase();
      } else {
        return ''
      }
    });

    cols = cols.filter(item => item !== '' && item !== undefined);

    const view = this.groupRowData;
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
      this.dataExportationService.exportToPdf(cols, matrix as string[][], 'Grouped_Table.pdf');
    } else if (type === 'xlsx') {
      this.dataExportationService.exportDataXlsx(jsonRows, 'Grouped_Table');
    } else if (type === 'csv') {
      this.dataExportationService.exportToCsv(jsonRows as any, 'Grouped_Table');
    }
  }


}

