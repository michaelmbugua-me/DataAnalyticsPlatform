import {Injectable, Signal, signal} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import {map, Observable} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataService {

  public rawData$: Observable<any>;
  public data: Signal<any>;

  constructor(public http: HttpClient) {
    this.rawData$ = this.http.get<any[]>('/data/raw_events.json');
    this.data = toSignal(this.rawData$);
  }



}
