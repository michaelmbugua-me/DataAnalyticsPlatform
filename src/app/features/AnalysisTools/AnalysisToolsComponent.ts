import {Component, OnInit, Signal} from '@angular/core';
import {GridModule, PageService, SortService, VirtualScrollService} from '@syncfusion/ej2-angular-grids';
import {DataService} from '../../core/services/DataService';
import { DataManager, WebApiAdaptor } from '@syncfusion/ej2-data';


@Component({
  selector: 'app-visualizations',
  templateUrl: './VisualizationsComponent.html',
  imports: [
    GridModule
  ],
  providers: [SortService, PageService, VirtualScrollService],
  styleUrls: ['./VisualizationsComponent.scss']
})
export class VisualizationsComponent implements OnInit {
  public data: any[] = [];
  public pageSettings = { pageSize: 50 };


  constructor() {
  }

  async ngOnInit() {
    const response = await fetch('/data/raw_events.json');
    this.data = await response.json();
  }


}
