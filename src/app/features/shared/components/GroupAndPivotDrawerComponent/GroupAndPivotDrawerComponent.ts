import {Component, EventEmitter, inject, Input, Output, WritableSignal} from '@angular/core';
import {Drawer} from 'primeng/drawer';
import {DatePicker} from 'primeng/datepicker';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ButtonDirective, ButtonIcon, ButtonLabel} from 'primeng/button';
import {DataService} from '../../../../core/services/DataService';
import {Select} from 'primeng/select';

@Component({
  selector: 'app-group-and-pivot-drawer',
  templateUrl: './GroupAndPivotDrawerComponent.html',
  imports: [

    FormsModule,
    ReactiveFormsModule,
  ],
  styleUrls: ['./GroupAndPivotDrawerComponent.scss']
})
export class GroupAndPivotDrawerComponent {

  private dataService: DataService = inject(DataService);


  dataGroupForm!: FormGroup;
  pivotTableForm!: FormGroup;

  // Dynamic select options derived from data
  @Input() dimensionOptions: { label: string; value: string }[] = [];
  @Input() measureOptions: { label: string; value: string }[] = [];

  @Input() startDate!: any;
  @Input() endDate!: any;
  @Input() visible!: WritableSignal<boolean>;

  @Output() filterApplied = new EventEmitter<unknown>();
  @Output() visibleChange = new EventEmitter<WritableSignal<boolean>>();
  @Input() dataType!: string;


  constructor(private fb: FormBuilder) {
    this.dataGroupForm = fb.group({
      groupBy: ['country', Validators.required],
      aggregation: ['count', Validators.required],
      measure: ['events_count', Validators.required]
    });

    this.pivotTableForm = fb.group({
      rowDimension: ['platform', Validators.required],
      columnDimension: [''],
      valueMeasure: ['events_count', Validators.required]
    });

  }



  applyFilter(start: string, end: string) {

    let from = new Date(start);
    let to = new Date(end);

    this.dataService.setDateRange({ from, to });
  }

}
