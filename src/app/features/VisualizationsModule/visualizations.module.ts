// visualizations.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import {VisualizationsRawDataComponent} from './VisualizationsRawData/VisualizationsRawDataComponent';
import {VisualizationsDailyRollupComponent} from './VisualizationsDailyRollup/VisualizationsDailyRollupComponent';


const routes: Routes = [
  { path: '', redirectTo: 'raw-events', pathMatch: 'full' },
  { path: 'raw-events', component: VisualizationsRawDataComponent },
  { path: 'daily-rollups', component: VisualizationsDailyRollupComponent },
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
export class VisualizationsModule { }
