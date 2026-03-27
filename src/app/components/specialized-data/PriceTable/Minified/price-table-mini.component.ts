import { Component, Input } from '@angular/core';
import { PriceTableData } from '../../../../interfaces/dataItem.interface';
import { getMinPrice } from '../../data-item-content.registry';

@Component({
  selector: 'app-price-table-mini',
  standalone: true,
  templateUrl: './price-table-mini.component.html',
})
export class PriceTableMiniComponent {
  @Input({ required: true }) item!: PriceTableData;

  get minPrice(): number {
    return getMinPrice(this.item);
  }
}
