import { Routes } from '@angular/router';
import {LoginComponent} from './features/Access/Login/LoginComponent';
import {DashboardComponent} from './features/Dashboard/DashboardComponent';
import {BaseComponent} from './layout/base/BaseComponent';
import {VisualizationsComponent} from './features/Visualizations/VisualizationsComponent';
import {AnalysisToolsComponent} from './features/AnalysisTools/AnalysisToolsComponent';
import {DataExplorerModule} from './features/DataExplorerModule/data-explorer.module';

export const routes: Routes = [

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: BaseComponent,
    children: [
      {path: 'dashboard', component: DashboardComponent},
      {
        path: 'data-explorer',
        loadChildren: () => DataExplorerModule,
      },
      {path: 'visualization', component: VisualizationsComponent},
      {path: 'analysis-tools', component: AnalysisToolsComponent},
    ]
  }
];
