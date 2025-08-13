import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { AnyDataItems } from '../../../interfaces/dataItem.interface';
import {DataItemType} from '../../../enum/state.enum';
import {PriceTableMiniComponent} from '../../specialized-data/PriceTable/Minified/price-table-mini.component';
import {selectIdleItems} from '../../../store/Data/dataState.selectors';
import {displayFromIdle} from '../../../store/Data/dataState.actions';

@Component({
  selector: 'app-mini',
  standalone: true,
  imports: [
    PriceTableMiniComponent
  ],
  templateUrl: './mini.component.html',
})
export class MiniComponent {
  @Input({required: true}) item!: AnyDataItems;
  protected readonly DataItemType = DataItemType;

  constructor(private readonly store: Store) {}

  displayData() {
    console.log(this.item.id);
    this.store.dispatch(displayFromIdle(this.item))
  }
}
