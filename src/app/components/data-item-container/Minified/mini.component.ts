import {Component, inject, Input} from '@angular/core';
import { Store } from '@ngrx/store';
import { AnyDataItems } from '../../../interfaces/dataItem.interface';
import { DataItemState, DataItemType } from '../../../enum/state.enum';
import {PriceTableMiniComponent} from '../../specialized-data/PriceTable/Minified/price-table-mini.component';
import {TextBlockMiniComponent} from '../../specialized-data/TextBlock/Minified/text-block-mini.component';
import { displayFromIdle, displayFromSaved } from '../../../store/Data/dataState.actions';

@Component({
  selector: 'app-mini',
  standalone: true,
  imports: [
    PriceTableMiniComponent,
    TextBlockMiniComponent
  ],
  templateUrl: './mini.component.html',
})
export class MiniComponent {
  @Input({required: true}) item!: AnyDataItems;
  protected readonly DataItemType = DataItemType;
  private readonly store = inject(Store)

  displayData() {
    console.log(this.item.id);
    if (this.item.state === DataItemState.Saved) {
      this.store.dispatch(displayFromSaved({ id: this.item.id }));
    } else if (this.item.state === DataItemState.Idle) {
      this.store.dispatch(displayFromIdle({ id: this.item.id }));
    }
  }
}
