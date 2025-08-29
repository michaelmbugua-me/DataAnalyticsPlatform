import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './PageHeaderComponent.html',
  standalone: true,
  imports: [],
  styleUrls: ['./PageHeaderComponent.scss']
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
}
