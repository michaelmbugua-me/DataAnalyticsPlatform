import { Routes } from '@angular/router';
import {LoginComponent} from './features/access/Login/LoginComponent';
import {BaseComponent} from './layout/base/BaseComponent';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: BaseComponent,
    children: [
      {
        path: 'data-explorer',
        loadChildren: () => import('./features/DataExplorerModule/data-explorer.module').then(m => m.DataExplorerModule)
      },
      {
        path: 'visualization',
        loadChildren: () => import('./features/VisualizationsModule/visualizations.module').then(m => m.VisualizationsModule)
      },
      {
        path: 'analysis-tools',
        loadChildren: () => import('./features/AnalysisToolsModule/analysis-tools.module').then(m => m.AnalysisToolsModule)
      }
    ]
  }
];
