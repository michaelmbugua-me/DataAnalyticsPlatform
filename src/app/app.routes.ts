import { Routes } from '@angular/router';
import {LoginComponent} from './features/Access/Login/LoginComponent';
import {DashboardComponent} from './features/Dashboard/DashboardComponent';

export const routes: Routes = [

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },

];
