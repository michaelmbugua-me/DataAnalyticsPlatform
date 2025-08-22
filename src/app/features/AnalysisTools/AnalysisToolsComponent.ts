import {Component, OnInit, Signal} from '@angular/core';
import {TableLazyLoadEvent, TableModule} from 'primeng/table';
import {HttpClient} from '@angular/common/http';


@Component({
  selector: 'app-analysis-tools',
  templateUrl: './AnalysisToolsComponent.html',
  imports: [
    TableModule,
  ],
  providers: [],
  styleUrls: ['./AnalysisToolsComponent.scss']
})
export class AnalysisToolsComponent implements OnInit {

  ngOnInit(): void {
        throw new Error("Method not implemented.");
    }



}
