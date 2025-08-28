// filter-manager.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import {FilterManagerComponent} from './FilterManager/FilterManagerComponent';
import {ConfirmationService, MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {ConfirmDialog} from 'primeng/confirmdialog';

const routes: Routes = [
  { path: '', redirectTo: 'filter-table', pathMatch: 'full' },
  { path: 'filter-table', component: FilterManagerComponent },
  { path: '**', redirectTo: 'filter-table' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ConfirmDialog, ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  exports: [
    RouterModule
  ]
})
export class FilterManagerModule { }
