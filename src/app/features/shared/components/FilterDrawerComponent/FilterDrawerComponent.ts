import {Component, EventEmitter, inject, Input, OnInit, Output, WritableSignal} from '@angular/core';
import {Drawer} from 'primeng/drawer';
import {DatePicker} from 'primeng/datepicker';
import {FormsModule} from '@angular/forms';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {DataService} from '../../../../core/services/DataService';
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

  // Local date range model for the PrimeNG date picker (range mode)
  dateRange: Date[] | null = null;

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

  // Update global date range when user selects two dates
  onDateRangeChange(range: Date[] | null) {
    this.dateRange = range;
    if (Array.isArray(range) && range.length === 2) {
      const [from, to] = range;
      const d1 = new Date(from);
      const d2 = new Date(to);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        // Normalize to inclusive end-of-day for 'to'
        const fromNorm = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), 0, 0, 0, 0);
        const toNorm = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), 23, 59, 59, 999);
        this.dataService.setDateRange({ from: fromNorm, to: toNorm });
      }
    }
  }

  onApplySelectedConfig(name: string) {
    if (name) this.applySelectedConfig.emit(name);
  }

  ngOnInit() {
    // Initialize local date range from current global range
    const r = this.dataService.dateRange();
    if (r?.from && r?.to) this.dateRange = [r.from, r.to];
  }
}
