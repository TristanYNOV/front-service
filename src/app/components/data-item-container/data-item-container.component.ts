import { Component, Input } from '@angular/core';
import { AnyDataItems } from '../../interfaces/dataItem.interface';
import { CommonModule } from '@angular/common';
import { PriceTableComponent } from '../specialized-data/PriceTable/price-table.component';
import { TextBlockComponent } from '../specialized-data/TextBlock/text-block.component';
import { Store } from '@ngrx/store';
import { removeFromDisplay, saveFromDisplay } from '../../store/Data/dataState.actions';

@Component({
  selector: 'app-data-item-container',
  standalone: true,
  imports: [CommonModule, PriceTableComponent, TextBlockComponent],
  templateUrl: './data-item-container.component.html',
})
export class DataItemContainerComponent {
  @Input() item!: AnyDataItems;

  constructor(private readonly store: Store) {}

  onDelete() {
    console.log(this.item);
    this.store.dispatch(removeFromDisplay({ id: this.item.id }));
  }

  onSave() {
    console.log(this.item);
    this.store.dispatch(saveFromDisplay({ id: this.item.id }));
  }
}
