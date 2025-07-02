import { Component, Input } from '@angular/core';
import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { CommonModule } from '@angular/common';
import {PriceTableComponent} from '../specialized-data/PriceTable/price-table.component';
import {Store} from '@ngrx/store';
import {removeFromDisplay, saveFromDisplay} from '../../store/Data/dataState.actions';

@Component({
  selector: 'app-data-item-container',
  standalone: true,
  imports: [CommonModule, PriceTableComponent],
  templateUrl: './data-item-container.component.html',
})
export class DataItemContainerComponent {
  @Input() item!: AnyDataItems;

  constructor(private readonly store: Store) {}

  get componentType() {
    switch (this.item.type) {
      case 'price':
        return 'price';
      default:
        return null;
    }
  }

  onDelete() {
    console.log(this.item);
    this.store.dispatch(removeFromDisplay(this.item))
  }

  onSave() {
    console.log(this.item);
    this.store.dispatch(saveFromDisplay(this.item))
  }
}
