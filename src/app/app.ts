import {Component, OnInit, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {initFlowbite} from 'flowbite';
import {AllCommunityModule, ModuleRegistry} from 'ag-grid-community';


@Component({
  selector: 'app-root', imports: [RouterOutlet], templateUrl: './app.html', styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('dataAnalytics');

  ngOnInit(): void {
    initFlowbite();
  }
}

ModuleRegistry.registerModules([AllCommunityModule]);
