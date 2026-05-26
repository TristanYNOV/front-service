import { Component, Input } from '@angular/core';

import {PriceTableData} from '../../../interfaces/dataItem.interface';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-price-table',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './price-table.component.html',
})
export class PriceTableComponent {
  @Input() data!: PriceTableData;
}
