import { Component, Input } from '@angular/core';
import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { CommonModule } from '@angular/common';
import {PriceTableComponent} from '../specialized-data/PriceTable/price-table.component';

@Component({
  selector: 'app-data-item-container',
  standalone: true,
  imports: [CommonModule, PriceTableComponent],
  templateUrl: './data-item-container.component.html',
})
export class DataItemContainerComponent {
  @Input() item!: AnyDataItems;

  get componentType() {
    switch (this.item.type) {
      case 'price':
        return 'price';
      default:
        return null;
    }
  }

  onDelete() {
    // Future action: delete item
  }

  onSave() {
    // Future action: save item
  }
}
