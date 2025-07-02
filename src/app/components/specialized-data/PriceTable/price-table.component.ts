import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PriceTableData} from '../../../interfaces/dataItem.interface';

@Component({
  selector: 'app-price-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-table.component.html',
})
export class PriceTableComponent {
  @Input() data!: PriceTableData;
}
