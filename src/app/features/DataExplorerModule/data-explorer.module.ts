// data-explorer.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import {RawEventsComponent} from './RawEvents/RawEventsComponent';
import {DailyRollupsComponent} from './DailyRollups/DailyRollupsComponent';

const routes: Routes = [
  { path: '', redirectTo: 'raw-events', pathMatch: 'full' },
  { path: 'raw-events', component: RawEventsComponent },
  { path: 'daily-rollups', component: DailyRollupsComponent },
  { path: '**', redirectTo: 'raw-events' }
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
export class DataExplorerModule { }
