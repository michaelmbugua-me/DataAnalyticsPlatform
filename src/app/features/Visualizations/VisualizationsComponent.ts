import {Component, OnInit} from '@angular/core';
import {AllCommunityModule, ColDef, GridOptions, GridReadyEvent, ModuleRegistry} from 'ag-grid-community';
import {AgGridAngular, AgGridModule} from 'ag-grid-angular';

ModuleRegistry.registerModules([AllCommunityModule]);


@Component({
  selector: 'app-visualizations',
  templateUrl: './VisualizationsComponent.html',
  imports: [AgGridAngular, AgGridModule],
  providers: [],
  styleUrls: ['./VisualizationsComponent.scss']
})

export class VisualizationsComponent implements OnInit {
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
  }

  onGridReady(params: GridReadyEvent) {
    console.log('Grid is ready');
    // You can access the grid API here if needed
    // params.api.sizeColumnsToFit();
  }
}
