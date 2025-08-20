import { Routes } from '@angular/router';
import {LoginComponent} from './features/Access/Login/LoginComponent';
import {DashboardComponent} from './features/Dashboard/DashboardComponent';
import {BaseComponent} from './layout/base/BaseComponent';
import {VisualizationsComponent} from './features/Visualizations/VisualizationsComponent';
import {DataExplorerComponent} from './features/DataExplorer/DataExplorerComponent';

export const routes: Routes = [

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: BaseComponent,
    children: [
      {path: 'dashboard', component: DashboardComponent},
      {path: 'visualization', component: VisualizationsComponent},
      {path: 'data-explorer', component: DataExplorerComponent},
    ]
  }
];
