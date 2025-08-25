import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import {AnalysisToolsRawComponent} from './AnalysisToolsRaw/analysis-tools-raw.component';
import {AnalysisToolsDailyComponent} from './AnalysisToolsDaily/analysis-tools-daily.component';

const routes: Routes = [
  { path: '', redirectTo: 'raw-events', pathMatch: 'full' },
  { path: 'raw-events', component: AnalysisToolsRawComponent },
  { path: 'daily-rollups', component: AnalysisToolsDailyComponent },
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
export class AnalysisToolsModule { }
