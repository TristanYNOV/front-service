import { Component, Input } from '@angular/core';
import {PriceTableData} from '../../../../interfaces/dataItem.interface';

@Component({
  selector: 'app-price-table-mini',
  standalone: true,
  templateUrl: './price-table-mini.component.html',
})
export class PriceTableMiniComponent {
  @Input() item!: PriceTableData;
}
