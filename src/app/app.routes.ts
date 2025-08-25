import { Routes } from '@angular/router';
import {LoginComponent} from './features/Access/Login/LoginComponent';
import {DashboardComponent} from './features/Dashboard/DashboardComponent';
import {BaseComponent} from './layout/base/BaseComponent';
import {VisualizationsRawDataComponent} from './features/VisualizationsModule/VisualizationsRawData/VisualizationsRawDataComponent';
import {AnalysisToolsComponent} from './features/AnalysisTools/AnalysisToolsComponent';
import {DataExplorerModule} from './features/DataExplorerModule/data-explorer.module';
import {VisualizationsModule} from './features/VisualizationsModule/visualizations.module';

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
        loadChildren: () => DataExplorerModule
      },
      {path: 'visualization',
        loadChildren: () => VisualizationsModule
      },
      {path: 'analysis-tools', component: AnalysisToolsComponent},
    ]
  }
];
