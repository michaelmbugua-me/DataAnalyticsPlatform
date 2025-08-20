import {AfterViewChecked, Component, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';

import {initFlowbite} from "flowbite";

import {interval, Observable, of} from 'rxjs';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {Tag} from 'primeng/tag';


@Component({
  selector: 'app-dashboard',
  templateUrl: './DashboardComponent.html',
  imports: [Tag, RouterLink, RouterOutlet,],
  styleUrls: ['./DashboardComponent.scss']
})
export class DashboardComponent implements OnInit, AfterViewChecked {

  eventFromNavbar: boolean = true;

  allowedModules: string[] = [];
  navItems: any[] = [];
  currentUrl: string = '';
  private hasInitializedFlowbite = false;

  constructor(private readonly appRoute: Router) {
    this.appRoute.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.url;
      });
  }

  isActive(route: string[], queryParams?: any): boolean {
    if (!route) return false;

    // Check if route matches
    const routeMatches = this.currentUrl.includes(route.join('/'));

    // If no query params needed, return route match
    if (!queryParams) return routeMatches;

    // Check query params match
    const currentQueryParams = this.appRoute.parseUrl(this.currentUrl).queryParams;
    return routeMatches && this.queryParamsMatch(currentQueryParams, queryParams);
  }

  ngAfterViewChecked(): void {
    if (this.shouldInitFlowbite() && !this.hasInitializedFlowbite) {
      initFlowbite();
      this.hasInitializedFlowbite = true;
    }
  }

  buttonClicked() {
    console.log("Button has been clicked....")
  }

  ngOnInit(): void {
    this.appRoute.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.url;
        console.log('Current URL:', this.currentUrl);
      });

    this.waitForAssignedModules().subscribe({
      next: (data) => {
        console.log(':::::::::::::data');
        console.log(data);
        this.initializeNavigation(data);
      }, error: (err) => {
        console.log(':::::::::::::error');
        console.log(err);
      }, complete: () => {
        console.log(':::::::::::::complete');
      }
    });
  }

  initializeNavigation(data: any) {

    this.allowedModules = JSON.parse(data) || [];

    this.navItems = [// Dashboard
      {
        title: 'DASHBOARD', route: ['mainApp/mainApp/dashboard'], alwaysVisible: true, isCollapsible: false
      },

      // Table with stats
      {
        title: 'STATISTICS', route: ['/mainApp/mainApp/statisticsTable'], alwaysVisible: true, isCollapsible: false,
      },

      // Card Management
      {

        title: 'Card Management', isCollapsible: true, collapseId: 'cards', children: [{
          title: 'Cards List', route: ['/mainApp/mainApp/card-management/all-cards'],
        }]
      },

      // Log Out
      {
        title: 'LOG OUT', isCollapsible: false, action: () => this.logout(), alwaysVisible: true
      }];
  }

  hasRequiredModules(requiredModules?: string[]): boolean {

    return Array.isArray(requiredModules) && requiredModules.some(module => this.allowedModules.includes(module));
  }

  hasAnyChildAccess(children: any[]): boolean {
    return children?.some(child => this.hasRequiredModules(child.requiredModules)) || false;
  }

  logout() {
    this.appRoute.navigate(['/']);
  }

  openSettingsModal() {

  }

  waitForAssignedModules(pollInterval = 100): Observable<any> {
    return interval(pollInterval)
      .pipe(
        map(() =>
          localStorage.getItem('assignedModules')),
        filter(data => data !== null),
        take(1),
        switchMap(data => {
      return of(data);
    }));
  }

  private queryParamsMatch(current: any, expected: any): boolean {
    return Object.keys(expected).every(key => current[key]?.toString() === expected[key]?.toString());
  }

  private shouldInitFlowbite(): boolean {
    return document.querySelector('[data-collapse-toggle]') !== null;
  }
}
