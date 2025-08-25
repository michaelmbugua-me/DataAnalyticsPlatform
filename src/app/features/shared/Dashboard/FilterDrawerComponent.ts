import {Component, EventEmitter, inject, Input, Output, WritableSignal} from '@angular/core';
import {Drawer} from 'primeng/drawer';
import {DatePicker} from 'primeng/datepicker';
import {FormsModule} from '@angular/forms';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {DataService} from '../../../core/services/DataService';

@Component({
  selector: 'app-filter-drawer',
  templateUrl: './FilterDrawerComponent.html',
  imports: [
    Drawer,
    DatePicker,
    FormsModule,
    ButtonLabel,
    ButtonIcon,
    ButtonDirective
  ],
  styleUrls: ['./FilterDrawerComponent.scss']
})
export class FilterDrawerComponent {

  private dataService: DataService = inject(DataService);


  @Input() startDate!: any;
  @Input() endDate!: any;
  @Input() visible!: WritableSignal<boolean>;

  @Output() filterApplied = new EventEmitter<unknown>();
  @Output() visibleChange = new EventEmitter<WritableSignal<boolean>>();


  applyFilter(start: string, end: string) {

    let from = new Date(start);
    let to = new Date(end);

    this.dataService.setDateRange({ from, to });
  }

}
