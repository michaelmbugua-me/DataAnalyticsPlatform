import { Routes } from '@angular/router';
import {LoginComponent} from './features/access/Login/LoginComponent';
import {BaseComponent} from './layout/base/BaseComponent';
import {DataExplorerModule} from './features/DataExplorerModule/data-explorer.module';
import {VisualizationsModule} from './features/VisualizationsModule/visualizations.module';
import {AnalysisToolsModule} from './features/AnalysisToolsModule/analysis-tools.module';

export const routes: Routes = [

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: BaseComponent,
    children: [
      {
        path: 'data-explorer',
        loadChildren: () => DataExplorerModule
      },
      {path: 'visualization',
        loadChildren: () => VisualizationsModule
      },
      {path: 'analysis-tools',
        loadChildren: () => AnalysisToolsModule
      },
    ]
  }
];
