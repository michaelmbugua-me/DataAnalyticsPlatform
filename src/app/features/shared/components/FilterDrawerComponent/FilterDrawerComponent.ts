import {Component, EventEmitter, inject, Input, OnInit, Output, Signal, WritableSignal} from '@angular/core';
import {Drawer} from 'primeng/drawer';
import {DatePicker} from 'primeng/datepicker';
import {FormsModule} from '@angular/forms';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {DataService} from '../../../../core/services/DataService';
import {AutoComplete} from 'primeng/autocomplete';
import {FiltersService} from '../../../../core/services/FiltersService';
import {Select} from 'primeng/select';

@Component({
  selector: 'app-filter-drawer',
  templateUrl: './FilterDrawerComponent.html',
  imports: [
    Drawer,
    DatePicker,
    FormsModule,
    ButtonLabel,
    ButtonIcon,
    ButtonDirective,
    Select
  ],
  styleUrls: ['./FilterDrawerComponent.scss']
})
export class FilterDrawerComponent implements OnInit {

  private dataService: DataService = inject(DataService);
  protected filtersService: FiltersService = inject(FiltersService);

  // date range controlled locally within drawer
  @Input() startDate!: any;
  @Input() endDate!: any;

  // drawer visibility signal from parent
  @Input() visible!: WritableSignal<boolean>;
  @Output() visibleChange = new EventEmitter<WritableSignal<boolean>>();

  // facet selections passed from parent as signals
  @Input() selectedSource!: WritableSignal<string | null>;
  @Input() selectedPlatform!: WritableSignal<string | null>;
  @Input() selectedCountry!: WritableSignal<string | null>;
  @Input() selectedReleaseChannel!: WritableSignal<string | null>;

  // options lists provided by parent (arrays computed from data)
  @Input() sourceOptions!: string[];
  @Input() platformOptions!: string[];
  @Input() countryOptions!: string[];
  @Input() releaseChannelOptions!: string[];

  // saved filter names provided by parent
  @Input() savedConfigNames!: string[] | null;

  // outputs to trigger parent actions
  @Output() applySelectedConfig = new EventEmitter<string>();
  @Output() saveCurrentConfigClick = new EventEmitter<void>();
  @Output() clearAllFiltersClick = new EventEmitter<void>();
  @Output() resetDateRangeToThisMonthClick = new EventEmitter<void>();

  @Input() dataType!: string;

  applyFilter(start: string, end: string) {
    const from = new Date(start);
    const to = new Date(end);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      this.dataService.setDateRange({ from, to });
    }
  }

  onApplySelectedConfig(name: string) {
    if (name) this.applySelectedConfig.emit(name);
  }

  ngOnInit() {
    console.log('sourceOptions')
    console.log(this.sourceOptions)
  }
}
