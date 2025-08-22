import {Component, OnInit, Signal} from '@angular/core';
import {AgGridAngular} from 'ag-grid-angular';
import {ColDef, GridOptions, GridReadyEvent} from 'ag-grid-community';
import {Drawer} from 'primeng/drawer';
import {Button, ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {Listbox} from 'primeng/listbox';
import {FormsModule} from '@angular/forms';



@Component({
  selector: 'app-data-explorer',
  templateUrl: './DataExplorerComponent.html',
  imports: [
    AgGridAngular,
    Drawer,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel,
    Listbox,
    FormsModule,
    Button
  ],
  providers: [],
  styleUrls: ['./DataExplorerComponent.scss']
})
export class DataExplorerComponent implements OnInit {

  filters!: Filter[];

  selectedFilter!: Filter;


  visible: boolean = false;

  columnDefs: ColDef[] = [
    {field: 'id', headerName: 'ID', filter: 'agTextColumnFilter'},
    {field: 'timestamp', headerName: 'Timestamp', filter: 'agDateColumnFilter', valueFormatter: params => new Date(params.value).toLocaleString()},
    {field: 'day', headerName: 'Day', filter: 'agNumberColumnFilter'},
    {field: 'hour', headerName: 'Hour', filter: 'agNumberColumnFilter'},
    {field: 'source', headerName: 'Source', filter: 'agTextColumnFilter'},
    {field: 'event_name', headerName: 'Event Name', filter: 'agTextColumnFilter'},
    {field: 'session_id', headerName: 'Session ID', filter: 'agTextColumnFilter'},
    {field: 'user_pseudo_id', headerName: 'User Pseudo ID', filter: 'agTextColumnFilter'}
  ];

  public defaultColDef: ColDef = {
    // ... same default column definitions
  };

  paginationPageSizeSelector = [5, 10, 20, 50, 100];
  paginationPageSize = 10;

  rowData: any = [];
  public data: any[] = [];

  // Grid Options
  public gridOptions: GridOptions = {
    rowModelType: 'clientSide',
    pagination: true,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    animateRows: true,
    sideBar: false,
    suppressMenuHide: true,
    domLayout: 'normal'
  };

  async ngOnInit() {
    const response = await fetch('/data/raw_events.json');
    this.data = await response.json();

    this.filters = [
      { name: 'Today\'s records' , code: 'NY' },
      { name: 'This weeks\'s records', code: 'RM' },
      { name: 'This month\'s records', code: 'LDN' },
      { name: 'This year\'s records', code: 'IST' }
    ];
  }

  onGridReady(params: GridReadyEvent) {
    console.log('Grid is ready');
    // You can access the grid API here if needed
    // params.api.sizeColumnsToFit();
  }

  toggleFilterVisibility() {
    this.visible = !this.visible;
  }
}

interface Filter {
  name: string,
  code: string
}
