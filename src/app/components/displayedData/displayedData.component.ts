import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {AppState} from '../../store/initial-state.state';
import {DisplayedData} from '../../interfaces/displayedData.interface';
import {selectArticles, selectPriceTables} from '../../store/displayedData/displayedData.selectors';


@Component({
  selector: 'app-displayed-data',
  templateUrl: './displayed-data.component.html',
  styleUrls: ['./displayed-data.component.scss']
})
export class DisplayedDataComponent {
  articles$: Observable<DisplayedData[]> | undefined;
  priceTables$: Observable<DisplayedData[]> | undefined;

  constructor(private store: Store<AppState>) {
    this.articles$ = this.store.select(selectArticles);
    this.priceTables$ = this.store.select(selectPriceTables);
  }
}
