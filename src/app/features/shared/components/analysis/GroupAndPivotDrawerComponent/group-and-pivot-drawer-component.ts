import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { Select } from 'primeng/select';
import { Drawer } from 'primeng/drawer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis-parameters-drawer',
  templateUrl: './group-and-pivot-drawer-component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Drawer,
    Select,
    ButtonDirective,
    ButtonIcon,
    ButtonLabel
  ],
  standalone: true
})
export class GroupAndPivotDrawerComponent {
  @Input() visible: boolean = false;
  @Input() dimensionOptions: { label: string; value: string }[] = [];
  @Input() measureOptions: { label: string; value: string }[] = [];

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() groupSubmit = new EventEmitter<any>();
  @Output() pivotSubmit = new EventEmitter<any>();

  dataGroupForm: FormGroup;
  pivotTableForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.dataGroupForm = this.fb.group({
      groupBy: ['country', Validators.required],
      aggregation: ['count', Validators.required],
      measure: ['count', Validators.required]
    });

    this.pivotTableForm = this.fb.group({
      rowDimension: ['platform', Validators.required],
      columnDimension: [''],
      valueMeasure: ['count', Validators.required]
    });
  }

  get dimensionOptionsNoPlaceholder() {
    return this.dimensionOptions.filter(o => !!o.value);
  }

  onGroupSubmit() {
    if (this.dataGroupForm.invalid) {
      this.dataGroupForm.markAllAsTouched();
      return;
    }
    this.groupSubmit.emit(this.dataGroupForm.value);
  }

  onPivotSubmit() {
    if (this.pivotTableForm.invalid) {
      this.pivotTableForm.markAllAsTouched();
      return;
    }
    this.pivotSubmit.emit(this.pivotTableForm.value);
  }

  onVisibleChange(visible: boolean) {
    this.visibleChange.emit(visible);
  }
}
