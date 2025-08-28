import {Component, inject, OnInit, computed, Signal, ChangeDetectionStrategy} from '@angular/core';
import {AgGridAngular} from 'ag-grid-angular';
import {ColDef, GridOptions, GridReadyEvent} from 'ag-grid-community';
import {FormsModule} from '@angular/forms';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {FiltersService, FilterConfig} from '../../../core/services/FiltersService';


ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-filter-manager-component',
  templateUrl: './FilterManagerComponent.html',
  imports: [
    AgGridAngular,
    FormsModule,
  ],
  providers: [],
  styleUrls: ['./FilterManagerComponent.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterManagerComponent implements OnInit {

  private filtersService = inject(FiltersService);

  public data: Signal<FilterConfig[]> = computed(() => (this.filtersService.savedConfigs() || []));

  columnDefs: ColDef<FilterConfig>[] = [
    { field: 'name', headerName: 'Name', filter: 'agTextColumnFilter', minWidth: 200 },
    { field: 'searchText', headerName: 'Search Text', filter: 'agTextColumnFilter', minWidth: 200 },
    { field: 'query', headerName: 'Custom Query', filter: 'agTextColumnFilter', minWidth: 240 },
    {
      headerName: 'From',
      valueGetter: params => params.data?.dateRange?.from || '-',
      minWidth: 160,
      sortable: true,
      filter: 'agDateColumnFilter'
    },
    {
      headerName: 'To',
      valueGetter: params => params.data?.dateRange?.to || '-',
      minWidth: 160,
      sortable: true,
      filter: 'agDateColumnFilter'
    },
    {
      headerName: 'Actions',
      colId: 'actions',
      minWidth: 100,
      maxWidth: 100,
      pinned: 'right',
      suppressMovable: true,
      cellRenderer: (params: { data: { name: string; }; }) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-danger btn-sm float-right';
        btn.title = 'Delete configuration';
        btn.innerText = 'Delete';
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (params.data?.name) {
            this.deleteConfig(params.data.name);
          }
        });
        return btn;
      }
    }
  ];

  public defaultColDef: ColDef<FilterConfig> = {
    sortable: true,
    resizable: true,
    filter: true
  };

  public gridOptions: GridOptions<FilterConfig> = {
    rowModelType: 'clientSide',
    pagination: true,
    paginationPageSize: 100,
    enableCellTextSelection: true,
    ensureDomOrder: true,
    animateRows: true,
    suppressMenuHide: true,
    domLayout: 'normal'
  };

  ngOnInit() {
    // Console to verify localStorage-loaded configs
    console.log('Saved filter configs', this.data());
  }

  onGridReady(params: GridReadyEvent<FilterConfig>) {
    params.api.sizeColumnsToFit();
  }

  deleteConfig(name: string) {
    this.filtersService.deleteConfig(name);
  }
}
