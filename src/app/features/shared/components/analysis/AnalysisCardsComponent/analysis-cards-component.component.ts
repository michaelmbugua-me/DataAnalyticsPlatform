import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {TableModule} from 'primeng/table';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';


@Component({
  selector: 'app-analysis-cards-component',
  templateUrl: './analysis-cards-component.component.html',
  imports: [TableModule, ReactiveFormsModule, FormsModule],
  providers: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./analysis-cards-component.component.scss']
})
export class AnalysisCardsComponentComponent implements OnInit {

  @Input() totalEvents!: any;
  @Input() averageDuration!: any;
  @Input() uniqueUsers!: any;

  constructor() {

  }

  ngOnInit(): void {
  }

}

