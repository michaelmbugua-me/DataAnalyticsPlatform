import {Component, OnInit, signal, Signal} from '@angular/core';
import {TableModule} from 'primeng/table';

import {ProgressSpinner} from 'primeng/progressspinner';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {Select} from 'primeng/select';
import {AgGridAngular} from 'ag-grid-angular';
import {ColDef, GridOptions, GridReadyEvent} from 'ag-grid-community';


@Component({
  selector: 'app-analysis-tools',
  templateUrl: './AnalysisToolsComponent.html',
  imports: [
    TableModule,
    ProgressSpinner,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    Select,
    AgGridAngular,
  ],
  providers: [],
  styleUrls: ['./AnalysisToolsComponent.scss']
})
export class AnalysisToolsComponent implements OnInit {

  filters!: Filter[];

  selectedFilter!: Filter;

  visible = signal(false);

  columnDefs: ColDef[] = [
    {field: 'id', headerName: 'ID', filter: 'agTextColumnFilter'},
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      filter: 'agDateColumnFilter',
      valueFormatter: params => new Date(params.value).toLocaleString()
    },
    {field: 'day', headerName: 'Day', filter: 'agNumberColumnFilter'},
    {field: 'hour', headerName: 'Hour', filter: 'agNumberColumnFilter'},
    {field: 'source', headerName: 'Source', filter: 'agTextColumnFilter'},
    {field: 'event_name', headerName: 'Event Name', filter: 'agTextColumnFilter'},
    {field: 'session_id', headerName: 'Session ID', filter: 'agTextColumnFilter'},
    {field: 'user_pseudo_id', headerName: 'User Pseudo ID', filter: 'agTextColumnFilter'}
  ];

  public defaultColDef: ColDef = {};

  public data = signal<any[]>([]);

  // Grid Options
  public gridOptions: GridOptions = {
    rowModelType: 'clientSide',
    pagination: false,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    animateRows: true,
    sideBar: false,
    suppressMenuHide: true,
    domLayout: 'normal'
  };

  async ngOnInit() {
    const response = await fetch('/data/raw_events.json');
    this.data.set(await response.json());

    this.filters = [
      {name: 'Today\'s records', code: 'NY'},
      {name: 'This weeks\'s records', code: 'RM'},
      {name: 'This month\'s records', code: 'LDN'},
      {name: 'This year\'s records', code: 'IST'}
    ];
  }

  onGridReady(params: GridReadyEvent) {
    console.log('Grid is ready');
    // You can access the grid API here if needed
    // params.api.sizeColumnsToFit();
  }

  toggleFilterVisibility() {
    this.visible.update(v => !v);
  }
}

interface Filter {
  name: string,
  code: string
}
