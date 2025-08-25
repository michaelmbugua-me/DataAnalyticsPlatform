import {Component, inject, OnInit, signal} from '@angular/core';
import {AgGridAngular} from 'ag-grid-angular';
import {ColDef, GridOptions, GridReadyEvent} from 'ag-grid-community';
import {Drawer} from 'primeng/drawer';
import {Button, ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {Listbox} from 'primeng/listbox';
import {FormsModule} from '@angular/forms';
import {DataService} from '../../../core/services/DataService';


@Component({
  selector: 'app-raw-events-component',
  templateUrl: './RawEventsComponent.html',
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
  styleUrls: ['./RawEventsComponent.scss']
})
export class RawEventsComponent implements OnInit {

  private dataService = inject(DataService);

  public data = this.dataService.data;
  loading = this.dataService.loading;
  error = this.dataService.error;

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

    this.filters = [
      {name: 'Today\'s records', code: 'NY'},
      {name: 'This weeks\'s records', code: 'RM'},
      {name: 'This month\'s records', code: 'LDN'},
      {name: 'This year\'s records', code: 'IST'}
    ];
  }

  onGridReady(params: GridReadyEvent) {
    console.log('Grid is ready');
    params.api.sizeColumnsToFit();
  }

  toggleFilterVisibility() {
    this.visible.update(v => !v);
  }
}

interface Filter {
  name: string,
  code: string
}
