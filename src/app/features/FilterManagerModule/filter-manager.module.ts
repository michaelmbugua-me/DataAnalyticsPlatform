// filter-manager.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import {FilterManagerComponent} from './FilterManager/FilterManagerComponent';

const routes: Routes = [
  { path: '', redirectTo: 'filter-table', pathMatch: 'full' },
  { path: 'filter-table', component: FilterManagerComponent },
  { path: '**', redirectTo: 'filter-table' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class FilterManagerModule { }
