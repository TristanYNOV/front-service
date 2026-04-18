import { Component, inject, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { AnyDataItems } from '../../../interfaces/dataItem.interface';
import { DataItemState } from '../../../enum/state.enum';
import { displayFromIdle, displayFromSaved } from '../../../store/Data/dataState.actions';
import { selectDisplayedItems } from '../../../store/Data/dataState.selectors';
import { MatIconModule } from '@angular/material/icon';
import { DataItemMeta, getDataItemMeta } from '../../specialized-data/data-item-content.registry';

@Component({
  selector: 'app-mini',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './mini.component.html',
})
export class MiniComponent {
  @Input({ required: true }) item!: AnyDataItems;
  private readonly store = inject(Store);
  private readonly displayedItems = this.store.selectSignal(selectDisplayedItems);

  get metadata(): DataItemMeta {
    return getDataItemMeta(this.item);
  }

  isDisplayed(): boolean {
    return this.displayedItems().some(item => item.id === this.item.id);
  }

  displayData(): void {
    if (this.isDisplayed()) {
      return;
    }
    if (this.item.state === DataItemState.Saved) {
      this.store.dispatch(displayFromSaved({ id: this.item.id }));
    } else if (this.item.state === DataItemState.Idle) {
      this.store.dispatch(displayFromIdle({ id: this.item.id }));
    }
  }
}
